from pydantic import BaseModel, Field, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

class TokenData(BaseModel):
    """JWT токен доступа"""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")

class UserBaseResponse(BaseModel):
    """Базовые данные пользователя"""
    id: UUID = Field(..., description="Unique user identifier")
    username: str = Field(..., description="User's username")
    email: EmailStr = Field(..., description="User's email address")
    created_at: datetime = Field(..., description="Registration timestamp")

class SignInResponseWithToken(BaseModel):
    """Полный ответ при регистрации с токеном доступа"""
    user: UserBaseResponse = Field(..., description="User data")
    auth: TokenData = Field(..., description="Authentication tokens")

    class Config:
        json_schema_extra = {
            "example": {
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "username": "john_doe",
                    "email": "user@example.com",
                    "created_at": "2023-07-21T12:00:00Z"
                },
                "auth": {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "token_type": "bearer"
                }
            }
        }