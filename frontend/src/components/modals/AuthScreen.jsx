import React, { useState } from "react";
import { Cpu } from "lucide-react";
import { api, setToken } from "../../api";

export function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", department: "", year: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const res = mode === "login"
        ? await api.login({ email: form.email, password: form.password })
        : await api.register(form);
      setToken(res.token);
      onAuthed();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") submit(); };

  return (
    <div className="auth-wrapper">
      <div className="card card-glow auth-card">
        <div className="auth-card__header">
          <div className="navbar__logo"><Cpu size={16} color="#060a08" /></div>
          <div>
            <span className="font-display" style={{ fontWeight: 700, fontSize: 18 }}>CampusSearch</span>
            <span className="navbar__version" style={{ marginLeft: 8 }}>v1.1</span>
          </div>
        </div>
        <div className="auth-card__subtitle">Campus component marketplace — trade with verified students.</div>

        <div className="auth-tabs">
          <button onClick={() => setMode("login")} className={`auth-tab ${mode === "login" ? "auth-tab--active" : ""}`}>Log in</button>
          <button onClick={() => setMode("register")} className={`auth-tab ${mode === "register" ? "auth-tab--active" : ""}`}>Register</button>
        </div>

        <div className="auth-form" onKeyDown={handleKeyDown}>
          {mode === "register" && (
            <>
              <input className="input" placeholder="Full name" value={form.name} onChange={set("name")} id="auth-name" />
              <input className="input" placeholder="Phone number" value={form.phone} onChange={set("phone")} id="auth-phone" />
              <div style={{ display: "flex", gap: 8 }}>
                <input className="input" placeholder="Department" value={form.department} onChange={set("department")} id="auth-dept" />
                <input className="input" style={{ maxWidth: 120 }} placeholder="Year" value={form.year} onChange={set("year")} id="auth-year" />
              </div>
            </>
          )}
          <input className="input" placeholder="Campus email (name@college.edu)" value={form.email} onChange={set("email")} id="auth-email" />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={set("password")} id="auth-password" />
        </div>

        {error && <div style={{ color: "var(--red)", fontSize: 12.5, marginTop: 10 }}>{error}</div>}

        <button onClick={submit} disabled={loading} className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} id="auth-submit">
          {loading ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
        </button>

        <div className="auth-footer">
          🔒 Registration is restricted to your campus email domain — this is identity verification in v1.
        </div>
      </div>
    </div>
  );
}
