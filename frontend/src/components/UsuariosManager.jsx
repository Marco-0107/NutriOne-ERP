import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X, UserCog, AlertCircle, CheckCircle2, Search, Shield } from 'lucide-react';
import { validarRut, validarEmail } from '../helpers/validaciones';

const ROL_COLORS = [
    { bg: 'rgba(139,92,246,0.12)', color: '#7c3aed' },
    { bg: 'rgba(16,185,129,0.12)', color: '#059669' },
    { bg: 'rgba(59,130,246,0.12)', color: '#2563eb' },
    { bg: 'rgba(245,158,11,0.12)', color: '#d97706' },
];

const getRolStyle = (rolNombre, rolesDisponibles) => {
    const idx = rolesDisponibles.findIndex(r => r.nombre === rolNombre);
    return ROL_COLORS[idx >= 0 ? idx % ROL_COLORS.length : 0];
};
import { apiUrl } from '../helpers/api';

const EMPTY_FORM = {
    rut:              '',
    nombres:          '',
    apellido_paterno: '',
    apellido_materno: '',
    correo:           '',
    contrasena:       '',
};

const UsuariosManager = () => {
    const { token, hasPermission } = useAuth();
    const [usuarios, setUsuarios]           = useState([]);
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [searchTerm, setSearchTerm]       = useState('');

    const [isModalOpen, setIsModalOpen]       = useState(false);
    const [editingUsuario, setEditingUsuario] = useState(null);
    const [formData, setFormData]             = useState(EMPTY_FORM);
    const [formError, setFormError]           = useState('');
    const [formLoading, setFormLoading]       = useState(false);

    const [isRolModalOpen, setIsRolModalOpen] = useState(false);
    const [rolTarget, setRolTarget]           = useState(null);
    const [rolValues, setRolValues]           = useState([]);
    const [rolLoading, setRolLoading]         = useState(false);
    const [rolError, setRolError]             = useState('');
    const [rolesDisponibles, setRolesDisponibles] = useState([]);

    const authHeaders = { Authorization: `Bearer ${token}` };

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3500);
    };

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const res  = await fetch(apiUrl('/usuarios'), { headers: authHeaders });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al obtener usuarios');
            setUsuarios(data.data || []);
        } catch (err) {
            setError(err.message || 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetch(apiUrl('/roles'), { headers: authHeaders })
            .then(r => r.json())
            .then(d => { if (d.success) setRolesDisponibles(d.data?.filter(r => r.estado === 'activo') || []); })
            .catch(() => {});
    }, [token]);

    // ── Rol modal ──────────────────────────────────────────────────
    const openRolModal = (usuario) => {
        setRolTarget(usuario);
        setRolValues(usuario.roles || []);
        setRolError('');
        setIsRolModalOpen(true);
    };

    const closeRolModal = () => {
        setIsRolModalOpen(false);
        setRolTarget(null);
        setRolError('');
    };

    const toggleRol = (nombre) => {
        setRolValues(prev =>
            prev.includes(nombre) ? prev.filter(r => r !== nombre) : [...prev, nombre],
        );
    };

    const handleAssignRol = async (e) => {
        e.preventDefault();
        if (rolValues.length === 0) { setRolError('Debes seleccionar al menos un rol'); return; }
        setRolLoading(true);
        setRolError('');
        try {
            const res  = await fetch(apiUrl(`/usuarios/${rolTarget.id}/rol`), {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body:    JSON.stringify({ roles: rolValues }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Error al asignar roles');
            showSuccess(`Roles actualizados para ${rolTarget.nombres} ${rolTarget.apellido_paterno}.`);
            closeRolModal();
            fetchData();
        } catch (err) {
            setRolError(err.message || 'Error al procesar la solicitud');
        } finally {
            setRolLoading(false);
        }
    };

    // ── RUT formatter ──────────────────────────────────────────────
    const handleRutChange = (e) => {
        const raw     = e.target.value.replace(/[^0-9kK]/gi, '').toUpperCase();
        const limited = raw.slice(0, 9);

        if (limited.length === 0) { setFormData(prev => ({ ...prev, rut: '' })); return; }
        if (limited.length === 1) { setFormData(prev => ({ ...prev, rut: limited })); return; }

        const verifier = limited.slice(-1);
        const body     = limited.slice(0, -1);

        let grouped = '';
        const rev = body.split('').reverse();
        for (let i = 0; i < rev.length; i++) {
            if (i > 0 && i % 3 === 0) grouped = '.' + grouped;
            grouped = rev[i] + grouped;
        }
        setFormData(prev => ({ ...prev, rut: `${grouped}-${verifier}` }));
    };

    // ── Nombre filter (solo letras Unicode) ────────────────────────
    const handleNombreChange = (field) => (e) => {
        const value = e.target.value.replace(/[^\p{L}\s'.-]/gu, '');
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleChange = (field) => (e) =>
        setFormData(prev => ({ ...prev, [field]: e.target.value }));

    // ── Modal ──────────────────────────────────────────────────────
    const openCreateModal = () => {
        setEditingUsuario(null);
        setFormData(EMPTY_FORM);
        setFormError('');
        setIsModalOpen(true);
    };

    const openEditModal = (usuario) => {
        setEditingUsuario(usuario);
        setFormData({
            rut:              usuario.rut              || '',
            nombres:          usuario.nombres          || '',
            apellido_paterno: usuario.apellido_paterno || '',
            apellido_materno: usuario.apellido_materno || '',
            correo:           usuario.correo           || '',
            contrasena:       '',
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingUsuario(null);
        setFormError('');
    };

    // ── Submit ─────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!validarRut(formData.rut)) return setFormError('El RUT ingresado no es válido.');
        if (!validarEmail(formData.correo)) return setFormError('El correo electrónico no tiene un formato válido.');
        if (!editingUsuario && formData.contrasena.length < 6) {
            return setFormError('La contraseña debe tener al menos 6 caracteres.');
        }

        setFormLoading(true);

        const url    = editingUsuario
            ? apiUrl(`/usuarios/${editingUsuario.id}`)
            : apiUrl('/usuarios');
        const method = editingUsuario ? 'PUT' : 'POST';

        const body = { ...formData };
        if (editingUsuario) delete body.contrasena; // contraseña no se edita aquí

        try {
            const res  = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body:    JSON.stringify(body),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Error al guardar el usuario');
            }

            showSuccess(editingUsuario ? 'Usuario actualizado exitosamente.' : 'Usuario creado exitosamente.');
            closeModal();
            fetchData();
        } catch (err) {
            setFormError(err.message || 'Error al procesar la solicitud');
        } finally {
            setFormLoading(false);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────
    const handleDelete = async (usuario) => {
        const nombre = `${usuario.nombres} ${usuario.apellido_paterno}`;
        if (!window.confirm(`¿Estás seguro que deseas eliminar al usuario "${nombre}"?\nEsta acción no se puede deshacer.`)) return;

        setError('');
        try {
            const res  = await fetch(apiUrl(`/usuarios/${usuario.id}`), {
                method: 'DELETE',
                headers: authHeaders,
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || 'Error al eliminar el usuario');
            showSuccess('Usuario eliminado exitosamente.');
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    // ── Filtro ─────────────────────────────────────────────────────
    const usuariosFiltrados = usuarios.filter((u) => {
        const q = searchTerm.toLowerCase();
        return (
            u.nombres?.toLowerCase().includes(q)          ||
            u.apellido_paterno?.toLowerCase().includes(q) ||
            u.rut?.toLowerCase().includes(q)              ||
            u.correo?.toLowerCase().includes(q)
        );
    });

    // ── Render ─────────────────────────────────────────────────────
    return (
        <div style={{ animation: 'slideIn 0.3s ease-out' }}>
            {/* Header */}
            <div className="action-bar">
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Gestión de Usuarios
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        Administra los usuarios del sistema (nutricionistas, recepcionistas y staff).
                    </p>
                </div>
                {hasPermission('usuarios:crear') && (
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <Plus size={18} />
                        Nuevo Usuario
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
                    placeholder="Buscar por nombre, RUT o correo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                />
            </div>

            {/* Tabla */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                    Cargando usuarios...
                </div>
            ) : usuariosFiltrados.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-color)', color: 'var(--text-muted)',
                }}>
                    <UserCog size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                    <p style={{ fontWeight: 600, marginBottom: '4px' }}>
                        {searchTerm ? 'Sin resultados' : 'Sin usuarios registrados'}
                    </p>
                    <p style={{ fontSize: '14px' }}>
                        {searchTerm
                            ? 'Prueba con otro término de búsqueda.'
                            : 'Haz clic en "Nuevo Usuario" para comenzar.'}
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
                                    {['Usuario', 'RUT', 'Correo', 'Rol', 'Estado', 'Acciones'].map(col => (
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
                                {usuariosFiltrados.map((usuario, idx) => (
                                    <tr
                                        key={usuario.id}
                                        style={{
                                            borderBottom: idx < usuariosFiltrados.length - 1
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
                                                    {(usuario.nombres?.[0] || 'U').toUpperCase()}
                                                    {(usuario.apellido_paterno?.[0] || '').toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                        {usuario.nombres} {usuario.apellido_paterno}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                                        {usuario.apellido_materno}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '13px' }}>
                                            {usuario.rut || '—'}
                                        </td>
                                        <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                                            {usuario.correo || '—'}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            {usuario.roles?.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {usuario.roles.map(rol => (
                                                        <span key={rol} style={{
                                                            display: 'inline-flex', alignItems: 'center',
                                                            padding: '3px 10px', borderRadius: '20px',
                                                            fontSize: '12px', fontWeight: 600,
                                                            ...getRolStyle(rol, rolesDisponibles),
                                                        }}>
                                                            {rol}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Sin rol</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                padding: '3px 10px', borderRadius: '20px',
                                                fontSize: '12px', fontWeight: 600,
                                                background: usuario.estado === 'activo'
                                                    ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                                color: usuario.estado === 'activo'
                                                    ? 'var(--exito)' : 'var(--error)',
                                            }}>
                                                <span style={{
                                                    width: '6px', height: '6px', borderRadius: '50%',
                                                    background: usuario.estado === 'activo'
                                                        ? 'var(--exito)' : 'var(--error)',
                                                }} />
                                                {usuario.estado === 'activo' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px 16px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {hasPermission('usuarios:editar') && (
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ padding: '6px 12px', fontSize: '12px' }}
                                                        onClick={() => openEditModal(usuario)}
                                                    >
                                                        <Edit2 size={13} /> Editar
                                                    </button>
                                                )}
                                                {hasPermission('usuarios:editar') && (
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ padding: '6px 12px', fontSize: '12px', color: '#7c3aed', borderColor: 'rgba(139,92,246,0.3)' }}
                                                        onClick={() => openRolModal(usuario)}
                                                    >
                                                        <Shield size={13} /> Rol
                                                    </button>
                                                )}
                                                {hasPermission('usuarios:eliminar') && (
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ padding: '6px 12px', fontSize: '12px', color: '#f87171', borderColor: 'rgba(239,68,68,0.25)' }}
                                                        onClick={() => handleDelete(usuario)}
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
                        {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? 's' : ''} encontrado{usuariosFiltrados.length !== 1 ? 's' : ''}
                        {searchTerm && ` para "${searchTerm}"`}
                    </div>
                </div>
            )}

            {/* Modal Asignar Rol */}
            {isRolModalOpen && rolTarget && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeRolModal(); }}>
                    <div className="modal-content" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                Asignar Rol — {rolTarget.nombres} {rolTarget.apellido_paterno}
                            </h3>
                            <button className="btn-close" onClick={closeRolModal} aria-label="Cerrar">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAssignRol}>
                            <div className="modal-body">
                                {rolError && (
                                    <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                                        <AlertCircle size={16} /><span>{rolError}</span>
                                    </div>
                                )}
                                <div className="form-group">
                                    <label className="form-label">ROLES</label>
                                    <div style={{
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '8px 4px',
                                        maxHeight: '200px',
                                        overflowY: 'auto',
                                    }}>
                                        {rolesDisponibles.length === 0 ? (
                                            <p style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '8px 12px', margin: 0 }}>
                                                No hay roles disponibles
                                            </p>
                                        ) : rolesDisponibles.map(r => {
                                            const checked = rolValues.includes(r.nombre);
                                            const style   = getRolStyle(r.nombre, rolesDisponibles);
                                            return (
                                                <label
                                                    key={r.id_rol}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                        padding: '8px 12px', cursor: 'pointer', borderRadius: 'var(--radius-sm)',
                                                        background: checked ? style.bg : 'transparent',
                                                        transition: 'background var(--transition-fast)',
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleRol(r.nombre)}
                                                        style={{ accentColor: style.color, width: '15px', height: '15px', cursor: 'pointer' }}
                                                    />
                                                    <span style={{
                                                        fontSize: '13px', fontWeight: checked ? 600 : 400,
                                                        color: checked ? style.color : 'var(--text-primary)',
                                                    }}>
                                                        {r.nombre}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    {rolValues.length > 0 && (
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px', marginBottom: 0 }}>
                                            {rolValues.length} rol{rolValues.length !== 1 ? 'es' : ''} seleccionado{rolValues.length !== 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeRolModal} disabled={rolLoading}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={rolLoading}>
                                    {rolLoading ? 'Guardando...' : 'Guardar Roles'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Crear / Editar */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="modal-content" style={{ maxWidth: '540px' }}>
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingUsuario
                                    ? `Editar Usuario: ${editingUsuario.nombres} ${editingUsuario.apellido_paterno}`
                                    : 'Crear Nuevo Usuario'}
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

                                <div className="form-group">
                                    <label className="form-label" htmlFor="usr-rut">
                                        RUT <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '11px' }}>(formato: 12.345.678-9)</span>
                                    </label>
                                    <input
                                        id="usr-rut"
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
                                        <label className="form-label" htmlFor="usr-nombres">NOMBRES</label>
                                        <input
                                            id="usr-nombres"
                                            type="text"
                                            className="form-input"
                                            placeholder="Ej: María"
                                            value={formData.nombres}
                                            onChange={handleNombreChange('nombres')}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="usr-ap">APELLIDO PATERNO</label>
                                        <input
                                            id="usr-ap"
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
                                    <label className="form-label" htmlFor="usr-am">APELLIDO MATERNO</label>
                                    <input
                                        id="usr-am"
                                        type="text"
                                        className="form-input"
                                        placeholder="Ej: López"
                                        value={formData.apellido_materno}
                                        onChange={handleNombreChange('apellido_materno')}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="usr-correo">CORREO ELECTRÓNICO</label>
                                    <input
                                        id="usr-correo"
                                        type="email"
                                        className="form-input"
                                        placeholder="Ej: maria@nutrione.cl"
                                        value={formData.correo}
                                        onChange={handleChange('correo')}
                                        required
                                    />
                                </div>

                                {!editingUsuario && (
                                    <div className="form-group">
                                        <label className="form-label" htmlFor="usr-pass">CONTRASEÑA</label>
                                        <input
                                            id="usr-pass"
                                            type="password"
                                            className="form-input"
                                            placeholder="Mínimo 6 caracteres"
                                            value={formData.contrasena}
                                            onChange={handleChange('contrasena')}
                                            minLength={6}
                                            required
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={formLoading}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                    {formLoading
                                        ? (editingUsuario ? 'Guardando...' : 'Creando...')
                                        : (editingUsuario ? 'Guardar Cambios' : 'Crear Usuario')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UsuariosManager;
