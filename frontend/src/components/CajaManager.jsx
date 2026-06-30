import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Wallet, ReceiptText, TrendingUp, ChevronDown, ChevronUp,
    CircleDollarSign, AlertCircle, CheckCircle2, X, Plus,
    Clock, Ban, CreditCard, Banknote, ArrowLeftRight, BookCheck,
    Printer, Loader
} from 'lucide-react';
import { apiUrl } from '../helpers/api';
import { generarReciboHTML, fetchCobroConCita } from '../helpers/reportes';

/* ─── utilidades ─────────────────────────────────────────────────── */
const formatCLP = (v) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(v) || 0);

const formatFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatFechaHora = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const METODOS = [
    { value: 'efectivo',      label: 'Efectivo',      icon: Banknote },
    { value: 'tarjeta',       label: 'Tarjeta',        icon: CreditCard },
    { value: 'transferencia', label: 'Transferencia',  icon: ArrowLeftRight },
    { value: 'cheque',        label: 'Cheque',         icon: BookCheck },
];

const ESTADO_BADGE = {
    pendiente:      { label: 'Pendiente',      color: '#F59E0B', bg: '#FEF3C7' },
    pagado_parcial: { label: 'Abono parcial',  color: '#3B82F6', bg: '#DBEAFE' },
    pagado:         { label: 'Pagado',         color: '#10B981', bg: '#D1FAE5' },
    anulado:        { label: 'Anulado',        color: '#6B7280', bg: '#F3F4F6' },
};

const EstadoBadge = ({ estado }) => {
    const cfg = ESTADO_BADGE[estado] || ESTADO_BADGE.pendiente;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
            color: cfg.color, backgroundColor: cfg.bg,
        }}>
            {cfg.label}
        </span>
    );
};

const MetodoBadge = ({ metodo }) => {
    const cfg = METODOS.find(m => m.value === metodo) || { label: metodo, icon: CircleDollarSign };
    const Icon = cfg.icon;
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <Icon size={14} /> {cfg.label}
        </span>
    );
};

/* ─── Modal: Registrar pago ─────────────────────────────────────── */
const ModalPago = ({ cobro, token, onClose, onSuccess }) => {
    const [monto, setMonto]         = useState('');
    const [metodo, setMetodo]       = useState('efectivo');
    const [notas, setNotas]         = useState('');
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState('');

    const saldo = cobro.saldo_pendiente;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const montoNum = parseFloat(monto);
        if (!monto || isNaN(montoNum) || montoNum <= 0) return setError('Ingresa un monto válido mayor a cero.');
        if (montoNum > saldo) return setError(`El monto no puede superar el saldo pendiente (${formatCLP(saldo)}).`);

        setLoading(true);
        try {
            const res = await fetch(apiUrl(`/caja/cobros/${cobro.id_cobro}/pagos`), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ monto: montoNum, metodo_pago: metodo, notas: notas || undefined }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al registrar el pago');
            onSuccess(data.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
            <div style={{
                background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '32px',
                width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-lg)',
                animation: 'fadeInUp 0.2s ease',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CircleDollarSign size={20} color="var(--morado-primario)" /> Registrar Pago
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ background: 'var(--lavanda-suave)', borderRadius: 'var(--radius-sm)', padding: '12px 16px', marginBottom: '20px', fontSize: '14px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Saldo pendiente: </span>
                    <strong style={{ color: 'var(--morado-primario)', fontSize: '16px' }}>{formatCLP(saldo)}</strong>
                </div>

                {error && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', background: '#FEF2F2', borderRadius: 'var(--radius-sm)', padding: '10px 14px', marginBottom: '16px', fontSize: '13px' }}>
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Monto a pagar</label>
                        <input
                            type="number" min="1" step="1" value={monto}
                            onChange={e => setMonto(e.target.value)}
                            placeholder={`Máx. ${formatCLP(saldo)}`}
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Método de pago</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {METODOS.map(m => {
                                const Icon = m.icon;
                                const sel = metodo === m.value;
                                return (
                                    <button type="button" key={m.value} onClick={() => setMetodo(m.value)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                            padding: '9px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600,
                                            border: sel ? '2px solid var(--morado-primario)' : '1.5px solid var(--border-color)',
                                            background: sel ? 'var(--lavanda-suave)' : 'transparent',
                                            color: sel ? 'var(--morado-primario)' : 'var(--text-secondary)',
                                            cursor: 'pointer', transition: 'all var(--transition-fast)',
                                        }}>
                                        <Icon size={15} /> {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Notas (opcional)</label>
                        <input
                            type="text" value={notas} onChange={e => setNotas(e.target.value)}
                            placeholder="Ej: pago con vuelto, referencia transferencia..."
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', fontSize: '14px', color: 'var(--text-primary)', outline: 'none' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                        <button type="button" onClick={onClose}
                            style={{ flex: 1, padding: '11px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading}
                            style={{ flex: 2, padding: '11px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                            {loading ? 'Registrando...' : 'Confirmar Pago'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/* ─── Fila de cobro expandible ──────────────────────────────────── */
const FilaCobro = ({ cobro: cobroInicial, token, hasPermission, onAnular }) => {
    const [cobro, setCobro]         = useState(cobroInicial);
    const [expanded, setExpanded]   = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [loadingRecibo, setLoadingRecibo] = useState(false);

    const handlePagoExitoso = (cobroActualizado) => {
        setCobro(prev => ({
            ...cobroActualizado,
            // preservar los campos enriquecidos que registrarPago no devuelve
            paciente:   prev.paciente,
            servicio:   prev.servicio,
            fecha_cita: prev.fecha_cita,
        }));
        setShowModal(false);
        setExpanded(true);
    };

    const handleImprimirRecibo = async (e) => {
        e.stopPropagation();
        setLoadingRecibo(true);
        try {
            const { cobro: cobroFull, cita } = await fetchCobroConCita(cobro.id_cobro, token);
            const html = generarReciboHTML(cobroFull, cita);
            const w = window.open('', '_blank', 'width=560,height=820');
            w.document.write(html); w.document.close();
        } catch (err) {
            alert(`Error al generar recibo: ${err.message}`);
        } finally { setLoadingRecibo(false); }
    };

    const porcentaje = cobro.monto_total > 0
        ? Math.min(100, (cobro.monto_pagado / cobro.monto_total) * 100)
        : 0;

    return (
        <>
            {showModal && (
                <ModalPago
                    cobro={cobro} token={token}
                    onClose={() => setShowModal(false)}
                    onSuccess={handlePagoExitoso}
                />
            )}
            <div style={{
                background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)', overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)', transition: 'box-shadow var(--transition-fast)',
            }}>
                {/* Cabecera del cobro */}
                <div
                    onClick={() => setExpanded(p => !p)}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', cursor: 'pointer' }}
                >
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 700, fontSize: '14px' }}>
                                {cobro.servicio?.nombre || 'Servicio'}
                            </span>
                            <EstadoBadge estado={cobro.estado} />
                        </div>
                        <div style={{ display: 'flex', gap: '16px', marginTop: '5px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Cita: {formatFecha(cobro.fecha_cita)}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                Paciente: {cobro.paciente?.nombres} {cobro.paciente?.apellido_paterno}
                            </span>
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--morado-primario)' }}>
                            {formatCLP(cobro.monto_total)}
                        </div>
                        {cobro.saldo_pendiente > 0 && (
                            <div style={{ fontSize: '12px', color: cobro.estado === 'anulado' ? 'var(--text-muted)' : 'var(--danger)' }}>
                                Saldo: {formatCLP(cobro.saldo_pendiente)}
                            </div>
                        )}
                    </div>

                    <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                </div>

                {/* Barra de progreso */}
                <div style={{ height: '3px', background: 'var(--gris-100)' }}>
                    <div style={{
                        height: '100%', width: `${porcentaje}%`,
                        background: cobro.estado === 'pagado' ? 'var(--exito)' : cobro.estado === 'anulado' ? 'var(--gris-300)' : 'var(--morado-primario)',
                        transition: 'width 0.4s ease',
                    }} />
                </div>

                {/* Detalle expandido */}
                {expanded && (
                    <div style={{ padding: '16px 20px', borderTop: '1px solid var(--gris-100)', background: 'var(--gris-50)' }}>
                        {cobro.pagos?.length > 0 ? (
                            <div style={{ marginBottom: '14px' }}>
                                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Pagos registrados</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {cobro.pagos.map(p => (
                                        <div key={p.id_transaccion}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', padding: '9px 14px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <MetodoBadge metodo={p.metodo_pago} />
                                                {p.notas && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{p.notas}</span>}
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, fontSize: '14px' }}>{formatCLP(p.monto)}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatFechaHora(p.fecha_pago)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>Sin pagos registrados aún.</p>
                        )}

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {hasPermission('caja:cobrar') && cobro.estado !== 'pagado' && cobro.estado !== 'anulado' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                                    <Plus size={14} /> Registrar pago
                                </button>
                            )}
                            {(cobro.estado === 'pagado' || cobro.estado === 'pagado_parcial') && (
                                <button
                                    onClick={handleImprimirRecibo}
                                    disabled={loadingRecibo}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1.5px solid #F59E0B', background: 'transparent', color: '#D97706', fontWeight: 600, fontSize: '13px', cursor: loadingRecibo ? 'wait' : 'pointer', opacity: loadingRecibo ? 0.6 : 1 }}>
                                    {loadingRecibo ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Printer size={14} />}
                                    Imprimir recibo
                                </button>
                            )}
                            {hasPermission('caja:anular') && cobro.estado !== 'pagado' && cobro.estado !== 'anulado' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onAnular(cobro.id_cobro); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--gris-300)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                                    <Ban size={14} /> Anular cobro
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

/* ─── Componente principal ──────────────────────────────────────── */
const CajaManager = () => {
    const { token, hasPermission } = useAuth();
    const headers = { Authorization: `Bearer ${token}` };

    const [tab, setTab] = useState('cobros');

    // Tab cobros
    const [cobros, setCobros]           = useState([]);
    const [loadingCobros, setLoadingCobros] = useState(true);
    const [errorCobros, setErrorCobros] = useState('');

    // Tab movimientos
    const [desde, setDesde]             = useState('');
    const [hasta, setHasta]             = useState('');
    const [movimientos, setMovimientos] = useState(null);
    const [loadingMov, setLoadingMov]   = useState(false);
    const [errorMov, setErrorMov]       = useState('');

    // Notificaciones
    const [toast, setToast] = useState(null);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Cargar todos los cobros del sistema
    const fetchCobros = useCallback(async () => {
        setLoadingCobros(true);
        setErrorCobros('');
        try {
            const res = await fetch(apiUrl('/caja/cobros'), { headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al obtener cobros');
            setCobros(data.data || []);
        } catch (err) {
            setErrorCobros(err.message);
        } finally {
            setLoadingCobros(false);
        }
    }, [token]);

    useEffect(() => { fetchCobros(); }, [fetchCobros]);

    const handleAnular = async (cobroId) => {
        if (!window.confirm('¿Estás seguro de anular este cobro?')) return;
        try {
            const res = await fetch(apiUrl(`/caja/cobros/${cobroId}/anular`), {
                method: 'PATCH', headers,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al anular');
            showToast('Cobro anulado exitosamente');
            fetchCobros();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    const fetchMovimientos = async (e) => {
        e.preventDefault();
        setLoadingMov(true);
        setErrorMov('');
        try {
            const params = new URLSearchParams();
            if (desde) params.append('desde', desde);
            if (hasta) params.append('hasta', hasta);
            const res = await fetch(apiUrl(`/caja/movimientos?${params}`), { headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al obtener movimientos');
            setMovimientos(data.data);
        } catch (err) {
            setErrorMov(err.message);
        } finally {
            setLoadingMov(false);
        }
    };

    /* ── render ── */
    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '8px 0' }}>

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: '24px', right: '24px', zIndex: 2000,
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '14px 20px', borderRadius: 'var(--radius-md)',
                    background: toast.type === 'error' ? '#FEF2F2' : '#ECFDF5',
                    color: toast.type === 'error' ? 'var(--danger)' : 'var(--exito)',
                    boxShadow: 'var(--shadow-lg)', fontWeight: 600, fontSize: '14px',
                    animation: 'fadeInUp 0.2s ease',
                }}>
                    {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    {toast.msg}
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: 'var(--gris-100)', padding: '4px', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
                {[
                    { id: 'cobros',      label: 'Cobros',       icon: ReceiptText },
                    { id: 'movimientos', label: 'Movimientos',   icon: TrendingUp },
                ].map(t => {
                    const Icon = t.icon;
                    const active = tab === t.id;
                    return (
                        <button key={t.id} onClick={() => setTab(t.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '7px',
                                padding: '8px 18px', borderRadius: 'var(--radius-sm)', border: 'none',
                                background: active ? 'var(--bg-card)' : 'transparent',
                                color: active ? 'var(--morado-primario)' : 'var(--text-muted)',
                                fontWeight: active ? 700 : 500, fontSize: '14px', cursor: 'pointer',
                                boxShadow: active ? 'var(--shadow-sm)' : 'none',
                                transition: 'all var(--transition-fast)',
                            }}>
                            <Icon size={16} /> {t.label}
                        </button>
                    );
                })}
            </div>

            {/* ── TAB: COBROS ── */}
            {tab === 'cobros' && (
                <div>
                    {loadingCobros && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                            <Clock size={20} style={{ marginRight: '8px', animation: 'spin 1s linear infinite' }} /> Cargando cobros...
                        </div>
                    )}

                    {errorCobros && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', background: '#FEF2F2', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
                            <AlertCircle size={18} /> {errorCobros}
                        </div>
                    )}

                    {!loadingCobros && !errorCobros && cobros.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)' }}>
                            <Wallet size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                            <p style={{ fontWeight: 600 }}>No hay cobros registrados aún.</p>
                            <p style={{ fontSize: '13px', marginTop: '6px' }}>Los cobros se generan automáticamente cuando se marca una cita como realizada.</p>
                        </div>
                    )}

                    {!loadingCobros && cobros.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {cobros.map(c => (
                                <FilaCobro
                                    key={c.id_cobro}
                                    cobro={c}
                                    token={token}
                                    hasPermission={hasPermission}
                                    onAnular={handleAnular}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── TAB: MOVIMIENTOS ── */}
            {tab === 'movimientos' && (
                <div>
                    {/* Filtro de fechas */}
                    <form onSubmit={fetchMovimientos}
                        style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '20px', border: '1px solid var(--border-color)' }}>
                        <div style={{ flex: 1, minWidth: '140px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Desde</label>
                            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', fontSize: '14px', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: '140px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Hasta</label>
                            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-color)', fontSize: '14px', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        <button type="submit" disabled={loadingMov}
                            style={{ padding: '9px 22px', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: loadingMov ? 'not-allowed' : 'pointer', opacity: loadingMov ? 0.7 : 1 }}>
                            {loadingMov ? 'Buscando...' : 'Consultar'}
                        </button>
                    </form>

                    {errorMov && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', background: '#FEF2F2', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: '16px' }}>
                            <AlertCircle size={18} /> {errorMov}
                        </div>
                    )}

                    {movimientos && (
                        <>
                            {/* Resumen */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '18px 20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total ingresos</p>
                                    <p style={{ fontSize: '22px', fontWeight: 800, color: 'var(--exito)' }}>{formatCLP(movimientos.total_ingresos)}</p>
                                </div>
                                {Object.entries(movimientos.subtotales_por_metodo).map(([metodo, total]) => (
                                    <div key={metodo} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', padding: '18px 20px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', textTransform: 'capitalize' }}>
                                            <MetodoBadge metodo={metodo} />
                                        </p>
                                        <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCLP(total)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Tabla de movimientos */}
                            {movimientos.movimientos.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                                    <TrendingUp size={40} style={{ opacity: 0.25, marginBottom: '10px' }} />
                                    <p>No hay movimientos en el período seleccionado.</p>
                                </div>
                            ) : (
                                <div style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                            <thead>
                                                <tr style={{ background: 'var(--gris-50)', borderBottom: '1px solid var(--border-color)' }}>
                                                    {['Fecha', 'Paciente', 'Servicio', 'Método', 'Monto'].map(h => (
                                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {movimientos.movimientos.map((m, i) => (
                                                    <tr key={m.id_transaccion} style={{ borderBottom: i < movimientos.movimientos.length - 1 ? '1px solid var(--gris-100)' : 'none' }}>
                                                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatFechaHora(m.fecha_pago)}</td>
                                                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                                                            {m.paciente ? `${m.paciente.nombres} ${m.paciente.apellido_paterno}` : '—'}
                                                        </td>
                                                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{m.servicio?.nombre || '—'}</td>
                                                        <td style={{ padding: '12px 16px' }}><MetodoBadge metodo={m.metodo_pago} /></td>
                                                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--exito)', whiteSpace: 'nowrap' }}>{formatCLP(m.monto)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default CajaManager;
