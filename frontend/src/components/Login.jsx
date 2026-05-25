import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Lock, Mail, ShieldAlert } from 'lucide-react';

const Login = () => {
    const { login } = useAuth();
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(correo, contrasena);
        } catch (err) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="bg-glow-orb orb-1"></div>
            <div className="bg-glow-orb orb-2"></div>

            <div className="auth-card">
                <div className="auth-header">
                    <div style={{ display: 'inline-flex', padding: '14px', background: 'var(--lavanda-suave)', borderRadius: '16px', color: 'var(--morado-primario)' }}>
                        <LogIn size={32} />
                    </div>
                    <h1 className="auth-title">NutriERP</h1>
                    <p className="auth-subtitle">ERP PARA NUTRICIONISTAS</p>
                </div>

                {error && (
                    <div className="alert alert-danger">
                        <ShieldAlert size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label" htmlFor="correo">
                            CORREO ELECTRÓNICO
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: '#6B7280' }} />
                            <input
                                id="correo"
                                type="email"
                                className="form-input"
                                placeholder="nombre@correo.com"
                                style={{ paddingLeft: '48px' }}
                                value={correo}
                                onChange={(e) => setCorreo(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label" htmlFor="contrasena">
                            CONTRASEÑA
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: '#6B7280' }} />
                            <input
                                id="contrasena"
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                style={{ paddingLeft: '48px' }}
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
