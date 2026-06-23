import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('app_user_token') || localStorage.getItem('app_admin_token');
    const storedUser = localStorage.getItem('app_user_data') || localStorage.getItem('app_admin_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (tokenData, userData) => {
    localStorage.setItem('app_user_token', tokenData);
    localStorage.setItem('app_user_data', JSON.stringify(userData));
    // For admin backward compatibility:
    if (userData.role === 'admin') {
      localStorage.setItem('app_admin_token', tokenData);
      localStorage.setItem('app_admin_user', JSON.stringify(userData));
    }
    setToken(tokenData);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('app_admin_token');
    localStorage.removeItem('app_admin_user');
    localStorage.removeItem('app_user_token');
    localStorage.removeItem('app_user_data');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      admin: user && user.role === 'admin' ? user : null,
      token, 
      loading, 
      login, 
      logout, 
      isAuthenticated: !!token 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

