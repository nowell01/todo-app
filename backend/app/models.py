from datetime import datetime, UTC

from sqlmodel import Field, SQLModel

class TodoBase(SQLModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)


class Todo(TodoBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    done: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

class TodoPublic(TodoBase):
    id: int
    done: bool
    created_at: datetime


class TodoCreate(TodoBase):
    """Create"""


class TodoUpdate(TodoBase):
    """Update"""
    done: bool