import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tenantConfig, setTenantConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5001/api';

  useEffect(() => {
    // Verificar si hay un token guardado al cargar la app
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Cargar configuración del tenant
      loadTenantConfig(JSON.parse(savedUser).tenant_id);
    }

    setLoading(false);
  }, []);

  const loadTenantConfig = async (tenantId) => {
    try {
      const response = await axios.get(`${API_URL}/tenant-config/${tenantId}`);
      setTenantConfig(response.data);
    } catch (error) {
      console.error('Error al cargar configuración del tenant:', error);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });

      const { token, user: userData } = response.data;

      // Guardar token y usuario
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Configurar axios para usar el token en todas las peticiones
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userData);

      // Cargar configuración del tenant
      await loadTenantConfig(userData.tenant_id);

      return { success: true };
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al iniciar sesión'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    setTenantConfig(null);
  };

  const value = {
    user,
    tenantConfig,
    loading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
