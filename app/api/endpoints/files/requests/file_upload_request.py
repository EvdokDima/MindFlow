from pydantic import BaseModel

class FileUploadRequest(BaseModel):
    file: bytes

    class Config:
        schema_extra = {
            "example": {
                "file": "binary file content"
            }
        }
