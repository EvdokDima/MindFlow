from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from app.db.models.groups import TaskGroup
from app.db.base import get_db
from app.utils.get_user import get_current_user
from app.db.models.users import User
from app.db.models.tasks import Task
from app.api.endpoints.groups.schemas.responses.read_group_response import TaskGroupResponse
from typing import List

router = APIRouter()


@router.get("/groups", response_model=List[TaskGroupResponse])
async def get_user_groups(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Получение всех групп пользователя с количеством задач"""
    from sqlalchemy import func

    # Запрос с подсчетом задач и преобразованием в словарь
    groups = db.query(
        TaskGroup,
        func.count(Task.id).label('tasks_count')
    ).outerjoin(
        Task,
        Task.group_id == TaskGroup.id
    ).filter(
        TaskGroup.user_id == current_user.id
    ).group_by(
        TaskGroup.id
    ).all()

    # Преобразуем в список словарей с нужными полями
    result = []
    for group, count in groups:
        result.append({
            "id": group.id,
            "name": group.name,
            "description": group.description,
            "user_id": group.user_id,
            "created_at": group.created_at,
            "tasks_count": count  # Добавляем подсчитанное количество
        })

    return result


@router.get("/groups/{group_id}", response_model=TaskGroupResponse)
async def get_group_details(
        group_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Получение информации о группе и количестве её задач"""
    from sqlalchemy import func

    group_data = db.query(
        TaskGroup,
        func.count(Task.id).label('tasks_count')
    ).outerjoin(
        Task,
        Task.group_id == TaskGroup.id
    ).filter(
        TaskGroup.id == group_id,
        TaskGroup.user_id == current_user.id
    ).group_by(
        TaskGroup.id
    ).first()

    if not group_data:
        raise HTTPException(status_code=404, detail="Group not found")

    group, count = group_data

    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "user_id": group.user_id,
        "created_at": group.created_at,
        "tasks_count": count
    }