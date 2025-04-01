from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional

class TaskUpdateRequest(BaseModel):
    """Схема для обновления задачи"""
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    due_date: Optional[datetime] = None
    priority: Optional[int] = Field(None, ge=1, le=5)
    status: Optional[str] = Field(None, pattern="^(todo|in_progress|done)$")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Updated task title",
                "description": "Updated description",
                "due_date": "2023-12-31T23:59:59",
                "priority": 3,
                "status": "in_progress"
            }
        }