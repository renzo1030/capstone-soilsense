import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _

class ComplexPasswordValidator:
    """
    Enforces that the password contains at least:
    - 8 characters (handled by MinimumLengthValidator or here)
    - 1 uppercase letter (A-Z)
    - 1 lowercase letter (a-z)
    - 1 digit (0-9)
    - 1 special character (@$!%*?&# etc.)
    """
    def validate(self, password, user=None):
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("Password must contain at least one uppercase letter (A-Z)."),
                code='password_no_upper'
            )
        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _("Password must contain at least one lowercase letter (a-z)."),
                code='password_no_lower'
            )
        if not re.search(r'\d', password):
            raise ValidationError(
                _("Password must contain at least one digit (0-9)."),
                code='password_no_digit'
            )
        if not re.search(r'[@$!%*?&#^()_\-+=\[\]{}|:;,<.>]', password):
            raise ValidationError(
                _("Password must contain at least one special character (@$!%*?&#^()_-+= etc.)."),
                code='password_no_special'
            )

    def get_help_text(self):
        return _(
            "Your password must contain at least 8 characters, including uppercase, "
            "lowercase, numeric, and special characters."
        )

