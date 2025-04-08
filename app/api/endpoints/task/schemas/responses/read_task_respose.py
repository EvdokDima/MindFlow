from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from app.api.endpoints.task.schemas.enums.task_status import TaskStatus
from app.api.endpoints.groups.schemas.responses.read_group_response import TaskGroupResponse


class TaskFile(BaseModel):
    file_name: str
    s3_key: str
    download_url: HttpUrl

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
    files: List[TaskFile]

    class Config:
        from_attributes = True

class PaginatedResponse(BaseModel):
    items: List[TaskResponse]
    total: int
    page: int
    per_page: int
    total_pages: int

    class Config:
        from_attributes = True
