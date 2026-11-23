from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import Todo


def test_create_todo(client: TestClient):
    response = client.post(
        "/todos", json={"title": "Buy groceries", "description": "Milk, butter, olive oil"}
    )
    data = response.json()

    assert response.status_code == 201
    assert data["title"] == "Buy groceries"
    assert data["description"] == "Milk, butter, olive oil"
    assert data["done"] is False
    assert data["id"] is not None
    assert "created_at" in data


def test_read_todos(session: Session, client: TestClient):
    todo_1 = Todo(title="Buy groceries", description="Milk, butter, olive oil")
    todo_2 = Todo(title="Wash the dishes", done=True)
    session.add(todo_1)
    session.add(todo_2)
    session.commit()

    response = client.get("/todos")
    data = response.json()

    assert response.status_code == 200
    assert len(data) == 2
    assert data[0]["id"] == todo_1.id
    assert data[0]["title"] == todo_1.title
    assert data[0]["done"] is False
    assert data[1]["id"] == todo_2.id
    assert data[1]["title"] == todo_2.title
    assert data[1]["done"] is True


def test_read_todo(session: Session, client: TestClient):
    todo_1 = Todo(title="Buy groceries", description="Milk, butter, olive oil")
    session.add(todo_1)
    session.commit()

    response = client.get(f"/todos/{todo_1.id}")
    data = response.json()

    assert response.status_code == 200
    assert data["id"] == todo_1.id
    assert data["title"] == todo_1.title
    assert data["description"] == todo_1.description


def test_update_todo(session: Session, client: TestClient):
    todo_1 = Todo(title="Buy groceries", description="Milk, butter, olive oil")
    session.add(todo_1)
    session.commit()

    response = client.put(
        f"/todos/{todo_1.id}",
        json={"title": "Buy groceries", "description": "Milk, butter, olive oil", "done": True},
    )
    data = response.json()

    assert response.status_code == 200
    assert data["id"] == todo_1.id
    assert data["title"] == "Buy groceries"
    assert data["description"] == "Milk, butter, olive oil"
    assert data["done"] is True


def test_delete_todo(session: Session, client: TestClient):
    todo_1 = Todo(title="Buy groceries", description="Milk, butter, olive oil")
    session.add(todo_1)
    session.commit()

    response = client.delete(f"/todos/{todo_1.id}")
    todo_in_db = session.get(Todo, todo_1.id)

    assert response.status_code == 204
    assert todo_in_db is None


def test_read_no_id_todos(session: Session, client: TestClient):
    todo_1 = Todo(title="Buy groceries")
    session.add(todo_1)
    session.commit()

    client.delete(f"/todos/{todo_1.id}")
    response = client.get(f"/todos/{todo_1.id}")
    assert response.status_code == 404

def test_read_wrong_id_todos(session: Session, client: TestClient):
    todo_1 = Todo(title="Buy groceries", description="Milk, butter, olive oil")
    session.add(todo_1)
    session.commit()

    response = client.get(f"/todos/{999}")

    assert response.status_code == 404

def test_update_no_title_todo(session: Session, client: TestClient):
    todo_1 = Todo(title="Buy groceries", description="Milk, butter, olive oil")
    session.add(todo_1)
    session.commit()

    response = client.put(
        f"/todos/{todo_1.id}",
        json={"description": "Milk, butter, olive oil", "done": True},
    )

    assert response.status_code == 422

def test_update_no_description_todo(session: Session, client: TestClient):
    todo_1 = Todo(title="Buy groceries", description="Milk, butter, olive oil")
    session.add(todo_1)
    session.commit()

    response = client.put(
        f"/todos/{todo_1.id}",
        json={"title":"Buy groceries", "done": True},
    )
    data = response.json()

    assert response.status_code == 200
    assert data["id"] == todo_1.id
    assert data["title"] == "Buy groceries"
    assert data["description"] is None
    assert data["done"] is True


def test_create_wrong_id_todos(session: Session, client: TestClient):
    todo_1 = Todo(title="Buy groceries")
    session.add(todo_1)
    session.commit()

    response = client.post("/todos", json={"title":"Buy groceries", "id":999})
    data = response.json()

    assert response.status_code == 201
    assert data["id"] != 999


def test_read_done_todos(session: Session, client: TestClient):
    todo_1 = Todo(title="Buy groceries", description="Milk, butter, olive oil")
    todo_2 = Todo(title="Wash the dishes", done=True)
    todo_3 = Todo(title="Walk the dog", done=True)
    session.add(todo_1)
    session.add(todo_2)
    session.add(todo_3)
    session.commit()

    response = client.get(f"/todos?done=true")
    data = response.json()

    assert response.status_code == 200
    assert len(data) == 2
    assert data[0]["done"] is True
    assert data[1]["done"] is True


def test_read_wrong_limit_todos(session: Session, client: TestClient):
    response = client.get(f"/todos?limit=0")

    assert response.status_code == 422