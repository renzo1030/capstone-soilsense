import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from core.models import Role, Account, Farmer, MaoStaff, Farm, SoilHealthStatus, Fertilizer
farmer_role, _ = Role.objects.get_or_create(role_name='farmer', description='Rice Farmer')
mao_role, _ = Role.objects.get_or_create(role_name='mao', description='MAO Administrator')
SoilHealthStatus.objects.get_or_create(status_name="Optimal")
SoilHealthStatus.objects.get_or_create(status_name="High Acidity")
SoilHealthStatus.objects.get_or_create(status_name="Low Nitrogen")
SoilHealthStatus.objects.get_or_create(status_name="Low Moisture")
Fertilizer.objects.get_or_create(fertilizer_name="Urea (46-0-0)", nutrient_type="Nitrogen")
Fertilizer.objects.get_or_create(fertilizer_name="Agricultural Lime", nutrient_type="pH Balancer")
if not Account.objects.filter(username='FARMER001').exists():
    farmer_acc = Account.objects.create_user(
        username='FARMER001',
        password='testpassword123',
        role=farmer_role
    )
    farmer_prof = Farmer.objects.create(
        account=farmer_acc,
        firstname='Juan',
        lastname='Dela Cruz',
        barangay='Central',
        contact_number='09123456789'
    )
    farm = Farm.objects.create(
        farmer=farmer_prof,
        location='Brgy. Central Rice Field',
        total_area_sqm=15000.0
    )
    print(f"Created Farmer Account: FARMER001. Farm ID is {farm.farm_id}")
else:
    print("Farmer Account already exists.")
if not Account.objects.filter(username='MAO001').exists():
    mao_acc = Account.objects.create_user(
        username='MAO001',
        password='testpassword123',
        role=mao_role
    )
    MaoStaff.objects.create(
        account=mao_acc,
        firstname='Maria',
        lastname='Santos',
        position='Head Agriculturist'
    )
    print("Created MAO Account: MAO001")
else:
    print("MAO Account already exists.")
if not Account.objects.filter(username='ADMIN001').exists():
    admin_acc = Account.objects.create_superuser(
        username='ADMIN001',
        password='testpassword123'
    )
    print("Created Super Admin Account: ADMIN001")
else:
    print("Super Admin Account already exists.")
