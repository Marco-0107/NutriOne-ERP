import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RolesManager from './components/RolesManager';
import PacientesManager from './components/PacientesManager';
import UsuariosManager from './components/UsuariosManager';

// Inner App component to access context hooks
const AppContent = () => {
    const { user, loading, hasPermission } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                minHeight: '100vh', 
                backgroundColor: '#FAFAFA',
                color: '#6B7280',
                fontSize: '16px',
                fontFamily: "'Outfit', sans-serif"
            }}>
                Cargando portal NutriERP...
            </div>
        );
    }

    if (!user) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        );
    }

    // Function to dynamically resolve page title based on path
    const getPageTitle = () => {
        switch (location.pathname) {
            case '/':
                return 'Panel de Inicio';
            case '/roles':
                return 'Configuración de Roles';
            case '/pacientes':
                return 'Gestión de Pacientes';
            case '/usuarios':
                return 'Gestión de Usuarios';
            default:
                return 'NutriERP';
        }
    };

    return (
        <div className="app-container">
            <Sidebar />
            
            <div className="main-wrapper">
                <header className="main-header">
                    <h2 className="page-title">{getPageTitle()}</h2>
                    <div style={{ fontSize: '13px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
                        <span>{user.correo}</span>
                    </div>
                </header>
                
                <main className="content-container">
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        
                        {hasPermission('roles:ver') ? (
                            <Route path="/roles" element={<RolesManager />} />
                        ) : (
                            <Route path="/roles" element={<Navigate to="/" replace />} />
                        )}

                        {hasPermission('pacientes:ver') ? (
                            <Route path="/pacientes" element={<PacientesManager />} />
                        ) : (
                            <Route path="/pacientes" element={<Navigate to="/" replace />} />
                        )}

                        {hasPermission('usuarios:ver') ? (
                            <Route path="/usuarios" element={<UsuariosManager />} />
                        ) : (
                            <Route path="/usuarios" element={<Navigate to="/" replace />} />
                        )}

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
};

const App = () => {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </AuthProvider>
    );
};

export default App;
