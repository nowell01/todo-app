from typing import Annotated

from fastapi import APIRouter, HTTPException, status, Query
from sqlmodel import select

from app.database import SessionDep
from app.models import Todo, TodoPublic, TodoCreate, TodoUpdate

router = APIRouter(prefix="/todos", tags=["todos"])


@router.get("", response_model=list[TodoPublic])
def list_todos(
    session: SessionDep,
    done: bool | None = None,
    search: Annotated[str | None, Query(max_length=50)] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
):
    statement = select(Todo)
    if done is not None:
        statement = statement.where(Todo.done == done)
    if search:
        statement = statement.where(Todo.title.ilike(f"%{search}%"))
    statement = statement.order_by(Todo.id).offset(offset).limit(limit)
    return session.exec(statement).all()



@router.get("/{todo_id}", response_model=TodoPublic)
def read_todo(todo_id: int, session: SessionDep):
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    return todo


@router.post("", response_model=TodoPublic, status_code=status.HTTP_201_CREATED)
def create_todo(data: TodoCreate, session: SessionDep):
    todo = Todo.model_validate(data)
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


@router.put("/{todo_id}", response_model=TodoPublic)
def update_todo(todo_id: int, data: TodoUpdate, session: SessionDep):
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    todo.sqlmodel_update(data.model_dump())
    session.add(todo)
    session.commit()
    session.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int, session: SessionDep):
    todo = session.get(Todo, todo_id)
    if not todo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    session.delete(todo)
    session.commit()