import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = sessionStorage.getItem('superAdminToken');

  if (!token) {
    return <Navigate to="/superadmin/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;