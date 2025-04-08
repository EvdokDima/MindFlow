from fastapi import APIRouter, HTTPException, status, Response
from pydantic import BaseModel
from app.utils.s3.delete_file_from_s3 import delete_file_from_s3
from uuid import UUID
from app.api.endpoints.files.requests.delete_file_request import DeleteFileRequest
from botocore.exceptions import ClientError

router = APIRouter()

@router.delete("/task/files", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_file(request: DeleteFileRequest):
    """
    Удаляет файл из S3 по ключу
    """
    delete_file_from_s3(request.s3_key)

    return Response(status_code=status.HTTP_204_NO_CONTENT)
