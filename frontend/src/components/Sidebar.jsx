import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShieldCheck, LogOut, Activity, Users, UserCog, ClipboardList, Clock, CalendarDays, Salad, Briefcase, Wallet, FileDown } from 'lucide-react';


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
                <span style={{ fontWeight: 800 }}>NutriOne ERP</span>
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

                {hasPermission('calendario:ver') && (
                <NavLink
                    to="/calendario"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <CalendarDays size={18} />
                    <span>Calendario</span>
                </NavLink>
                )}

                <NavLink
                    to="/nutricion"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                >
                    <Salad size={18} />
                    <span>Bases Nutricionales</span>
                </NavLink>

                {hasPermission('disponibilidad:ver') && (
                    <NavLink
                        to="/disponibilidad"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <Clock size={18} />
                        <span>Disponibilidad</span>
                    </NavLink>
                )}

                {hasPermission('servicios:ver') && (
                    <NavLink
                        to="/servicios"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <Briefcase size={18} />
                        <span>Servicios</span>
                    </NavLink>
                )}

                {hasPermission('caja:ver') && (
                    <NavLink
                        to="/caja"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <Wallet size={18} />
                        <span>Caja y Pagos</span>
                    </NavLink>
                )}

                {hasPermission('caja:ver') && (
                    <NavLink
                        to="/reportes"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <FileDown size={18} />
                        <span>Reportes</span>
                    </NavLink>
                )}

                {hasPermission('roles:ver') && (
                    <NavLink
                        to="/roles"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <ShieldCheck size={18} />
                        <span>Roles y Permisos</span>
                    </NavLink>
                )}

                {hasPermission('usuarios:ver') && (
                    <NavLink
                        to="/usuarios"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <UserCog size={18} />
                        <span>Usuarios</span>
                    </NavLink>
                )}

                {hasPermission('pacientes:ver') && (
                    <NavLink
                        to="/pacientes"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <Users size={18} />
                        <span>Pacientes</span>
                    </NavLink>
                )}
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
