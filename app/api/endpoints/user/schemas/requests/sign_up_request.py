from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Annotated
from uuid import UUID, uuid4
import re


class SignUpRequest(BaseModel):
    """
    User registration request schema with validation for:
    - Username (4-20 chars, alphanumeric + underscores)
    - Email (valid format)
    - Password (8-20 chars, at least 1 uppercase, 1 digit)
    """
    username: Annotated[
        str,
        Field(
            min_length=4,
            max_length=20,
            pattern=r"^[a-zA-Z0-9_]+$",
            examples=["john_doe", "alice123"],
            description="Username must be 4-20 characters long, alphanumeric with underscores"
        )
    ]

    email: Annotated[
        EmailStr,
        Field(
            examples=["user@example.com"],
            description="Valid email address"
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

    @field_validator('username')
    def validate_username(cls, value):
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise ValueError("Username can only contain letters, numbers and underscores")
        if value.startswith('_') or value.endswith('_'):
            raise ValueError("Username cannot start or end with underscore")
        return value

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
                "username": "john_doe",
                "email": "user@example.com",
                "password": "SecurePass123"
            }
        }