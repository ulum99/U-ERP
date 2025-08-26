import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

function ProtectedRoute() {
    const auth = useAuth();
    // Jika tidak ada token, redirect ke halaman login
    return auth.token ? <Outlet /> : <Navigate to="/login" replace />;
}

export default ProtectedRoute;