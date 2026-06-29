import base64
import hashlib
from cryptography.fernet import Fernet
from src.core import settings

def _get_fernet() -> Fernet:
    # Derive a 32-byte key from JWT_SECRET by hashing it
    key_hash = hashlib.sha256(settings.JWT_SECRET.encode()).digest()
    fernet_key = base64.urlsafe_b64encode(key_hash)
    return Fernet(fernet_key)

def encrypt_data(data: str | None) -> str | None:
    """
    Encrypts a string using Fernet symmetric encryption.
    """
    if not data:
        return data
    f = _get_fernet()
    return f.encrypt(data.encode()).decode()

def decrypt_data(encrypted_data: str | None) -> str | None:
    """
    Decrypts a Fernet encrypted string.
    """
    if not encrypted_data:
        return encrypted_data
    f = _get_fernet()
    return f.decrypt(encrypted_data.encode()).decode()
