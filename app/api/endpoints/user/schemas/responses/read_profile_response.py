from pydantic import BaseModel
from datetime import datetime
from pydantic import Field

from typing import Optional
from uuid import UUID

class ProfileResponse(BaseModel):
    """Схема ответа с данными профиля"""
    username: str
    email: str
    created_at: datetime
    groups_count: int
    tasks_count: int

    class Config:
        from_attributes = True