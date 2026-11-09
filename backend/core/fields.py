import base64
import hashlib
from django.db import models
from django.conf import settings
from cryptography.fernet import Fernet, InvalidToken

def get_fernet_cipher():
    raw_key = getattr(settings, 'FIELD_ENCRYPTION_KEY', settings.SECRET_KEY).encode('utf-8')
    fernet_key = base64.urlsafe_b64encode(hashlib.sha256(raw_key).digest())
    return Fernet(fernet_key)

class EncryptedCharField(models.CharField):
    """
    AES-128-CBC / HMAC-SHA256 authenticated field encryption using cryptography Fernet.
    Complies with manuscript Chapter 3 Section 460 for protecting sensitive farm & contact data.
    Gracefully handles existing plaintext data without breaking historical records.
    """
    def __init__(self, *args, **kwargs):
        # Encrypted ciphertext is base64 encoded and longer than raw text; ensure adequate max_length
        kwargs.setdefault('max_length', 512)
        super().__init__(*args, **kwargs)

    def from_db_value(self, value, expression, connection):
        if value is None:
            return value
        return self._decrypt(value)

    def to_python(self, value):
        if value is None:
            return value
        return self._decrypt(value)

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if value is None or value == '':
            return value
        return self._encrypt(str(value))

    def _encrypt(self, text):
        if not text:
            return text
        try:
            cipher = get_fernet_cipher()
            # If already encrypted, don't double-encrypt
            if text.startswith('gAAAAA'):
                try:
                    cipher.decrypt(text.encode('ascii'))
                    return text
                except InvalidToken:
                    pass
            return cipher.encrypt(text.encode('utf-8')).decode('ascii')
        except Exception:
            return text

    def _decrypt(self, text):
        if not text:
            return text
        try:
            if isinstance(text, str) and text.startswith('gAAAAA'):
                cipher = get_fernet_cipher()
                return cipher.decrypt(text.encode('ascii')).decode('utf-8')
            return str(text)
        except (InvalidToken, Exception):
            return str(text)

    def deconstruct(self):
        name, path, args, kwargs = super().deconstruct()
        return name, path, args, kwargs

