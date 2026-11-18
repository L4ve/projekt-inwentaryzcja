import { useState } from "react";

function Login({ apiUrl, onLogin, onBack }) {
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
    <main className="min-vh-100 d-flex flex-column align-items-center justify-content-center gap-3 p-3">
      <form className="login-card card w-100 shadow-sm overflow-hidden" onSubmit={handleSubmit}>
        <div className="card-header bg-body-tertiary d-flex align-items-center gap-2 fw-semibold py-3 px-4">
          <i className="bi bi-box-seam text-primary fs-5" />
          <span>Ewidencja Sprzętu</span>
        </div>
        <div className="card-body p-4">
          <h1 className="h4 fw-semibold mb-1">Panel logowania</h1>
          <p className="text-secondary mb-4">Logowanie dla moderatorów i administratorów.</p>
          <label className="form-label small fw-medium" htmlFor="user-email">Adres email</label>
          <input className="form-control mb-3" id="user-email" type="email" maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required/>
          <label className="form-label small fw-medium" htmlFor="password">Hasło</label>
          <input className="form-control mb-3" id="password" type="password" maxLength="256" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required/>
          {error && <p className="text-danger small mb-1" role="alert">{error}</p>}
          <button className="btn btn-primary w-100 py-2 mt-2" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Logowanie..." : "Zaloguj się"}
          </button>
        </div>
      </form>
      {onBack && (
        <button className="btn btn-link link-secondary text-decoration-none d-flex align-items-center gap-2" type="button" onClick={onBack}>
          <i className="bi bi-arrow-left" />
          Wróć do ewidencji
        </button>
      )}
    </main>
  );
}

export default Login;
