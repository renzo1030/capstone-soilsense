from django.contrib import admin
from .models import Role, Account, Farmer, MaoStaff, Farm, IoTDevice, SoilHealthStatus, SoilReading, Fertilizer, Recommendation

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('role_id', 'role_name', 'description')

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'role', 'is_active')
    list_filter = ('role',)

@admin.register(Farmer)
class FarmerAdmin(admin.ModelAdmin):
    list_display = ('farmer_id', 'firstname', 'lastname', 'barangay', 'account')
    search_fields = ('firstname', 'lastname', 'barangay')

@admin.register(Farm)
class FarmAdmin(admin.ModelAdmin):
    list_display = ('farm_id', 'farmer', 'location', 'total_area_sqm')

@admin.register(IoTDevice)
class IoTDeviceAdmin(admin.ModelAdmin):
    list_display = ('device_id', 'device_uid', 'device_name', 'farm', 'is_active', 'last_sync', 'registered_date')
    list_filter = ('is_active',)
    search_fields = ('device_uid', 'device_name')

@admin.register(SoilHealthStatus)
class SoilHealthStatusAdmin(admin.ModelAdmin):
    list_display = ('status_id', 'status_name')

@admin.register(SoilReading)
class SoilReadingAdmin(admin.ModelAdmin):
    list_display = ('reading_id', 'farm', 'device', 'recorded_at', 'nitrogen_n', 'phosphorus_p', 'potassium_k', 'ph_level', 'moisture')
    list_filter = ('farm',)

@admin.register(Fertilizer)
class FertilizerAdmin(admin.ModelAdmin):
    list_display = ('fertilizer_id', 'fertilizer_name', 'nutrient_type')

@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ('recommendation_id', 'reading', 'fertilizer', 'recommended_amount_kg', 'generated_date')
