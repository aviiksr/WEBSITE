import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/auth/profile`, {
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

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/auth/login`, { email, password });
    if (data.otpRequired) {
      return data;
    }
    localStorage.setItem('token', data.token);
    setUser(data);
    return data;
  };

  const verifyOtp = async (email, otp) => {
    const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/auth/verify-otp`, { email, otp });
    localStorage.setItem('token', data.token);
    setUser(data);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/auth/register`, { name, email, password });
    // Under option 2 we do NOT automatically log the user in after registration.
    // The backend now returns a JWT token, but we intentionally ignore it here.
    // The caller (Register page) will redirect to the login page.
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, verifyOtp, register, logout, loading, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
