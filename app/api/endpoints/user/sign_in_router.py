from fastapi import APIRouter, status, Depends, HTTPException
from authlib.jose import JsonWebToken
from datetime import datetime, timedelta
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.db.models.users import User
from app.db.base import get_db
from app.api.endpoints.user.schemas.requests.sign_in_request import SignInRequest
from app.api.endpoints.user.schemas.responses.sign_up_response import TokenData
import os

router = APIRouter()

SECRET_KEY = os.getenv("RANDOM_SECRET")
ACCESS_TOKEN_EXPIRE_DAYS = 30

jwt = JsonWebToken(['HS256'])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет соответствие пароля и его хэша"""
    return pwd_context.verify(plain_password, hashed_password)


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Аутентифицирует пользователя"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    return user


def create_access_token(user_id: str) -> str:
    """Создает JWT токен"""
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire}
    header = {'alg': 'HS256'}
    return jwt.encode(header, payload, SECRET_KEY)


@router.post("/signin", response_model=TokenData)
async def signin(
        form_data: SignInRequest,
        db: Session = Depends(get_db)
):
    user = authenticate_user(db, str(form_data.email), form_data.password)

    access_token = create_access_token(str(user.id))

    return TokenData(
        access_token=access_token,
        token_type="bearer"
    )