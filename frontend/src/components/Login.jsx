import { useState } from "react";

function Login({ apiUrl, onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [registrationDone, setRegistrationDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Podaj prawidłowy adres email.");
      return;
    }
    if (!password || password.length > (isRegistering ? 128 : 256)) {
      setError("Podaj prawidłowe hasło.");
      return;
    }
    if (isRegistering && password.length < 12) {
      setError("Hasło musi mieć co najmniej 12 znaków.");
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiUrl}/api/auth/${isRegistering ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: normalizedEmail, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Logowanie nie powiodło się.");
      }

      if (isRegistering) {
        setRegistrationDone(true);
        setEmail("");
        setPassword("");
      } else {
        onLogin(data.user);
      }
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
        {registrationDone ? (
          <div className="login-heading">
            <h1>Rejestracja zakończona</h1>
            <p>Twoje konto zostało utworzone. Możesz teraz się zalogować.</p>
            <button className="login-button" type="button" onClick={() => {
              setRegistrationDone(false);
              setIsRegistering(false);
            }}>
              Przejdź do logowania
            </button>
          </div>
        ) : <>
        <div className="login-heading">
          <h1>{isRegistering ? "Utwórz konto" : "Zaloguj się"}</h1>
          <p>{isRegistering ? "Załóż konto, aby korzystać z systemu." : "Wprowadź dane, aby uzyskać dostęp do systemu."}</p>
        </div>
        <label htmlFor="user-email">Adres email</label>
        <input id="user-email" type="email" maxLength="254" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" required/>
        <label htmlFor="password">Hasło</label>
        <input id="password" type="password" minLength={isRegistering ? 12 : undefined} maxLength={isRegistering ? 128 : 256} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required/>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-button" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (isRegistering ? "Tworzenie konta..." : "Logowanie...") : (isRegistering ? "Zarejestruj się" : "Zaloguj się")}
        </button>
        <button className="login-switch-button" type="button" onClick={() => {
          setIsRegistering(!isRegistering);
          setError("");
        }}>
          {isRegistering ? "Masz już konto? Zaloguj się" : "Nie masz konta? Zarejestruj się"}
        </button>
        </>}
      </form>
    </main>
  );
}

export default Login;
