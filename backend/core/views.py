from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from django.conf import settings

from .models import Account, Role, Farmer, Farm, SoilReading, SoilHealthStatus, Recommendation, Fertilizer
from .serializers import AccountSerializer, SoilReadingSerializer
from .ml_service import predict_soil_condition

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    ERD-compliant Login Endpoint.
    """
    username = request.data.get('controlId') # Reusing controlId from React as username
    password = request.data.get('password')

    try:
        
        account = Account.objects.get(username=username)
    except Account.DoesNotExist:
        return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    if account.check_password(password):
        refresh = RefreshToken.for_user(account)
        
       
        detected_role = 'superadmin' if account.is_superuser else (account.role.role_name if account.role else 'unknown')

        return Response({
            'token': str(refresh.access_token),
            'user': {
                'id': account.id,
                'username': account.username,
                'role': detected_role
            }
        })
    else:
        return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])
def iot_data_ingest(request):
    """
    IoT Data Ingestion matching the ERD.
    Links directly to Farm instead of IoTDevice.
    """
 
    api_key = request.headers.get('X-Api-Key')
    if api_key != settings.IOT_API_KEY:
        return Response({'error': 'Unauthorized hardware device'}, status=status.HTTP_401_UNAUTHORIZED)

    farm_id = request.data.get('farm_id')
    nitrogen = float(request.data.get('nitrogen', 0))
    phosphorus = float(request.data.get('phosphorus', 0))
    potassium = float(request.data.get('potassium', 0))
    ph = float(request.data.get('ph', 0))
    moisture = float(request.data.get('moisture', 0))

    try:
        farm = Farm.objects.get(farm_id=farm_id)
    except Farm.DoesNotExist:
        return Response({'error': 'Unregistered Farm'}, status=status.HTTP_404_NOT_FOUND)

    condition, action_plan = predict_soil_condition(nitrogen, phosphorus, potassium, ph, moisture)
    
  
    status_obj, _ = SoilHealthStatus.objects.get_or_create(status_name=condition)

   
    reading = SoilReading.objects.create(
        farm=farm,
        nitrogen_n=nitrogen,
        phosphorus_p=phosphorus,
        potassium_k=potassium,
        ph_level=ph,
        moisture=moisture,
        status=status_obj
    )

   
    fert, _ = Fertilizer.objects.get_or_create(fertilizer_name='Urea (46-0-0)', nutrient_type='Nitrogen')
    Recommendation.objects.create(
        reading=reading,
        fertilizer=fert,
        recommended_amount_kg=15.0 # Dummy amount
    )

    return Response({
        'message': 'Data processed successfully',
        'reading_id': reading.reading_id,
        'ml_prediction': condition
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def farmer_logs(request):
    user = request.user
    if not user.role or user.role.role_name != 'farmer':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        farmer_profile = user.farmer_profile
        farms = Farm.objects.filter(farmer=farmer_profile)
        readings = SoilReading.objects.filter(farm__in=farms).order_by('-recorded_at')[:50]
        
        # We need to send custom data shape to React
        data = []
        for r in readings:
            data.append({
                'id': r.reading_id,
                'timestamp': r.recorded_at,
                'nitrogen': r.nitrogen_n,
                'phosphorus': r.phosphorus_p,
                'potassium': r.potassium_k,
                'ph': r.ph_level,
                'moisture': r.moisture,
                'condition': r.status.status_name if r.status else 'Unknown'
            })
        return Response(data)
    except Farmer.DoesNotExist:
        return Response({'error': 'No profile found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_farmer(request):
    """
    MAO Endpoint to register a new Farmer, Farmer Profile, and Farm atomically.
    """
    user = request.user
    if not user.role or user.role.role_name != 'mao':
        return Response({'error': 'Only MAO Administrators can register new farmers.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        data = request.data
        control_id = data.get('control_id')
        password = data.get('password')
        
        # We wrap this in transaction.atomic() so if Farm creation fails, Account isn't created.
        with transaction.atomic():
            # 1. Ensure Farmer Role exists
            farmer_role = Role.objects.get(role_name='farmer')
            
            # 2. Create Account
            if Account.objects.filter(username=control_id).exists():
                return Response({'error': 'Control ID already exists!'}, status=status.HTTP_400_BAD_REQUEST)
                
            new_account = Account.objects.create_user(
                username=control_id,
                password=password,
                role=farmer_role
            )
            
            # 3. Create Farmer Profile
            farmer_profile = Farmer.objects.create(
                account=new_account,
                firstname=data.get('firstname'),
                lastname=data.get('lastname'),
                contact_number=data.get('contact_number'),
                barangay=data.get('barangay')
            )
            
            # 4. Create Farm
            farm = Farm.objects.create(
                farmer=farmer_profile,
                location=data.get('farm_location'),
                total_area_sqm=float(data.get('farm_area_sqm', 0))
            )
            
        return Response({
            'message': 'Farmer registered successfully!',
            'farm_id': farm.farm_id
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def farmer_dashboard_data(request):
    user = request.user
    if not user.role or user.role.role_name != 'farmer':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        farmer = user.farmer_profile
        farms = Farm.objects.filter(farmer=farmer)
        farm = farms.first()
        
        reading_data = None
        if farm:
            latest_reading = SoilReading.objects.filter(farm=farm).order_by('-recorded_at').first()
            if latest_reading:
                reading_data = {
                    'nitrogen': latest_reading.nitrogen_n,
                    'phosphorus': latest_reading.phosphorus_p,
                    'potassium': latest_reading.potassium_k,
                    'ph': latest_reading.ph_level,
                    'moisture': latest_reading.moisture,
                    'condition': latest_reading.status.status_name if latest_reading.status else 'Unknown',
                    'recorded_at': latest_reading.recorded_at
                }

        return Response({
            'farmer_name': f"{farmer.firstname} {farmer.lastname}",
            'control_id': user.username,
            'barangay': farmer.barangay,
            'farm_location': farm.location if farm else 'No Farm Registered',
            'latest_reading': reading_data
        })
    except Farmer.DoesNotExist:
        return Response({'error': 'No profile found'}, status=404)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mao_dashboard_data(request):
    user = request.user
    if not user.role or user.role.role_name != 'mao':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    total_farmers = Farmer.objects.count()
    active_farms = Farm.objects.count()
    
    critical_readings = SoilReading.objects.exclude(status__status_name='Optimal').count()
    
    farmer_statuses = []
    for farm in Farm.objects.all()[:10]:
        latest = SoilReading.objects.filter(farm=farm).order_by('-recorded_at').first()
        if latest:
            farmer_statuses.append({
                'control_id': farm.farmer.account.username,
                'farmer_name': f"{farm.farmer.firstname} {farm.farmer.lastname}",
                'barangay': farm.farmer.barangay,
                'nitrogen': latest.nitrogen_n,
                'phosphorus': latest.phosphorus_p,
                'potassium': latest.potassium_k,
                'ph': latest.ph_level,
                'moisture': latest.moisture,
                'condition': latest.status.status_name if latest.status else 'Unknown',
            })

    return Response({
        'stats': {
            'total_farmers': total_farmers,
            'active_sensors': active_farms,
            'critical_fields': critical_readings,
        },
        'recent_statuses': farmer_statuses
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mao_logs_data(request):
    user = request.user
    if not user.role or user.role.role_name != 'mao':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    readings = SoilReading.objects.select_related('farm', 'farm__farmer', 'status').order_by('-recorded_at')[:100]
    
    data = []
    for r in readings:
        data.append({
            'id': r.reading_id,
            'timestamp': r.recorded_at,
            'farmer_name': f"{r.farm.farmer.firstname} {r.farm.farmer.lastname}",
            'location': r.farm.location,
            'nitrogen': r.nitrogen_n,
            'phosphorus': r.phosphorus_p,
            'potassium': r.potassium_k,
            'ph': r.ph_level,
            'moisture': r.moisture,
            'condition': r.status.status_name if r.status else 'Unknown'
        })
    return Response(data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def register_mao(request):
    """
    SuperAdmin Endpoint to register a new MAO Administrator.
    """
    user = request.user
    if not user.is_superuser:
        return Response({'error': 'Only Super Admins can register MAO staff.'}, status=status.HTTP_403_FORBIDDEN)

    try:
        data = request.data
        control_id = data.get('control_id')
        password = data.get('password')
        
        with transaction.atomic():
            mao_role = Role.objects.get(role_name='mao')
            
            if Account.objects.filter(username=control_id).exists():
                return Response({'error': 'Control ID already exists!'}, status=status.HTTP_400_BAD_REQUEST)
                
            new_account = Account.objects.create_user(
                username=control_id,
                password=password,
                role=mao_role
            )
            
            MaoStaff.objects.create(
                account=new_account,
                firstname=data.get('firstname'),
                lastname=data.get('lastname'),
                position=data.get('position', 'Staff')
            )
            
        return Response({'message': 'MAO Administrator registered successfully!'}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mao_farms_data(request):
    """
    Returns all registered farms and their latest hardware (sensor) status.
    """
    user = request.user
    if not user.role or user.role.role_name != 'mao':
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    farms = Farm.objects.select_related('farmer', 'farmer__account').all()
    
    data = []
    for farm in farms:
        latest = SoilReading.objects.filter(farm=farm).order_by('-recorded_at').first()
        status_label = 'Active' if latest else 'Inactive'
        
        data.append({
            'farm_id': farm.farm_id,
            'control_id': farm.farmer.account.username,
            'farmer_name': f"{farm.farmer.firstname} {farm.farmer.lastname}",
            'location': farm.location,
            'area': farm.total_area_sqm,
            'hardware_status': status_label,
            'latest_reading': latest.recorded_at if latest else None
        })
        
    return Response(data)
