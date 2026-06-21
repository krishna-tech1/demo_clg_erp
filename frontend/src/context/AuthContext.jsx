import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('app_admin_token');
    const storedAdmin = localStorage.getItem('app_admin_user');
    if (storedToken && storedAdmin) {
      setToken(storedToken);
      setAdmin(JSON.parse(storedAdmin));
    }
    setLoading(false);
  }, []);

  const login = (tokenData, adminData) => {
    localStorage.setItem('app_admin_token', tokenData);
    localStorage.setItem('app_admin_user', JSON.stringify(adminData));
    setToken(tokenData);
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem('app_admin_token');
    localStorage.removeItem('app_admin_user');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, token, loading, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
