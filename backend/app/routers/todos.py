from typing import Annotated

from fastapi import APIRouter, HTTPException, status, Query
from sqlmodel import Session, select

from app.security import CurrentUserDep
from app.database import SessionDep
from app.models import Todo, TodoCreate, TodoPublic, TodoUpdate, User

router = APIRouter(prefix="/todos", tags=["todos"])


def get_owned_todo(todo_id: int, session: Session, user: User) -> Todo:
    """Load a todo that belongs to this user, or raise 404."""
    todo = session.get(Todo, todo_id)
    if not todo or todo.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    return todo


@router.get("", response_model=list[TodoPublic])
def list_todos(
    session: SessionDep,
    current_user: CurrentUserDep,
    done: bool | None = None,
    search: Annotated[str | None, Query(max_length=50)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    statement = select(Todo).where(Todo.owner_id == current_user.id)   # ← only my todos
    if done is not None:
        statement = statement.where(Todo.done == done)
    if search:
        statement = statement.where(Todo.title.ilike(f"%{search}%"))
    statement = statement.order_by(Todo.id).offset(offset).limit(limit)
    return session.exec(statement).all()


@router.get("/{todo_id}", response_model=TodoPublic)
def read_todo(todo_id: int, session: SessionDep, current_user: CurrentUserDep):
    return get_owned_todo(todo_id, session, current_user)


@router.post("", response_model=TodoPublic, status_code=status.HTTP_201_CREATED)
def create_todo(data: TodoCreate, session: SessionDep, current_user: CurrentUserDep):
    todo = Todo.model_validate(data, update={"owner_id": current_user.id})
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


@router.put("/{todo_id}", response_model=TodoPublic)
def update_todo(todo_id: int, data: TodoUpdate, session: SessionDep, current_user: CurrentUserDep):
    todo = get_owned_todo(todo_id, session, current_user)
    todo.sqlmodel_update(data.model_dump())
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, session: SessionDep, current_user: CurrentUserDep):
    todo = get_owned_todo(todo_id, session, current_user)
    session.delete(todo)
    session.commit()