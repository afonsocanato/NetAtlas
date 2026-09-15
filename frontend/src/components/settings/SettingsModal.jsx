import { useEffect, useState } from 'react';
import { api, API_URL } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';

export function SettingsModal({ onClose }) {
  const { username, logout } = useAuth();
  const [agentKey, setAgentKey] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .getAgentKey()
      .then((res) => setAgentKey(res.agentApiKey))
      .catch((err) => setError(err.message));
  }, []);

  const copy = async () => {
    if (!agentKey) return;
    await navigator.clipboard.writeText(agentKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="ns-modal-backdrop" onClick={onClose}>
      <div className="ns-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ns-modal__header">
          <h2>Settings</h2>
          <button className="ns-details__close" onClick={onClose} aria-label="Close">×</button>
        </div>

        <p className="ns-muted-text">Signed in as <strong>{username}</strong></p>

        <h3>Agent setup</h3>
        <p className="ns-muted-text">
          Paste these into the agent's environment to connect it to this backend — see{' '}
          <code>agent/README.md</code> for the full command per OS.
        </p>

        {error ? (
          <p className="ns-login__error">{error}</p>
        ) : (
          <>
            <label>
              Backend URL
              <input readOnly value={API_URL} onFocus={(e) => e.target.select()} />
            </label>
            <label>
              Agent API key
              <input readOnly value={agentKey ?? 'Loading…'} onFocus={(e) => e.target.select()} />
            </label>
            <button onClick={copy} disabled={!agentKey}>
              {copied ? 'Copied!' : 'Copy key'}
            </button>
          </>
        )}

        <hr className="ns-modal__divider" />
        <button onClick={logout}>Sign out</button>
      </div>
    </div>
  );
}
