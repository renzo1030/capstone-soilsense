from django.db import migrations
from django.contrib.auth.hashers import make_password

def seed_data(apps, schema_editor):
    Role = apps.get_model('core', 'Role')
    Account = apps.get_model('core', 'Account')
    MaoStaff = apps.get_model('core', 'MaoStaff')
    Farmer = apps.get_model('core', 'Farmer')
    Farm = apps.get_model('core', 'Farm')
    Fertilizer = apps.get_model('core', 'Fertilizer')
    SoilHealthStatus = apps.get_model('core', 'SoilHealthStatus')
    IoTDevice = apps.get_model('core', 'IoTDevice')
    SoilReading = apps.get_model('core', 'SoilReading')
    Recommendation = apps.get_model('core', 'Recommendation')

    # 1. Roles
    role_farmer, _ = Role.objects.get_or_create(role_name='farmer', defaults={'description': 'Rice Farmer'})
    role_mao, _ = Role.objects.get_or_create(role_name='mao', defaults={'description': 'MAO Administrator'})

    # 2. Accounts (password: password123)
    hashed_pwd = make_password('password123')

    mao_acc, created = Account.objects.get_or_create(
        username='MAO001',
        defaults={
            'password': hashed_pwd,
            'role': role_mao,
            'first_name': 'Maria',
            'last_name': 'Santos',
            'is_active': True,
        }
    )
    if not created:
        mao_acc.password = hashed_pwd
        mao_acc.role = role_mao
        mao_acc.save()

    f1_acc, created = Account.objects.get_or_create(
        username='FARMER001',
        defaults={
            'password': hashed_pwd,
            'role': role_farmer,
            'first_name': 'Juan',
            'last_name': 'Dela Cruz',
            'is_active': True,
        }
    )
    if not created:
        f1_acc.password = hashed_pwd
        f1_acc.role = role_farmer
        f1_acc.save()

    f2_acc, created = Account.objects.get_or_create(
        username='FARMER1000',
        defaults={
            'password': hashed_pwd,
            'role': role_farmer,
            'first_name': 'Renz Aron',
            'last_name': 'Taguiam',
            'is_active': True,
        }
    )
    if not created:
        f2_acc.password = hashed_pwd
        f2_acc.role = role_farmer
        f2_acc.save()

    f3_acc, created = Account.objects.get_or_create(
        username='FARMER004',
        defaults={
            'password': hashed_pwd,
            'role': role_farmer,
            'first_name': 'Raven Chase',
            'last_name': 'Gliane',
            'is_active': True,
        }
    )
    if not created:
        f3_acc.password = hashed_pwd
        f3_acc.role = role_farmer
        f3_acc.save()

    # 3. Staff & Farmer Profiles
    MaoStaff.objects.get_or_create(
        account=mao_acc,
        defaults={
            'firstname': 'Maria',
            'middlename': '',
            'lastname': 'Santos',
            'position': 'Agricultural Technician',
        }
    )

    farmer1, _ = Farmer.objects.get_or_create(
        account=f1_acc,
        defaults={
            'firstname': 'Juan',
            'middlename': '',
            'lastname': 'Dela Cruz',
            'barangay': 'Brgy. Tubigan',
            'contact_number': '09000000000',
        }
    )

    farmer2, _ = Farmer.objects.get_or_create(
        account=f2_acc,
        defaults={
            'firstname': 'Renz Aron',
            'middlename': '',
            'lastname': 'Taguiam',
            'barangay': 'Tubigan',
            'contact_number': '09987793336',
        }
    )

    farmer3, _ = Farmer.objects.get_or_create(
        account=f3_acc,
        defaults={
            'firstname': 'Raven Chase',
            'middlename': '',
            'lastname': 'Gliane',
            'barangay': 'R. Magsaysay',
            'contact_number': '09987793336',
        }
    )

    # 4. Farms
    farm1, _ = Farm.objects.get_or_create(
        farmer=farmer1,
        defaults={
            'location': 'Brgy. Tubigan',
            'total_area_sqm': 10000.0,
        }
    )

    farm2, _ = Farm.objects.get_or_create(
        farmer=farmer2,
        defaults={
            'location': 'Tubigan',
            'total_area_sqm': 100.0,
        }
    )

    farm3, _ = Farm.objects.get_or_create(
        farmer=farmer3,
        defaults={
            'location': 'R. Magsaysay',
            'total_area_sqm': 1000.0,
        }
    )

    # 5. IoT Devices
    dev1, _ = IoTDevice.objects.get_or_create(
        device_uid='ESP32-SOILSENSE-01',
        defaults={
            'device_name': 'Tubigan Demo Probe #1',
            'farm': farm1,
            'is_active': True,
        }
    )

    dev2, _ = IoTDevice.objects.get_or_create(
        device_uid='ESP32-SOILSENSE-02',
        defaults={
            'device_name': 'Taguiam Farm Probe',
            'farm': farm2,
            'is_active': True,
        }
    )

    # 6. Fertilizers
    fert_catalog = [
        ('Urea (46-0-0)', 'Nitrogen', 'Apply Urea (46-0-0) to replenish Nitrogen levels.'),
        ('Compost', 'Organic Matter', 'Apply organic Compost to improve soil structure and organic matter content.'),
        ('DAP (18-46-0)', 'Nitrogen & Phosphorus', 'Apply Diammonium Phosphate (DAP) to address Nitrogen and Phosphorus deficiency.'),
        ('Zinc Sulphate', 'Micronutrients', 'Apply Zinc Sulphate to address zinc deficiency and improve grain yield.'),
        ('Ammonium Sulfate (21-0-0)', 'Nitrogen', 'Apply Ammonium Sulfate (21-0-0) to replenish Nitrogen.'),
        ('NPK (14-14-14)', 'Nitrogen, Phosphorus & Potassium', 'Apply NPK Compound Fertilizer for balanced nutrient replenishment.'),
        ('Agricultural Lime + Urea (46-0-0)', 'Nitrogen', 'Apply Agricultural Lime to neutralize extreme acidity, then apply Urea.'),
        ('Agricultural Lime + Compost', 'Organic Matter', 'Apply Agricultural Lime to neutralize extreme acidity, then apply Compost.'),
    ]
    fert_objs = {}
    for name, n_type, desc in fert_catalog:
        f_obj, _ = Fertilizer.objects.get_or_create(
            fertilizer_name=name,
            defaults={'nutrient_type': n_type, 'description': desc}
        )
        fert_objs[name] = f_obj

    # 7. Soil Health Statuses
    status_optimal, _ = SoilHealthStatus.objects.get_or_create(
        status_name='Optimal Soil Condition',
        defaults={'description': 'Soil nutrient and pH levels are within ideal ranges for rice production.'}
    )
    status_acidic, _ = SoilHealthStatus.objects.get_or_create(
        status_name='Critical Acidity & Low Nitrogen',
        defaults={'description': 'Soil is acidic with low nitrogen concentration.'}
    )

    # 8. Sample Soil Readings for Farm 1 and Farm 2 if none exist
    if not SoilReading.objects.filter(farm=farm1).exists():
        r1 = SoilReading.objects.create(
            farm=farm1,
            device=dev1,
            nitrogen_n=32.5,
            phosphorus_p=22.0,
            potassium_k=35.0,
            ph_level=6.2,
            moisture=58.0,
            status=status_optimal,
        )
        urea = fert_objs.get('Urea (46-0-0)')
        if urea:
            Recommendation.objects.create(
                reading=r1,
                fertilizer=urea,
                recommended_amount_kg=45.0,
            )

    if not SoilReading.objects.filter(farm=farm2).exists():
        r2 = SoilReading.objects.create(
            farm=farm2,
            device=dev2,
            nitrogen_n=18.0,
            phosphorus_p=14.5,
            potassium_k=25.0,
            ph_level=5.4,
            moisture=48.0,
            status=status_acidic,
        )
        npk = fert_objs.get('NPK (14-14-14)')
        if npk:
            Recommendation.objects.create(
                reading=r2,
                fertilizer=npk,
                recommended_amount_kg=60.0,
            )

def reverse_func(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_alter_fertilizer_nutrient_type_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_data, reverse_code=reverse_func),
    ]

