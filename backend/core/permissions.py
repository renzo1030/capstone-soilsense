from rest_framework.permissions import BasePermission

class IsMaoAdmin(BasePermission):
    """
    Allows access only to authenticated MAO Administrators.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role and 
            request.user.role.role_name == 'mao'
        )

class IsFarmer(BasePermission):
    """
    Allows access only to authenticated Farmers.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role and 
            request.user.role.role_name == 'farmer'
        )
