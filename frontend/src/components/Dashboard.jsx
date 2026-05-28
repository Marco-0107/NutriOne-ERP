import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Calendar, Award, ShieldAlert, Heart } from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();

    return (
        <div style={{ animation: 'slideIn 0.3s ease-out' }}>
            <div className="welcome-card">
                <h1 className="welcome-title">¡Bienvenido de vuelta, {user.nombres}!</h1>
                <p className="welcome-text">
                    Estás conectado en la plataforma NutriERP. Aquí tienes un resumen del estado del sistema y tus accesos rápidos.
                </p>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                Resumen de Actividades
            </h2>

            <div className="dashboard-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--exito)' }}>
                        <Users size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">128</span>
                        <span className="stat-label">Pacientes Registrados</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--informacion)' }}>
                        <Calendar size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">14</span>
                        <span className="stat-label">Citas para Hoy</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--advertencia)' }}>
                        <Award size={24} />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">8</span>
                        <span className="stat-label">Servicios Activos</span>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '40px', padding: '24px', background: 'var(--blanco)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <ShieldAlert size={18} style={{ color: 'var(--morado-primario)' }} />
                    Tus Permisos Asignados en este ERP:
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {user.permisos && user.permisos.map((p, idx) => (
                        <span 
                            key={idx} 
                            style={{ 
                                padding: '4px 10px', 
                                background: 'var(--lavanda-suave)', 
                                border: '1px solid rgba(109, 40, 217, 0.15)', 
                                color: 'var(--morado-primario)', 
                                borderRadius: '6px', 
                                fontSize: '12px',
                                fontWeight: 600
                            }}
                        >
                            {p}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
