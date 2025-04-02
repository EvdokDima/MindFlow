from uuid import UUID

from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from app.api.endpoints.task.schemas.enums.task_status import TaskStatus

class TaskCreateRequest(BaseModel):
    """Схема для создания задачи"""
    title: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    due_date: Optional[datetime] = None
    group_id: Optional[UUID] = None
    priority: int = Field(1, ge=1, le=5)
    status: TaskStatus = TaskStatus.TODO

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Complete project documentation",
                "description": "Write detailed docs for all endpoints",
                "due_date": "2023-12-31T23:59:59",
                "priority": 2,
                "status": "todo"
            }
        }
