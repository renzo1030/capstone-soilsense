import os
import sys

sys.path.append('backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()

from core.models import Account, Role, Farmer, MaoStaff, Farm, IoTDevice, SoilReading, SoilHealthStatus, Fertilizer, Recommendation

def run_audit(db_name="Default"):
    print(f"\n=======================================================")
    print(f" DATABASE AUDIT REPORT ({db_name})")
    print(f"=======================================================")

    # 1. Accounts & Roles
    print("\n[1. ACCOUNTS & ROLES]")
    total_accounts = Account.objects.count()
    print(f"Total Accounts: {total_accounts}")
    roles = Role.objects.all()
    for r in roles:
        count = Account.objects.filter(role=r).count()
        print(f" - Role '{r.role_name}' (ID {r.role_id}): {count} accounts")

    # 2. Farmers & Farm Mapping
    print("\n[2. FARMER PROFILES & FARM ASSIGNMENTS]")
    farmers = Farmer.objects.select_related('account').all()
    print(f"Total Farmer Profiles: {farmers.count()}")
    orphaned_farmers = Farmer.objects.filter(account__isnull=True).count()
    print(f"Orphaned Farmers (no Account): {orphaned_farmers}")

    farms = Farm.objects.select_related('farmer').all()
    print(f"Total Farms Registered: {farms.count()}")
    orphaned_farms = Farm.objects.filter(farmer__isnull=True).count()
    print(f"Orphaned Farms (no Farmer): {orphaned_farms}")

    print("\nFarmer-to-Farm Registry Breakdown:")
    for f in farmers:
        farmer_farms = f.farms.all()
        print(f"  • Farmer #{f.farmer_id}: {f.firstname} {f.lastname} (User: @{f.account.username})")
        print(f"    Barangay: {f.barangay} | Contact: {f.contact_number}")
        print(f"    Assigned Farms ({farmer_farms.count()}):")
        for farm in farmer_farms:
            print(f"      ↳ Farm ID {farm.farm_id}: Location='{farm.location}', Area={farm.total_area_sqm} sqm")

    # 3. Hardware Registry (IoTDevice)
    print("\n[3. IOT HARDWARE REGISTRY (IoTDevice)]")
    devices = IoTDevice.objects.select_related('farm', 'farm__farmer').all()
    print(f"Total Hardware Devices: {devices.count()}")
    active_devices = devices.filter(is_active=True).count()
    assigned_devices = devices.filter(farm__isnull=False).count()
    unassigned_devices = devices.filter(farm__isnull=True).count()
    print(f"Active Devices: {active_devices} | Inactive: {devices.count() - active_devices}")
    print(f"Assigned to Farm: {assigned_devices} | Unassigned (Floating): {unassigned_devices}")

    print("\nDevice Itemized Audit:")
    for d in devices:
        status_flag = "ACTIVE" if d.is_active else "DISABLED"
        if d.farm:
            farm_desc = f"Farm #{d.farm.farm_id} ('{d.farm.location}')"
            farmer_desc = f"Owner: {d.farm.farmer.firstname} {d.farm.farmer.lastname}"
        else:
            farm_desc = "UNASSIGNED (Floating)"
            farmer_desc = "N/A"
        
        readings_count = SoilReading.objects.filter(device=d).count()
        last_sync_str = str(d.last_sync) if d.last_sync else "Never Synchronized"

        print(f"  • Device #{d.device_id} [{status_flag}]:")
        print(f"      UID          : \"{d.device_uid}\"")
        print(f"      Name         : \"{d.device_name}\"")
        print(f"      Assigned To  : {farm_desc} -> {farmer_desc}")
        print(f"      Last Sync    : {last_sync_str}")
        print(f"      Readings Log : {readings_count} historical records mapped")

    # 4. Ingestion Authenticity Simulation
    print("\n[4. IOT AUTHENTICATION & INGESTION SIMULATION]")
    test_uids = ["ESP32-SOILSENSE-01", "NON-EXISTENT-UID", "ESP32-SOILSENSE-02"]
    for uid in test_uids:
        try:
            matched_dev = IoTDevice.objects.select_related('farm').get(device_uid=uid)
            if not matched_dev.is_active:
                print(f"  • Ingest with UID '{uid}': REJECTED (HTTP 403 Forbidden - Device deactivated)")
            elif not matched_dev.farm:
                print(f"  • Ingest with UID '{uid}': REJECTED (HTTP 400 Bad Request - Device unassigned to farm)")
            else:
                print(f"  • Ingest with UID '{uid}': AUTHORIZED (HTTP 201 - Mapped to Farm #{matched_dev.farm.farm_id})")
        except IoTDevice.DoesNotExist:
            print(f"  • Ingest with UID '{uid}': REJECTED (HTTP 401 Unauthorized - Unregistered hardware)")

    # 5. Soil Readings Telemetry Summary
    print("\n[5. TELEMETRY & SOIL READING RECORDS]")
    total_readings = SoilReading.objects.count()
    print(f"Total Historical Soil Readings: {total_readings}")
    recent_readings = SoilReading.objects.select_related('farm', 'device', 'status').order_by('-recorded_at')[:5]
    print(f"Latest 5 Soil Ingestion Records:")
    for r in recent_readings:
        dev_label = r.device.device_uid if r.device else "Legacy/Direct"
        status_label = r.status.status_name if r.status else "Unknown"
        print(f"  • Reading #{r.reading_id} [{r.recorded_at}]: Farm #{r.farm.farm_id} via {dev_label} | N={r.nitrogen_n}, P={r.phosphorus_p}, K={r.potassium_k}, pH={r.ph_level}, Moist={r.moisture}% | Status='{status_label}'")

if __name__ == '__main__':
    run_audit("Local SQLite")

