from django.db import models
from django.contrib.auth.models import AbstractUser
class Role(models.Model):
    role_id = models.AutoField(primary_key=True)
    role_name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    def __str__(self):
        return self.role_name
class Account(AbstractUser):
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
class Farmer(models.Model):
    farmer_id = models.AutoField(primary_key=True)
    account = models.OneToOneField(Account, on_delete=models.CASCADE, related_name='farmer_profile')
    firstname = models.CharField(max_length=100)
    middlename = models.CharField(max_length=100, blank=True)
    lastname = models.CharField(max_length=100)
    barangay = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=20)
    def __str__(self):
        return f"{self.firstname} {self.lastname}"
class MaoStaff(models.Model):
    staff_id = models.AutoField(primary_key=True)
    account = models.OneToOneField(Account, on_delete=models.CASCADE, related_name='mao_profile')
    firstname = models.CharField(max_length=100)
    middlename = models.CharField(max_length=100, blank=True)
    lastname = models.CharField(max_length=100)
    position = models.CharField(max_length=100)
class Farm(models.Model):
    farm_id = models.AutoField(primary_key=True)
    farmer = models.ForeignKey(Farmer, on_delete=models.CASCADE, related_name='farms')
    location = models.CharField(max_length=255)
    total_area_sqm = models.FloatField()
    def __str__(self):
        return f"Farm {self.farm_id} - {self.location}"
class SoilHealthStatus(models.Model):
    status_id = models.AutoField(primary_key=True)
    status_name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    def __str__(self):
        return self.status_name
class SoilReading(models.Model):
    reading_id = models.AutoField(primary_key=True)
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='readings')
    recorded_at = models.DateTimeField(auto_now_add=True)
    nitrogen_n = models.FloatField()
    phosphorus_p = models.FloatField()
    potassium_k = models.FloatField()
    ph_level = models.FloatField()
    moisture = models.FloatField()
    status = models.ForeignKey(SoilHealthStatus, on_delete=models.SET_NULL, null=True)
class Fertilizer(models.Model):
    fertilizer_id = models.AutoField(primary_key=True)
    fertilizer_name = models.CharField(max_length=100)
    nutrient_type = models.CharField(max_length=50)
    description = models.TextField(blank=True)
    def __str__(self):
        return self.fertilizer_name
class Recommendation(models.Model):
    recommendation_id = models.AutoField(primary_key=True)
    reading = models.ForeignKey(SoilReading, on_delete=models.CASCADE, related_name='recommendations')
    fertilizer = models.ForeignKey(Fertilizer, on_delete=models.CASCADE)
    recommended_amount_kg = models.FloatField()
    generated_date = models.DateField(auto_now_add=True)
