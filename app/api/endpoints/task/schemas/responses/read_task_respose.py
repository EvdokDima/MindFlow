from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from uuid import UUID
from app.api.endpoints.task.schemas.enums.task_status import TaskStatus

class TaskResponse(BaseModel):
    """Схема ответа с данными задачи"""
    id: UUID
    title: str
    description: Optional[str]
    due_date: Optional[datetime]
    priority: int
    status: TaskStatus
    created_at: datetime
    user_id: UUID

    class Config:
        from_attributes = True