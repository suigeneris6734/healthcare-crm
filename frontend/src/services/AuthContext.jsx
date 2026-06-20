import { createContext, useContext, useState, useEffect } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      // In a real app we might fetch user profile here. 
      // We assume if token exists, they are logged in until API returns 401.
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    if (res.token) {
      setToken(res.token);
      setUser(res.user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
