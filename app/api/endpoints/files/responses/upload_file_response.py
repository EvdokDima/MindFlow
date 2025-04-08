from pydantic import BaseModel

class FileUploadResponse(BaseModel):
    s3_key: str