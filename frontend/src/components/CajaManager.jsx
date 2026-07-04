import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Wallet, ReceiptText, TrendingUp, ChevronDown, ChevronUp,
    CircleDollarSign, AlertCircle, CheckCircle2, X, Plus,
    Clock, Ban, CreditCard, Banknote, ArrowLeftRight, BookCheck,
    Printer, Loader, BarChart2, Calendar,
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
    { value: 'efectivo',      label: 'Efectivo',      icon: Banknote,       color: '#10B981' },
    { value: 'tarjeta',       label: 'Tarjeta',        icon: CreditCard,     color: '#6366F1' },
    { value: 'transferencia', label: 'Transferencia',  icon: ArrowLeftRight, color: '#3B82F6' },
    { value: 'cheque',        label: 'Cheque',         icon: BookCheck,      color: '#F59E0B' },
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

/* ─── Modal: Desglose de caja ────────────────────────────────────── */
const ModalDesgloseCaja = ({ resumen, onClose }) => {
    const total = resumen.total_en_caja;
    const entradas = METODOS.filter(m => resumen.por_metodo[m.value] != null && resumen.por_metodo[m.value] > 0);
    // También incluir métodos que no están en METODOS pero que vienen en la data
    const metodosExtra = Object.keys(resumen.por_metodo).filter(k => !METODOS.find(m => m.value === k));

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(4px)',
        }}>
            <div style={{
                background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', padding: '32px',
                width: '100%', maxWidth: '460px', boxShadow: 'var(--shadow-lg)',
                animation: 'fadeInUp 0.2s ease',
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div>
                        <h3 style={{ fontWeight: 700, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <Wallet size={20} color="var(--morado-primario)" /> Desglose de Caja
                        </h3>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            background: 'var(--lavanda-suave)', color: 'var(--morado-primario)',
                            borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: 700,
                        }}>
                            <Calendar size={11} /> {resumen.periodo}
                        </span>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Total */}
                <div style={{
                    background: 'var(--accent-gradient)', borderRadius: 'var(--radius-md)',
                    padding: '20px 24px', marginBottom: '20px', textAlign: 'center',
                }}>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px', fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        Total del mes
                    </p>
                    <p style={{ color: '#fff', fontSize: '32px', fontWeight: 900, letterSpacing: '-0.02em' }}>
                        {formatCLP(total)}
                    </p>
                </div>

                {/* Desglose por método */}
                {total === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', padding: '16px 0' }}>
                        No hay ingresos registrados este mes.
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {entradas.map(m => {
                            const monto = resumen.por_metodo[m.value] || 0;
                            const pct = total > 0 ? (monto / total) * 100 : 0;
                            const Icon = m.icon;
                            return (
                                <div key={m.value} style={{
                                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                                    padding: '14px 16px', background: 'var(--gris-50)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            <Icon size={16} color={m.color} /> {m.label}
                                        </span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '15px', fontWeight: 700, color: m.color }}>{formatCLP(monto)}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>{pct.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--gris-200)', borderRadius: '99px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', width: `${pct}%`,
                                            background: m.color,
                                            borderRadius: '99px',
                                            transition: 'width 0.6s ease',
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                        {metodosExtra.map(k => {
                            const monto = resumen.por_metodo[k] || 0;
                            const pct = total > 0 ? (monto / total) * 100 : 0;
                            return (
                                <div key={k} style={{
                                    borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)',
                                    padding: '14px 16px', background: 'var(--gris-50)',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                            <CircleDollarSign size={16} color="var(--morado-primario)" /> {k}
                                        </span>
                                        <div style={{ textAlign: 'right' }}>
                                            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--morado-primario)' }}>{formatCLP(monto)}</span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>{pct.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div style={{ height: '6px', background: 'var(--gris-200)', borderRadius: '99px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', width: `${pct}%`,
                                            background: 'var(--morado-primario)',
                                            borderRadius: '99px',
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <button onClick={onClose} style={{
                    marginTop: '20px', width: '100%', padding: '11px', borderRadius: 'var(--radius-sm)',
                    border: '1.5px solid var(--border-color)', background: 'transparent',
                    color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '14px',
                }}>
                    Cerrar
                </button>
            </div>
        </div>
    );
};

/* ─── Tarjeta de Saldo del Mes ───────────────────────────────────── */
const TarjetaSaldoCaja = ({ token, refreshKey }) => {
    const [resumen, setResumen] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(apiUrl('/caja/resumen'), { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (d.success) setResumen(d.data); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [token, refreshKey]);

    if (loading) {
        return (
            <div style={{
                background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)', padding: '24px 28px',
                marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px',
                color: 'var(--text-muted)', boxShadow: 'var(--shadow-sm)',
            }}>
                <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                <span style={{ fontSize: '14px' }}>Calculando saldo del mes...</span>
            </div>
        );
    }

    if (!resumen) return null;

    const total = resumen.total_en_caja;
    const tieneData = total > 0;
    const metodosConData = METODOS.filter(m => resumen.por_metodo[m.value] > 0);

    return (
        <>
            {showModal && <ModalDesgloseCaja resumen={resumen} onClose={() => setShowModal(false)} />}
            <div style={{
                background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)', padding: '24px 28px',
                marginBottom: '24px', boxShadow: 'var(--shadow-sm)',
                position: 'relative', overflow: 'hidden',
            }}>
                {/* Decorador de fondo */}
                <div style={{
                    position: 'absolute', top: '-20px', right: '-20px',
                    width: '120px', height: '120px', borderRadius: '50%',
                    background: 'var(--lavanda-suave)', opacity: 0.5, pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Lado izquierdo: total */}
                    <div style={{ flex: 1, minWidth: '180px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                                background: 'var(--accent-gradient)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                                <Wallet size={18} color="#fff" />
                            </div>
                            <div>
                                <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Saldo en caja
                                </p>
                                {/* Pastilla de período */}
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                    background: 'var(--lavanda-suave)', color: 'var(--morado-primario)',
                                    borderRadius: '20px', padding: '1px 8px', fontSize: '11px', fontWeight: 700,
                                }}>
                                    <Calendar size={10} /> {resumen.periodo}
                                </span>
                            </div>
                        </div>
                        <p style={{ fontSize: '30px', fontWeight: 900, color: 'var(--morado-primario)', letterSpacing: '-0.02em', marginTop: '6px' }}>
                            {formatCLP(total)}
                        </p>
                    </div>

                    {/* Lado derecho: mini barras por método */}
                    {tieneData && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '200px', flex: 2 }}>
                            {metodosConData.map(m => {
                                const monto = resumen.por_metodo[m.value] || 0;
                                const pct = total > 0 ? (monto / total) * 100 : 0;
                                const Icon = m.icon;
                                return (
                                    <div key={m.value}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                                                <Icon size={12} color={m.color} /> {m.label}
                                            </span>
                                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCLP(monto)}</span>
                                        </div>
                                        <div style={{ height: '5px', background: 'var(--gris-100)', borderRadius: '99px', overflow: 'hidden' }}>
                                            <div style={{
                                                height: '100%', width: `${pct}%`,
                                                background: m.color, borderRadius: '99px',
                                                transition: 'width 0.6s ease',
                                            }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Botón detalles */}
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                        <button
                            onClick={() => setShowModal(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 16px', borderRadius: 'var(--radius-sm)',
                                border: '1.5px solid var(--morado-primario)', background: 'transparent',
                                color: 'var(--morado-primario)', fontWeight: 600, fontSize: '13px',
                                cursor: 'pointer', transition: 'all var(--transition-fast)',
                                whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--lavanda-suave)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                        >
                            <BarChart2 size={14} /> Ver detalles
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

/* ─── Gráfico SVG de ingresos ────────────────────────────────────── */
const calcularGranularidad = (desde, hasta) => {
    if (!desde || !hasta) return 'dia';
    const d1 = new Date(desde);
    const d2 = new Date(hasta);
    const dias = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
    if (dias <= 31)  return 'dia';
    if (dias <= 90)  return 'semana';
    return 'mes';
};

// Extrae la fecha LOCAL (sin desfase UTC) como "YYYY-MM-DD"
const toLocalDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Extrae el mes LOCAL como "YYYY-MM"
const toLocalMonthStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
};

const agruparPorGranularidad = (movimientos, granularidad) => {
    const map = {};

    for (const m of movimientos) {
        // new Date() interpreta la fecha en hora local del navegador
        const fecha = new Date(m.fecha_pago);
        let clave;
        if (granularidad === 'dia') {
            // Usar fecha LOCAL para evitar el desfase UTC
            clave = toLocalDateStr(fecha);
        } else if (granularidad === 'semana') {
            // Calcular el lunes de la semana en hora LOCAL
            const d = new Date(fecha);
            const day = d.getDay(); // 0=dom, 1=lun...
            const diff = (day === 0 ? -6 : 1 - day);
            d.setDate(d.getDate() + diff);
            clave = toLocalDateStr(d);
        } else {
            // Mes en hora LOCAL
            clave = toLocalMonthStr(fecha);
        }
        map[clave] = (map[clave] || 0) + Number(m.monto);
    }

    return Object.entries(map)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([clave, total]) => ({ clave, total }));
};

const formatEtiqueta = (clave, granularidad) => {
    if (granularidad === 'mes') {
        const [y, m] = clave.split('-');
        return `${m}/${y.slice(2)}`;
    }
    const [, m, d] = clave.split('-');
    if (granularidad === 'semana') return `↗${d}/${m}`; // prefijo indica inicio de semana
    return `${d}/${m}`;
};

// Etiqueta larga para el tooltip (más descriptiva)
const formatEtiquetaTooltip = (clave, granularidad) => {
    if (granularidad === 'mes') {
        const [y, m] = clave.split('-');
        const nombre = new Date(`${y}-${m}-01T12:00:00`).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
        return nombre.charAt(0).toUpperCase() + nombre.slice(1);
    }
    const [y, m, d] = clave.split('-');
    if (granularidad === 'semana') {
        // Mostrar rango de la semana: lunes a domingo
        const lunes = new Date(`${y}-${m}-${d}T12:00:00`);
        const domingo = new Date(lunes);
        domingo.setDate(domingo.getDate() + 6);
        return `Sem. ${toLocalDateStr(lunes).slice(8)}/${m} – ${toLocalDateStr(domingo).slice(8)}/${String(domingo.getMonth() + 1).padStart(2, '0')}`;
    }
    return `${d}/${m}/${y}`;
};

const GraficoIngresos = ({ movimientos, desde, hasta }) => {
    const [tooltip, setTooltip] = useState(null);
    const svgRef = useRef(null);

    const granularidad = calcularGranularidad(desde, hasta);
    const datos = agruparPorGranularidad(movimientos, granularidad);

    const labelGranularidad = { dia: 'por día', semana: 'por semana', mes: 'por mes' }[granularidad];

    if (datos.length === 0) return null;

    // Dimensiones del gráfico
    const W = 840, H = 240;
    const padL = 72, padR = 24, padT = 20, padB = 44;
    const chartW = W - padL - padR;
    const chartH = H - padT - padB;

    const maxVal = Math.max(...datos.map(d => d.total), 1);
    const n = datos.length;

    // Coordenadas de cada punto
    const pts = datos.map((d, i) => ({
        x: padL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW),
        y: padT + chartH - (d.total / maxVal) * chartH,
        ...d,
    }));

    // Path de la línea
    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    // Path del área (relleno)
    const areaPath = [
        `M ${pts[0].x.toFixed(1)} ${(padT + chartH).toFixed(1)}`,
        ...pts.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
        `L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + chartH).toFixed(1)}`,
        'Z',
    ].join(' ');

    // Etiquetas del eje Y (4 niveles)
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
        val: maxVal * f,
        y: padT + chartH - f * chartH,
    }));

    // Cuántas etiquetas X mostrar (max ~8)
    const xStep = Math.max(1, Math.ceil(n / 8));

    const gradId = 'ingresosGrad';
    const areaGradId = 'ingresosAreaGrad';

    return (
        <div style={{
            background: 'var(--bg-card)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)', padding: '20px 24px 16px',
            marginBottom: '20px', boxShadow: 'var(--shadow-sm)',
        }}>
            {/* Encabezado */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <TrendingUp size={16} color="var(--morado-primario)" />
                        Ingresos {labelGranularidad}
                    </p>
                    {desde && hasta && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {formatFecha(desde + 'T00:00:00')} → {formatFecha(hasta + 'T00:00:00')}
                        </p>
                    )}
                </div>
                <span style={{
                    background: 'var(--lavanda-suave)', color: 'var(--morado-primario)',
                    borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: 700,
                }}>
                    {datos.length} {labelGranularidad === 'por día' ? 'días' : labelGranularidad === 'por semana' ? 'semanas' : 'meses'}
                </span>
            </div>

            {/* SVG */}
            <div style={{ position: 'relative', overflowX: 'auto' }}>
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${W} ${H}`}
                    style={{ width: '100%', height: 'auto', display: 'block', minWidth: '320px' }}
                    onMouseLeave={() => setTooltip(null)}
                >
                    <defs>
                        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#7C3AED" />
                            <stop offset="100%" stopColor="#A78BFA" />
                        </linearGradient>
                        <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.01" />
                        </linearGradient>
                    </defs>

                    {/* Líneas guía horizontales */}
                    {yTicks.map((t, i) => (
                        <g key={i}>
                            <line
                                x1={padL} y1={t.y.toFixed(1)} x2={W - padR} y2={t.y.toFixed(1)}
                                stroke="#E5E7EB" strokeWidth="1" strokeDasharray={i > 0 ? '4 4' : '0'}
                            />
                            <text
                                x={padL - 6} y={t.y + 4} textAnchor="end"
                                fontSize="10" fill="#9CA3AF" fontFamily="system-ui, sans-serif"
                            >
                                {t.val >= 1000000
                                    ? `$${(t.val / 1000000).toFixed(1)}M`
                                    : t.val >= 1000
                                        ? `$${(t.val / 1000).toFixed(0)}k`
                                        : `$${t.val.toFixed(0)}`}
                            </text>
                        </g>
                    ))}

                    {/* Área */}
                    <path d={areaPath} fill={`url(#${areaGradId})`} />

                    {/* Línea */}
                    <path d={linePath} fill="none" stroke={`url(#${gradId})`} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

                    {/* Etiquetas eje X */}
                    {pts.map((p, i) => {
                        if (i % xStep !== 0 && i !== n - 1) return null;
                        return (
                            <text key={i} x={p.x.toFixed(1)} y={H - 6} textAnchor="middle"
                                fontSize="10" fill="#9CA3AF" fontFamily="system-ui, sans-serif">
                                {formatEtiqueta(p.clave, granularidad)}
                            </text>
                        );
                    })}

                    {/* Puntos interactivos */}
                    {pts.map((p, i) => (
                        <g key={i}>
                            {/* Área de hover ampliada */}
                            <rect
                                x={(p.x - (chartW / n / 2)).toFixed(1)}
                                y={padT}
                                width={(chartW / n).toFixed(1)}
                                height={chartH}
                                fill="transparent"
                                style={{ cursor: 'crosshair' }}
                                onMouseEnter={() => setTooltip({ x: p.x, y: p.y, clave: p.clave, total: p.total })}
                            />
                            {/* Punto visible */}
                            <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4"
                                fill="#fff" stroke="#7C3AED" strokeWidth="2"
                                style={{ pointerEvents: 'none' }}
                            />
                        </g>
                    ))}

                    {/* Tooltip SVG — se voltea hacia abajo si no hay espacio arriba */}
                    {tooltip && (() => {
                        const tw = 130, th = 42, gap = 12;
                        const tx = Math.min(Math.max(tooltip.x - tw / 2, padL), W - padR - tw);
                        // Si el punto está muy cerca del borde superior, colocar el tooltip debajo
                        const flipDown = tooltip.y - th - gap < padT;
                        const ty = flipDown ? tooltip.y + gap : tooltip.y - th - gap;
                        return (
                            <g style={{ pointerEvents: 'none' }}>
                                <rect x={tx} y={ty} width={tw} height={th} rx="6" ry="6"
                                    fill="#1F2937" opacity="0.92"
                                />
                                <text x={tx + tw / 2} y={ty + 14} textAnchor="middle"
                                    fontSize="10" fill="#D1D5DB" fontFamily="system-ui, sans-serif">
                                    {formatEtiquetaTooltip(tooltip.clave, granularidad)}
                                </text>
                                <text x={tx + tw / 2} y={ty + 30} textAnchor="middle"
                                    fontSize="12" fill="#fff" fontWeight="700" fontFamily="system-ui, sans-serif">
                                    {formatCLP(tooltip.total)}
                                </text>
                            </g>
                        );
                    })()}
                </svg>
            </div>
        </div>
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
const FilaCobro = ({ cobro: cobroInicial, token, hasPermission, onAnular, onPagoExitoso }) => {
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
        // Notificar al padre para refrescar el resumen de caja
        if (onPagoExitoso) onPagoExitoso();
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

    // Refresh key para forzar recarga de la tarjeta de saldo
    const [cajaRefreshKey, setCajaRefreshKey] = useState(0);

    // Tab movimientos
    const [desde, setDesde]             = useState('');
    const [hasta, setHasta]             = useState('');
    const [movimientos, setMovimientos] = useState(null);
    const [loadingMov, setLoadingMov]   = useState(false);
    const [errorMov, setErrorMov]       = useState('');
    // Guardar el período que fue consultado (para el gráfico)
    const [periodoConsultado, setPeriodoConsultado] = useState({ desde: '', hasta: '' });

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

    // Refrescar tarjeta de saldo al registrar un pago exitoso
    const handlePagoExitoso = () => {
        setCajaRefreshKey(k => k + 1);
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
            // Guardar el período consultado para el gráfico
            setPeriodoConsultado({ desde, hasta });
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
                    {/* Tarjeta de saldo del mes */}
                    <TarjetaSaldoCaja token={token} refreshKey={cajaRefreshKey} />

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
                                    onPagoExitoso={handlePagoExitoso}
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

                            {/* Gráfico de ingresos */}
                            {movimientos.movimientos.length > 0 && (
                                <GraficoIngresos
                                    movimientos={movimientos.movimientos}
                                    desde={periodoConsultado.desde}
                                    hasta={periodoConsultado.hasta}
                                />
                            )}

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
