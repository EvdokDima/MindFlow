from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.models.tasks import Task
from app.db.base import get_db
from app.utils.get_user import get_current_user
from app.db.models.users import User
from app.api.endpoints.task.schemas.requests.update_task_request import TaskUpdateRequest
from app.api.endpoints.task.schemas.responses.read_task_respose import TaskResponse

router = APIRouter()


@router.patch("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
        task_id: UUID,
        task_data: TaskUpdateRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Обновление задачи"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    update_data = task_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(task, field, value)

    if task_data.status and task_data.status not in ["todo", "in_progress", "done"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid status value"
        )

    db.commit()
    db.refresh(task)

    return task