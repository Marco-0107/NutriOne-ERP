import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Salad, FlaskConical } from 'lucide-react';
import { buscarAlimentos, calcularNutrientes, getCategoriaById } from '../data/alimentosMock';

const NUTRIENTES = [
    { key: 'calorias',      label: 'Calorías',      unidad: 'kcal', color: '#6D28D9' },
    { key: 'proteinas',     label: 'Proteínas',     unidad: 'g',    color: '#10B981' },
    { key: 'carbohidratos', label: 'Carbohidratos', unidad: 'g',    color: '#F59E0B' },
    { key: 'grasas',        label: 'Grasas',        unidad: 'g',    color: '#EF4444' },
    { key: 'fibra',         label: 'Fibra',         unidad: 'g',    color: '#14B8A6' },
    { key: 'sodio',         label: 'Sodio',         unidad: 'mg',   color: '#3B82F6' },
];

const BasesNutricionales = () => {
    const [busqueda, setBusqueda]           = useState('');
    const [sugerencias, setSugerencias]     = useState([]);
    const [alimento, setAlimento]           = useState(null);
    const [medidaIdx, setMedidaIdx]         = useState(0);
    const [cantidad, setCantidad]           = useState(1);
    const [showSugerencias, setShowSugerencias] = useState(false);
    const searchRef = useRef(null);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowSugerencias(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleBusqueda = (valor) => {
        setBusqueda(valor);
        const resultados = buscarAlimentos(valor);
        setSugerencias(resultados);
        setShowSugerencias(resultados.length > 0);
    };

    const seleccionarAlimento = (item) => {
        setAlimento(item);
        setBusqueda(item.nombre);
        setSugerencias([]);
        setShowSugerencias(false);
        setMedidaIdx(0);
        setCantidad(1);
    };

    const limpiar = () => {
        setAlimento(null);
        setBusqueda('');
        setSugerencias([]);
        setCantidad(1);
        setMedidaIdx(0);
        searchRef.current?.focus();
    };

    const gramosActuales = alimento
        ? alimento.medidas[medidaIdx].gramos * cantidad
        : 0;

    const nutrientes = alimento ? calcularNutrientes(alimento, gramosActuales) : null;
    const categoria  = alimento ? getCategoriaById(alimento.id_categoria) : null;

    return (
        <div style={{ animation: 'slideIn 0.3s ease-out' }}>
            {/* Header */}
            <div className="welcome-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 className="welcome-title">Bases Nutricionales</h1>
                    <p className="welcome-text">
                        Consulta valores nutricionales de alimentos por cantidad y medida.
                    </p>
                </div>
                <span className="bn-badge-mockup">
                    <FlaskConical size={13} />
                    Datos de muestra — sprint futuro
                </span>
            </div>

            {/* Buscador */}
            <div className="bn-search-card" ref={wrapperRef}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Search size={15} />
                    Buscar alimento
                </label>
                <div className="bn-search-wrapper">
                    <input
                        ref={searchRef}
                        type="text"
                        className="form-input"
                        placeholder="Ej: manzana, pollo, arroz..."
                        value={busqueda}
                        onChange={(e) => handleBusqueda(e.target.value)}
                        onFocus={() => sugerencias.length > 0 && setShowSugerencias(true)}
                        autoComplete="off"
                    />
                    {busqueda && (
                        <button className="bn-clear-btn" onClick={limpiar} title="Limpiar">
                            <X size={16} />
                        </button>
                    )}

                    {showSugerencias && (
                        <ul className="bn-sugerencias">
                            {sugerencias.map((item) => {
                                const cat = getCategoriaById(item.id_categoria);
                                return (
                                    <li
                                        key={item.id}
                                        className="bn-sugerencia-item"
                                        onMouseDown={() => seleccionarAlimento(item)}
                                    >
                                        <span className="bn-cat-icono">{cat?.icono}</span>
                                        <div>
                                            <span className="bn-sugerencia-nombre">{item.nombre}</span>
                                            <span className="bn-sugerencia-cat">{cat?.nombre}</span>
                                        </div>
                                        <span className="bn-sugerencia-cal">{item.por_100g.calorias} kcal/100g</span>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                {busqueda.length >= 2 && sugerencias.length === 0 && !alimento && (
                    <p style={{ marginTop: '8px', fontSize: '13px', color: 'var(--texto-secundario, #6B7280)' }}>
                        No se encontraron alimentos con ese nombre.
                    </p>
                )}
            </div>

            {/* Panel de detalle */}
            {alimento && nutrientes && (
                <div className="bn-detalle-grid">
                    {/* Columna izquierda: alimento + cantidad */}
                    <div className="bn-info-card">
                        <div className="bn-alimento-header">
                            <span className="bn-cat-icono bn-cat-icono--lg">{categoria?.icono}</span>
                            <div>
                                <h3 className="bn-alimento-nombre">{alimento.nombre}</h3>
                                <span className="bn-categoria-chip">{categoria?.nombre}</span>
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '20px' }}>
                            <label className="form-label">Medida</label>
                            <select
                                className="form-input"
                                value={medidaIdx}
                                onChange={(e) => { setMedidaIdx(Number(e.target.value)); setCantidad(1); }}
                            >
                                {alimento.medidas.map((m, i) => (
                                    <option key={i} value={i}>{m.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Cantidad</label>
                            <input
                                type="number"
                                className="form-input"
                                min="1"
                                step="1"
                                value={cantidad}
                                onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                            />
                        </div>

                        <div className="bn-gramos-info">
                            <Salad size={14} />
                            Equivale a <strong>{gramosActuales.toFixed(1)} g</strong> de alimento
                        </div>
                    </div>

                    {/* Columna derecha: valores nutricionales */}
                    <div className="bn-nutrientes-card">
                        <h3 className="bn-nutrientes-titulo">Valores nutricionales</h3>
                        <p className="bn-nutrientes-subtitulo">
                            Para {gramosActuales.toFixed(1)}g de {alimento.nombre}
                        </p>

                        <div className="bn-nutrientes-lista">
                            {NUTRIENTES.map(({ key, label, unidad, color }) => {
                                const valor = nutrientes[key];
                                const max = key === 'calorias' ? 800 : key === 'sodio' ? 500 : 100;
                                const pct  = Math.min((valor / max) * 100, 100);
                                return (
                                    <div key={key} className="bn-nutriente-row">
                                        <div className="bn-nutriente-header-row">
                                            <span className="bn-nutriente-label">{label}</span>
                                            <span className="bn-nutriente-valor" style={{ color }}>
                                                {valor} <span className="bn-nutriente-unidad">{unidad}</span>
                                            </span>
                                        </div>
                                        <div className="bn-barra-bg">
                                            <div
                                                className="bn-barra-fill"
                                                style={{ width: `${pct}%`, backgroundColor: color }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <p className="bn-referencia-nota">
                            Valores de referencia por 100g: {alimento.por_100g.calorias} kcal ·{' '}
                            {alimento.por_100g.proteinas}g prot · {alimento.por_100g.carbohidratos}g carb ·{' '}
                            {alimento.por_100g.grasas}g grasas
                        </p>
                    </div>
                </div>
            )}

            {/* Estado vacío */}
            {!alimento && (
                <div className="bn-empty-state">
                    <span className="bn-empty-icono">🥗</span>
                    <p>Busca un alimento para ver sus valores nutricionales</p>
                </div>
            )}
        </div>
    );
};

export default BasesNutricionales;
