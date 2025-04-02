from pydantic import BaseModel
from typing import Optional

class TaskGroupCreate(BaseModel):
    name: str
    description: Optional[str] = None