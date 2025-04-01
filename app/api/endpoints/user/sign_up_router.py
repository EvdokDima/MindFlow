from fastapi import APIRouter, status, Depends, HTTPException
from authlib.jose import JsonWebToken
from uuid import UUID, uuid4
from datetime import datetime, timedelta
from passlib.context import CryptContext
from app.api.endpoints.user.schemas.requests.sign_up_request import SignUpRequest
from app.api.endpoints.user.schemas.responses.sign_up_response import SignUpResponseWithToken, UserBaseResponse, TokenData
from app.db.models.users import User
from app.db.base import get_db
from sqlalchemy.orm import Session
import os

router = APIRouter()

SECRET_KEY = os.getenv("RANDOM_SECRET")
ACCESS_TOKEN_EXPIRE_DAYS = 30

jwt = JsonWebToken(['HS256'])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Генерирует хэш пароля"""
    return pwd_context.hash(password)


def create_access_token(user_id: UUID) -> str:
    """Создает JWT токен с использованием authlib"""
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(user_id), "exp": expire}

    header = {'alg': 'HS256'}
    return jwt.encode(header, payload, SECRET_KEY)


@router.post(
    "/signup",
    response_model=SignUpResponseWithToken,
    status_code=status.HTTP_201_CREATED
)
async def signup(user_data: SignUpRequest, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )

    hashed_password = get_password_hash(user_data.password)

    new_user = User(
        id=uuid4(),
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        created_at=datetime.utcnow()
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = create_access_token(new_user.id)

    return SignUpResponseWithToken(
        user=UserBaseResponse(
            id=new_user.id,
            username=new_user.username,
            email=new_user.email,
            created_at=new_user.created_at
        ),
        auth=TokenData(
            access_token=access_token,
            token_type="bearer"
        )
    )