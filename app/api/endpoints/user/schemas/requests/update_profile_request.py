from pydantic import BaseModel
from datetime import datetime
from pydantic import Field
from typing import Optional
from uuid import UUID

class ProfileUpdateRequest(BaseModel):
    """Схема для обновления профиля (только username)"""
    username: str = Field(..., min_length=3, max_length=50)

    class Config:
        json_schema_extra = {
            "example": {
                "username": "new_username"
            }
        }