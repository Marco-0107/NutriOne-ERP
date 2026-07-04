import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Calendar, CalendarRange, Award, Wallet, TrendingUp,
    AlertCircle, Loader, Lock, Wallet2
} from 'lucide-react';
import { apiUrl } from '../helpers/api';

/* ─── utilidades ─────────────────────────────────────────────────── */
const formatCLP = (v) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(v) || 0);

const toISODate = (date) => date.toISOString().slice(0, 10);

const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const METODO_LABELS = {
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    transferencia: 'Transferencia',
    cheque: 'Cheque',
};

// Colores categóricos para el gráfico de torta: 3 tonos ya existentes en index.css,
// deliberadamente distintos entre sí (no variaciones del mismo morado) para que
// las porciones se distingan sin depender de la leyenda.
const METODO_COLORS = {
    efectivo: 'var(--bienestar)',
    tarjeta: 'var(--informacion)',
    transferencia: 'var(--morado-primario)',
    cheque: 'var(--recordatorio)',
};
const METODO_COLOR_FALLBACK = 'var(--gris-500)';

// Construye los paths SVG de cada porción a partir de los subtotales por método.
const buildPieSlices = (subtotales, total) => {
    if (!total || total <= 0) return [];
    const cx = 100, cy = 100, r = 90;
    let anguloActual = -Math.PI / 2; // arranca arriba (12 en punto)

    return Object.entries(subtotales)
        .filter(([, monto]) => monto > 0)
        .map(([metodo, monto]) => {
            const fraccion = monto / total;
            const anguloInicio = anguloActual;
            const anguloFin = anguloActual + fraccion * 2 * Math.PI;
            anguloActual = anguloFin;

            const x1 = cx + r * Math.cos(anguloInicio);
            const y1 = cy + r * Math.sin(anguloInicio);
            const x2 = cx + r * Math.cos(anguloFin);
            const y2 = cy + r * Math.sin(anguloFin);
            const arcoGrande = (anguloFin - anguloInicio) > Math.PI ? 1 : 0;

            return {
                metodo,
                monto,
                pct: fraccion * 100,
                d: `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${arcoGrande} 1 ${x2} ${y2} Z`,
                color: METODO_COLORS[metodo] || METODO_COLOR_FALLBACK,
            };
        });
};

const getSaludo = (hour) => {
    if (hour < 12) return { texto: 'Buenos días', emoji: '☀️' };
    if (hour < 19) return { texto: 'Buenas tardes', emoji: '🌤️' };
    return { texto: 'Buenas noches', emoji: '🌙' };
};

/* ─── Estilo "vidrio esmerilado" reutilizado por todas las tarjetas ── */
const glassCard = {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
    borderRadius: '20px',
    boxShadow: 'var(--shadow-lg)',
};

/* ─── Eyebrow: encabezado pequeño de sección con icono ──────────────── */
const SeccionTitulo = ({ icon: Icon, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Icon size={16} style={{ color: 'var(--morado-primario)' }} />
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {children}
        </span>
    </div>
);

/* ─── Tarjeta de estadística con estado de carga/error/permiso propio ── */
const StatCard = ({ icon: Icon, color, bg, value, label, loading, error, sinPermiso }) => (
    <div
        style={{
            ...glassCard,
            padding: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '18px',
            transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
        <div style={{
            width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: bg, color,
        }}>
            <Icon size={24} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {sinPermiso ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <Lock size={13} /> Sin permiso
                </span>
            ) : loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Cargando...
                </span>
            ) : error ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--danger)', fontWeight: 600 }}>
                    <AlertCircle size={13} /> Error al cargar
                </span>
            ) : (
                <span style={{ fontSize: '25px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</span>
            )}
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</span>
        </div>
    </div>
);

/* ─── Aviso de permiso faltante para una sección ────────────────────── */
const SinPermiso = ({ mensaje }) => (
    <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '18px 22px',
        background: 'rgba(255, 255, 255, 0.6)', border: '1px dashed var(--border-color)',
        borderRadius: '20px', color: 'var(--text-muted)', fontSize: '13px',
    }}>
        <Lock size={16} /> {mensaje}
    </div>
);

/* ─── Gráfico de torta: leyenda a la izquierda, porciones a la derecha ── */
const GraficoTorta = ({ slices }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: '1 1 200px', minWidth: '200px' }}>
            {slices.map((s) => (
                <div key={s.metodo} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: s.color, flexShrink: 0 }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {METODO_LABELS[s.metodo] || s.metodo}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {formatCLP(s.monto)} · {s.pct.toFixed(1)}%
                        </span>
                    </div>
                </div>
            ))}
        </div>

        <svg viewBox="0 0 200 200" width="180" height="180" style={{ flexShrink: 0 }}>
            {slices.length === 1 ? (
                <circle cx="100" cy="100" r="90" style={{ fill: slices[0].color }}>
                    <title>{`${METODO_LABELS[slices[0].metodo] || slices[0].metodo}: ${formatCLP(slices[0].monto)} (100%)`}</title>
                </circle>
            ) : (
                slices.map((s) => (
                    <path key={s.metodo} d={s.d} style={{ fill: s.color, stroke: 'var(--bg-card)', strokeWidth: 2 }}>
                        <title>{`${METODO_LABELS[s.metodo] || s.metodo}: ${formatCLP(s.monto)} (${s.pct.toFixed(1)}%)`}</title>
                    </path>
                ))
            )}
        </svg>
    </div>
);

const Dashboard = () => {
    const { user, token, hasPermission } = useAuth();
    const headers = { Authorization: `Bearer ${token}` };

    const puedeVerDashboard = hasPermission('dashboard:ver');
    const puedeVerServicios = hasPermission('servicios:ver');

    // Reloj en vivo del banner de bienvenida (solo decorativo, no afecta ningún fetch)
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Resumen financiero (deuda total, ingresos del mes, subtotales por método)
    const [financiero, setFinanciero]           = useState(null);
    const [loadingFinanciero, setLoadingFinanciero] = useState(puedeVerDashboard);
    const [errorFinanciero, setErrorFinanciero] = useState('');

    // Resumen de agenda (citas hoy / semana)
    const [agenda, setAgenda]                 = useState(null);
    const [loadingAgenda, setLoadingAgenda]   = useState(puedeVerDashboard);
    const [errorAgenda, setErrorAgenda]       = useState('');

    // Servicios activos
    const [serviciosActivos, setServiciosActivos] = useState(null);
    const [loadingServicios, setLoadingServicios]  = useState(puedeVerServicios);
    const [errorServicios, setErrorServicios]      = useState('');

    const fetchFinanciero = useCallback(async () => {
        if (!puedeVerDashboard) return;
        setLoadingFinanciero(true);
        setErrorFinanciero('');
        try {
            const hoy = new Date();
            const desde = toISODate(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
            const hasta = toISODate(hoy);
            const res = await fetch(apiUrl(`/dashboard/resumen-financiero?desde=${desde}&hasta=${hasta}`), { headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al obtener el resumen financiero');
            setFinanciero(data.data);
        } catch (err) {
            setErrorFinanciero(err.message);
        } finally {
            setLoadingFinanciero(false);
        }
    }, [token, puedeVerDashboard]);

    const fetchAgenda = useCallback(async () => {
        if (!puedeVerDashboard) return;
        setLoadingAgenda(true);
        setErrorAgenda('');
        try {
            const res = await fetch(apiUrl('/dashboard/resumen-agenda'), { headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al obtener el resumen de agenda');
            setAgenda(data.data);
        } catch (err) {
            setErrorAgenda(err.message);
        } finally {
            setLoadingAgenda(false);
        }
    }, [token, puedeVerDashboard]);

    const fetchServiciosActivos = useCallback(async () => {
        if (!puedeVerServicios) return;
        setLoadingServicios(true);
        setErrorServicios('');
        try {
            const res = await fetch(apiUrl('/servicios?estado=activo'), { headers });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al obtener los servicios');
            setServiciosActivos((data.data || []).length);
        } catch (err) {
            setErrorServicios(err.message);
        } finally {
            setLoadingServicios(false);
        }
    }, [token, puedeVerServicios]);

    useEffect(() => { fetchFinanciero(); }, [fetchFinanciero]);
    useEffect(() => { fetchAgenda(); }, [fetchAgenda]);
    useEffect(() => { fetchServiciosActivos(); }, [fetchServiciosActivos]);

    const mesActual = MESES[new Date().getMonth()];
    const subtotales = financiero?.subtotales_por_metodo || {};
    const pieSlices = buildPieSlices(subtotales, financiero?.ingresos_periodo);
    const saludo = getSaludo(currentTime.getHours());

    return (
        <div style={{ position: 'relative', animation: 'slideIn 0.3s ease-out' }}>
            {/* Fondo decorativo: dos manchas suaves en la paleta morada de la marca,
                el equivalente en NutriOne del fondo desenfocado de la referencia. */}
            <div aria-hidden style={{
                position: 'absolute', inset: '-40px', zIndex: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: '32px',
                background: 'radial-gradient(circle at 12% 0%, rgba(139, 92, 246, 0.14), transparent 45%),'
                          + 'radial-gradient(circle at 90% 20%, rgba(109, 40, 217, 0.10), transparent 50%)',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
                {/* ── Encabezado de bienvenida ── */}
                <div className="welcome-card" style={{ position: 'relative', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                        <div>
                            <h1 className="welcome-title" style={{ fontSize: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {saludo.emoji} {saludo.texto}, {user.nombres}!
                            </h1>
                            <div style={{ width: '64px', height: '4px', background: 'rgba(255,255,255,0.5)', borderRadius: '999px', margin: '14px 0' }} />
                        </div>

                        {/* Reloj en vivo: un detalle cálido y secundario, no compite con los datos de negocio */}
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px',
                            background: 'rgba(255,255,255,0.15)', padding: '8px 14px', borderRadius: '12px',
                            backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                        }}>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', textTransform: 'capitalize' }}>
                                {currentTime.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </span>
                            <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                                {currentTime.toLocaleTimeString('es-CL')}
                            </span>
                        </div>
                    </div>
                    <p className="welcome-text" style={{ maxWidth: '640px' }}>
                        Bienvenido de vuelta a NutriOne ERP. Aquí tienes un resumen del día y tus accesos rápidos.
                    </p>
                </div>

                {/* ── Sección financiera ── */}
                <div style={{ marginTop: '32px' }}>
                    <SeccionTitulo icon={Wallet2}>Financiero</SeccionTitulo>

                    {!puedeVerDashboard ? (
                        <SinPermiso mensaje="No tienes permiso para ver los indicadores financieros." />
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'stretch' }}>
                            {/* 1/3: indicadores apilados */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <StatCard
                                    icon={Wallet}
                                    bg="rgba(245, 158, 11, 0.12)" color="var(--advertencia)"
                                    value={formatCLP(financiero?.deuda_total)}
                                    label="Deuda Total del Consultorio"
                                    loading={loadingFinanciero} error={errorFinanciero} sinPermiso={!puedeVerDashboard}
                                />
                                <StatCard
                                    icon={TrendingUp}
                                    bg="rgba(16, 185, 129, 0.12)" color="var(--exito)"
                                    value={formatCLP(financiero?.ingresos_periodo)}
                                    label={`Ingresos de ${mesActual}`}
                                    loading={loadingFinanciero} error={errorFinanciero} sinPermiso={!puedeVerDashboard}
                                />
                            </div>

                            {/* 2/3: gráfico de torta por método de pago */}
                            <div style={{ ...glassCard, padding: '26px', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
                                    <TrendingUp size={18} style={{ color: 'var(--morado-primario)' }} />
                                    Ingresos de {mesActual} por método de pago
                                </h3>

                                {loadingFinanciero && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px', padding: '12px 0' }}>
                                        <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Cargando movimientos...
                                    </div>
                                )}

                                {!loadingFinanciero && errorFinanciero && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)', background: '#FEF2F2', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '13px' }}>
                                        <AlertCircle size={16} /> {errorFinanciero}
                                    </div>
                                )}

                                {!loadingFinanciero && !errorFinanciero && pieSlices.length === 0 && (
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>
                                        No hay ingresos registrados este mes.
                                    </p>
                                )}

                                {!loadingFinanciero && !errorFinanciero && pieSlices.length > 0 && (
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                                        <GraficoTorta slices={pieSlices} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Sección agenda y servicios ── */}
                <div style={{ marginTop: '32px' }}>
                    <SeccionTitulo icon={Calendar}>Agenda y Servicios</SeccionTitulo>

                    {!puedeVerDashboard && !puedeVerServicios ? (
                        <SinPermiso mensaje="No tienes permiso para ver los indicadores de agenda y servicios." />
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                            <StatCard
                                icon={Calendar}
                                bg="rgba(59, 130, 246, 0.12)" color="var(--informacion)"
                                value={agenda?.citas_hoy}
                                label="Citas para Hoy"
                                loading={loadingAgenda} error={errorAgenda} sinPermiso={!puedeVerDashboard}
                            />
                            <StatCard
                                icon={CalendarRange}
                                bg="rgba(109, 40, 217, 0.12)" color="var(--morado-primario)"
                                value={agenda?.citas_semana}
                                label="Citas Próximos 7 Días"
                                loading={loadingAgenda} error={errorAgenda} sinPermiso={!puedeVerDashboard}
                            />
                            <StatCard
                                icon={Award}
                                bg="rgba(245, 158, 11, 0.12)" color="var(--advertencia)"
                                value={serviciosActivos}
                                label="Servicios Activos"
                                loading={loadingServicios} error={errorServicios} sinPermiso={!puedeVerServicios}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
