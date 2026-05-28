import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, X, CheckSquare, ShieldCheck, AlertCircle } from 'lucide-react';
import { apiUrl } from '../helpers/api';

const RolesManager = () => {
    const { token, hasPermission } = useAuth();
    const [roles, setRoles]                   = useState([]);
    const [permissionsList, setPermissionsList] = useState([]);
    const [loading, setLoading]               = useState(true);
    const [error, setError]                   = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Estado del modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [formError, setFormError]     = useState('');
    const [formLoading, setFormLoading] = useState(false);
    const [formData, setFormData]       = useState({ nombre: '', descripcion: '', permisos: [] });

    // ─── Helpers ────────────────────────────────────────────────────
    const authHeaders = { 'Authorization': `Bearer ${token}` };

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3500);
    };

    // ─── Carga de datos ─────────────────────────────────────────────
    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            const [rolesRes, permRes] = await Promise.all([
                fetch(apiUrl('/roles'),    { headers: authHeaders }),
                fetch(apiUrl('/permisos'), { headers: authHeaders })
            ]);

            if (!rolesRes.ok) {
                const err = await rolesRes.json();
                throw new Error(err.message || 'Error al obtener roles');
            }
            if (!permRes.ok) {
                const err = await permRes.json();
                throw new Error(err.message || 'Error al obtener permisos');
            }

            const rolesJson = await rolesRes.json();
            const permJson  = await permRes.json();

            // La API retorna { success: true, data: [...] }
            setRoles(rolesJson.data || []);
            setPermissionsList(permJson.data || []);
        } catch (err) {
            setError(err.message || 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    // ─── Acciones del modal ──────────────────────────────────────────
    const openCreateModal = () => {
        setEditingRole(null);
        setFormData({ nombre: '', descripcion: '', permisos: [] });
        setFormError('');
        setIsModalOpen(true);
    };

    const openEditModal = (role) => {
        setEditingRole(role);
        setFormData({
            nombre:      role.nombre,
            descripcion: role.descripcion || '',
            permisos:    role.permisos.map(p => p.id_permiso)
        });
        setFormError('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingRole(null);
        setFormError('');
    };

    const handleCheckbox = (permId) => {
        setFormData(prev => ({
            ...prev,
            permisos: prev.permisos.includes(permId)
                ? prev.permisos.filter(id => id !== permId)
                : [...prev.permisos, permId]
        }));
    };

    // ─── Submit (Crear / Editar) ─────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setFormLoading(true);

        const url    = editingRole ? apiUrl(`/roles/${editingRole.id_rol}`) : apiUrl('/roles');
        const method = editingRole ? 'PUT' : 'POST';

        try {
            const res  = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...authHeaders },
                body:    JSON.stringify(formData)
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Error al guardar el rol');
            }

            showSuccess(editingRole ? 'Rol actualizado exitosamente.' : 'Rol creado exitosamente.');
            closeModal();
            fetchData();
        } catch (err) {
            setFormError(err.message || 'Error al procesar la solicitud');
        } finally {
            setFormLoading(false);
        }
    };

    // ─── Eliminar ────────────────────────────────────────────────────
    const handleDelete = async (roleId, roleName) => {
        if (!window.confirm(`¿Estás seguro que deseas eliminar el rol "${roleName}"?\nEsta acción no se puede deshacer.`)) return;

        setError('');
        try {
            const res  = await fetch(apiUrl(`/roles/${roleId}`), {
                method: 'DELETE',
                headers: authHeaders
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Error al eliminar el rol');
            }

            showSuccess('Rol eliminado exitosamente.');
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    // ─── Agrupar permisos por módulo ─────────────────────────────────
    const groupedPermissions = permissionsList.reduce((acc, perm) => {
        const mod = perm.modulo || 'Otros';
        if (!acc[mod]) acc[mod] = [];
        acc[mod].push(perm);
        return acc;
    }, {});

    // ─── Render ──────────────────────────────────────────────────────
    return (
        <div style={{ animation: 'slideIn 0.3s ease-out' }}>
            {/* Header */}
            <div className="action-bar">
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Gestión de Roles y Permisos
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        Administra los perfiles de acceso y asocia permisos granulares a cada uno.
                    </p>
                </div>
                {hasPermission('roles:crear') && (
                    <button className="btn btn-primary" onClick={openCreateModal}>
                        <Plus size={18} />
                        Crear Nuevo Rol
                    </button>
                )}
            </div>

            {/* Alertas globales */}
            {error && (
                <div className="alert alert-danger">
                    <AlertCircle size={18} /><span>{error}</span>
                </div>
            )}
            {successMessage && (
                <div className="alert alert-success">
                    <ShieldCheck size={18} /><span>{successMessage}</span>
                </div>
            )}

            {/* Listado de roles */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                    Cargando roles...
                </div>
            ) : (
                <div className="roles-grid">
                    {roles.map((role) => (
                        <div key={role.id_rol} className="role-card">
                            <div className="role-card-header">
                                <div className="role-card-title">
                                    <span>{role.nombre}</span>
                                    <span className="role-badge">
                                        {role.permisos.length} permiso{role.permisos.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                <p className="role-card-desc">
                                    {role.descripcion || <em style={{ color: '#6b7280' }}>Sin descripción.</em>}
                                </p>
                            </div>

                            <div className="role-card-permissions">
                                <h4 className="role-permissions-title">Permisos asignados</h4>
                                <div className="role-permissions-list">
                                    {role.permisos.length === 0
                                        ? <span style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic' }}>Ninguno.</span>
                                        : role.permisos.map(p => (
                                            <span key={p.id_permiso} className="permission-chip" title={p.descripcion}>
                                                {p.codigo}
                                            </span>
                                        ))
                                    }
                                </div>
                            </div>

                            <div className="role-card-actions">
                                {hasPermission('roles:editar') && (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '8px 14px', fontSize: '13px' }}
                                        onClick={() => openEditModal(role)}
                                    >
                                        <Edit2 size={14} /> Editar
                                    </button>
                                )}
                                {hasPermission('roles:eliminar') && (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ padding: '8px 14px', fontSize: '13px', color: '#f87171', borderColor: 'rgba(239,68,68,0.25)' }}
                                        onClick={() => handleDelete(role.id_rol, role.nombre)}
                                        disabled={role.nombre === 'Administrador'}
                                        title={role.nombre === 'Administrador' ? 'El rol Administrador no puede eliminarse' : ''}
                                    >
                                        <Trash2 size={14} /> Eliminar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Crear / Editar */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3 className="modal-title">
                                {editingRole ? `Editar Rol: ${editingRole.nombre}` : 'Crear Nuevo Rol'}
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
                                    <label className="form-label" htmlFor="rol-nombre">NOMBRE DEL ROL</label>
                                    <input
                                        id="rol-nombre"
                                        type="text"
                                        className="form-input"
                                        placeholder="Ej: Recepcionista"
                                        value={formData.nombre}
                                        onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                                        disabled={editingRole?.nombre === 'Administrador'}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label" htmlFor="rol-desc">DESCRIPCIÓN</label>
                                    <textarea
                                        id="rol-desc"
                                        className="form-input"
                                        rows="2"
                                        placeholder="Describe las responsabilidades de este perfil..."
                                        style={{ resize: 'vertical' }}
                                        value={formData.descripcion}
                                        onChange={e => setFormData(p => ({ ...p, descripcion: e.target.value }))}
                                    />
                                </div>

                                {/* Selector de permisos granulares */}
                                <div className="permissions-selection">
                                    <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CheckSquare size={16} style={{ color: 'var(--morado-primario)' }} />
                                        Permisos Granulares
                                        <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>
                                            {formData.permisos.length} seleccionado{formData.permisos.length !== 1 ? 's' : ''}
                                        </span>
                                    </h4>

                                    {Object.keys(groupedPermissions).sort().map(modName => (
                                        <div key={modName} className="permission-module-group">
                                            <div className="module-title">{modName}</div>
                                            <div className="checkbox-grid">
                                                {groupedPermissions[modName].map(perm => (
                                                    <label key={perm.id_permiso} className="checkbox-label">
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox-input"
                                                            checked={formData.permisos.includes(perm.id_permiso)}
                                                            onChange={() => handleCheckbox(perm.id_permiso)}
                                                        />
                                                        <div className="checkbox-info">
                                                            <span className="checkbox-text">{perm.nombre}</span>
                                                            <span className="checkbox-desc">{perm.descripcion}</span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={formLoading}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                    {formLoading
                                        ? (editingRole ? 'Guardando...' : 'Creando...')
                                        : (editingRole ? 'Guardar Cambios' : 'Crear Rol')
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RolesManager;
