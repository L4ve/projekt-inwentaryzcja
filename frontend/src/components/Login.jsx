import { useState } from "react";

function Login({ apiUrl, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Podaj prawidłowy adres email.");
      return;
    }
    if (!password || password.length > 256) {
      setError("Podaj prawidłowe hasło.");
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail, password }),
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
        <label htmlFor="user-email">Adres email</label>
        <input id="user-email" type="email" maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required/>
        <label htmlFor="password">Hasło</label>
        <input id="password" type="password" maxLength="256" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required/>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logowanie..." : "Zaloguj się"}
        </button>
      </form>
    </main>
  );
}

export default Login;
