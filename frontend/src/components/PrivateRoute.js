import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#667eea'
      }}>
        Cargando...
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

export default PrivateRoute;
