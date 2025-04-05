from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.models.groups import TaskGroup
from app.db.base import get_db
from app.utils.get_user import get_current_user
from app.db.models.users import User

router = APIRouter()

@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Удаление группы"""
    group = db.query(TaskGroup).filter(
        TaskGroup.id == group_id,
        TaskGroup.user_id == current_user.id
    ).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    db.delete(group)
    db.commit()

    return None