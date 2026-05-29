import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShieldCheck, LogOut, Activity, ClipboardList } from 'lucide-react';

const Sidebar = () => {
    const { user, logout, hasPermission } = useAuth();

    if (!user) return null;

    // Get initials for the user avatar
    const getInitials = () => {
        const first = user.nombres ? user.nombres.charAt(0) : 'U';
        const last = user.apellido_paterno ? user.apellido_paterno.charAt(0) : '';
        return (first + last).toUpperCase();
    };

    // Format roles string
    const getRolesDisplay = () => {
        if (!user.roles || user.roles.length === 0) return 'Usuario';
        return user.roles.join(', ');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <Activity size={24} style={{ color: 'var(--morado-primario)' }} />
                <span style={{ fontWeight: 800 }}>NutriERP</span>
            </div>

            <div className="sidebar-user">
                <div className="user-avatar">
                    {getInitials()}
                </div>
                <div className="user-info">
                    <span className="user-name" title={`${user.nombres} ${user.apellido_paterno}`}>
                        {user.nombres} {user.apellido_paterno}
                    </span>
                    <span className="user-role" title={getRolesDisplay()}>
                        {getRolesDisplay()}
                    </span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <NavLink 
                    to="/" 
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    end
                >
                    <LayoutDashboard size={18} />
                    <span>Inicio</span>
                </NavLink>

                <NavLink
                    to="/fichas"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <ClipboardList size={18} />
                    <span>Fichas Clinicas</span>
                </NavLink>

                {hasPermission('roles:ver') && (
                    <NavLink 
                        to="/roles" 
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <ShieldCheck size={18} />
                        <span>Roles y Permisos</span>
                    </NavLink>
                )}

                {hasPermission()}
            </nav>

            <div className="sidebar-footer">
                <button className="btn-logout" onClick={logout}>
                    <LogOut size={18} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
