import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, AlertCircle, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { apiUrl } from '../helpers/api';

const DIAS_SPANISH = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado'
};

const DIAS_ORDEN = {
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6
};

const DURACIONES = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

const EMPTY_FORM = {
    dia_semana: '',
    hora_inicio: '09:00',
    hora_fin: '18:00',
    duracion_minutos: 30,
};

const DisponibilidadManager = () => {
    const { token, user, hasPermission } = useAuth();
    const [disponibilidades, setDisponibilidades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');

    const authHeaders = { Authorization: `Bearer ${token}` };

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3500);
    };

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            // Under normal operation, the backend automatically returns the logged-in nutritionist's availability if they are a Nutricionista.
            const res = await fetch(apiUrl('/disponibilidad'), { headers: authHeaders });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al obtener disponibilidades');
            setDisponibilidades(data.data || []);
        } catch (err) {
            setError(err.message || 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const handleInputChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        const { dia_semana, hora_inicio, hora_fin, duracion_minutos } = formData;
        if (!dia_semana || !hora_inicio || !hora_fin) {
            setFormError('Todos los campos son obligatorios.');
            setFormLoading(false);
            return;
        }

        if (hora_fin <= hora_inicio) {
            setFormError('La hora de fin debe ser posterior a la hora de inicio.');
            setFormLoading(false);
            return;
        }

        try {
            const res = await fetch(apiUrl('/disponibilidad'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify({
                    dia_semana,
                    hora_inicio,
                    hora_fin,
                    duracion_minutos: Number(duracion_minutos),
                }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Error al guardar el bloque de disponibilidad');
            }

            showSuccess('Bloque de disponibilidad agregado exitosamente.');
            setFormData(EMPTY_FORM);
            fetchData();
        } catch (err) {
            setFormError(err.message || 'Error al guardar la disponibilidad');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro que deseas eliminar este bloque de disponibilidad?\nEsto eliminará los horarios disponibles asociados a este bloque en tu agenda pública.')) {
            return;
        }

        setError('');
        try {
            const res = await fetch(apiUrl(`/disponibilidad/${id}`), {
                method: 'DELETE',
                headers: authHeaders,
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Error al eliminar el bloque');
            }

            showSuccess('Bloque de disponibilidad eliminado exitosamente.');
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    // Sort availability by day and start time
    const sortedDisponibilidades = [...disponibilidades].sort((a, b) => {
        const orderA = DIAS_ORDEN[a.dia_semana] || 99;
        const orderB = DIAS_ORDEN[b.dia_semana] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.hora_inicio.localeCompare(b.hora_inicio);
    });

    return (
        <div style={{ animation: 'slideIn 0.3s ease-out' }}>
            {/* Header */}
            <div className="action-bar" style={{ marginBottom: '30px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Disponibilidad Horaria
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        Define tus días y rangos horarios laborables para que los pacientes puedan agendar sus citas.
                    </p>
                </div>
            </div>

            {/* Notifications */}
            {error && (
                <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                    <AlertCircle size={18} /><span>{error}</span>
                </div>
            )}
            {successMessage && (
                <div className="alert alert-success" style={{ marginBottom: '20px' }}>
                    <CheckCircle2 size={18} /><span>{successMessage}</span>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                {/* Form column */}
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '24px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    height: 'fit-content'
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={18} style={{ color: 'var(--morado-primario)' }} />
                        Nuevo Rango Horario
                    </h3>

                    {formError && (
                        <div className="alert alert-danger" style={{ marginBottom: '16px', padding: '10px 12px', fontSize: '13px' }}>
                            <AlertCircle size={15} /><span>{formError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label" htmlFor="disp-dia">DÍA DE LA SEMANA</label>
                            <select
                                id="disp-dia"
                                className="form-input"
                                value={formData.dia_semana}
                                onChange={handleInputChange('dia_semana')}
                                required
                            >
                                <option value="">-- Seleccionar --</option>
                                <option value="lunes">Lunes</option>
                                <option value="martes">Martes</option>
                                <option value="miercoles">Miércoles</option>
                                <option value="jueves">Jueves</option>
                                <option value="viernes">Viernes</option>
                                <option value="sabado">Sábado</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="disp-inicio">HORA INICIO</label>
                                <input
                                    id="disp-inicio"
                                    type="time"
                                    className="form-input"
                                    value={formData.hora_inicio}
                                    onChange={handleInputChange('hora_inicio')}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="disp-fin">HORA FIN</label>
                                <input
                                    id="disp-fin"
                                    type="time"
                                    className="form-input"
                                    value={formData.hora_fin}
                                    onChange={handleInputChange('hora_fin')}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label className="form-label" htmlFor="disp-duracion">DURACIÓN DE CADA SESIÓN</label>
                            <select
                                id="disp-duracion"
                                className="form-input"
                                value={formData.duracion_minutos}
                                onChange={handleInputChange('duracion_minutos')}
                                required
                            >
                                {DURACIONES.map((min) => (
                                    <option key={min} value={min}>{min} minutos</option>
                                ))}
                            </select>
                        </div>

                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ width: '100%', justifyContent: 'center' }}
                            disabled={formLoading}
                        >
                            <Plus size={18} />
                            {formLoading ? 'Guardando...' : 'Agregar Horario'}
                        </button>
                    </form>
                </div>

                {/* List column */}
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '24px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} style={{ color: 'var(--morado-primario)' }} />
                        Tus Bloques de Horario
                    </h3>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                            Cargando disponibilidad...
                        </div>
                    ) : sortedDisponibilidades.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '60px 20px',
                            border: '1px dashed var(--border-color)', color: 'var(--text-muted)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <Clock size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                            <p style={{ fontWeight: 600, marginBottom: '4px' }}>Sin disponibilidad registrada</p>
                            <p style={{ fontSize: '13px' }}>Usa el panel de la izquierda para agregar tus bloques de disponibilidad.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {sortedDisponibilidades.map((disp) => (
                                <div 
                                    key={disp.id_disponibilidad} 
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '14px 18px',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--morado-secundario)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{
                                            background: 'var(--morado-primario)',
                                            color: 'var(--blanco)',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            width: '100px',
                                            textAlign: 'center'
                                        }}>
                                            {DIAS_SPANISH[disp.dia_semana] || disp.dia_semana}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
                                            {disp.hora_inicio.substring(0, 5)} - {disp.hora_fin.substring(0, 5)}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                            Sesiones de {disp.duracion_minutos ?? 30} min
                                        </div>
                                    </div>

                                    {hasPermission('disponibilidad:gestionar') && (
                                        <button
                                            className="btn btn-secondary"
                                            style={{
                                                padding: '6px 10px',
                                                color: '#f87171',
                                                borderColor: 'rgba(239,68,68,0.2)'
                                            }}
                                            onClick={() => handleDelete(disp.id_disponibilidad)}
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DisponibilidadManager;
