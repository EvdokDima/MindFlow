from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from app.db.models.tasks import Task
from app.db.base import get_db
from app.utils.get_user import get_current_user
from app.db.models.users import User
from app.api.endpoints.task.schemas.requests.create_task_request import TaskCreateRequest
from app.api.endpoints.task.schemas.responses.read_task_respose import TaskResponse
router = APIRouter()


@router.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
        task_data: TaskCreateRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Создание новой задачи"""

    new_task = Task(
        title=task_data.title,
        description=task_data.description,
        due_date=task_data.due_date,
        priority=task_data.priority,
        status=task_data.status.value,
        user_id=current_user.id,
        created_at=datetime.utcnow()
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task