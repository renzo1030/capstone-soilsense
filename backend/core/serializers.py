from rest_framework import serializers
from .models import Account, Role, Farmer, MaoStaff, Farm, SoilHealthStatus, SoilReading, Fertilizer, Recommendation
class AccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = Account
        fields = ('id', 'username', 'role')
class SoilReadingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoilReading
        fields = '__all__'
