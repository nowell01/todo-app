import { useCallback, useEffect, useState } from "react";

import { listTodos, UnauthorizedError, type Todo } from "../api";
import TodoForm from "./TodoForm";
import TodoItem from "./TodoItem";

const PAGE_SIZE = 10;

type StatusFilter = "all" | "active" | "done";

const statusToDone: Record<StatusFilter, boolean | undefined> = {
  all: undefined,
  active: false,
  done: true,
};

interface Props {
  onUnauthorized: () => void;
}

export default function TodoPage({ onUnauthorized }: Props) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState(""); // debounced copy of searchInput
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Any error from any API call goes through here
  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof UnauthorizedError) {
        onUnauthorized(); // token expired or invalid -> back to login
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong");
    },
    [onUnauthorized],
  );

  // Debounce: only search 300 ms after the user stops typing
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load the FIRST page whenever a filter changes (or reload() is called)
  useEffect(() => {
    let cancelled = false; // ignore responses from outdated requests
    setLoading(true);
    setError(null);

    listTodos({ done: statusToDone[status], search, limit: PAGE_SIZE, offset: 0 })
      .then((page) => {
        if (cancelled) return;
        setTodos(page);
        setHasMore(page.length === PAGE_SIZE);
      })
      .catch((err) => !cancelled && handleError(err))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [status, search, reloadKey, handleError]);

  const reload = () => setReloadKey((k) => k + 1);

  async function loadMore() {
    setLoading(true);
    try {
      const page = await listTodos({
        done: statusToDone[status],
        search,
        limit: PAGE_SIZE,
        offset: todos.length, // continue where we stopped
      });
      setTodos((prev) => [...prev, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }

  function handleUpdated(updated: Todo) {
    const wantedDone = statusToDone[status];
    setTodos((prev) =>
      prev
        .map((t) => (t.id === updated.id ? updated : t))
        // e.g. on the "Active" tab, a todo you just ticked off disappears
        .filter((t) => wantedDone === undefined || t.done === wantedDone),
    );
  }

  function handleDeleted(id: number) {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <>
      <TodoForm onCreated={reload} onError={handleError} />

      <div className="toolbar">
        <div className="tabs">
          {(["all", "active", "done"] as const).map((s) => (
            <button
              key={s}
              className={status === s ? "tab active" : "tab"}
              onClick={() => setStatus(s)}
            >
              {s[0].toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search titles..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
      </div>

      {error && <p className="error">{error}</p>}

      <ul className="todo-list">
        {todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
            onError={handleError}
          />
        ))}
      </ul>

      {!loading && todos.length === 0 && <p className="empty">Nothing here yet.</p>}

      {hasMore && (
        <button className="secondary load-more" onClick={loadMore} disabled={loading}>
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </>
  );
}