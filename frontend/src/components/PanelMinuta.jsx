import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, X, Search, Edit2, Check, UtensilsCrossed } from 'lucide-react';
import { apiUrl } from '../helpers/api';

const TIEMPOS_DEFAULT = [
    { id: 'desayuno', nombre: 'Desayuno', alimentos: [] },
    { id: 'almuerzo', nombre: 'Almuerzo', alimentos: [] },
    { id: 'once',     nombre: 'Once',     alimentos: [] },
    { id: 'cena',     nombre: 'Cena',     alimentos: [] },
];

function calcNutrientes(alimento, gramos) {
    const g = Number(gramos);
    if (!alimento || !g || g <= 0) return { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 };
    const f = g / 100;
    return {
        calorias:      +(alimento.por_100g.calorias      * f).toFixed(1),
        proteinas:     +(alimento.por_100g.proteinas     * f).toFixed(1),
        carbohidratos: +(alimento.por_100g.carbohidratos * f).toFixed(1),
        grasas:        +(alimento.por_100g.grasas        * f).toFixed(1),
        fibra:         +(alimento.por_100g.fibra         * f).toFixed(1),
    };
}

function sumarNutrientes(alimentos) {
    return alimentos.reduce((acc, a) => {
        const n = calcNutrientes(a, a.gramos);
        return {
            calorias:      +(acc.calorias      + n.calorias).toFixed(1),
            proteinas:     +(acc.proteinas     + n.proteinas).toFixed(1),
            carbohidratos: +(acc.carbohidratos + n.carbohidratos).toFixed(1),
            grasas:        +(acc.grasas        + n.grasas).toFixed(1),
            fibra:         +(acc.fibra         + n.fibra).toFixed(1),
        };
    }, { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 });
}

const MACROS_CONFIG = [
    { key: 'calorias',      label: 'Energía',       unit: 'kcal', color: '#6D28D9' },
    { key: 'proteinas',     label: 'Proteínas',     unit: 'g',    color: '#10B981' },
    { key: 'carbohidratos', label: 'Carbohidratos', unit: 'g',    color: '#F59E0B' },
    { key: 'grasas',        label: 'Grasas',        unit: 'g',    color: '#EF4444' },
    { key: 'fibra',         label: 'Fibra',         unit: 'g',    color: '#14B8A6' },
];

const PanelMinuta = ({ value, onChange, objetivoCalorico, token, disabled = false }) => {
    const tiempos = value?.tiempos?.length ? value.tiempos : TIEMPOS_DEFAULT;

    const [tabActivo, setTabActivo]                 = useState(0);
    const [busqueda, setBusqueda]                   = useState('');
    const [sugerencias, setSugerencias]             = useState([]);
    const [showDropdown, setShowDropdown]           = useState(false);
    const [cargandoBusqueda, setCargandoBusqueda]   = useState(false);
    const [alimentoPendiente, setAlimentoPendiente] = useState(null);
    const [gramosPendiente, setGramosPendiente]     = useState('100');
    const [editandoTab, setEditandoTab]             = useState(null);
    const [nombreEditando, setNombreEditando]       = useState('');

    const debounceRef  = useRef(null);
    const searchWrapRef = useRef(null);

    useEffect(() => {
        const onClick = (e) => {
            if (searchWrapRef.current && !searchWrapRef.current.contains(e.target))
                setShowDropdown(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    useEffect(() => {
        if (tabActivo >= tiempos.length) setTabActivo(Math.max(0, tiempos.length - 1));
    }, [tiempos.length]);

    const updateTiempos = (newTiempos) => onChange({ tiempos: newTiempos });

    const buscarAlimentos = useCallback((texto) => {
        setBusqueda(texto);
        setAlimentoPendiente(null);
        clearTimeout(debounceRef.current);
        if (texto.trim().length < 2) { setSugerencias([]); setShowDropdown(false); return; }
        debounceRef.current = setTimeout(async () => {
            setCargandoBusqueda(true);
            try {
                const res  = await fetch(apiUrl(`/alimentos/buscar?q=${encodeURIComponent(texto.trim())}&limit=8`), {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const json = await res.json();
                if (json.success) { setSugerencias(json.data); setShowDropdown(json.data.length > 0); }
            } catch { /* silencioso */ }
            finally { setCargandoBusqueda(false); }
        }, 300);
    }, [token]);

    const seleccionarAlimento = (al) => {
        setAlimentoPendiente(al);
        setBusqueda(al.nombre);
        setGramosPendiente('100');
        setShowDropdown(false);
        setSugerencias([]);
    };

    const agregarAlimento = () => {
        const g = Number(gramosPendiente);
        if (!alimentoPendiente || !g || g <= 0) return;
        const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const idxActivo = Math.min(tabActivo, tiempos.length - 1);
        const newItem = {
            uid,
            id:       alimentoPendiente.id,
            nombre:   alimentoPendiente.nombre,
            icono:    alimentoPendiente.icono,
            gramos:   g,
            por_100g: alimentoPendiente.por_100g,
        };
        updateTiempos(tiempos.map((t, i) =>
            i === idxActivo ? { ...t, alimentos: [...t.alimentos, newItem] } : t
        ));
        setBusqueda('');
        setAlimentoPendiente(null);
        setGramosPendiente('100');
    };

    const quitarAlimento = (tiempoIdx, uid) => {
        updateTiempos(tiempos.map((t, i) =>
            i === tiempoIdx ? { ...t, alimentos: t.alimentos.filter(a => a.uid !== uid) } : t
        ));
    };

    const actualizarGramos = (tiempoIdx, uid, gramos) => {
        const g = Number(gramos);
        if (g < 0) return;
        updateTiempos(tiempos.map((t, i) =>
            i === tiempoIdx
                ? { ...t, alimentos: t.alimentos.map(a => a.uid === uid ? { ...a, gramos: g } : a) }
                : t
        ));
    };

    const agregarTiempo = () => {
        const nombre = `Colación ${tiempos.length - 3}`;
        const newTiempos = [...tiempos, { id: `custom-${Date.now()}`, nombre, alimentos: [] }];
        updateTiempos(newTiempos);
        setTabActivo(newTiempos.length - 1);
    };

    const quitarTiempo = (idx) => {
        if (tiempos.length <= 1) return;
        const newTiempos = tiempos.filter((_, i) => i !== idx);
        updateTiempos(newTiempos);
        setTabActivo(prev => (prev >= newTiempos.length ? newTiempos.length - 1 : prev));
    };

    const iniciarEditar = (idx) => {
        setEditandoTab(idx);
        setNombreEditando(tiempos[idx].nombre);
    };

    const confirmarEditar = () => {
        if (editandoTab === null) return;
        const nombre = nombreEditando.trim() || tiempos[editandoTab].nombre;
        updateTiempos(tiempos.map((t, i) => i === editandoTab ? { ...t, nombre } : t));
        setEditandoTab(null);
        setNombreEditando('');
    };

    const idxActivo    = Math.min(tabActivo, tiempos.length - 1);
    const tiempoActivo = tiempos[idxActivo];
    const totalGeneral = sumarNutrientes(tiempos.flatMap(t => t.alimentos));
    const porcentaje   = objetivoCalorico && objetivoCalorico > 0
        ? Math.min(Math.round((totalGeneral.calorias / objetivoCalorico) * 100), 999)
        : null;
    const barColor = porcentaje == null ? '#22C55E'
        : porcentaje > 105 ? '#EF4444'
        : porcentaje > 90  ? '#F59E0B'
        : '#22C55E';

    return (
        <div style={{ background: 'var(--bg-card)' }}>

            {/* ── Tabs de tiempos de comida ── */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '10px 16px 0', borderBottom: '1px solid var(--border-color)' }}>
                {tiempos.map((t, i) => {
                    const esActivo = i === idxActivo;
                    return (
                        <div
                            key={t.id}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                padding: '5px 10px', borderRadius: '8px 8px 0 0',
                                background: esActivo ? 'rgba(34,197,94,0.10)' : 'transparent',
                                border: esActivo ? '1px solid rgba(34,197,94,0.25)' : '1px solid transparent',
                                borderBottom: esActivo ? '1px solid var(--bg-card)' : '1px solid transparent',
                                cursor: 'pointer',
                            }}
                        >
                            {editandoTab === i ? (
                                <>
                                    <input
                                        autoFocus
                                        value={nombreEditando}
                                        onChange={e => setNombreEditando(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && confirmarEditar()}
                                        onBlur={confirmarEditar}
                                        style={{ fontSize: '12px', fontWeight: 700, width: '80px', border: 'none', background: 'transparent', outline: 'none', color: '#15803D' }}
                                    />
                                    <button onClick={confirmarEditar} type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                                        <Check size={12} color="#15803D" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span
                                        onClick={() => setTabActivo(i)}
                                        style={{ fontSize: '12px', fontWeight: esActivo ? 700 : 500, color: esActivo ? '#15803D' : 'var(--text-secondary)', userSelect: 'none' }}
                                    >
                                        {t.nombre}
                                        {t.alimentos.length > 0 && (
                                            <span style={{ marginLeft: '4px', fontSize: '10px', background: 'rgba(34,197,94,0.2)', borderRadius: '999px', padding: '1px 5px', color: '#15803D', fontWeight: 800 }}>
                                                {t.alimentos.length}
                                            </span>
                                        )}
                                    </span>
                                    {!disabled && (
                                        <button onClick={() => iniciarEditar(i)} type="button" title="Renombrar" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', display: 'flex', opacity: 0.45 }}>
                                            <Edit2 size={9} />
                                        </button>
                                    )}
                                    {!disabled && tiempos.length > 1 && (
                                        <button onClick={() => quitarTiempo(i)} type="button" title="Eliminar tiempo" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', display: 'flex', opacity: 0.45, color: '#EF4444' }}>
                                            <X size={9} />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
                {!disabled && (
                    <button
                        type="button"
                        onClick={agregarTiempo}
                        style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '5px 9px', borderRadius: '8px 8px 0 0', background: 'transparent', border: '1px dashed rgba(34,197,94,0.4)', color: '#15803D', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                    >
                        <Plus size={10} /> Agregar
                    </button>
                )}
            </div>

            {/* ── Panel del tiempo activo ── */}
            <div style={{ padding: '14px 16px' }}>

                {/* Buscador */}
                {!disabled && (
                    <div ref={searchWrapRef} style={{ position: 'relative', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <Search size={13} style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                                <input
                                    value={busqueda}
                                    onChange={e => buscarAlimentos(e.target.value)}
                                    onFocus={() => sugerencias.length > 0 && setShowDropdown(true)}
                                    placeholder={`Buscar alimento para ${tiempoActivo.nombre}...`}
                                    style={{ width: '100%', paddingLeft: '30px', paddingRight: '10px', height: '34px', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-base)', outline: 'none', boxSizing: 'border-box', color: 'var(--text-primary)' }}
                                />
                                {cargandoBusqueda && (
                                    <span style={{ position: 'absolute', right: '9px', top: '50%', transform: 'translateY(-50%)', fontSize: '10px', color: 'var(--text-muted)' }}>...</span>
                                )}
                            </div>

                            {alimentoPendiente && (
                                <>
                                    <input
                                        type="number"
                                        min="1"
                                        max="9999"
                                        value={gramosPendiente}
                                        onChange={e => setGramosPendiente(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && agregarAlimento()}
                                        style={{ width: '64px', height: '34px', textAlign: 'center', fontSize: '13px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-base)', outline: 'none', color: 'var(--text-primary)' }}
                                    />
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>g</span>
                                    <button
                                        type="button"
                                        onClick={agregarAlimento}
                                        disabled={!gramosPendiente || Number(gramosPendiente) <= 0}
                                        style={{ height: '34px', padding: '0 12px', borderRadius: 'var(--radius-sm)', background: '#15803D', color: 'white', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0, opacity: (!gramosPendiente || Number(gramosPendiente) <= 0) ? 0.5 : 1 }}
                                    >
                                        <Plus size={13} /> Agregar
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Dropdown sugerencias */}
                        {showDropdown && sugerencias.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-md)', maxHeight: '210px', overflowY: 'auto', marginTop: '3px' }}>
                                {sugerencias.map(al => (
                                    <button
                                        key={al.id}
                                        type="button"
                                        onClick={() => seleccionarAlimento(al)}
                                        style={{ width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', borderBottom: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,197,94,0.06)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                                    >
                                        <span style={{ fontSize: '18px', flexShrink: 0 }}>{al.icono}</span>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{al.nombre}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                                                {al.por_100g.calorias} kcal · {al.por_100g.proteinas}g prot · {al.por_100g.carbohidratos}g carb · {al.por_100g.grasas}g gras <span style={{ opacity: 0.6 }}>por 100g</span>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Lista de alimentos del tiempo activo */}
                {tiempoActivo.alimentos.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '18px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
                        <UtensilsCrossed size={22} color="#15803D" style={{ opacity: 0.2 }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {disabled ? `Sin alimentos en ${tiempoActivo.nombre}` : `Busca un alimento para agregarlo a ${tiempoActivo.nombre}`}
                        </span>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                        {tiempoActivo.alimentos.map(al => {
                            const n = calcNutrientes(al, al.gramos);
                            return (
                                <div
                                    key={al.uid}
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-base)' }}
                                >
                                    <span style={{ fontSize: '16px', flexShrink: 0 }}>{al.icono}</span>
                                    <span style={{ flex: 1, fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {al.nombre}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                                        {disabled ? (
                                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>{al.gramos}g</span>
                                        ) : (
                                            <>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="9999"
                                                    value={al.gramos}
                                                    onChange={e => actualizarGramos(idxActivo, al.uid, e.target.value)}
                                                    style={{ width: '52px', height: '26px', textAlign: 'center', fontSize: '12px', border: '1px solid var(--border-color)', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                                />
                                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>g</span>
                                            </>
                                        )}
                                        <span style={{ fontSize: '11px', color: '#15803D', fontWeight: 700, padding: '2px 7px', background: 'rgba(34,197,94,0.10)', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                                            {n.calorias} kcal
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>P:{n.proteinas}g</span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>C:{n.carbohidratos}g</span>
                                        {!disabled && (
                                            <button
                                                type="button"
                                                onClick={() => quitarAlimento(idxActivo, al.uid)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: '2px', display: 'flex', flexShrink: 0 }}
                                            >
                                                <X size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Totales generales ── */}
                <div style={{ border: '1px solid rgba(34,197,94,0.20)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', background: 'rgba(34,197,94,0.04)' }}>
                    {/* Barra de progreso calórico */}
                    {objetivoCalorico && objetivoCalorico > 0 && (
                        <div style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                                    Objetivo calórico diario
                                </span>
                                <span style={{ fontSize: '12px', fontWeight: 800, color: barColor }}>
                                    {totalGeneral.calorias} / {objetivoCalorico} kcal ({porcentaje}%)
                                </span>
                            </div>
                            <div style={{ height: '7px', background: 'var(--border-color)', borderRadius: '999px', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${Math.min(porcentaje, 100)}%`,
                                    background: barColor,
                                    borderRadius: '999px',
                                    transition: 'width 0.4s ease, background-color 0.3s',
                                }} />
                            </div>
                        </div>
                    )}

                    {/* Resumen de macronutrientes */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center' }}>
                        {MACROS_CONFIG.map(m => (
                            <div key={m.key}>
                                <div style={{ fontSize: '14px', fontWeight: 800, color: m.color, lineHeight: 1.2 }}>
                                    {totalGeneral[m.key]}
                                </div>
                                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.3, marginTop: '2px' }}>
                                    {m.label}<br />{m.unit}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PanelMinuta;
