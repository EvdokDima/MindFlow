from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from uuid import UUID

class TaskGroupResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    user_id: UUID
    tasks_count: Optional[int] = 0
    created_at: datetime