from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from app.api.endpoints.task.schemas.enums.task_status import TaskStatus
from app.api.endpoints.groups.schemas.responses.read_group_response import TaskGroupResponse

class TaskResponse(BaseModel):
    """Схема ответа с данными задачи"""
    id: UUID
    title: str
    description: Optional[str]
    due_date: Optional[datetime]
    priority: int
    status: TaskStatus
    created_at: datetime
    group: Optional[TaskGroupResponse] = None
    user_id: UUID

    class Config:
        from_attributes = True

class PaginatedResponse(BaseModel):
    items: List[TaskResponse]
    total: int
    page: int
    per_page: int
    total_pages: int