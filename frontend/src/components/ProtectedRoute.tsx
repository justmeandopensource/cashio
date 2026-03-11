import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute: React.FC = () => {
  const token = localStorage.getItem('access_token');

  if (!token) {
    // If no token, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  // If token exists, render the nested routes
  return <Outlet />;
};

export default ProtectedRoute;
