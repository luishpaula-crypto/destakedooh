import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import MainLayout from './components/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import CRM from './pages/CRM';
import Quotes from './pages/Quotes';
import Checkin from './pages/Checkin';
import Assets from './pages/Assets';
import Maintenance from './pages/Maintenance';
import Inventory from './pages/Inventory';
import Finance from './pages/Finance';

import Programming from './pages/Programming';

const ProtectedRoute = ({ children }) => {
    const { user } = useAuth();
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    return children;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
                <ProtectedRoute>
                    <MainLayout />
                </ProtectedRoute>
            }>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="quotes" element={<Quotes />} />
                <Route path="clients" element={<CRM />} />
                <Route path="maintenance" element={<Maintenance />} />
                <Route path="assets" element={<Assets />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="finance" element={<Finance />} />
                <Route path="checkin" element={<Checkin />} />
                <Route path="programming" element={<Programming />} />
            </Route>
        </Routes>
    );
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <DataProvider>
                    <AppRoutes />
                </DataProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
