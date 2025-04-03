from fastapi import APIRouter, Depends
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.base import get_db
from app.utils.get_user import get_current_user
from app.db.models.tasks import Task
from app.db.models.groups import TaskGroup
from app.db.models.users import User

router = APIRouter()


@router.get("/tasks/stats")
async def get_tasks_stats(
        db: Session = Depends(get_db),
        current_user: User = Depends(get_current_user)
):
    """Получение статистики по задачам"""
    # Общее количество задач
    total_tasks = db.query(func.count(Task.id)).filter(
        Task.user_id == current_user.id
    ).scalar()

    # Выполненные задачи
    completed_tasks = db.query(func.count(Task.id)).filter(
        Task.user_id == current_user.id,
        Task.status == 'done'
    ).scalar()

    # Просроченные задачи
    overdue_tasks = db.query(func.count(Task.id)).filter(
        Task.user_id == current_user.id,
        Task.due_date < datetime.now(),
        Task.status != 'done'
    ).scalar()

    # Распределение по статусам
    status_distribution = db.query(
        func.sum(case((Task.status == 'todo', 1), else_=0)).label('todo'),
                 func.sum(case((Task.status == 'in_progress', 1), else_=0)).label('in_progress'),
                          func.sum(case((Task.status == 'done', 1), else_=0)).label('done')
                                   ).filter(
                              Task.user_id == current_user.id
                          ).first()

    # Распределение по приоритетам
    priority_distribution = db.query(
        func.sum(case((Task.priority == 1, 1), else_=0)).label('p1'),
                 func.sum(case((Task.priority == 2, 1), else_=0)).label('p2'),
                          func.sum(case((Task.priority == 3, 1), else_=0)).label('p3'),
                                   func.sum(case((Task.priority == 4, 1), else_=0)).label('p4'),
                                            func.sum(case((Task.priority == 5, 1), else_=0)).label('p5')
                                                     ).filter(
                                                Task.user_id == current_user.id
                                            ).first()

    # Распределение по группам
    groups_distribution = db.query(
        TaskGroup.name.label('group_name'),
        func.count(Task.id).label('task_count')
    ).outerjoin(
        Task,
        Task.group_id == TaskGroup.id
    ).filter(
        TaskGroup.user_id == current_user.id
    ).group_by(
        TaskGroup.id
    ).all()

    return {
        "total_tasks": total_tasks or 0,
        "completed_tasks": completed_tasks or 0,
        "overdue_tasks": overdue_tasks or 0,
        "status_distribution": {
            "todo": status_distribution.todo or 0,
            "in_progress": status_distribution.in_progress or 0,
            "done": status_distribution.done or 0
        },
        "priority_distribution": {
            "p1": priority_distribution.p1 or 0,
            "p2": priority_distribution.p2 or 0,
            "p3": priority_distribution.p3 or 0,
            "p4": priority_distribution.p4 or 0,
            "p5": priority_distribution.p5 or 0
        },
        "groups_distribution": [
            {
                "group_name": group.group_name,
                "task_count": group.task_count
            } for group in groups_distribution
        ]
    }