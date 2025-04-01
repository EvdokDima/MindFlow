from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from app.api.endpoints.task.schemas.enums.task_status import TaskStatus

class TaskFilter(BaseModel):
    """Схема для фильтрации задач"""
    status: Optional[List[TaskStatus]] = None
    priority_min: Optional[int] = Field(None, ge=1, le=5)
    priority_max: Optional[int] = Field(None, ge=1, le=5)
    start_date_from: Optional[datetime] = None
    start_date_to: Optional[datetime] = None
    due_date_from: Optional[datetime] = None
    due_date_to: Optional[datetime] = None

class Pagination(BaseModel):
    """Схема пагинации"""
    page: int = Field(1, ge=1)
    per_page: int = Field(10, ge=1, le=100)