import { useState } from "react";

import { clearToken, getToken } from "./api";
import AuthForm from "./components/AuthForm";
import TodoPage from "./components/TodoPage";

export default function App() {
  // Logged in = we have a token. Start with whatever is saved from last time.
  const [loggedIn, setLoggedIn] = useState(() => getToken() !== null);

  function logout() {
    clearToken();
    setLoggedIn(false);
  }

  return (
    <main className="container">
      <header className="header">
        <h1>Todos</h1>
        {loggedIn && (
          <button className="secondary" onClick={logout}>
            Log out
          </button>
        )}
      </header>

      {loggedIn ? (
        <TodoPage onUnauthorized={logout} />
      ) : (
        <AuthForm onLoggedIn={() => setLoggedIn(true)} />
      )}
    </main>
  );
}