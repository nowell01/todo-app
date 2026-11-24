from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import Todo, User


def test_todos_require_login(anon_client: TestClient):
    response = anon_client.get("/todos")
    assert response.status_code == 401


def test_register_login_and_use_token(anon_client: TestClient):
    anon_client.post("/auth/register", json={"email": "a@example.com", "password": "password123"})
    login = anon_client.post("/auth/token", data={"username": "a@example.com", "password": "password123"})
    token = login.json()["access_token"]

    response = anon_client.get("/todos", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200


def test_garbage_token_is_rejected(anon_client: TestClient):
    response = anon_client.get("/todos", headers={"Authorization": "Bearer not.a.token"})
    assert response.status_code == 401


def test_cannot_see_other_users_todo(session: Session, client: TestClient):
    other = User(email="other@example.com", hashed_password="x")
    session.add(other)
    session.commit()
    others_todo = Todo(title="Secret", owner_id=other.id)
    session.add(others_todo)
    session.commit()

    assert client.get(f"/todos/{others_todo.id}").status_code == 404
    assert client.get("/todos").json() == []