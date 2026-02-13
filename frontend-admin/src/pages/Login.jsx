import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { auth } from "../api/client";

export default function Login() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
      return;
    }
    auth
      .status()
      .then((data) => {
        if (!data.has_admin) setIsRegister(true);
      })
      .catch(() => {})
      .finally(() => setCheckingStatus(false));
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-accent dark:border-gray-700" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
            <span className="text-lg font-bold text-white">F</span>
          </div>
          <span className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            effeff
          </span>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-gray-100/50 p-6 dark:border-gray-800 dark:bg-gray-900/50"
        >
          <h2 className="mb-6 text-center text-lg font-medium text-gray-900 dark:text-white">
            {isRegister ? "Admin-Konto erstellen" : "Anmelden"}
          </h2>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {isRegister && (
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 outline-none transition-colors focus:border-accent dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                placeholder="Admin"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 outline-none transition-colors focus:border-accent dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="admin@example.com"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="mb-1.5 block text-sm font-medium text-gray-600 dark:text-gray-400">
              Passwort
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-500 outline-none transition-colors focus:border-accent dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              placeholder="Mindestens 8 Zeichen"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting
              ? "..."
              : isRegister
                ? "Registrieren"
                : "Anmelden"}
          </button>

          {!isRegister && (
            <p className="mt-4 text-center text-xs text-gray-500">
              Kein Konto?{" "}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-accent hover:underline"
              >
                Registrieren
              </button>
            </p>
          )}
          {isRegister && (
            <p className="mt-4 text-center text-xs text-gray-500">
              Bereits registriert?{" "}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-accent hover:underline"
              >
                Anmelden
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
