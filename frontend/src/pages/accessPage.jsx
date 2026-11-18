import { useCallback, useEffect, useState } from "react";

function AccessPage({ apiUrl }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ email: "", password: "", roleId: "2" });
  const [pendingRoles, setPendingRoles] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = useCallback(async () => {
    const [usersResponse, rolesResponse] = await Promise.all([
      fetch(`${apiUrl}/api/admin/users`, { credentials: "include" }),
      fetch(`${apiUrl}/api/admin/roles`, { credentials: "include" }),
    ]);
    if (!usersResponse.ok || !rolesResponse.ok) {
      throw new Error("Nie udało się pobrać użytkowników.");
    }
    setUsers(await usersResponse.json());
    setRoles(await rolesResponse.json());
  }, [apiUrl]);

  useEffect(() => {
    loadUsers().catch((loadError) => setError(loadError.message));
  }, [loadUsers]);

  async function createUser(event) {
    event.preventDefault();
    setError("");
    const email = form.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setError("Podaj prawidłowy adres email.");
    }
    if (form.password.length < 12) {
      return setError("Hasło musi mieć co najmniej 12 znaków.");
    }
    const response = await fetch(`${apiUrl}/api/admin/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...form, email, roleId: Number(form.roleId) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setError(data.error || "Nie udało się utworzyć użytkownika.");
    setForm({ email: "", password: "", roleId: "2" });
    setMessage("Użytkownik został utworzony.");
    await loadUsers();
  }

  async function changeRole(id, roleId) {
    const response = await fetch(`${apiUrl}/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ roleId: Number(roleId) }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setError(data.error || "Nie udało się zmienić roli.");
    setPendingRoles((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
    await loadUsers();
  }

  async function removeUser(id) {
    if (!window.confirm("Czy na pewno usunąć tego użytkownika?")) return;
    const response = await fetch(`${apiUrl}/api/admin/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return setError(data.error || "Nie udało się usunąć użytkownika.");
    }
    await loadUsers();
  }

  return (
    <div>
      <h1 className="h4 fw-semibold mb-3">Zarządzanie Dostępem</h1>
      <form className="card mb-3 overflow-hidden" onSubmit={createUser}>
        <h2 className="card-header bg-body-tertiary fs-6 fw-semibold py-3 mb-0">Dodaj użytkownika</h2>
        <div className="admin-form card-body d-flex flex-wrap gap-2">
          <input className="form-control flex-grow-1 w-auto" type="email" aria-label="Adres email" maxLength="254" placeholder="Adres email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          <input className="form-control flex-grow-1 w-auto" type="password" aria-label="Hasło" minLength="12" maxLength="128" placeholder="Hasło (min. 12 znaków)" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} required />
          <select className="form-select w-auto" aria-label="Rola" value={form.roleId} onChange={(event) => setForm({ ...form, roleId: event.target.value })}>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.role}</option>)}
          </select>
          <button type="submit" className="btn btn-primary">Utwórz</button>
        </div>
      </form>
      {error && <p className="text-danger mb-3" role="alert">{error}</p>}
      {message && <p className="text-success-emphasis mb-3" role="status">{message}</p>}
      <div className="card overflow-hidden">
        <div className="table-responsive">
          <table className="access-table table table-hover align-middle mb-0">
            <thead><tr><th>Email</th><th>Rola</th><th>Akcje</th></tr></thead>
            <tbody>{users.map((user) => (
              <tr key={user.id}>
                <td className="fw-medium text-body">{user.email}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <select className="form-select form-select-sm w-auto" aria-label={`Rola: ${user.email}`} value={pendingRoles[user.id] ?? user.roleId} onChange={(event) => setPendingRoles((current) => ({ ...current, [user.id]: event.target.value }))}>
                      {!roles.some((role) => role.id === user.roleId) && <option value={user.roleId} disabled>{user.role}</option>}
                      {roles.map((role) => <option key={role.id} value={role.id}>{role.role}</option>)}
                    </select>
                    {pendingRoles[user.id] && <button type="button" className="btn btn-primary btn-sm" onClick={() => changeRole(user.id, pendingRoles[user.id])}>Potwierdź</button>}
                  </div>
                </td>
                <td className="row-actions">
                  <button type="button" className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={() => removeUser(user.id)}>
                    <i className="bi bi-trash" />
                    Usuń
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AccessPage;
