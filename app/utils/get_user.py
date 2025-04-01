from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from authlib.jose import JsonWebToken
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.db.models.users import User
import os

jwt = JsonWebToken(['HS256'])
SECRET_KEY = os.getenv("RANDOM_SECRET")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="signin")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )