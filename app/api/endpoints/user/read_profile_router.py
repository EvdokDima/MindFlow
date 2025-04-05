from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Annotated
from uuid import UUID
from app.db.base import get_db
from app.db.models.users import User
from app.db.models.tasks import Task
from app.db.models.groups import TaskGroup
from app.api.endpoints.user.schemas.responses.read_profile_response import ProfileResponse
from app.api.endpoints.user.schemas.requests.update_profile_request import ProfileUpdateRequest
from app.utils.get_user import get_current_user

router = APIRouter()

@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
):
    """Получение данных профиля пользователя"""
    tasks_count = db.query(func.count(Task.id)).filter(Task.user_id == current_user.id).scalar()

    groups_count = db.query(func.count(TaskGroup.id)).filter(TaskGroup.user_id == current_user.id).scalar()

    return ProfileResponse(
        username=current_user.username,
        email=current_user.email,
        created_at=current_user.created_at,
        groups_count=groups_count,
        tasks_count=tasks_count
    )


@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(
        update_data: ProfileUpdateRequest,
        current_user: Annotated[User, Depends(get_current_user)],
        db: Session = Depends(get_db)
):
    """Обновление username пользователя"""

    current_user.username = update_data.username
    db.commit()
    db.refresh(current_user)

    return await get_profile(current_user, db)