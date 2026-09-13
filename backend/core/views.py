from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from django.conf import settings

from .models import Account, Role, Farmer, MaoStaff, Farm, SoilReading, SoilHealthStatus, Recommendation, Fertilizer
from .serializers import AccountSerializer, SoilReadingSerializer
from .ml_service import predict_soil_condition
from .permissions import IsMaoAdmin, IsFarmer
from django.db.models import Prefetch

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    ERD-compliant Login Endpoint.
    """
    username = request.data.get('controlId') 
    password = request.data.get('password')

    try:
        
        account = Account.objects.get(username=username)
    except Account.DoesNotExist:
        return Response({'error': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)

    if account.check_password(password):
        refresh = RefreshToken.for_user(account)
        
        detected_role = account.role.role_name if account.role else 'unknown'

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

    condition, action_plan, fert_name, nutrient, amount = predict_soil_condition(
        nitrogen, phosphorus, potassium, ph, moisture
    )
    
  
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

    fert, _ = Fertilizer.objects.get_or_create(
        fertilizer_name=fert_name,
        nutrient_type=nutrient,
        defaults={'description': action_plan}
    )
    if fert.description != action_plan:
        fert.description = action_plan
        fert.save()

    Recommendation.objects.create(
        reading=reading,
        fertilizer=fert,
        recommended_amount_kg=amount
    )

    return Response({
        'message': 'Data processed successfully',
        'reading_id': reading.reading_id,
        'condition': condition,
        'fertilizer_recommendation': fert_name,
        'recommended_amount_kg': amount
    }, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsFarmer])
def farmer_logs(request):
    user = request.user
    
    try:
        farmer_profile = user.farmer_profile
        farms = Farm.objects.filter(farmer=farmer_profile)
        readings = SoilReading.objects.filter(farm__in=farms).select_related('status').prefetch_related(
            'recommendations__fertilizer'
        ).order_by('-recorded_at')[:50]
        
        data = []
        for r in readings:
            rec = r.recommendations.first()
            data.append({
                'id': r.reading_id,
                'timestamp': r.recorded_at,
                'nitrogen': r.nitrogen_n,
                'phosphorus': r.phosphorus_p,
                'potassium': r.potassium_k,
                'ph': r.ph_level,
                'moisture': r.moisture,
                'condition': r.status.status_name if r.status else 'Unknown',
                'fertilizer_name': rec.fertilizer.fertilizer_name if rec else 'N/A',
                'recommended_amount_kg': rec.recommended_amount_kg if rec else None,
            })
        return Response(data)
    except Farmer.DoesNotExist:
        return Response({'error': 'No profile found'}, status=404)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsMaoAdmin])
def register_farmer(request):
    """
    MAO Endpoint to register a new Farmer, Farmer Profile, and Farm atomically.
    """
    try:
        data = request.data
        control_id = data.get('control_id')
        password = data.get('password')
        contact_number = data.get('contact_number')
        
        if not contact_number or not contact_number.isdigit() or len(contact_number) < 10:
            return Response({'error': 'Invalid contact number format.'}, status=status.HTTP_400_BAD_REQUEST)
        if not password or len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            farmer_role = Role.objects.get(role_name='farmer')
            
            if Account.objects.filter(username=control_id).exists():
                return Response({'error': 'Control ID already exists!'}, status=status.HTTP_400_BAD_REQUEST)
                
            new_account = Account.objects.create_user(
                username=control_id,
                password=password,
                role=farmer_role
            )
            
            farmer_profile = Farmer.objects.create(
                account=new_account,
                firstname=data.get('firstname'),
                lastname=data.get('lastname'),
                contact_number=data.get('contact_number'),
                email=data.get('email'),
                barangay=data.get('barangay')
            )
            
        return Response({
            'message': 'Farmer registered successfully!',
            'farmer_id': farmer_profile.farmer_id
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsMaoAdmin])
def register_farm(request):
    """
    MAO Endpoint to register a Farm (Hardware Registry) and link it to an existing Farmer.
    """
    try:
        data = request.data
        farmer_id = data.get('farmer_id')
        
        try:
            farmer = Farmer.objects.get(farmer_id=farmer_id)
        except Farmer.DoesNotExist:
            return Response({'error': 'Farmer not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        farm = Farm.objects.create(
            farmer=farmer,
            location=data.get('farm_location'),
            total_area_sqm=float(data.get('farm_area_sqm', 0))
        )
        
        return Response({
            'message': 'Hardware (Farm) registered successfully!',
            'farm_id': farm.farm_id
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsFarmer])
def farmer_dashboard_data(request):
    user = request.user
    
    try:
        farmer = user.farmer_profile
        farms = Farm.objects.filter(farmer=farmer)
        farm = farms.first()
        
        reading_data = None
        if farm:
            latest_reading = SoilReading.objects.filter(farm=farm).select_related('status').prefetch_related(
                'recommendations__fertilizer'
            ).order_by('-recorded_at').first()
            if latest_reading:
                rec = latest_reading.recommendations.first()
                reading_data = {
                    'nitrogen': latest_reading.nitrogen_n,
                    'phosphorus': latest_reading.phosphorus_p,
                    'potassium': latest_reading.potassium_k,
                    'ph': latest_reading.ph_level,
                    'moisture': latest_reading.moisture,
                    'condition': latest_reading.status.status_name if latest_reading.status else 'Unknown',
                    'recorded_at': latest_reading.recorded_at,
                    'fertilizer_name': rec.fertilizer.fertilizer_name if rec else 'N/A',
                    'nutrient_type': rec.fertilizer.nutrient_type if rec else 'N/A',
                    'recommended_amount_kg': rec.recommended_amount_kg if rec else None,
                    'action_plan': rec.fertilizer.description if rec else 'Monitor your field closely.',
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
@permission_classes([IsAuthenticated, IsMaoAdmin])
def mao_dashboard_data(request):
    total_farmers = Farmer.objects.count()
    active_farms = Farm.objects.count()
    
    latest_readings = SoilReading.objects.select_related('status').prefetch_related(
        'recommendations__fertilizer'
    ).order_by('-recorded_at')
    
    farms = Farm.objects.select_related('farmer', 'farmer__account').all().prefetch_related(
        Prefetch('readings', queryset=latest_readings, to_attr='latest_reading_list')
    )

    farmer_statuses = []
    critical_fields_count = 0
    
    for farm in farms:
        latest = farm.latest_reading_list[0] if farm.latest_reading_list else None
        if latest:
            if latest.status and latest.status.status_name != 'Optimal':
                critical_fields_count += 1
                
            rec = latest.recommendations.first()
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
                'fertilizer_name': rec.fertilizer.fertilizer_name if rec else 'N/A',
                'recommended_amount_kg': rec.recommended_amount_kg if rec else None,
            })

    return Response({
        'stats': {
            'total_farmers': total_farmers,
            'active_sensors': active_farms,
            'critical_fields': critical_fields_count,
        },
        'recent_statuses': farmer_statuses
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsMaoAdmin])
def mao_logs_data(request):
    farmer_id = request.GET.get('farmer_id')
    queryset = SoilReading.objects.select_related('farm', 'farm__farmer', 'status').prefetch_related(
        'recommendations__fertilizer'
    )
    
    if farmer_id:
        queryset = queryset.filter(farm__farmer__farmer_id=farmer_id)
        
    readings = queryset.order_by('-recorded_at')[:500]
    
    data = []
    for r in readings:
        rec = r.recommendations.first()
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
            'condition': r.status.status_name if r.status else 'Unknown',
            'fertilizer_name': rec.fertilizer.fertilizer_name if rec else 'N/A',
            'recommended_amount_kg': rec.recommended_amount_kg if rec else None,
        })
    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsMaoAdmin])
def mao_farms_data(request):
    """
    Returns all registered farms and their latest hardware (sensor) status.
    """
    latest_readings = SoilReading.objects.order_by('-recorded_at')
    farms = Farm.objects.select_related('farmer', 'farmer__account').all().prefetch_related(
        Prefetch('readings', queryset=latest_readings, to_attr='latest_reading_list')
    )
    
    data = []
    for farm in farms:
        latest = farm.latest_reading_list[0] if farm.latest_reading_list else None
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

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsMaoAdmin])
def list_farmers(request):
    """
    MAO Endpoint to list all registered Farmers.
    """
    farmers = Farmer.objects.select_related('account').prefetch_related('farms').all()
    data = []
    for farmer in farmers:
        farm = farmer.farms.first()
        data.append({
            'id': farmer.account.id,
            'farmer_id': farmer.farmer_id,
            'control_id': farmer.account.username,
            'firstname': farmer.firstname,
            'lastname': farmer.lastname,
            'barangay': farmer.barangay,
            'contact_number': farmer.contact_number,
            'email': farmer.email,
            'farm_location': farm.location if farm else 'N/A',
            'farm_area_sqm': farm.total_area_sqm if farm else 'N/A',
        })
    return Response(data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsMaoAdmin])
def delete_farmer(request, account_id):
    """
    MAO Endpoint to delete a Farmer account (cascades to Farmer profile and Farms).
    """
    try:
        account = Account.objects.get(id=account_id)
        account.delete()
        return Response({'message': 'Farmer account deleted successfully.'}, status=status.HTTP_200_OK)
    except Account.DoesNotExist:
        return Response({'error': 'Account not found.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated, IsMaoAdmin])
def unregister_farm(request, farm_id):
    """
    MAO Endpoint to unregister a Farm (Hardware) from a Farmer.
    This also cascades to delete the SoilReadings associated with this Farm.
    """
    try:
        farm = Farm.objects.get(farm_id=farm_id)
        farm.delete()
        return Response({'message': 'Hardware unregistered successfully.'}, status=status.HTTP_200_OK)
    except Farm.DoesNotExist:
        return Response({'error': 'Hardware not found.'}, status=status.HTTP_404_NOT_FOUND)
