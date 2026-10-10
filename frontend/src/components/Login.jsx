import { useState } from "react";

function Login({ apiUrl, onLogin, onCancel }) {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Logowanie nie powiodło się.");
      }

      onLogin(data.user);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-brand">📦 Ewidencja <span>Sprzętu</span></div>
        <div className="login-heading">
          <h1>Zaloguj się</h1>
          <p>Wprowadź dane, aby uzyskać dostęp do systemu.</p>
        </div>
        <label htmlFor="user-id">Identyfikator użytkownika</label>
        <input id="user-id" type="number" min="1" inputMode="numeric" value={userId} onChange={(event) => setUserId(event.target.value)} autoComplete="username" required/>
        <label htmlFor="password">Hasło</label>
        <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required/>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-button" type="submit" disabled={isSubmitting}> {isSubmitting ? "Logowanie..." : "Zaloguj się"}
        </button>
        <button className="login-button" type="button" onClick={onCancel}>Wróć</button>
      </form>
    </main>
  );
}

export default Login;
