from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import uvicorn
import os

from app.db.base import init_db

from app.api.endpoints.user import sign_up_router
from app.api.endpoints.user import sign_in_router

from app.api.endpoints.task import create_task_router
from app.api.endpoints.task import read_task_router
from app.api.endpoints.task import update_task_router
from app.api.endpoints.task import delete_task_router
app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:63342",  # Это порт, который использует ваш фронтенд
    "http://127.0.0.1",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:63342",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все методы
    allow_headers=["*"],  # Разрешаем все заголовки
)
app.include_router(sign_up_router.router, prefix="/api", tags=["User"])
app.include_router(sign_in_router.router, prefix="/api", tags=["User"])
app.include_router(create_task_router.router, prefix="/api", tags=["Task"])
app.include_router(read_task_router.router, prefix="/api", tags=["Task"])
app.include_router(update_task_router.router, prefix="/api", tags=["Task"])
app.include_router(delete_task_router.router, prefix="/api", tags=["Task"])

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/api")
async def root():
    return {"message": "ok"}


if __name__ == "__main__":
    server_address = os.getenv("SERVER_ADDRESS", "0.0.0.0:8080")
    host, port = server_address.split(":")
    uvicorn.run(app, host=host, port=int(port))
