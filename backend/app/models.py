from datetime import datetime, UTC
from pydantic import EmailStr

from sqlmodel import Field, SQLModel

class TodoBase(SQLModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    priority: int = Field(default=2, ge=1, le=3)


class Todo(TodoBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    done: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    owner_id: int = Field(foreign_key="user.id", index=True)

class TodoPublic(TodoBase):
    id: int
    done: bool
    created_at: datetime


class TodoCreate(TodoBase):
    """Create"""


class TodoUpdate(TodoBase):
    """Update"""
    done: bool


class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)


class User(UserBase, table=True):
    id: int | None = Field(default=None, primary_key=True)
    hashed_password: str


class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserPublic(UserBase):
    id: int


class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"