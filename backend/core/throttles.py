from rest_framework.throttling import AnonRateThrottle

class LoginRateThrottle(AnonRateThrottle):
    """
    Limits authentication attempts by IP to prevent automated brute-force attacks.
    """
    scope = 'login'

