from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional

class GroupUpdateRequest(BaseModel):
    """Схема для обновления группы задач"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Updated group name",
                "description": "Updated group description"
            }
        }