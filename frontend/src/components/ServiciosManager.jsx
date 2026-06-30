import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Pencil, AlertCircle, CheckCircle2, Briefcase, Clock, X } from 'lucide-react';
import { apiUrl } from '../helpers/api';

const PREVISIONES = [
    { value: 'particular', label: 'Particular' },
    { value: 'fonasa', label: 'Fonasa' },
    { value: 'isapre', label: 'Isapre' },
];

const formatCLP = (value) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value) || 0);

const EMPTY_FORM = {
    nombre: '',
    descripcion: '',
    precio: '',
    duracion_minutos: 30,
    prevision: 'particular',
};

const ServiciosManager = () => {
    const { token, hasPermission } = useAuth();
    const [servicios, setServicios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState(EMPTY_FORM);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState('');
    const [editingId, setEditingId] = useState(null);

    const authHeaders = { Authorization: `Bearer ${token}` };

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3500);
    };

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(apiUrl('/servicios'), { headers: authHeaders });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al obtener los servicios');
            setServicios(data.data || []);
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
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const resetForm = () => {
        setFormData(EMPTY_FORM);
        setEditingId(null);
        setFormError('');
    };

    const startEdit = (servicio) => {
        setEditingId(servicio.id);
        setFormData({
            nombre: servicio.nombre,
            descripcion: servicio.descripcion || '',
            precio: String(servicio.precio),
            duracion_minutos: servicio.duracion_minutos,
            prevision: servicio.prevision,
        });
        setFormError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        const { nombre, precio, duracion_minutos, prevision, descripcion } = formData;
        if (!nombre.trim()) return setFormError('El nombre del servicio es obligatorio.');
        if (!precio || Number(precio) <= 0) return setFormError('El precio debe ser mayor a 0.');
        if (!duracion_minutos || Number(duracion_minutos) <= 0) return setFormError('La duración debe ser mayor a 0.');

        setFormLoading(true);
        try {
            const body = {
                nombre: nombre.trim(),
                descripcion: descripcion.trim() || null,
                precio: Number(precio),
                duracion_minutos: Number(duracion_minutos),
                prevision,
            };

            const url = editingId ? apiUrl(`/servicios/${editingId}`) : apiUrl('/servicios');
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body: JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Error al guardar el servicio');
            }

            showSuccess(editingId ? 'Servicio actualizado exitosamente.' : 'Servicio creado exitosamente.');
            resetForm();
            fetchData();
        } catch (err) {
            setFormError(err.message || 'Error al guardar el servicio');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro que deseas eliminar este servicio?\nYa no podrá ser seleccionado al agendar nuevas citas.')) {
            return;
        }

        setError('');
        try {
            const res = await fetch(apiUrl(`/servicios/${id}`), {
                method: 'DELETE',
                headers: authHeaders,
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Error al eliminar el servicio');
            }

            showSuccess('Servicio eliminado exitosamente.');
            if (editingId === id) resetForm();
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const sortedServicios = [...servicios].sort((a, b) => a.nombre.localeCompare(b.nombre));

    return (
        <div style={{ animation: 'slideIn 0.3s ease-out' }}>
            <div className="action-bar" style={{ marginBottom: '30px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Servicios
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        Define los servicios que ofreces, su valor, duración y previsión asociada para que puedan asociarse al agendar citas.
                    </p>
                </div>
            </div>

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
                <div style={{
                    background: 'var(--bg-card)',
                    padding: '24px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                    height: 'fit-content',
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Briefcase size={18} style={{ color: 'var(--morado-primario)' }} />
                            {editingId ? 'Editar Servicio' : 'Nuevo Servicio'}
                        </span>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="btn-close" aria-label="Cancelar edición">
                                <X size={16} />
                            </button>
                        )}
                    </h3>

                    {formError && (
                        <div className="alert alert-danger" style={{ marginBottom: '16px', padding: '10px 12px', fontSize: '13px' }}>
                            <AlertCircle size={15} /><span>{formError}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label" htmlFor="serv-nombre">NOMBRE</label>
                            <input
                                id="serv-nombre"
                                type="text"
                                className="form-input"
                                placeholder="Ej: Consulta nutricional"
                                value={formData.nombre}
                                onChange={handleInputChange('nombre')}
                                required
                            />
                        </div>

                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="form-label" htmlFor="serv-descripcion">DESCRIPCIÓN</label>
                            <textarea
                                id="serv-descripcion"
                                className="form-input"
                                rows="3"
                                placeholder="Detalle del servicio (opcional)"
                                value={formData.descripcion}
                                onChange={handleInputChange('descripcion')}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                            <div className="form-group">
                                <label className="form-label" htmlFor="serv-precio">PRECIO (CLP)</label>
                                <input
                                    id="serv-precio"
                                    type="number"
                                    min="0"
                                    step="1"
                                    className="form-input"
                                    placeholder="Ej: 20000"
                                    value={formData.precio}
                                    onChange={handleInputChange('precio')}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label" htmlFor="serv-duracion">DURACIÓN (MIN)</label>
                                <input
                                    id="serv-duracion"
                                    type="number"
                                    min="5"
                                    step="5"
                                    className="form-input"
                                    value={formData.duracion_minutos}
                                    onChange={handleInputChange('duracion_minutos')}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '24px' }}>
                            <label className="form-label" htmlFor="serv-prevision">PREVISIÓN</label>
                            <select
                                id="serv-prevision"
                                className="form-input"
                                value={formData.prevision}
                                onChange={handleInputChange('prevision')}
                                required
                            >
                                {PREVISIONES.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
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
                            {formLoading ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Agregar Servicio'}
                        </button>
                    </form>
                </div>

                <div style={{
                    background: 'var(--bg-card)',
                    padding: '24px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    boxShadow: 'var(--shadow-sm)',
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Briefcase size={18} style={{ color: 'var(--morado-primario)' }} />
                        Tus Servicios
                    </h3>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                            Cargando servicios...
                        </div>
                    ) : sortedServicios.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '60px 20px',
                            border: '1px dashed var(--border-color)', color: 'var(--text-muted)',
                            borderRadius: 'var(--radius-md)',
                        }}>
                            <Briefcase size={36} style={{ marginBottom: '12px', opacity: 0.4 }} />
                            <p style={{ fontWeight: 600, marginBottom: '4px' }}>Sin servicios registrados</p>
                            <p style={{ fontSize: '13px' }}>Usa el panel de la izquierda para agregar tus servicios disponibles.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {sortedServicios.map((servicio) => (
                                <div
                                    key={servicio.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '14px 18px',
                                        background: 'var(--bg-primary)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        transition: 'all 0.2s',
                                        gap: '14px',
                                        flexWrap: 'wrap',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--morado-secundario)')}
                                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
                                >
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                            {servicio.nombre}
                                        </div>
                                        {servicio.descripcion && (
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{servicio.descripcion}</div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--morado-primario)' }}>
                                            {formatCLP(servicio.precio)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-muted)' }}>
                                            <Clock size={14} />
                                            {servicio.duracion_minutos} min
                                        </div>
                                        <div style={{
                                            background: 'var(--lavanda-suave)',
                                            color: 'var(--morado-primario)',
                                            padding: '3px 10px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: 700,
                                            textTransform: 'capitalize',
                                        }}>
                                            {servicio.prevision}
                                        </div>
                                        {servicio.estado === 'inactivo' && (
                                            <div style={{ fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>Inactivo</div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {hasPermission('servicios:editar') && (
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '6px 10px' }}
                                                onClick={() => startEdit(servicio)}
                                                aria-label="Editar servicio"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                        )}
                                        {hasPermission('servicios:eliminar') && (
                                            <button
                                                className="btn btn-secondary"
                                                style={{ padding: '6px 10px', color: '#f87171', borderColor: 'rgba(239,68,68,0.2)' }}
                                                onClick={() => handleDelete(servicio.id)}
                                                aria-label="Eliminar servicio"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiciosManager;
