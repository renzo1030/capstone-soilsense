import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from core.models import Role

# Ensure the two required user roles exist
Role.objects.get_or_create(role_name='farmer', description='Rice Farmer')
Role.objects.get_or_create(role_name='mao', description='MAO Administrator')

print("System roles initialized: 'farmer' and 'mao'.")
print("Use the MAO web portal to register actual farmer accounts.")
