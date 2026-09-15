import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setUnauthorizedHandler } from '../api/client.js';
import { setToken } from '../auth/token.js';
import { disconnectSocket } from '../api/socket.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [checking, setChecking] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUsername(null);
    disconnectSocket();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
  }, [logout]);

  useEffect(() => {
    // Always ask, even with no local token: if the backend has
    // NETATLAS_DISABLE_AUTH=true, this succeeds anonymously and skips the
    // login screen entirely.
    api
      .me()
      .then((res) => setUsername(res.username))
      .catch(() => setToken(null))
      .finally(() => setChecking(false));
  }, []);

  const login = async (user, password) => {
    const res = await api.login(user, password);
    setToken(res.token);
    setUsername(res.username);
  };

  return (
    <AuthContext.Provider value={{ username, isAuthenticated: Boolean(username), checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
