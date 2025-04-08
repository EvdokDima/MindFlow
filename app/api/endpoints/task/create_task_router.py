from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime
from app.db.models.tasks import Task
from app.db.base import get_db
from app.utils.get_user import get_current_user
from app.db.models.users import User
from app.api.endpoints.task.schemas.requests.create_task_request import TaskCreateRequest
from app.api.endpoints.task.schemas.responses.read_task_respose import TaskResponse, TaskFile
from app.utils.s3.list_task_files_from_s3 import list_task_files_with_urls_from_s3

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
        group_id=task_data.group_id,
        created_at=datetime.utcnow()
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)



    file_objs = list_task_files_with_urls_from_s3(str(new_task.id))
    task_dict = new_task.__dict__
    task_dict["files"] = [TaskFile(**f) for f in file_objs]

    # Поддержка pydantic-конверсии с SQLAlchemy модели
    return TaskResponse(**task_dict)