import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const { data } = await axios.get('http://127.0.0.1:5000/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser({ ...data, token });
        } catch (error) {
          console.error("Token invalid", error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post('http://127.0.0.1:5000/api/auth/login', { email, password });
    if (data.otpRequired) {
      return data;
    }
    localStorage.setItem('token', data.token);
    setUser(data);
    return data;
  };

  const verifyOtp = async (email, otp) => {
    const { data } = await axios.post('http://127.0.0.1:5000/api/auth/verify-otp', { email, otp });
    localStorage.setItem('token', data.token);
    setUser(data);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post('http://127.0.0.1:5000/api/auth/register', { name, email, password });
    localStorage.setItem('token', data.token);
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, verifyOtp, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
