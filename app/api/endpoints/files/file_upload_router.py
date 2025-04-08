from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Annotated
from sqlalchemy.orm import Session
from app.db.models.tasks import Task
from app.db.base import get_db
from app.db.models.users import User
from app.utils.get_user import get_current_user
from app.api.endpoints.files.responses.upload_file_response import FileUploadResponse
from app.utils.s3.upload_file_to_s3 import upload_file_to_s3
from app.api.endpoints.files.requests.file_upload_request import FileUploadRequest
from uuid import UUID

router = APIRouter()

@router.post("/task/{task_id}/files", response_model=FileUploadResponse)
async def upload_task_file(
    task_id: UUID,
    file: Annotated[UploadFile, File(description="Файл для загрузки")],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Загрузка файла, привязанного к задаче"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    if not file:
        raise HTTPException(status_code=400, detail="Файл не найден в запросе")

    content = await file.read()
    s3_key = f"{task_id}/{file.filename}"

    upload_file_to_s3(content, s3_key, file.content_type)

    return FileUploadResponse(
        s3_key=s3_key
    )