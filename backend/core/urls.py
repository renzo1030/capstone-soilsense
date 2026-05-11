from django.urls import path
from . import views
urlpatterns = [
    path('auth/login/', views.login_view, name='api_login'),
    path('iot/upload/', views.iot_data_ingest, name='api_iot_upload'),
    path('farmer/logs/', views.farmer_logs, name='api_farmer_logs'),
    path('farmer/dashboard/', views.farmer_dashboard_data, name='api_farmer_dashboard'),
    path('mao/register-farmer/', views.register_farmer, name='api_register_farmer'),
    path('mao/dashboard/', views.mao_dashboard_data, name='api_mao_dashboard'),
    path('mao/logs/', views.mao_logs_data, name='api_mao_logs'),
    path('mao/farms/', views.mao_farms_data, name='api_mao_farms'),
    path('superadmin/register-mao/', views.register_mao, name='api_register_mao'),
]
