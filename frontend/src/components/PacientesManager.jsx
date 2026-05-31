import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X, Users, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { apiUrl } from '../helpers/api';

const EMPTY_FORM = {
    rut:              '',
    nombres:          '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    prevision:        '',
};

const PacientesManager = () => {
    const { token, hasPermission } = useAuth();
    const [pacientes, setPacientes]         = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [searchTerm, setSearchTerm]       = useState('');

    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [editingPaciente, setEditingPaciente] = useState(null);
    const [formData, setFormData]         = useState(EMPTY_FORM);
    const [formError, setFormError]       = useState('');
    const [formLoading, setFormLoading]   = useState(false);

    const authHeaders = { Authorization: `Bearer ${token}` };

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3500);
    };

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const res  = await fetch(apiUrl('/pacientes'), { headers: authHeaders });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al obtener pacientes');
            setPacientes(data.data || []);
        } catch (err) {
            setError(err.message || 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    const openCreateModal = () => {
        setEditingPaciente(null);
        setFormData(EMPTY_FORM);
        setFormError('');
        setIsModalOpen(true);
    };

    const openEditModal = (paciente) => {
        setEditingPaciente(paciente);
        setFormData({
            rut:              paciente.usuario?.rut              || '',
            nombres:          paciente.usuario?.nombres          || '',
            apellido_paterno: paciente.usuario?.apellido_paterno || '',
            apellido_materno: paciente.usuario?.apellido_materno || '',
            fecha_nacimiento: paciente.fecha_nacimiento || '',
            prevision:        paciente.prevision        || '',
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPaciente(null);
        setFormError('');
    };

    const handleChange = (field) => (e) =>
        setFormData(prev => ({ ...prev, [field]: e.target.value }));

    // RUT: auto-formatea con puntos y guion → XX.XXX.XXX-Y (máx 9 dígitos cuerpo + verificador)
    const handleRutChange = (e) => {
        const raw     = e.target.value.replace(/[^0-9kK]/gi, '').toUpperCase();
        const limited = raw.slice(0, 9); // máx 9 dígitos (8 cuerpo + 1 verificador)

        if (limited.length === 0) { setFormData(prev => ({ ...prev, rut: '' })); return; }
        if (limited.length === 1) { setFormData(prev => ({ ...prev, rut: limited })); return; }

        const verifier = limited.slice(-1);
        const body     = limited.slice(0, -1);

        // Agrupación con puntos de derecha a izquierda (grupos de 3)
        let grouped = '';
        const rev = body.split('').reverse();
        for (let i = 0; i < rev.length; i++) {
            if (i > 0 && i % 3 === 0) grouped = '.' + grouped;
            grouped = rev[i] + grouped;
        }

        setFormData(prev => ({ ...prev, rut: `${grouped}-${verifier}` }));
    };

    // Nombres y apellidos: cualquier letra Unicode, espacios, guiones, puntos y apóstrofos
    const handleNombreChange = (field) => (e) => {
        const value = e.target.value.replace(/[^\p{L}\s'.-]/gu, '');
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        const url    = editingPaciente
            ? apiUrl(`/pacientes/${editingPaciente.id}`)
            : apiUrl('/pacientes');
        const method = editingPaciente ? 'PUT' : 'POST';

        const body = { ...formData };
        // On edit: skip password (no se cambia desde este formulario)
        if (editingPaciente) {
            delete body.contrasena;
        }

        try {
            const res  = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body:    JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Error al guardar el paciente');
            }

            showSuccess(editingPaciente ? 'Paciente actualizado exitosamente.' : 'Paciente registrado exitosamente.');
            closeModal();
            fetchData();
        } catch (err) {
            setFormError(err.message || 'Error al procesar la solicitud');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (paciente) => {
        const nombre = `${paciente.usuario?.nombres} ${paciente.usuario?.apellido_paterno}`;
        if (!window.confirm(`¿Estás seguro que deseas eliminar al paciente "${nombre}"?\nEsta acción eliminará también su cuenta de usuario y no se puede deshacer.`)) return;

        setError('');
        try {
            const res  = await fetch(apiUrl(`/pacientes/${paciente.id}`), {
                method: 'DELETE',
                headers: authHeaders,
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Error al eliminar el paciente');
            }

            showSuccess('Paciente eliminado exitosamente.');
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const calcularEdad = (fechaNacimiento) => {
        if (!fechaNacimiento) return '—';
        const hoy   = new Date();
        const nac   = new Date(fechaNacimiento);
        let edad    = hoy.getFullYear() - nac.getFullYear();
        const mes   = hoy.getMonth() - nac.getMonth();
        if (mes < 0 || (mes === 0 && hoy.getDate() < nac.getDate())) edad--;
        return `${edad} años`;
    };

    const formatFecha = (fecha) => {
        if (!fecha) return '—';
        return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CL', {
            day:   '2-digit',
            month: '2-digit',
            year:  'numeric',
        });
    };

    const pacientesFiltrados = pacientes.filter((p) => {
        const q = searchTerm.toLowerCase();
        return (
            p.usuario?.nombres?.toLowerCase().includes(q)          ||
            p.usuario?.apellido_paterno?.toLowerCase().includes(q) ||
            p.usuario?.rut?.toLowerCase().includes(q)              ||
            p.usuario?.correo?.toLowerCase().includes(q)           ||
            (p.prevision || '').toLowerCase().includes(q)
        );
    });

    return (
        <div style={{ animation: 'slideIn 0.3s ease-out' }}>
            {/* Header */}
            <div className="action-bar">
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Gestión de Pacientes
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        Registra y administra los pacientes del sistema NutriERP.
                    </p>
                </div>
                {hasPermission('pacientes:crear') && (
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <Plus size={18} />
                        Nuevo Paciente
                    </button>
                )}
            </div>

            {/* Alertas */}
            {error && (
                <div className="alert alert-danger">
                    <AlertCircle size={18} /><span>{error}</span>
                </div>
            )}
            {successMessage && (
                <div className="alert alert-success">
                    <CheckCircle2 size={18} /><span>{successMessage}</span>
                </div>
            )}

            {/* Buscador */}
            <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '400px' }}>
                <Search size={16} style={{
                    position: 'absolute', left: '12px', top: '50%',
                    transform: 'translateY(-50%)', color: 'var(--text-muted)',
                    pointerEvents: 'none',
                }} />
                <input
                    type="text"
                    className="form-input"
                    placeholder="Buscar por nombre, RUT, correo o previsión..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                />
            </div>

            {/* Tabla */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                    Cargando pacientes...
                </div>
            ) : pacientesFiltrados.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-color)', color: 'var(--text-muted)',
                }}>
                    <Users size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                    <p style={{ fontWeight: 600, marginBottom: '4px' }}>
                        {searchTerm ? 'Sin resultados' : 'Sin pacientes registrados'}
                    </p>
                    <p style={{ fontSize: '14px' }}>
                        {searchTerm
                            ? 'Prueba con otro término de búsqueda.'
                            : 'Haz clic en "Nuevo Paciente" para comenzar.'}
                    </p>
                </div>
            ) : (
                <div style={{
                    background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)', overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                                    {['Paciente', 'RUT', 'Fecha Nac.', 'Edad', 'Previsión', 'Estado', 'Acciones'].map(col => (
                                        <th key={col} style={{
                                            padding: '12px 16px', textAlign: 'left',
                                            fontWeight: 700, fontSize: '11px', letterSpacing: '0.05em',
                                            color: 'var(--text-muted)', textTransform: 'uppercase',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pacientesFiltrados.map((paciente, idx) => (
                                    <tr key={paciente.id} style={{
                                        borderBottom: idx < pacientesFiltrados.length - 1
                                            ? '1px solid var(--border-color)' : 'none',
                                        transition: 'background var(--transition-fast)',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '34px', height: '34px', borderRadius: '50%',
                                                    background: 'var(--lavanda-suave)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '12px', fontWeight: 700,
                                                    color: 'var(--morado-primario)', flexShrink: 0,
                                                }}>
                                                    {(paciente.usuario?.nombres?.[0] || 'P').toUpperCase()}
                                                    {(paciente.usuario?.apellido_paterno?.[0] || '').toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {paciente.usuario?.nombres} {paciente.usuario?.apellido_paterno}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        {paciente.usuario?.apellido_materno}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '13px' }}>
                                            {paciente.usuario?.rut || '—'}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                            {formatFecha(paciente.fecha_nacimiento)}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                            {calcularEdad(paciente.fecha_nacimiento)}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            {paciente.prevision ? (
                                                <span style={{
                                                    background: 'var(--lavanda-suave)', color: 'var(--morado-primario)',
                                                    padding: '3px 10px', borderRadius: '20px',
                                                    fontSize: '12px', fontWeight: 600,
                                                }}>
                                                    {paciente.prevision}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>Sin previsión</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                                background: paciente.usuario?.estado === 'activo'
                                                    ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                color: paciente.usuario?.estado === 'activo'
                                                    ? 'var(--exito)' : 'var(--error)',
                                            }}>
                                                <span style={{
                                                    width: '6px', height: '6px', borderRadius: '50%',
                                                    background: paciente.usuario?.estado === 'activo'
                                                        ? 'var(--exito)' : 'var(--error)',
                                                }} />
                                                {paciente.usuario?.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {hasPermission('pacientes:editar') && (
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                                        onClick={() => openEditModal(paciente)}
                                                    >
                                                        <Edit2 size={13} /> Editar
                                                    </button>
                                                )}
                                                {hasPermission('pacientes:eliminar') && (
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ padding: '6px 12px', fontSize: '12px', color: '#f87171', borderColor: 'rgba(239,68,68,0.25)' }}
                                                        onClick={() => handleDelete(paciente)}
                                                    >
                                                        <Trash2 size={13} /> Eliminar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{
                        padding: '10px 16px', borderTop: '1px solid var(--border-color)',
                        color: 'var(--text-muted)', fontSize: '13px',
                    }}>
                        {pacientesFiltrados.length} paciente{pacientesFiltrados.length !== 1 ? 's' : ''} encontrado{pacientesFiltrados.length !== 1 ? 's' : ''}
                        {searchTerm && ` para "${searchTerm}"`}
                    </div>
                </div>
            )}

            {/* Modal Crear / Editar */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="modal-content" style={{ maxWidth: '580px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingPaciente
                                    ? `Editar Paciente: ${editingPaciente.usuario?.nombres} ${editingPaciente.usuario?.apellido_paterno}`
                                    : 'Registrar Nuevo Paciente'}
                            </h3>
                            <button className="btn-close" onClick={closeModal} aria-label="Cerrar">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {formError && (
                                    <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
                                        <AlertCircle size={16} /><span>{formError}</span>
                                    </div>
                                )}

                                {/* Datos personales */}
                                <p style={{
                                    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                                    letterSpacing: '0.08em', color: 'var(--morado-primario)',
                                    marginBottom: '14px', paddingBottom: '6px',
                                    borderBottom: '1px solid var(--border-color)',
                                }}>
                                    Datos Personales
                                </p>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="pac-rut">
                                        RUT <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '11px' }}>(formato: 12.345.678-9)</span>
                                    </label>
                                    <input
                                        id="pac-rut"
                                        type="text"
                                        className="form-input"
                                        placeholder="Ej: 12.345.678-9"
                                        value={formData.rut}
                                        onChange={handleRutChange}
                                        maxLength={13}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="pac-nombres">NOMBRES</label>
                                        <input
                                            id="pac-nombres"
                                            type="text"
                                            className="form-input"
                                            placeholder="Ej: María"
                                            value={formData.nombres}
                                            onChange={handleNombreChange('nombres')}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="pac-ap">APELLIDO PATERNO</label>
                                        <input
                                            id="pac-ap"
                                            type="text"
                                            className="form-input"
                                            placeholder="Ej: González"
                                            value={formData.apellido_paterno}
                                            onChange={handleNombreChange('apellido_paterno')}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="pac-am">APELLIDO MATERNO</label>
                                    <input
                                        id="pac-am"
                                        type="text"
                                        className="form-input"
                                        placeholder="Ej: López"
                                        value={formData.apellido_materno}
                                        onChange={handleNombreChange('apellido_materno')}
                                        required
                                    />
                                </div>

                                {/* Datos clínicos */}
                                <p style={{
                                    fontSize: '11px', fontWeight: 700, textTransform: 'uppercase',
                                    letterSpacing: '0.08em', color: 'var(--morado-primario)',
                                    marginTop: '20px', marginBottom: '14px', paddingBottom: '6px',
                                    borderBottom: '1px solid var(--border-color)',
                                }}>
                                    Datos Clínicos
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="pac-fn">FECHA DE NACIMIENTO</label>
                                        <input
                                            id="pac-fn"
                                            type="date"
                                            className="form-input"
                                            value={formData.fecha_nacimiento}
                                            onChange={handleChange('fecha_nacimiento')}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="pac-prev">PREVISIÓN</label>
                                        <select
                                            id="pac-prev"
                                            className="form-input"
                                            value={formData.prevision}
                                            onChange={handleChange('prevision')}
                                        >
                                            <option value="">Sin previsión</option>
                                            <option value="Fonasa A">Fonasa A</option>
                                            <option value="Fonasa B">Fonasa B</option>
                                            <option value="Fonasa C">Fonasa C</option>
                                            <option value="Fonasa D">Fonasa D</option>
                                            <option value="Isapre">Isapre</option>
                                            <option value="Particular">Particular</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={formLoading}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                    {formLoading
                                        ? (editingPaciente ? 'Guardando...' : 'Registrando...')
                                        : (editingPaciente ? 'Guardar Cambios' : 'Registrar Paciente')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PacientesManager;
