import { useState, type FormEvent } from "react";

import { createTodo, type Priority } from "../api";
import PrioritySelect from "./PrioritySelect";

interface Props {
  onCreated: () => void;
  onError: (err: unknown) => void;
}

export default function TodoForm({ onCreated, onError }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>(2);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await createTodo({
        title: title.trim(),
        description: description.trim() || null, // empty box -> null, not ""
        done: false,
        priority,
      });
      setTitle("");
      setDescription("");
      setPriority(2);
      onCreated();
    } catch (err) {
      onError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card new-todo" onSubmit={handleSubmit}>
      <input
        placeholder="What needs doing?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        required
      />
      <input
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={1000}
      />
      <PrioritySelect value={priority} onChange={setPriority} />
      <button type="submit" disabled={busy || !title.trim()}>
        Add
      </button>
    </form>
  );
}