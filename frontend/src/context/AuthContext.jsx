import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiUrl } from '../helpers/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser]       = useState(null);
    const [token, setToken]     = useState(localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true);

    // Restaurar sesión al iniciar si existe un token guardado
    useEffect(() => {
        const loadUser = async () => {
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const response = await fetch(apiUrl('/auth/me'), {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUser(data.user);
                } else {
                    handleLogout();
                }
            } catch (error) {
                console.error("Error restaurando sesión:", error);
                handleLogout();
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, [token]);

    const handleLogin = async (correo, contrasena) => {
        const response = await fetch(apiUrl('/auth/login'), {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ correo, contrasena })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Error al iniciar sesión');
        }

        localStorage.setItem('token', data.token);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };

    const hasPermission = (codigo) => {
        if (!user?.permisos) return false;
        return user.permisos.includes(codigo);
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login:         handleLogin,
            logout:        handleLogout,
            hasPermission
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider');
    return context;
};
