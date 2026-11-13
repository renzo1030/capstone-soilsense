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
    Allows access only to authenticated Farmers who have completed mandatory password reset.
    """
    def has_permission(self, request, view):
        is_farmer = bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role and 
            request.user.role.role_name == 'farmer'
        )
        if not is_farmer:
            return False

        # Reject operational data requests if mandatory password change is pending
        if getattr(request.user, 'must_change_password', False):
            return False

        return True
