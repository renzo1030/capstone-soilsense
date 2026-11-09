from django.urls import path
from . import views
urlpatterns = [
    path('auth/login/', views.login_view, name='api_login'),
    path('iot/upload/', views.iot_data_ingest, name='api_iot_upload'),
    path('farmer/logs/', views.farmer_logs, name='api_farmer_logs'),
    path('farmer/dashboard/', views.farmer_dashboard_data, name='api_farmer_dashboard'),
    path('mao/register-farmer/', views.register_farmer, name='api_register_farmer'),
    path('mao/register-farm/', views.register_farm, name='api_register_farm'),
    path('mao/register-device/', views.register_device, name='api_register_device'),
    path('mao/device-list/', views.list_devices, name='api_list_devices'),
    path('mao/unassign-device/<int:device_id>/', views.unassign_device, name='api_unassign_device'),
    path('mao/assign-device/<int:device_id>/', views.assign_device, name='api_assign_device'),
    path('mao/dashboard/', views.mao_dashboard_data, name='api_mao_dashboard'),
    path('mao/logs/', views.mao_logs_data, name='api_mao_logs'),
    path('mao/farms/', views.mao_farms_data, name='api_mao_farms'),
    path('mao/list-farmers/', views.list_farmers, name='api_list_farmers'),
    path('mao/delete-farmer/<int:account_id>/', views.delete_farmer, name='api_delete_farmer'),
    path('mao/unregister-farm/<int:farm_id>/', views.unregister_farm, name='api_unregister_farm'),
]
