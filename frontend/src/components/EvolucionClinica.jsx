import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ChevronLeft, Weight, Calculator, Ruler, Activity, TrendingUp,
    Calendar, UserRound, ClipboardList, X, AlertCircle, Clock3,
    Stethoscope, ArrowUpRight, ArrowDownRight, ArrowRight,
} from 'lucide-react';
import { apiUrl } from '../helpers/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getFullName = (u) =>
    u ? [u.nombres, u.apellido_paterno, u.apellido_materno].filter(Boolean).join(' ').trim() : '—';

const calcIMC = (peso, talla) => {
    if (!peso || !talla) return null;
    const tallaMt = talla / 100;
    return +(peso / (tallaMt * tallaMt)).toFixed(1);
};

const formatFecha = (f) => {
    if (!f) return '—';
    return new Date(f + 'T00:00:00').toLocaleDateString('es-CL', {
        day: '2-digit', month: 'short', year: 'numeric',
    });
};

const clasificarIMC = (imc) => {
    if (imc === null || imc === undefined) return null;
    if (imc < 18.5) return { label: 'Bajo peso', color: '#3B82F6' };
    if (imc < 25)   return { label: 'Normal',     color: '#10B981' };
    if (imc < 30)   return { label: 'Sobrepeso',  color: '#F59E0B' };
    return              { label: 'Obesidad',      color: '#EF4444' };
};

const INDICADORES = [
    { key: 'peso',    label: 'Peso',    unit: 'kg', color: '#6D28D9' },
    { key: 'imc',     label: 'IMC',     unit: '',   color: '#14B8A6' },
    { key: 'cintura', label: 'Cintura', unit: 'cm', color: '#F59E0B' },
];

// ── Sub: Gráfico SVG ──────────────────────────────────────────────────────────
const LineChart = ({ data, color, unit, onClickPoint }) => {
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const W = 600, H = 220, padL = 52, padR = 24, padT = 18, padB = 42;

    if (!data || data.length === 0) return null;
    const vals = data.map(d => d.valor).filter(v => v !== null);
    if (vals.length === 0) return null;

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;

    const px = (i) => padL + (i / Math.max(data.length - 1, 1)) * (W - padL - padR);
    const py = (v) => padT + (1 - (v - min) / range) * (H - padT - padB);

    const pts = data.map((d, i) => ({
        ...d, i, x: px(i), y: d.valor !== null ? py(d.valor) : null,
    })).filter(p => p.y !== null);

    const pathD  = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaD  = pts.length > 1
        ? `${pathD} L ${pts[pts.length - 1].x} ${H - padB} L ${pts[0].x} ${H - padB} Z`
        : '';

    const yTicks = Array.from({ length: 5 }, (_, i) => {
        const v = min + (i / 4) * range;
        return { v, y: py(v) };
    });

    const gradId  = `grad-${color.replace('#', '')}`;
    const areaGId = `area-${color.replace('#', '')}`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
            <defs>
                <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor={color} stopOpacity="1" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id={areaGId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"   stopColor={color} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                </linearGradient>
            </defs>

            {/* Cuadrícula */}
            {yTicks.map((t, i) => (
                <g key={i}>
                    <line x1={padL} y1={t.y} x2={W - padR} y2={t.y}
                        stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                    <text x={padL - 8} y={t.y + 4} textAnchor="end" fontSize="11" fill="var(--text-muted)">
                        {t.v % 1 === 0 ? t.v.toFixed(0) : t.v.toFixed(1)}
                    </text>
                </g>
            ))}

            {/* Área */}
            {areaD && <path d={areaD} fill={`url(#${areaGId})`} />}

            {/* Línea */}
            {pts.length > 1 && (
                <path d={pathD} fill="none" stroke={`url(#${gradId})`}
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            )}

            {/* Etiquetas eje X */}
            {pts.map(p => (
                <text key={p.i} x={p.x} y={H - padB + 18}
                    textAnchor="middle" fontSize="10" fill="var(--text-muted)">
                    {new Date(p.fecha + 'T00:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                </text>
            ))}

            {/* Puntos interactivos */}
            {pts.map(p => (
                <g key={p.i}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onClickPoint && onClickPoint(p.i)}
                    onMouseEnter={() => setHoveredIdx(p.i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                >
                    {hoveredIdx === p.i && (
                        <circle cx={p.x} cy={p.y} r={14} fill={color} fillOpacity="0.12" />
                    )}
                    <circle cx={p.x} cy={p.y}
                        r={hoveredIdx === p.i ? 6 : 4}
                        fill={hoveredIdx === p.i ? color : 'white'}
                        stroke={color} strokeWidth="2.5"
                        style={{ transition: 'r 0.15s' }}
                    />
                    {hoveredIdx === p.i && (
                        <g>
                            <rect x={p.x - 32} y={p.y - 34} width="64" height="22"
                                rx="6" ry="6" fill="#1F2937" fillOpacity="0.92" />
                            <text x={p.x} y={p.y - 19} textAnchor="middle"
                                fontSize="11.5" fontWeight="700" fill="white">
                                {p.valor}{unit}
                            </text>
                        </g>
                    )}
                </g>
            ))}
        </svg>
    );
};

// ── Sub: Tarjeta KPI ──────────────────────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, unit, delta, color, sub }) => {
    const hasDelta = delta !== null && delta !== undefined && !isNaN(delta);
    const isGood   = hasDelta && delta < 0; // bajar peso/IMC/cintura es bueno
    const DeltaIcon = hasDelta
        ? (delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : ArrowRight)
        : null;

    return (
        <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)', padding: '20px', boxShadow: 'var(--shadow-sm)',
            display: 'flex', flexDirection: 'column', gap: '10px',
            position: 'relative', overflow: 'hidden',
            transition: 'box-shadow 0.2s, transform 0.2s',
        }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
            <div style={{ position: 'absolute', right: '-16px', bottom: '-16px', width: '80px', height: '80px', borderRadius: '50%', background: color, opacity: 0.07 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {label}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                    {value !== null && value !== undefined ? value : '—'}
                </span>
                {value !== null && value !== undefined && unit && (
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>{unit}</span>
                )}
            </div>

            {sub && (
                <span style={{ fontSize: '11px', color: sub.color || 'var(--text-muted)', fontWeight: 700 }}>
                    {sub.label}
                </span>
            )}

            {hasDelta && delta !== 0 && (
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '12px', fontWeight: 700,
                    color: isGood ? '#10B981' : '#EF4444',
                    background: isGood ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
                    borderRadius: '999px', padding: '2px 8px', width: 'fit-content',
                }}>
                    <DeltaIcon size={13} />
                    {delta > 0 ? '+' : ''}{delta}{unit} vs anterior
                </div>
            )}
            {hasDelta && delta === 0 && (
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)',
                    background: 'var(--bg-tertiary)', borderRadius: '999px', padding: '2px 8px', width: 'fit-content',
                }}>
                    <ArrowRight size={13} /> Sin cambio
                </div>
            )}
        </div>
    );
};

// ── Sub: Modal Detalle Control ────────────────────────────────────────────────
const ModalDetalleControl = ({ ficha, onClose }) => {
    if (!ficha) return null;
    const imc         = calcIMC(ficha.peso, ficha.talla);
    const clasificacion = clasificarIMC(imc);
    const nutriNombre = getFullName(ficha.cita?.usuario);

    const rows = [
        { label: 'Tipo de atención',        value: ficha.tipo },
        { label: 'Fecha',                   value: formatFecha(ficha.fecha_atencion) },
        { label: 'Edad',                    value: ficha.edad ? `${ficha.edad} años` : null },
        { label: 'Sexo',                    value: ficha.sexo },
        { label: 'Peso',                    value: ficha.peso ? `${ficha.peso} kg` : null },
        { label: 'Talla',                   value: ficha.talla ? `${ficha.talla} cm` : null },
        { label: 'IMC',                     value: imc ? `${imc}` : null, extra: clasificacion?.label, extraColor: clasificacion?.color },
        { label: 'Cintura',                 value: ficha.circunferencia_cintura ? `${ficha.circunferencia_cintura} cm` : null },
        { label: 'Presión arterial',        value: ficha.presion_arterial },
        { label: 'Motivo de consulta',      value: ficha.motivo_consulta },
        { label: 'Diagnóstico nutricional', value: ficha.diagnostico_nutricional },
        { label: 'Indicaciones',            value: ficha.indicaciones },
        { label: 'Recomendaciones',         value: ficha.recomendaciones },
        { label: 'Derivaciones',            value: ficha.derivaciones },
        { label: 'Observación',             value: ficha.observacion },
        { label: 'Profesional',             value: nutriNombre !== '—' ? nutriNombre : null },
    ].filter(r => r.value);

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal-content" style={{ maxWidth: '580px' }}>
                <div className="modal-header">
                    <div>
                        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ClipboardList size={20} color="var(--morado-primario)" />
                            Detalle del control
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            {formatFecha(ficha.fecha_atencion)} · {ficha.tipo}
                        </p>
                    </div>
                    <button className="btn-close" onClick={onClose} aria-label="Cerrar">
                        <X size={20} />
                    </button>
                </div>
                <div className="modal-body">
                    <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        {rows.map(r => (
                            <div key={r.label} style={{
                                background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '12px 14px',
                                gridColumn: r.value && r.value.length > 30 ? '1 / -1' : undefined,
                            }}>
                                <dt style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                    {r.label}
                                </dt>
                                <dd style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                    {r.value}
                                    {r.extra && (
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: r.extraColor, background: `${r.extraColor}18`, borderRadius: '999px', padding: '1px 8px' }}>
                                            {r.extra}
                                        </span>
                                    )}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    {ficha.calculos && (
                        <div style={{ marginTop: '14px', background: 'rgba(109,40,217,0.05)', border: '1px solid rgba(109,40,217,0.15)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                            <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--morado-primario)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Cálculos</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{ficha.calculos}</p>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// ── Componente principal ──────────────────────────────────────────────────────
const EvolucionClinica = () => {
    const { id }       = useParams();
    const navigate     = useNavigate();
    const { token }    = useAuth();

    const [paciente,   setPaciente]   = useState(null);
    const [fichas,     setFichas]     = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState('');
    const [indicador,  setIndicador]  = useState('peso');
    const [detalleFicha, setDetalleFicha] = useState(null);

    useEffect(() => {
        if (!id || !token) return;
        setLoading(true);
        setError('');
        Promise.all([
            fetch(apiUrl('/pacientes'),                 { headers: { Authorization: `Bearer ${token}` } }),
            fetch(apiUrl(`/fichas/paciente/${id}`),     { headers: { Authorization: `Bearer ${token}` } }),
        ])
            .then(async ([resPac, resFichas]) => {
                const dataPac    = await resPac.json();
                const dataFichas = await resFichas.json();
                if (!resPac.ok)    throw new Error(dataPac.message    || 'Error al obtener paciente');
                if (!resFichas.ok) throw new Error(dataFichas.message || 'Error al obtener fichas');
                const pac = (dataPac.data || []).find(p => String(p.id) === String(id));
                if (!pac) throw new Error('Paciente no encontrado');
                setPaciente(pac);
                setFichas(dataFichas.data || []);
            })
            .catch(err => setError(err.message || 'Error de conexión'))
            .finally(() => setLoading(false));
    }, [id, token]);

    // ── Datos del gráfico ─────────────────────────────────────────────────────
    const chartData = fichas.map(f => {
        const imc = calcIMC(f.peso, f.talla);
        const valor =
            indicador === 'peso'    ? (f.peso    ?? null) :
            indicador === 'imc'     ? imc :
            indicador === 'cintura' ? (f.circunferencia_cintura ?? null) : null;
        return { fecha: f.fecha_atencion, valor, ficha: f };
    }).filter(d => d.valor !== null);

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const fPeso    = fichas.filter(f => f.peso    != null);
    const fCintura = fichas.filter(f => f.circunferencia_cintura != null);
    const fTalla   = fichas.filter(f => f.talla   != null);

    const ultimoPeso    = fPeso.length    ? fPeso[fPeso.length - 1].peso                               : null;
    const penultPeso    = fPeso.length > 1 ? fPeso[fPeso.length - 2].peso                              : null;
    const deltaPeso     = (ultimoPeso !== null && penultPeso !== null) ? +(ultimoPeso - penultPeso).toFixed(1) : null;

    const ultimaTalla   = fTalla.length   ? fTalla[fTalla.length - 1].talla                            : null;
    const penultTalla   = fTalla.length > 1 ? fTalla[fTalla.length - 2].talla                          : null;
    const ultimoIMC     = calcIMC(ultimoPeso, ultimaTalla);
    const penultIMC     = calcIMC(penultPeso, penultTalla);
    const deltaIMC      = (ultimoIMC !== null && penultIMC !== null) ? +(ultimoIMC - penultIMC).toFixed(1)   : null;

    const ultimaCintura = fCintura.length    ? fCintura[fCintura.length - 1].circunferencia_cintura    : null;
    const penultCintura = fCintura.length > 1 ? fCintura[fCintura.length - 2].circunferencia_cintura   : null;
    const deltaCintura  = (ultimaCintura !== null && penultCintura !== null) ? +(ultimaCintura - penultCintura).toFixed(1) : null;

    const clasificacion = clasificarIMC(ultimoIMC);

    // ── Deltas totales (primera → última) ────────────────────────────────────
    const primeraPeso    = fPeso.length    > 1 ? fPeso[0].peso                               : null;
    const primeraCintura = fCintura.length > 1 ? fCintura[0].circunferencia_cintura          : null;
    const primeraFichaIMC = fichas.find(f => f.peso && f.talla);
    const primeraIMC     = primeraFichaIMC ? calcIMC(primeraFichaIMC.peso, primeraFichaIMC.talla) : null;
    const fichasConIMC   = fichas.filter(f => f.peso && f.talla);

    const deltaTotal = {
        peso:    primeraPeso    !== null && ultimoPeso    !== null ? +(ultimoPeso    - primeraPeso).toFixed(1)    : null,
        imc:     primeraIMC    !== null && ultimoIMC     !== null && fichasConIMC.length > 1 ? +(ultimoIMC  - primeraIMC).toFixed(1)    : null,
        cintura: primeraCintura !== null && ultimaCintura !== null ? +(ultimaCintura - primeraCintura).toFixed(1) : null,
    };

    const nombreCompleto = paciente ? getFullName(paciente.usuario) : '...';
    const calcularEdad   = (f) => {
        if (!f) return '—';
        const hoy = new Date(), nac = new Date(f + 'T00:00:00');
        let e = hoy.getFullYear() - nac.getFullYear();
        const m = hoy.getMonth() - nac.getMonth();
        if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) e--;
        return `${e} años`;
    };

    const indActivo = INDICADORES.find(i => i.key === indicador) || INDICADORES[0];

    // ── Loading / Error ───────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', color: 'var(--text-muted)', gap: '12px' }}>
            <Clock3 size={36} style={{ opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>Cargando evolución clínica...</p>
        </div>
    );

    if (error) return (
        <div style={{ animation: 'slideIn 0.3s ease-out' }}>
            <button className="btn btn-secondary" style={{ marginBottom: '24px' }} onClick={() => navigate('/pacientes')}>
                <ChevronLeft size={16} /> Volver a Pacientes
            </button>
            <div className="alert alert-danger"><AlertCircle size={18} /><span>{error}</span></div>
        </div>
    );

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div style={{ animation: 'slideIn 0.3s ease-out', paddingBottom: '40px' }}>

            {/* Botón volver */}
            <button
                className="btn btn-secondary"
                style={{ marginBottom: '24px', fontSize: '13px', padding: '8px 16px' }}
                onClick={() => navigate('/pacientes')}
            >
                <ChevronLeft size={16} /> Volver a Pacientes
            </button>

            {/* ─── Encabezado del paciente ─── */}
            <div style={{
                background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)', padding: '24px 28px', marginBottom: '24px',
                boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center',
                gap: '20px', flexWrap: 'wrap', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', right: '-40px', top: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'var(--accent-gradient)', opacity: 0.06 }} />

                {/* Avatar */}
                <div style={{
                    width: '64px', height: '64px', borderRadius: '50%',
                    background: 'var(--accent-gradient)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', fontWeight: 800, color: 'white', flexShrink: 0,
                    boxShadow: '0 4px 14px rgba(109,40,217,0.30)',
                }}>
                    {(paciente?.usuario?.nombres?.[0] || 'P').toUpperCase()}
                    {(paciente?.usuario?.apellido_paterno?.[0] || '').toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
                            {nombreCompleto}
                        </h2>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                            background: paciente?.usuario?.estado === 'activo' ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
                            color: paciente?.usuario?.estado === 'activo' ? '#10B981' : '#EF4444',
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                            {paciente?.usuario?.estado === 'activo' ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <UserRound size={13} color="var(--morado-primario)" />
                            {paciente?.usuario?.rut || '—'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={13} color="var(--morado-primario)" />
                            {calcularEdad(paciente?.fecha_nacimiento)}
                        </span>
                        <span style={{ background: 'var(--lavanda-suave)', color: 'var(--morado-primario)', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                            {paciente?.prevision || 'Sin previsión'}
                        </span>
                    </div>
                </div>

                {/* Stats rápidas */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '14px 18px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--morado-primario)' }}>{fichas.length}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Controles</div>
                    </div>
                    {fichas.length > 0 && (
                        <>
                            <div style={{ width: '1px', background: 'var(--border-color)' }} />
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatFecha(fichas[0]?.fecha_atencion)}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>1ª atención</div>
                            </div>
                            <div style={{ width: '1px', background: 'var(--border-color)' }} />
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{formatFecha(fichas[fichas.length - 1]?.fecha_atencion)}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Último</div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ─── Sin datos ─── */}
            {fichas.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '64px 24px',
                    background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                    border: '1px dashed var(--border-color)', color: 'var(--text-muted)',
                }}>
                    <svg viewBox="0 0 120 100" width="120" height="100" style={{ marginBottom: '16px', opacity: 0.35 }}>
                        <rect x="10" y="20" width="100" height="70" rx="8" fill="none" stroke="#6D28D9" strokeWidth="2.5" />
                        <line x1="10" y1="36" x2="110" y2="36" stroke="#6D28D9" strokeWidth="2" />
                        <circle cx="24" cy="28" r="4" fill="#6D28D9" />
                        <circle cx="36" cy="28" r="4" fill="#A78BFA" />
                        <polyline points="22,72 38,58 54,65 70,48 86,55 102,42" fill="none" stroke="#6D28D9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p style={{ fontWeight: 700, fontSize: '16px', marginBottom: '6px', color: 'var(--text-secondary)' }}>
                        Sin datos de evolución
                    </p>
                    <p style={{ fontSize: '14px' }}>
                        Este paciente aún no tiene fichas clínicas registradas.<br />
                        Los datos aparecerán aquí cuando se complete una atención.
                    </p>
                </div>
            ) : (
                <>
                    {/* ─── Tarjetas KPI ─── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <KpiCard icon={Weight}     label="Peso"           value={ultimoPeso}    unit=" kg" delta={deltaPeso}    color="#6D28D9" />
                        <KpiCard icon={Calculator} label="IMC"            value={ultimoIMC}     unit=""    delta={deltaIMC}     color="#14B8A6" sub={clasificacion} />
                        <KpiCard icon={Ruler}      label="Cintura"        value={ultimaCintura} unit=" cm" delta={deltaCintura} color="#F59E0B" />
                        <KpiCard icon={Activity}   label="Grasa corporal" value={null}          unit="%"   delta={null}         color="#EC4899" />
                    </div>

                    {/* ─── Gráfico ─── */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TrendingUp size={18} color="var(--morado-primario)" />
                                    Evolución de {indActivo.label}
                                </h3>
                                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                    Haz clic en un punto para ver el detalle del control
                                </p>
                            </div>
                            {/* Selector de indicador */}
                            <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
                                {INDICADORES.map(ind => (
                                    <button key={ind.key} onClick={() => setIndicador(ind.key)} style={{
                                        padding: '6px 14px', fontSize: '12px', fontWeight: 700,
                                        borderRadius: '8px', border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                                        background: indicador === ind.key ? 'white' : 'transparent',
                                        color: indicador === ind.key ? ind.color : 'var(--text-muted)',
                                        boxShadow: indicador === ind.key ? 'var(--shadow-sm)' : 'none',
                                    }}>
                                        {ind.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {chartData.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                                <Activity size={28} style={{ marginBottom: '8px', opacity: 0.35 }} />
                                <p style={{ fontWeight: 600 }}>Sin datos para este indicador</p>
                            </div>
                        ) : chartData.length === 1 ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '36px', fontWeight: 800, color: indActivo.color, marginBottom: '4px' }}>
                                    {chartData[0].valor}{indActivo.unit}
                                </div>
                                <p style={{ fontSize: '13px' }}>Solo un registro disponible. El gráfico aparece con 2 o más controles.</p>
                                <p style={{ fontSize: '12px', marginTop: '4px' }}>{formatFecha(chartData[0].fecha)}</p>
                            </div>
                        ) : (
                            <div style={{ height: '220px', width: '100%' }}>
                                <LineChart
                                    data={chartData}
                                    color={indActivo.color}
                                    unit={indActivo.unit}
                                    onClickPoint={(i) => setDetalleFicha(chartData[i]?.ficha ?? null)}
                                />
                            </div>
                        )}
                    </div>

                    {/* ─── Diferencias entre controles ─── */}
                    {fichas.length > 1 && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Stethoscope size={18} color="var(--morado-primario)" />
                                Diferencias entre controles
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                                {[
                                    { label: 'Peso',    val: deltaTotal.peso,    unit: ' kg', first: primeraPeso,    last: ultimoPeso    },
                                    { label: 'IMC',     val: deltaTotal.imc,     unit: '',    first: primeraIMC,     last: ultimoIMC     },
                                    { label: 'Cintura', val: deltaTotal.cintura, unit: ' cm', first: primeraCintura, last: ultimaCintura },
                                ].map(item => {
                                    const noData     = item.val === null;
                                    const improvement = item.val !== null && item.val < 0;
                                    const worsening   = item.val !== null && item.val > 0;
                                    const DIcon = item.val > 0 ? ArrowUpRight : item.val < 0 ? ArrowDownRight : ArrowRight;
                                    return (
                                        <div key={item.label} style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: '16px', textAlign: 'center' }}>
                                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                                {item.label} · primera → última
                                            </div>
                                            {noData ? (
                                                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-muted)' }}>—</div>
                                            ) : (
                                                <>
                                                    <div style={{ fontSize: '24px', fontWeight: 800, color: item.val === 0 ? 'var(--text-muted)' : improvement ? '#10B981' : '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                                        <DIcon size={20} />
                                                        {item.val > 0 ? '+' : ''}{item.val}{item.unit}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                        {item.first}{item.unit} → {item.last}{item.unit}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ─── Línea de tiempo de controles ─── */}
                    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ClipboardList size={18} color="var(--morado-primario)" />
                            Historial de controles
                            <span style={{ marginLeft: '4px', background: 'var(--lavanda-suave)', color: 'var(--morado-primario)', borderRadius: '999px', padding: '2px 10px', fontSize: '12px', fontWeight: 700 }}>
                                {fichas.length}
                            </span>
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {[...fichas].reverse().map((ficha, idx, arr) => {
                                const imc2   = calcIMC(ficha.peso, ficha.talla);
                                const clas2  = clasificarIMC(imc2);
                                const nutr   = getFullName(ficha.cita?.usuario);
                                const isLast = idx === arr.length - 1;
                                const isFirst = idx === 0;

                                return (
                                    <div key={ficha.id_ficha} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                                        {/* Nodo y línea */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: '28px' }}>
                                            <div style={{
                                                width: '12px', height: '12px', borderRadius: '50%',
                                                background: isFirst ? 'var(--accent-gradient)' : 'white',
                                                border: isFirst ? 'none' : '2px solid var(--border-color)',
                                                boxShadow: isFirst ? '0 0 0 3px rgba(109,40,217,0.15)' : 'none',
                                                flexShrink: 0, marginTop: '18px',
                                            }} />
                                            {!isLast && (
                                                <div style={{ flex: 1, width: '2px', background: 'var(--border-color)', minHeight: '24px' }} />
                                            )}
                                        </div>

                                        {/* Tarjeta */}
                                        <div
                                            style={{
                                                flex: 1, marginBottom: isLast ? 0 : '12px',
                                                background: isFirst ? 'rgba(109,40,217,0.04)' : 'var(--bg-tertiary)',
                                                border: isFirst ? '1px solid rgba(109,40,217,0.18)' : '1px solid var(--border-color)',
                                                borderRadius: 'var(--radius-md)', padding: '14px 16px',
                                                cursor: 'pointer', transition: 'all 0.15s',
                                            }}
                                            onClick={() => setDetalleFicha(ficha)}
                                            onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateX(0)'; }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                                <div>
                                                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                        {formatFecha(ficha.fecha_atencion)}
                                                    </span>
                                                    {isFirst && (
                                                        <span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 700, background: 'var(--accent-gradient)', color: 'white', borderRadius: '999px', padding: '2px 8px' }}>
                                                            Último
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--morado-primario)', background: 'var(--lavanda-suave)', borderRadius: '999px', padding: '2px 10px' }}>
                                                    {ficha.tipo}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                                {ficha.peso && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Weight size={12} color="#6D28D9" />
                                                        <strong>{ficha.peso} kg</strong>
                                                    </span>
                                                )}
                                                {imc2 !== null && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Calculator size={12} color="#14B8A6" />
                                                        <strong>IMC {imc2}</strong>
                                                        {clas2 && <span style={{ color: clas2.color, fontWeight: 700 }}>({clas2.label})</span>}
                                                    </span>
                                                )}
                                                {ficha.circunferencia_cintura && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Ruler size={12} color="#F59E0B" />
                                                        <strong>{ficha.circunferencia_cintura} cm</strong>
                                                    </span>
                                                )}
                                                {nutr !== '—' && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                                                        <UserRound size={12} />
                                                        {nutr}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* ─── Modal de detalle ─── */}
            {detalleFicha && (
                <ModalDetalleControl ficha={detalleFicha} onClose={() => setDetalleFicha(null)} />
            )}
        </div>
    );
};

export default EvolucionClinica;
