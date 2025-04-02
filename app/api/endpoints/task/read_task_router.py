from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.db.models.tasks import Task
from app.db.base import get_db
from app.utils.get_user import get_current_user
from app.db.models.users import User
from app.api.endpoints.task.schemas.responses.read_task_respose import TaskResponse, PaginatedResponse
from app.api.endpoints.task.schemas.requests.read_task_request import TaskFilter, Pagination, TaskStatus

router = APIRouter()


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task_by_id(
        task_id: UUID,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Получение задачи по ID"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    return task


@router.get("/tasks", response_model=PaginatedResponse)
async def get_all_tasks(
        pagination: Pagination = Depends(),
        status: Optional[List[TaskStatus]] = Query(None),
        priority_min: Optional[int] = Query(None, ge=1, le=5),
        priority_max: Optional[int] = Query(None, ge=1, le=5),
        created_at_from: Optional[datetime] = None,
        group_id: Optional[UUID] = Query(None),
        created_at_to: Optional[datetime] = None,
        due_date_from: Optional[datetime] = None,
        due_date_to: Optional[datetime] = None,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Получение всех задач с фильтрацией и пагинацией"""
    query = db.query(Task).filter(Task.user_id == current_user.id)

    if group_id is not None:
        query = query.filter(Task.group_id == group_id)

    if status:
        query = query.filter(Task.status.in_([s.value for s in status]))

    if priority_min is not None:
        query = query.filter(Task.priority >= priority_min)
    if priority_max is not None:
        query = query.filter(Task.priority <= priority_max)

    if created_at_from:
        query = query.filter(Task.created_at >= created_at_from)
    if created_at_to:
        query = query.filter(Task.created_at <= created_at_to)

    if due_date_from:
        query = query.filter(Task.due_date >= due_date_from)
    if due_date_to:
        query = query.filter(Task.due_date <= due_date_to)

    # Получаем общее количество задач (до пагинации)
    total = query.count()

    # Применяем пагинацию
    tasks = query.offset((pagination.page - 1) * pagination.per_page) \
        .limit(pagination.per_page) \
        .all()

    # Вычисляем общее количество страниц
    total_pages = (total + pagination.per_page - 1) // pagination.per_page

    return {
        "items": tasks,
        "total": total,
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total_pages": total_pages
    }