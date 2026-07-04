import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Edit2, Trash2, X, Users, AlertCircle, CheckCircle2, Search,
    ClipboardList, ClipboardPlus, Clock3, UserRound, CalendarDays,
    CircleCheckBig, Ban, Weight, Calculator, Apple, ChevronDown,
    ChevronLeft, MapPin, MoreVertical, TrendingUp,
} from 'lucide-react';
import { apiUrl } from '../helpers/api';
import PanelMinuta from './PanelMinuta';

const EMPTY_FORM = {
    rut:              '',
    nombres:          '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    prevision:        '',
    telefono:         '',
};

// ── Helpers compartidos ────────────────────────────────────────────────────
const getFullName = (person) => {
    if (!person) return '';
    return [person.nombres, person.apellido_paterno, person.apellido_materno]
        .filter(Boolean).join(' ').trim();
};

const EVENT_STYLES = {
    confirmada: { accent: '#14B8A6', background: 'rgba(20,184,166,0.08)',  text: '#0F766E', label: 'Confirmada',  icon: CircleCheckBig },
    pendiente:  { accent: '#F59E0B', background: 'rgba(245,158,11,0.10)',  text: '#B45309', label: 'Pendiente',   icon: AlertCircle    },
    completada: { accent: '#22C55E', background: 'rgba(34,197,94,0.08)',   text: '#15803D', label: 'Completada',  icon: CircleCheckBig },
    cancelada:  { accent: '#EF4444', background: 'rgba(239,68,68,0.08)',   text: '#B91C1C', label: 'Cancelada',   icon: Ban            },
    default:    { accent: '#6B7280', background: 'rgba(107,114,128,0.10)', text: '#374151', label: 'Programada',  icon: CalendarDays   },
};

const INITIAL_ATENCION_FORM = {
    tipo: 'Control nutricional',
    fecha_atencion: '',
    edad: '',
    nombre_social: '',
    sexo: '',
    peso: '',
    talla: '',
    presion_arterial: '',
    circunferencia_cintura: '',
    motivo_consulta: '',
    diagnostico_nutricional: '',
    calculos: '',
    indicaciones: '',
    recomendaciones: '',
    derivaciones: '',
    observacion: '',
};

// Sub-componente: Modal de Atención (ficha clínica)
const ModalAtencion = ({ cita, token, onClose }) => {
    const [ficha, setFicha]                         = useState(null);
    const [fetchLoading, setFetchLoading]           = useState(false);
    const [atencionForm, setAtencionForm]           = useState(INITIAL_ATENCION_FORM);
    const [atencionLoading, setAtencionLoading]     = useState(false);
    const [atencionError, setAtencionError]         = useState('');
    const [atencionSuccess, setAtencionSuccess]     = useState(false);
    const [usaNombreSocial, setUsaNombreSocial]     = useState(false);
    const [panelCalcOpen, setPanelCalcOpen]         = useState(false);
    const [panelAlimOpen, setPanelAlimOpen]         = useState(false);
    const [minutaState, setMinutaState]             = useState(null);
    const [objetivoCalorico, setObjetivoCalorico]   = useState(null);

    const { hasPermission } = useAuth();

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setAtencionForm({ ...INITIAL_ATENCION_FORM, fecha_atencion: cita.fecha || today });
        setFetchLoading(true);
        fetch(apiUrl(`/fichas/cita/${cita.id_cita}`), {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (data.data) {
                    const f = data.data;
                    setFicha(f);
                    if (f.nombre_social) setUsaNombreSocial(true);
                    if (f.minuta)        setMinutaState(f.minuta);
                    setAtencionForm({
                        tipo:                    f.tipo                    ?? 'Control nutricional',
                        fecha_atencion:          f.fecha_atencion           ?? cita.fecha ?? today,
                        edad:                    f.edad                    ?? '',
                        nombre_social:           f.nombre_social            ?? '',
                        sexo:                    f.sexo                    ?? '',
                        peso:                    f.peso                    ?? '',
                        talla:                   f.talla                   ?? '',
                        presion_arterial:        f.presion_arterial         ?? '',
                        circunferencia_cintura:  f.circunferencia_cintura   ?? '',
                        motivo_consulta:         f.motivo_consulta          ?? '',
                        diagnostico_nutricional: f.diagnostico_nutricional  ?? '',
                        calculos:                f.calculos                 ?? '',
                        indicaciones:            f.indicaciones             ?? '',
                        recomendaciones:         f.recomendaciones          ?? '',
                        derivaciones:            f.derivaciones             ?? '',
                        observacion:             f.observacion              ?? '',
                    });
                    // Cargar objetivo calórico desde la evaluación nutricional
                    fetch(apiUrl(`/calculos/ficha/${f.id_ficha}`), {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                        .then(r => r.json())
                        .then(ev => { if (ev.data?.get) setObjetivoCalorico(Number(ev.data.get)); })
                        .catch(() => {});
                }
            })
            .catch(() => {})
            .finally(() => setFetchLoading(false));
    }, [cita, token]);

    const handleChange = (field) => (e) =>
        setAtencionForm(prev => ({ ...prev, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAtencionError('');
        if (!atencionForm.tipo.trim())        return setAtencionError('El tipo de atención es requerido.');
        if (!atencionForm.fecha_atencion)      return setAtencionError('La fecha de atención es requerida.');
        if (!String(atencionForm.edad).trim()) return setAtencionError('La edad del paciente es requerida.');

        setAtencionLoading(true);
        try {
            const body = {
                tipo:                    atencionForm.tipo.trim(),
                fecha_atencion:          atencionForm.fecha_atencion,
                edad:                    Number(atencionForm.edad),
                ...(atencionForm.nombre_social.trim()           && { nombre_social:           atencionForm.nombre_social.trim() }),
                ...(atencionForm.sexo                           && { sexo:                    atencionForm.sexo }),
                ...(atencionForm.peso                           && { peso:                    parseFloat(atencionForm.peso) }),
                ...(atencionForm.talla                          && { talla:                   parseFloat(atencionForm.talla) }),
                ...(atencionForm.presion_arterial.trim()        && { presion_arterial:         atencionForm.presion_arterial.trim() }),
                ...(atencionForm.circunferencia_cintura         && { circunferencia_cintura:   parseFloat(atencionForm.circunferencia_cintura) }),
                ...(atencionForm.motivo_consulta.trim()         && { motivo_consulta:          atencionForm.motivo_consulta.trim() }),
                ...(atencionForm.diagnostico_nutricional.trim() && { diagnostico_nutricional:  atencionForm.diagnostico_nutricional.trim() }),
                ...(atencionForm.calculos.trim()                && { calculos:                 atencionForm.calculos.trim() }),
                ...(atencionForm.indicaciones.trim()            && { indicaciones:             atencionForm.indicaciones.trim() }),
                ...(atencionForm.recomendaciones.trim()         && { recomendaciones:          atencionForm.recomendaciones.trim() }),
                ...(atencionForm.derivaciones.trim()            && { derivaciones:             atencionForm.derivaciones.trim() }),
                ...(atencionForm.observacion.trim()             && { observacion:              atencionForm.observacion.trim() }),
                minuta: minutaState ?? null,
            };

            const url    = ficha ? apiUrl(`/fichas/${ficha.id_ficha}`) : apiUrl(`/fichas/cita/${cita.id_cita}`);
            const method = ficha ? 'PUT' : 'POST';

            const res  = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) { setAtencionError(data.message || 'Error al guardar la ficha clínica.'); return; }
            setAtencionSuccess(true);
        } catch {
            setAtencionError('Error de conexión con el servidor.');
        } finally {
            setAtencionLoading(false);
        }
    };

    const canEdit = cita.estado === 'completada'
        ? hasPermission('fichas:editar')
        : hasPermission('fichas:crear');

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: '740px' }}>
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ClipboardPlus size={20} color="var(--morado-primario)" />
                            {ficha ? 'Ficha clínica registrada' : 'Iniciar atención médica'}
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Paciente:&nbsp;
                            <strong style={{ color: 'var(--text-primary)' }}>
                                {getFullName(cita.paciente) || 'Paciente no disponible'}
                            </strong>
                            &nbsp;·&nbsp;{cita.fecha}&nbsp;
                            {cita.hora_inicio?.substring(0, 5)} – {cita.hora_fin?.substring(0, 5)}
                        </p>
                    </div>
                    <button className="btn-close" onClick={onClose} aria-label="Cerrar">×</button>
                </div>

                {fetchLoading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Clock3 size={28} style={{ marginBottom: '10px', opacity: 0.5 }} />
                        <div>Cargando ficha clínica...</div>
                    </div>
                ) : atencionSuccess ? (
                    <div style={{ padding: '48px 32px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(20,184,166,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <CircleCheckBig size={32} color="#14B8A6" />
                        </div>
                        <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                            {ficha ? 'Ficha actualizada correctamente' : 'Atención registrada correctamente'}
                        </h4>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            La ficha clínica ha sido guardada. La cita ahora figura como <strong>completada</strong>.
                        </p>
                        <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {atencionError && (
                                <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                                    <AlertCircle size={18} /><span>{atencionError}</span>
                                </div>
                            )}

                            {/* Tipo y fecha */}
                            <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Tipo de atención <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <select className="form-input" value={atencionForm.tipo} onChange={handleChange('tipo')} required disabled={!canEdit}>
                                        <option value="Control nutricional">Control nutricional</option>
                                        <option value="Evaluación inicial">Evaluación inicial</option>
                                        <option value="Control metabólico">Control metabólico</option>
                                        <option value="Seguimiento">Seguimiento</option>
                                        <option value="Urgencia">Urgencia</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Fecha de atención <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <input type="date" className="form-input" value={atencionForm.fecha_atencion} onChange={handleChange('fecha_atencion')} required disabled={!canEdit} />
                                </div>
                            </div>

                            {/* Datos personales */}
                            <div style={{ background: 'var(--lavanda-suave)', borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: '16px', fontSize: '12px', fontWeight: 800, color: 'var(--morado-primario)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                                <UserRound size={14} />
                                Datos personales
                            </div>
                            <div className="form-group" style={{ marginBottom: '8px' }}>
                                <label className="form-label">Nombre completo</label>
                                <input type="text" className="form-input" value={getFullName(cita.paciente) || ''} readOnly disabled style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', cursor: 'not-allowed' }} />
                            </div>
                            <div style={{ marginBottom: usaNombreSocial ? '8px' : '14px' }}>
                                <label htmlFor="hist-toggle-ns" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: canEdit ? 'pointer' : 'default', userSelect: 'none', fontSize: '13px', color: usaNombreSocial ? 'var(--morado-primario)' : 'var(--text-muted)', fontWeight: usaNombreSocial ? 700 : 500, transition: 'color 0.2s' }}>
                                    <input
                                        id="hist-toggle-ns"
                                        type="checkbox"
                                        checked={usaNombreSocial}
                                        disabled={!canEdit}
                                        onChange={(e) => {
                                            setUsaNombreSocial(e.target.checked);
                                            if (!e.target.checked) setAtencionForm(prev => ({ ...prev, nombre_social: '' }));
                                        }}
                                        style={{ accentColor: 'var(--morado-primario)', width: '15px', height: '15px', cursor: canEdit ? 'pointer' : 'default' }}
                                    />
                                    El paciente usa nombre social
                                </label>
                            </div>
                            {usaNombreSocial && (
                                <div className="form-group" style={{ marginBottom: '14px', animation: 'slideIn 0.2s ease-out' }}>
                                    <label className="form-label">Nombre social</label>
                                    <input type="text" className="form-input" placeholder="Nombre por el que prefiere ser llamado/a" value={atencionForm.nombre_social} onChange={handleChange('nombre_social')} disabled={!canEdit} />
                                </div>
                            )}
                            <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Sexo</label>
                                    <select className="form-input" value={atencionForm.sexo} onChange={handleChange('sexo')} disabled={!canEdit}>
                                        <option value="">Seleccionar</option>
                                        <option value="Femenino">Femenino</option>
                                        <option value="Masculino">Masculino</option>
                                        <option value="Otro">Otro</option>
                                        <option value="Prefiero no indicar">Prefiero no indicar</option>
                                    </select>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Edad <span style={{ color: 'var(--danger)' }}>*</span></label>
                                    <input type="number" min="0" max="120" className="form-input" placeholder="Ej: 34" value={atencionForm.edad} onChange={handleChange('edad')} required disabled={!canEdit} />
                                </div>
                            </div>

                            {/* Datos de atención */}
                            <div style={{ background: 'rgba(20,184,166,0.07)', borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: '16px', fontSize: '12px', fontWeight: 800, color: '#0F766E', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                                <Weight size={14} />
                                Datos de atención
                            </div>
                            <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Peso (kg)</label>
                                    <input type="number" step="0.01" min="0" className="form-input" placeholder="Ej: 72.5" value={atencionForm.peso} onChange={handleChange('peso')} disabled={!canEdit} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Talla (cm)</label>
                                    <input type="number" step="0.1" min="0" className="form-input" placeholder="Ej: 168.0" value={atencionForm.talla} onChange={handleChange('talla')} disabled={!canEdit} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Presión arterial</label>
                                    <input type="text" className="form-input" placeholder="Ej: 120/80" value={atencionForm.presion_arterial} onChange={handleChange('presion_arterial')} disabled={!canEdit} />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Circunferencia de cintura (cm)</label>
                                    <input type="number" step="0.1" min="0" className="form-input" placeholder="Ej: 88.5" value={atencionForm.circunferencia_cintura} onChange={handleChange('circunferencia_cintura')} disabled={!canEdit} />
                                </div>
                            </div>

                            {/* Calculadora */}
                            <div style={{ border: '1px solid rgba(109,40,217,0.18)', borderRadius: 'var(--radius-md)', marginBottom: '14px', overflow: 'hidden' }}>
                                <button type="button" onClick={() => setPanelCalcOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'rgba(109,40,217,0.05)', border: 'none', cursor: 'pointer', gap: '10px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, color: 'var(--morado-primario)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                                        <Calculator size={14} />Calculadora antropométrica
                                    </span>
                                    <ChevronDown size={16} color="var(--morado-primario)" style={{ transition: 'transform 0.2s', transform: panelCalcOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                </button>
                                {panelCalcOpen && (
                                    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', background: 'var(--bg-card)' }}>
                                        <Calculator size={32} color="var(--morado-primario)" style={{ opacity: 0.25 }} />
                                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                                            <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-secondary)' }}>Próximamente</strong>
                                            Cálculos de IMC, GET, peso ideal, % grasa corporal y más.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Alimentos */}
                            <div style={{ border: '1px solid rgba(34,197,94,0.20)', borderRadius: 'var(--radius-md)', marginBottom: '22px', overflow: 'hidden' }}>
                                <button type="button" onClick={() => setPanelAlimOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'rgba(34,197,94,0.05)', border: 'none', cursor: 'pointer', gap: '10px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, color: '#15803D', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                                        <Apple size={14} />Consulta de valores nutricionales
                                    </span>
                                    <ChevronDown size={16} color="#15803D" style={{ transition: 'transform 0.2s', transform: panelAlimOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                                </button>
                                {panelAlimOpen && (
                                    <PanelMinuta
                                        value={minutaState}
                                        onChange={setMinutaState}
                                        objetivoCalorico={objetivoCalorico}
                                        token={token}
                                        disabled={!canEdit}
                                    />
                                )}
                            </div>

                            {/* Conclusiones */}
                            <div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: '16px', fontSize: '12px', fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
                                <ClipboardPlus size={14} />Conclusiones de la cita
                            </div>
                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label className="form-label">Recomendaciones</label>
                                <textarea className="form-input" rows="3" placeholder="Recomendaciones generales para el paciente..." value={atencionForm.recomendaciones} onChange={handleChange('recomendaciones')} disabled={!canEdit} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '14px' }}>
                                <label className="form-label">Indicaciones</label>
                                <textarea className="form-input" rows="3" placeholder="Plan alimentario, indicaciones clínicas, próxima consulta..." value={atencionForm.indicaciones} onChange={handleChange('indicaciones')} disabled={!canEdit} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Derivaciones</label>
                                <textarea className="form-input" rows="2" placeholder="Derivaciones a otros especialistas..." value={atencionForm.derivaciones} onChange={handleChange('derivaciones')} disabled={!canEdit} />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={atencionLoading}>
                                {canEdit ? 'Cancelar' : 'Cerrar'}
                            </button>
                            {canEdit && (
                                <button type="submit" className="btn btn-primary" disabled={atencionLoading}>
                                    <ClipboardPlus size={16} />
                                    {atencionLoading ? 'Guardando...' : ficha ? 'Actualizar ficha' : 'Guardar atención'}
                                </button>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

// Sub-componente: Modal Historial de Atenciones del Paciente
const ModalHistorialAtenciones = ({ paciente, token, onClose }) => {
    const [citas, setCitas]           = useState([]);
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [selectedCita, setSelectedCita] = useState(null);

    const nombreCompleto = getFullName(paciente.usuario) || 'Paciente';

    useEffect(() => {
        setLoading(true);
        setError('');
        fetch(apiUrl(`/citas?id_paciente=${paciente.id}`), {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (!data.success) throw new Error(data.message || 'Error al obtener atenciones');
                setCitas(data.data || []);
            })
            .catch(err => setError(err.message || 'Error de conexión'))
            .finally(() => setLoading(false));
    }, [paciente, token]);

    if (selectedCita) {
        return (
            <ModalAtencion
                cita={selectedCita}
                token={token}
                onClose={() => setSelectedCita(null)}
            />
        );
    }

    const getCitaStyle = (estado) => EVENT_STYLES[estado] || EVENT_STYLES.default;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: '700px' }}>
                {/* Header */}
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ClipboardList size={20} color="var(--morado-primario)" />
                            Atenciones
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Todas las citas registradas para&nbsp;
                            <strong style={{ color: 'var(--text-primary)' }}>{nombreCompleto}</strong>
                        </p>
                    </div>
                    <button className="btn-close" onClick={onClose} aria-label="Cerrar">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="modal-body" style={{ padding: '24px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                            <Clock3 size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                            <p style={{ fontWeight: 600 }}>Cargando atenciones...</p>
                        </div>
                    ) : error ? (
                        <div className="alert alert-danger">
                            <AlertCircle size={18} /><span>{error}</span>
                        </div>
                    ) : citas.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '48px 24px',
                            border: '1px dashed var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-muted)',
                        }}>
                            <CalendarDays size={40} style={{ marginBottom: '12px', opacity: 0.35 }} />
                            <p style={{ fontWeight: 700, marginBottom: '4px' }}>Sin atenciones registradas</p>
                            <p style={{ fontSize: '13px' }}>Este paciente aún no tiene citas en el sistema.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* Contador */}
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                marginBottom: '4px',
                            }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    {citas.length} atención{citas.length !== 1 ? 'es' : ''} registrada{citas.length !== 1 ? 's' : ''}
                                </span>
                                {/* Resumen de estados */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {Object.entries(
                                        citas.reduce((acc, c) => {
                                            acc[c.estado] = (acc[c.estado] || 0) + 1;
                                            return acc;
                                        }, {})
                                    ).map(([estado, count]) => {
                                        const s = getCitaStyle(estado);
                                        return (
                                            <span key={estado} style={{
                                                background: s.background, color: s.text,
                                                padding: '2px 10px', borderRadius: '999px',
                                                fontSize: '11px', fontWeight: 700,
                                            }}>
                                                {count} {s.label}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Lista de citas */}
                            {citas.map(cita => {
                                const s = getCitaStyle(cita.estado);
                                const StatusIcon = s.icon;
                                const nutriNombre = getFullName(cita.nutricionista) || 'Nutricionista';
                                const servNombre  = cita.servicio?.nombre || cita.origen || 'Consulta';
                                const canVer      = cita.estado !== 'pendiente' ? (
                                    cita.estado === 'completada'
                                        ? true   // siempre puede verse si completada
                                        : true
                                ) : true;

                                return (
                                    <div
                                        key={cita.id_cita}
                                        style={{
                                            borderRadius: '14px',
                                            border: '1px solid rgba(0,0,0,0.05)',
                                            background: s.background,
                                            borderLeft: `5px solid ${s.accent}`,
                                            padding: '14px 16px',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '14px',
                                            transition: 'box-shadow 0.15s',
                                        }}
                                    >
                                        {/* Icono de estado */}
                                        <div style={{
                                            width: '38px', height: '38px', borderRadius: '10px',
                                            background: `${s.accent}22`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <StatusIcon size={18} color={s.accent} />
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                                                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                                                    {servNombre}
                                                </span>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                    fontSize: '11px', fontWeight: 700, color: s.text,
                                                    background: 'rgba(255,255,255,0.6)',
                                                    borderRadius: '999px', padding: '4px 10px',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    <StatusIcon size={12} />
                                                    {s.label}
                                                </span>
                                            </div>
                                            <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    <CalendarDays size={13} style={{ color: s.accent }} />
                                                    {cita.fecha}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    <Clock3 size={13} style={{ color: s.accent }} />
                                                    {cita.hora_inicio?.substring(0, 5)} – {cita.hora_fin?.substring(0, 5)}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                    <UserRound size={13} style={{ color: s.accent }} />
                                                    {nutriNombre}
                                                </div>
                                                {cita.observacion && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', gridColumn: '1 / -1' }}>
                                                        <MapPin size={13} style={{ color: s.accent }} />
                                                        {cita.observacion}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Botón Ver atención */}
                                        {cita.estado !== 'cancelada' && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCita(cita)}
                                                style={{
                                                    flexShrink: 0,
                                                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                                                    fontSize: '12px', fontWeight: 600,
                                                    color: cita.estado === 'completada' ? '#0F766E' : '#6D28D9',
                                                    background: cita.estado === 'completada' ? 'rgba(20,184,166,0.10)' : 'rgba(109,40,217,0.08)',
                                                    border: cita.estado === 'completada' ? '1px solid rgba(20,184,166,0.25)' : '1px solid rgba(109,40,217,0.20)',
                                                    borderRadius: '8px', padding: '6px 12px',
                                                    cursor: 'pointer', transition: 'all 0.15s',
                                                    whiteSpace: 'nowrap',
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                            >
                                                <ClipboardPlus size={13} />
                                                {cita.estado === 'completada' ? 'Ver atención' : 'Iniciar atención'}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

// Componente principal: PacientesManager
const PacientesManager = () => {
    const { token, hasPermission } = useAuth();
    const navigate = useNavigate();
    const [pacientes, setPacientes]               = useState([]);
    const [pacientesConCitas, setPacientesConCitas] = useState(new Set());
    const [loading, setLoading]                   = useState(true);
    const [error, setError]                       = useState('');
    const [successMessage, setSuccessMessage]     = useState('');
    const [searchTerm, setSearchTerm]             = useState('');

    const [isModalOpen, setIsModalOpen]         = useState(false);
    const [editingPaciente, setEditingPaciente] = useState(null);
    const [formData, setFormData]               = useState(EMPTY_FORM);
    const [formError, setFormError]             = useState('');
    const [formLoading, setFormLoading]         = useState(false);

    // Estado para el historial de atenciones
    const [historialPaciente, setHistorialPaciente] = useState(null);
    // Tooltip del botón eliminar deshabilitado
    const [hoveredDeleteId, setHoveredDeleteId] = useState(null);
    // Menú de 3 puntos
    const [openMenu, setOpenMenu] = useState(null);
    const menuRef = useRef(null);

    const authHeaders = { Authorization: `Bearer ${token}` };

    const showSuccess = (msg) => {
        setSuccessMessage(msg);
        setTimeout(() => setSuccessMessage(''), 3500);
    };

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            // Carga pacientes y todas las citas en paralelo
            const [resPac, resCitas] = await Promise.all([
                fetch(apiUrl('/pacientes'), { headers: authHeaders }),
                fetch(apiUrl('/citas'),     { headers: authHeaders }),
            ]);

            const dataPac   = await resPac.json();
            const dataCitas = await resCitas.json();

            if (!resPac.ok) throw new Error(dataPac.message || 'Error al obtener pacientes');

            setPacientes(dataPac.data || []);

            // Construir Set con los IDs de pacientes que tienen al menos una cita
            if (resCitas.ok && dataCitas.data) {
                const ids = new Set(
                    dataCitas.data
                        .map(c => c.paciente?.id)
                        .filter(Boolean)
                );
                setPacientesConCitas(ids);
            }
        } catch (err) {
            setError(err.message || 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    // Cerrar menú al hacer clic fuera o al hacer scroll
    useEffect(() => {
        const close = () => setOpenMenu(null);
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) close();
        };
        if (openMenu !== null) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', close, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', close, true);
        };
    }, [openMenu]);

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
            telefono:         paciente.telefono         || '',
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
                        Registra y administra los pacientes del sistema NutriOne ERP.
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
                        <table style={{ width: '100%', minWidth: '860px', borderCollapse: 'collapse', fontSize: '14px' }}>
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
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap' }}>
                                                {/* Botón Evolución Clínica */}
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{
                                                        padding: '6px 14px',
                                                        fontSize: '12px',
                                                        color: 'var(--morado-primario)',
                                                        borderColor: 'rgba(109,40,217,0.25)',
                                                        background: 'rgba(109,40,217,0.06)',
                                                        fontWeight: 700,
                                                        gap: '6px',
                                                    }}
                                                    onClick={() => navigate(`/pacientes/${paciente.id}/evolucion`)}
                                                    title="Ver evolución clínica"
                                                >
                                                    <TrendingUp size={13} />
                                                    Evolución
                                                </button>

                                                {/* Botón Ver atenciones*/}
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{
                                                        padding: '6px 14px',
                                                        fontSize: '12px',
                                                        color: '#0F766E',
                                                        borderColor: 'rgba(20,184,166,0.25)',
                                                        background: 'rgba(20,184,166,0.06)',
                                                        fontWeight: 700,
                                                        gap: '6px',
                                                    }}
                                                    onClick={() => setHistorialPaciente(paciente)}
                                                    title="Ver historial de atenciones"
                                                >
                                                    <ClipboardList size={13} />
                                                    Atenciones
                                                </button>

                                                {/* Menú 3 puntos */}
                                                {(hasPermission('pacientes:editar') || hasPermission('pacientes:eliminar')) && (
                                                    <div ref={openMenu?.id === paciente.id ? menuRef : null}>
                                                        <button
                                                            className="btn btn-secondary"
                                                            style={{ padding: '6px 8px', fontSize: '12px' }}
                                                            title="Más opciones"
                                                            onClick={(e) => {
                                                                if (openMenu?.id === paciente.id) {
                                                                    setOpenMenu(null);
                                                                } else {
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    setOpenMenu({
                                                                        id: paciente.id,
                                                                        right: window.innerWidth - rect.right,
                                                                        top: rect.bottom + 6,
                                                                    });
                                                                }
                                                            }}
                                                        >
                                                            <MoreVertical size={15} />
                                                        </button>
                                                    </div>
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

            {/* Dropdown menú 3 puntos — position:fixed para escapar overflow:hidden de la tabla */}
            {openMenu && (() => {
                const tieneCitas = pacientesConCitas.has(openMenu.id);
                const pacienteMenu = pacientes.find(p => p.id === openMenu.id);
                if (!pacienteMenu) return null;
                return (
                    <div
                        ref={menuRef}
                        style={{
                            position: 'fixed',
                            right: openMenu.right,
                            top: openMenu.top,
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: 'var(--shadow-lg)',
                            zIndex: 9998,
                            minWidth: '160px',
                            overflow: 'hidden',
                            animation: 'slideIn 0.15s ease-out',
                        }}
                    >
                        {hasPermission('pacientes:editar') && (
                            <button
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    width: '100%', padding: '10px 14px',
                                    background: 'none', border: 'none',
                                    cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                    color: 'var(--text-secondary)',
                                    transition: 'background var(--transition-fast)',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                onClick={() => { openEditModal(pacienteMenu); setOpenMenu(null); }}
                            >
                                <Edit2 size={13} /> Editar
                            </button>
                        )}
                        {hasPermission('pacientes:eliminar') && (
                            <div
                                onMouseEnter={(e) => {
                                    if (!tieneCitas) return;
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setHoveredDeleteId({
                                        id: openMenu.id,
                                        x: rect.left + rect.width / 2,
                                        y: rect.top - 10,
                                    });
                                }}
                                onMouseLeave={() => setHoveredDeleteId(null)}
                            >
                                <button
                                    disabled={tieneCitas}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        width: '100%', padding: '10px 14px',
                                        background: 'none', border: 'none',
                                        cursor: tieneCitas ? 'not-allowed' : 'pointer',
                                        fontSize: '13px', fontWeight: 600,
                                        color: tieneCitas ? '#9CA3AF' : '#f87171',
                                        opacity: tieneCitas ? 0.6 : 1,
                                        transition: 'background var(--transition-fast)',
                                    }}
                                    onMouseEnter={e => { if (!tieneCitas) e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; }}
                                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                    onClick={() => { if (!tieneCitas) { handleDelete(pacienteMenu); setOpenMenu(null); } }}
                                >
                                    <Trash2 size={13} /> Eliminar
                                </button>
                            </div>
                        )}
                    </div>
                );
            })()}

            {/* Tooltip de eliminar — renderizado fuera de la tabla para evitar clipping por overflow */}
            {hoveredDeleteId && (
                <div style={{
                    position: 'fixed',
                    left: hoveredDeleteId.x,
                    top: hoveredDeleteId.y,
                    transform: 'translate(-50%, -100%)',
                    background: '#1F2937',
                    color: '#F9FAFB',
                    fontSize: '12px',
                    fontWeight: 500,
                    lineHeight: 1.5,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    whiteSpace: 'normal',
                    maxWidth: '220px',
                    textAlign: 'center',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
                    zIndex: 9999,
                    pointerEvents: 'none',
                }}>
                    No es posible eliminar: el paciente tiene citas o atenciones registradas.
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 0, height: 0,
                        borderLeft: '6px solid transparent',
                        borderRight: '6px solid transparent',
                        borderTop: '6px solid #1F2937',
                    }} />
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

                                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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

                                <div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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

                                <div className="form-group">
                                    <label className="form-label" htmlFor="pac-telefono">
                                        TELÉFONO <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '11px' }}>(para verificación de evolución online)</span>
                                    </label>
                                    <input
                                        id="pac-telefono"
                                        type="tel"
                                        className="form-input"
                                        placeholder="Ej: +56912345678"
                                        value={formData.telefono}
                                        onChange={handleChange('telefono')}
                                    />
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

            {/* Modal Historial de Atenciones */}
            {historialPaciente && (
                <ModalHistorialAtenciones
                    paciente={historialPaciente}
                    token={token}
                    onClose={() => setHistorialPaciente(null)}
                />
            )}
        </div>
    );
};

export default PacientesManager;
