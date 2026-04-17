import { useState, useCallback, type ReactNode } from 'react';
import { AuthContext } from './AuthContext';

const STORAGE_KEY = 'access_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_KEY),
  );

  const login = useCallback((newToken: string) => {
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ isAuthenticated: token !== null, token, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
