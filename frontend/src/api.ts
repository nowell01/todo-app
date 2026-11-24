// All communication with the FastAPI backend lives in this file.
// Components never build URLs or headers themselves.

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "token";

// ---------- Types (mirror your Pydantic models) ----------
export type Priority = 1 | 2 | 3;

export const PRIORITY_LABELS: Record<Priority, string> = {
  1: "High",
  2: "Normal",
  3: "Low",
};

export interface Todo {
  id: number;
  title: string;
  description: string | null;
  done: boolean;
  priority: Priority;
  created_at: string;
}

// What PUT and POST send (no id / created_at - the server owns those)
export interface TodoInput {
  title: string;
  description: string | null;
  done: boolean;
  priority: Priority;
}

export interface TodoFilters {
  done?: boolean;
  search?: string;
  limit: number;
  offset: number;
}

// ---------- Errors ----------
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Thrown on 401 so the UI can send the user back to the login screen
export class UnauthorizedError extends ApiError {
  constructor() {
    super(401, "Session expired, please log in again");
  }
}

// FastAPI errors look like {"detail": "text"} or, for 422,
// {"detail": [{"loc": [...], "msg": "..."}]}. Turn both into one readable string.
async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail
        .map((e: { loc: string[]; msg: string }) => `${e.loc.at(-1)}: ${e.msg}`)
        .join(", ");
    }
  } catch {
    // body wasn't JSON - fall through
  }
  return `Request failed (${response.status})`;
}

// ---------- Token storage ----------
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const saveToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ---------- Core request helper ----------
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    clearToken();
    throw new UnauthorizedError();
  }
  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }
  if (response.status === 204) {
    return undefined as T; // DELETE returns no body
  }
  return response.json() as Promise<T>;
}

// ---------- Auth ----------
export async function register(email: string, password: string): Promise<void> {
  await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string): Promise<void> {
  // OAuth2 wants FORM data, not JSON - and the field is called "username"
  const response = await fetch(`${API_URL}/auth/token`, {
    method: "POST",
    body: new URLSearchParams({ username: email, password }),
  });
  if (!response.ok) {
    throw new ApiError(response.status, await readError(response));
  }
  const data: { access_token: string } = await response.json();
  saveToken(data.access_token);
}

// ---------- Todos ----------
export function listTodos(filters: TodoFilters): Promise<Todo[]> {
  const params = new URLSearchParams({
    limit: String(filters.limit),
    offset: String(filters.offset),
  });
  if (filters.done !== undefined) params.set("done", String(filters.done));
  if (filters.search) params.set("search", filters.search);
  return request<Todo[]>(`/todos?${params}`);
}

export function createTodo(input: TodoInput): Promise<Todo> {
  return request<Todo>("/todos", { method: "POST", body: JSON.stringify(input) });
}

export function updateTodo(id: number, input: TodoInput): Promise<Todo> {
  return request<Todo>(`/todos/${id}`, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteTodo(id: number): Promise<void> {
  return request<void>(`/todos/${id}`, { method: "DELETE" });
}

// Helper: turn a Todo into the full PUT body (PUT = replace everything)
export function toInput(todo: Todo): TodoInput {
  return {
    title: todo.title,
    description: todo.description,
    done: todo.done,
    priority: todo.priority,
  };
}