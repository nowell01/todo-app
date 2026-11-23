import os
from dotenv import load_dotenv
from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, create_engine

load_dotenv()  # reads .env into the environment

DATABASE_URL = os.getenv("DATABASE_URL", "")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False}, echo=False)

def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]