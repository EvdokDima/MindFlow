from pydantic import BaseModel

class DeleteFileRequest(BaseModel):
    s3_key: str