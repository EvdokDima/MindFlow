import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from app.db.models.groups import TaskGroup
from app.db.base import get_db
from app.utils.get_user import get_current_user
from app.db.models.users import User
from app.api.endpoints.groups.schemas.requests.create_group_request import TaskGroupCreate
from app.api.endpoints.groups.schemas.responses.read_group_response import TaskGroupResponse

router = APIRouter()

@router.post("/groups", response_model=TaskGroupResponse)
async def create_group(
    group_data: TaskGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Создание новой группы задач"""
    group = TaskGroup(id=uuid.uuid4(),
                      name=group_data.name,
                      description=group_data.description,
                      created_at=datetime.utcnow(),
                      user_id=current_user.id)
    db.add(group)
    db.commit()
    db.refresh(group)
    return group