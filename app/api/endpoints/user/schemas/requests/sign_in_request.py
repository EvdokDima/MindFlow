from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Annotated


class SignInRequest(BaseModel):
    """
    User login request schema with validation for:
    - Email (valid format)
    - Password (8-20 chars, at least 1 uppercase, 1 digit)
    """
    email: Annotated[
        EmailStr,
        Field(
            examples=["user@example.com"],
            description="Valid email address used during registration"
        )
    ]

    password: Annotated[
        str,
        Field(
            min_length=8,
            max_length=20,
            examples=["SecurePass123"],
            description="Password must be 8-20 chars with at least 1 uppercase letter and 1 digit"
        )
    ]

    @field_validator('password')
    def validate_password(cls, value):
        if not any(char.isupper() for char in value):
            raise ValueError("Password must contain at least 1 uppercase letter")
        if not any(char.isdigit() for char in value):
            raise ValueError("Password must contain at least 1 digit")
        return value

    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123"
            }
        }