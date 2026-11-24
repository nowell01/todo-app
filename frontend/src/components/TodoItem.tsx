import { useState } from "react";

import {
  deleteTodo,
  PRIORITY_LABELS,
  toInput,
  updateTodo,
  type Priority,
  type Todo,
} from "../api";
import PrioritySelect from "./PrioritySelect";

interface Props {
  todo: Todo;
  onUpdated: (todo: Todo) => void;
  onDeleted: (id: number) => void;
  onError: (err: unknown) => void;
}

export default function TodoItem({ todo, onUpdated, onDeleted, onError }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [description, setDescription] = useState(todo.description ?? "");
  const [priority, setPriority] = useState<Priority>(todo.priority);
  const [busy, setBusy] = useState(false);

  // Wraps every API action: disable buttons while it runs, report errors
  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  }

  // PUT replaces the WHOLE todo, so we send every field - only `done` changes
  const toggleDone = () =>
    run(async () => {
      onUpdated(await updateTodo(todo.id, { ...toInput(todo), done: !todo.done }));
    });

  const save = () =>
    run(async () => {
      const updated = await updateTodo(todo.id, {
        ...toInput(todo),
        title: title.trim(),
        description: description.trim() || null,
        priority,
      });
      onUpdated(updated);
      setEditing(false);
    });

  const remove = () =>
    run(async () => {
      if (!confirm(`Delete "${todo.title}"?`)) return;
      await deleteTodo(todo.id);
      onDeleted(todo.id);
    });

  function cancelEdit() {
    setTitle(todo.title);
    setDescription(todo.description ?? "");
    setPriority(todo.priority);
    setEditing(false);
  }

  if (editing) {
    return (
      <li className="todo editing">
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
        <input
          value={description}
          placeholder="Description"
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
        />
        <PrioritySelect value={priority} onChange={setPriority} />
        <div className="actions">
          <button onClick={save} disabled={busy || !title.trim()}>
            Save
          </button>
          <button className="secondary" onClick={cancelEdit} disabled={busy}>
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className={todo.done ? "todo done" : "todo"}>
      <input type="checkbox" checked={todo.done} onChange={toggleDone} disabled={busy} />
      <div className="body">
        <span className="title">{todo.title}</span>
        {todo.description && <span className="description">{todo.description}</span>}
      </div>
      <span className={`badge p${todo.priority}`}>{PRIORITY_LABELS[todo.priority]}</span>
      <div className="actions">
        <button className="secondary" onClick={() => setEditing(true)} disabled={busy}>
          Edit
        </button>
        <button className="danger" onClick={remove} disabled={busy}>
          Delete
        </button>
      </div>
    </li>
  );
}