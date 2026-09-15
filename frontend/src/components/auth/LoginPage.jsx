import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ns-login">
      <form className="ns-login__card" onSubmit={submit}>
        <img className="ns-login__logo" src="/logo-netatlas.png" alt="NetAtlas" />
        <p className="ns-login__hint">
          First time? Check the backend's server log for the auto-generated username/password.
        </p>

        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus autoComplete="username" />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>

        {error && <div className="ns-login__error">{error}</div>}

        <button type="submit" className="ns-primary" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
