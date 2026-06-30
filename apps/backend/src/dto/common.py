from typing import Generic, TypeVar, Any
from pydantic import BaseModel

# Create a generic type variable
T = TypeVar('T')

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T | None = None
    error: Any | None = None