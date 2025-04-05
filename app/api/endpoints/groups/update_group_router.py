from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.models.groups import TaskGroup
from app.db.base import get_db
from app.utils.get_user import get_current_user
from app.db.models.users import User
from app.api.endpoints.groups.schemas.requests.update_group_request import GroupUpdateRequest
from app.api.endpoints.groups.schemas.responses.read_group_response import TaskGroupResponse

router = APIRouter()

@router.patch("/groups/{group_id}", response_model=TaskGroupResponse)
async def update_group(
        group_id: UUID,
        group_data: GroupUpdateRequest,
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Обновление группы задач"""
    group = db.query(TaskGroup).filter(
        TaskGroup.id == group_id,
        TaskGroup.user_id == current_user.id
    ).first()

    if not group:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Group not found"
        )

    update_data = group_data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(group, field, value)

    db.commit()
    db.refresh(group)

    group.tasks_count = len(group.tasks) if group.tasks else 0

    return group