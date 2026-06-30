import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    FileSpreadsheet, FileText, Printer, Download,
    TrendingUp, ClipboardList, Receipt, FileDown,
    AlertCircle, CheckCircle2, Loader, Search,
    Calendar, ChevronRight, Clock, User
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
    formatCLP, formatFecha, formatFechaHora, nombreCompleto,
    generarPDFSesion, generarReciboHTML,
    fetchCitaCompleta, fetchCobroConCita,
} from '../helpers/reportes';
import { apiUrl } from '../helpers/api';

const COLOR_VERDE  = '#10B981';
const COLOR_MORADO = '#7C3AED';
const COLOR_AZUL   = '#3B82F6';
const COLOR_AMBER  = '#F59E0B';
const COLOR_GRIS   = '#6B7280';

const hoy = () => new Date().toISOString().split('T')[0];
const hace30 = () => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
};

/* ─── Alerta ────────────────────────────────────────────────────── */
const Alerta = ({ tipo, mensaje }) => {
    if (!mensaje) return null;
    const esError = tipo === 'error';
    return (
        <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            padding: '10px 14px', borderRadius: '8px', fontSize: '13px',
            backgroundColor: esError ? '#FEF2F2' : '#ECFDF5',
            color: esError ? '#DC2626' : '#059669',
            border: `1px solid ${esError ? '#FECACA' : '#A7F3D0'}`,
        }}>
            {esError ? <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} /> : <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: '1px' }} />}
            <span>{mensaje}</span>
        </div>
    );
};

/* ─── Tarjeta sección ───────────────────────────────────────────── */
const SeccionCard = ({ icono: Icono, titulo, descripcion, color, children }) => (
    <div style={{
        backgroundColor: 'var(--bg-card, #fff)',
        border: '1px solid var(--border-color, #E5E7EB)',
        borderRadius: '12px', padding: '24px',
        display: 'flex', flexDirection: 'column', gap: '16px',
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icono size={20} color={color} />
            </div>
            <div>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary, #111)' }}>{titulo}</h3>
                <p style={{ margin: 0, fontSize: '12px', color: COLOR_GRIS }}>{descripcion}</p>
            </div>
        </div>
        {children}
    </div>
);

/* ─── Input fecha ───────────────────────────────────────────────── */
const InputFecha = ({ label, value, onChange }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: COLOR_GRIS }}>{label}</label>
        <input type="date" value={value} onChange={e => onChange(e.target.value)}
            style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--border-color,#E5E7EB)', backgroundColor: 'var(--bg-input,#F9FAFB)', color: 'var(--text-primary,#111)', outline: 'none' }} />
    </div>
);

/* ─── Botón exportar ────────────────────────────────────────────── */
const BtnExportar = ({ onClick, loading, icono: Icono, label, color }) => (
    <button onClick={onClick} disabled={loading}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, backgroundColor: loading ? '#E5E7EB' : color, color: loading ? COLOR_GRIS : '#fff', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? <Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Icono size={15} />}
        {loading ? 'Generando...' : label}
    </button>
);

/* ─── Lista de items seleccionables ─────────────────────────────── */
const ListaSeleccionable = ({ items, renderItem, onSelect, loadingId, emptyMsg }) => {
    if (!items) return null;
    if (!items.length) return <p style={{ fontSize: '13px', color: COLOR_GRIS, padding: '12px 0' }}>{emptyMsg}</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '320px', overflowY: 'auto' }}>
            {items.map(item => {
                const isLoading = loadingId === item._key;
                return (
                    <div key={item._key}
                        onClick={() => !isLoading && onSelect(item)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            padding: '10px 14px', borderRadius: '8px',
                            border: '1px solid var(--border-color,#E5E7EB)',
                            cursor: isLoading ? 'wait' : 'pointer',
                            backgroundColor: isLoading ? '#F5F3FF' : 'var(--bg-input,#F9FAFB)',
                            transition: 'background-color 0.15s',
                        }}
                        onMouseEnter={e => { if (!isLoading) e.currentTarget.style.backgroundColor = '#F5F3FF'; }}
                        onMouseLeave={e => { if (!isLoading) e.currentTarget.style.backgroundColor = 'var(--bg-input,#F9FAFB)'; }}
                    >
                        <div style={{ flex: 1, minWidth: 0 }}>{renderItem(item)}</div>
                        {isLoading
                            ? <Loader size={16} color={COLOR_MORADO} style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                            : <ChevronRight size={16} color={COLOR_GRIS} style={{ flexShrink: 0 }} />
                        }
                    </div>
                );
            })}
        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════
   SECCIÓN 1 — Reporte financiero → Excel
══════════════════════════════════════════════════════════════════ */
const ReporteFinanciero = ({ token }) => {
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState(hoy());
    const [loading, setLoading] = useState(false);
    const [alerta, setAlerta]   = useState(null);

    const exportar = async () => {
        setAlerta(null); setLoading(true);
        try {
            const params = new URLSearchParams();
            if (desde) params.append('desde', desde);
            if (hasta) params.append('hasta', hasta);

            const res  = await fetch(apiUrl(`/caja/movimientos?${params}`), { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Error al obtener movimientos');

            const { movimientos, total_ingresos, subtotales_por_metodo } = json.data;
            if (!movimientos.length) { setAlerta({ tipo: 'error', mensaje: 'No hay movimientos en el rango seleccionado.' }); return; }

            const wb  = XLSX.utils.book_new();
            const ws1 = XLSX.utils.json_to_sheet(movimientos.map(m => ({
                'ID Transacción':      m.id_transaccion,
                'Fecha Pago':          formatFechaHora(m.fecha_pago),
                'Paciente':            nombreCompleto(m.paciente),
                'Servicio':            m.servicio?.nombre ?? '—',
                'Método de Pago':      m.metodo_pago,
                'Monto ($)':           Number(m.monto),
                'Estado Cobro':        m.cobro?.estado ?? '—',
                'Monto Total Cobro($)':Number(m.cobro?.monto_total ?? 0),
                'Notas':               m.notas ?? '',
            })));
            ws1['!cols'] = [{ wch: 14 }, { wch: 18 }, { wch: 24 }, { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 30 }];
            XLSX.utils.book_append_sheet(wb, ws1, 'Movimientos');

            const ws2 = XLSX.utils.aoa_to_sheet([
                ['Reporte Financiero NutriOne ERP'],
                ['Período', `${desde || 'Inicio'} — ${hasta || 'Hoy'}`],
                ['Generado el', formatFechaHora(new Date().toISOString())],
                [], ['RESUMEN DE INGRESOS'], ['Total General ($)', total_ingresos],
                [], ['Subtotales por Método de Pago'],
                ...Object.entries(subtotales_por_metodo).map(([k, v]) => [k, v]),
            ]);
            ws2['!cols'] = [{ wch: 30 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws2, 'Resumen');

            const nombre = `reporte_financiero_${desde || 'inicio'}_${hasta || hoy()}.xlsx`;
            XLSX.writeFile(wb, nombre);
            setAlerta({ tipo: 'exito', mensaje: `Archivo "${nombre}" generado.` });
        } catch (err) {
            setAlerta({ tipo: 'error', mensaje: err.message });
        } finally { setLoading(false); }
    };

    return (
        <SeccionCard icono={TrendingUp} titulo="Reporte Financiero" descripcion="Exporta el historial de pagos y movimientos de caja a Excel" color={COLOR_VERDE}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <InputFecha label="Desde" value={desde} onChange={setDesde} />
                <InputFecha label="Hasta" value={hasta} onChange={setHasta} />
                <BtnExportar onClick={exportar} loading={loading} icono={FileSpreadsheet} label="Exportar a Excel" color={COLOR_VERDE} />
            </div>
            <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />
        </SeccionCard>
    );
};

/* ══════════════════════════════════════════════════════════════════
   SECCIÓN 2 — Reporte de citas → Excel
══════════════════════════════════════════════════════════════════ */
const ReporteCitas = ({ token }) => {
    const [desde, setDesde]   = useState('');
    const [hasta, setHasta]   = useState(hoy());
    const [estado, setEstado] = useState('');
    const [loading, setLoading] = useState(false);
    const [alerta, setAlerta]   = useState(null);

    const exportar = async () => {
        setAlerta(null); setLoading(true);
        try {
            const params = new URLSearchParams();
            if (desde)  params.append('desde',  desde);
            if (hasta)  params.append('hasta',  hasta);
            if (estado) params.append('estado', estado);

            const res  = await fetch(apiUrl(`/citas?${params}`), { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Error al obtener citas');

            const citas = json.data;
            if (!citas.length) { setAlerta({ tipo: 'error', mensaje: 'No hay citas con los filtros seleccionados.' }); return; }

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(citas.map(c => ({
                'ID Cita':         c.id_cita,
                'Fecha':           formatFecha(c.fecha),
                'Hora Inicio':     c.hora_inicio?.substring(0, 5) ?? '—',
                'Hora Fin':        c.hora_fin?.substring(0, 5)   ?? '—',
                'Duración (min)':  c.duracion_minutos ?? '—',
                'Paciente':        nombreCompleto(c.paciente),
                'Nutricionista':   nombreCompleto(c.nutricionista),
                'Servicio':        c.servicio?.nombre ?? '—',
                'Precio ($)':      c.servicio?.precio != null ? Number(c.servicio.precio) : '—',
                'Estado':          c.estado,
                'Origen':          c.origen,
                'Observación':     c.observacion ?? '',
                'Motivo Cancelación': c.motivo_cancelacion ?? '',
            })));
            ws['!cols'] = [{ wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 24 }, { wch: 24 }, { wch: 22 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 30 }, { wch: 30 }];
            XLSX.utils.book_append_sheet(wb, ws, 'Citas');

            const conteo = citas.reduce((a, c) => { a[c.estado] = (a[c.estado] || 0) + 1; return a; }, {});
            const wsR = XLSX.utils.aoa_to_sheet([
                ['Reporte de Citas NutriOne ERP'],
                ['Período', `${desde || 'Inicio'} — ${hasta || 'Hoy'}`],
                ['Estado filtrado', estado || 'Todos'],
                ['Generado el', formatFechaHora(new Date().toISOString())],
                [], ['Total de citas', citas.length],
                [], ['Desglose por estado'],
                ...Object.entries(conteo).map(([k, v]) => [k, v]),
            ]);
            wsR['!cols'] = [{ wch: 28 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, wsR, 'Resumen');

            const nombre = `reporte_citas_${desde || 'inicio'}_${hasta || hoy()}.xlsx`;
            XLSX.writeFile(wb, nombre);
            setAlerta({ tipo: 'exito', mensaje: `Archivo "${nombre}" generado.` });
        } catch (err) {
            setAlerta({ tipo: 'error', mensaje: err.message });
        } finally { setLoading(false); }
    };

    return (
        <SeccionCard icono={ClipboardList} titulo="Reporte de Citas" descripcion="Exporta el listado completo de citas según los filtros aplicados" color={COLOR_MORADO}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <InputFecha label="Desde" value={desde} onChange={setDesde} />
                <InputFecha label="Hasta" value={hasta} onChange={setHasta} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: COLOR_GRIS }}>Estado</label>
                    <select value={estado} onChange={e => setEstado(e.target.value)}
                        style={{ padding: '8px 10px', borderRadius: '8px', fontSize: '13px', border: '1px solid var(--border-color,#E5E7EB)', backgroundColor: 'var(--bg-input,#F9FAFB)', color: 'var(--text-primary,#111)', outline: 'none', minWidth: '140px' }}>
                        <option value="">Todos los estados</option>
                        <option value="agendada">Agendada</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                    </select>
                </div>
                <BtnExportar onClick={exportar} loading={loading} icono={FileSpreadsheet} label="Exportar a Excel" color={COLOR_MORADO} />
            </div>
            <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />
        </SeccionCard>
    );
};

/* ══════════════════════════════════════════════════════════════════
   SECCIÓN 3 — PDF de sesión clínica (con búsqueda por fecha)
══════════════════════════════════════════════════════════════════ */
const PDFSesion = ({ token }) => {
    const [desde, setDesde]     = useState(hace30());
    const [hasta, setHasta]     = useState(hoy());
    const [citas, setCitas]     = useState(null);
    const [buscando, setBuscando] = useState(false);
    const [loadingId, setLoadingId] = useState(null);
    const [alerta, setAlerta]   = useState(null);

    const buscar = async () => {
        setAlerta(null); setBuscando(true); setCitas(null);
        try {
            const params = new URLSearchParams({ estado: 'completada' });
            if (desde) params.append('desde', desde);
            if (hasta) params.append('hasta', hasta);
            const res  = await fetch(apiUrl(`/citas?${params}`), { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Error al buscar citas');
            setCitas(json.data ?? []);
        } catch (err) {
            setAlerta({ tipo: 'error', mensaje: err.message });
        } finally { setBuscando(false); }
    };

    const generarPDF = async (item) => {
        setLoadingId(item._key); setAlerta(null);
        try {
            const { cita, ficha, evaluacion } = await fetchCitaCompleta(item.id_cita, token);
            generarPDFSesion(cita, ficha, evaluacion);
            setAlerta({ tipo: 'exito', mensaje: `PDF de la sesión de ${nombreCompleto(cita?.paciente)} generado.` });
        } catch (err) {
            setAlerta({ tipo: 'error', mensaje: err.message });
        } finally { setLoadingId(null); }
    };

    const items = citas?.map(c => ({ ...c, _key: c.id_cita })) ?? null;

    return (
        <SeccionCard icono={FileText} titulo="PDF de Sesión Clínica" descripcion="Genera el documento completo de una sesión para entregar al paciente (incluye medidas, evaluación, minuta e indicaciones)" color={COLOR_AZUL}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <InputFecha label="Desde" value={desde} onChange={setDesde} />
                <InputFecha label="Hasta" value={hasta} onChange={setHasta} />
                <BtnExportar onClick={buscar} loading={buscando} icono={Search} label="Buscar citas" color={COLOR_AZUL} />
            </div>

            {items !== null && (
                <ListaSeleccionable
                    items={items}
                    loadingId={loadingId}
                    emptyMsg="No hay citas completadas en ese rango de fechas."
                    onSelect={generarPDF}
                    renderItem={c => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: `${COLOR_AZUL}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <User size={16} color={COLOR_AZUL} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary,#111)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {nombreCompleto(c.paciente)}
                                </div>
                                <div style={{ fontSize: '11px', color: COLOR_GRIS, display: 'flex', gap: '8px', marginTop: '2px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Calendar size={11} />{formatFecha(c.fecha)}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={11} />{c.hora_inicio?.substring(0, 5)}</span>
                                    {c.servicio?.nombre && <span>· {c.servicio.nombre}</span>}
                                </div>
                            </div>
                        </div>
                    )}
                />
            )}

            <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />
            <p style={{ fontSize: '11px', color: COLOR_GRIS }}>
                Solo se muestran citas completadas. Haz clic en una para generar el PDF al instante.
            </p>
        </SeccionCard>
    );
};

/* ══════════════════════════════════════════════════════════════════
   SECCIÓN 4 — Recibo de pago (con búsqueda por fecha)
══════════════════════════════════════════════════════════════════ */
const ReciboPago = ({ token }) => {
    const [desde, setDesde]     = useState(hace30());
    const [hasta, setHasta]     = useState(hoy());
    const [cobros, setCobros]   = useState(null);
    const [buscando, setBuscando] = useState(false);
    const [loadingId, setLoadingId] = useState(null);
    const [alerta, setAlerta]   = useState(null);

    const buscar = async () => {
        setAlerta(null); setBuscando(true); setCobros(null);
        try {
            const params = new URLSearchParams();
            if (desde) params.append('desde', desde);
            if (hasta) params.append('hasta', hasta);
            const res  = await fetch(apiUrl(`/caja/movimientos?${params}`), { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Error al buscar cobros');

            // Deduplicar cobros únicos del listado de movimientos
            const cobroMap = new Map();
            for (const m of json.data?.movimientos ?? []) {
                if (m.cobro?.id_cobro && !cobroMap.has(m.cobro.id_cobro)) {
                    cobroMap.set(m.cobro.id_cobro, {
                        id_cobro:      m.cobro.id_cobro,
                        monto_total:   m.cobro.monto_total,
                        estado:        m.cobro.estado,
                        paciente:      m.paciente,
                        servicio:      m.servicio,
                        fecha_pago:    m.fecha_pago,
                        _key:          m.cobro.id_cobro,
                    });
                }
            }
            setCobros([...cobroMap.values()]);
        } catch (err) {
            setAlerta({ tipo: 'error', mensaje: err.message });
        } finally { setBuscando(false); }
    };

    const generarRecibo = async (item) => {
        setLoadingId(item._key); setAlerta(null);
        try {
            const { cobro, cita } = await fetchCobroConCita(item.id_cobro, token);
            const html = generarReciboHTML(cobro, cita);
            const w = window.open('', '_blank', 'width=560,height=820');
            w.document.write(html); w.document.close();
            setAlerta({ tipo: 'exito', mensaje: 'Recibo abierto en nueva ventana. Usa el botón "Imprimir" para guardarlo como PDF.' });
        } catch (err) {
            setAlerta({ tipo: 'error', mensaje: err.message });
        } finally { setLoadingId(null); }
    };

    const ESTADO_COLOR = { pagado: COLOR_VERDE, pagado_parcial: COLOR_AZUL, pendiente: COLOR_AMBER, anulado: COLOR_GRIS };
    const ESTADO_LABEL = { pagado: 'Pagado', pagado_parcial: 'Abono parcial', pendiente: 'Pendiente', anulado: 'Anulado' };

    return (
        <SeccionCard icono={Receipt} titulo="Recibo de Pago" descripcion="Genera e imprime el recibo de una atención para entregar al paciente" color={COLOR_AMBER}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <InputFecha label="Desde" value={desde} onChange={setDesde} />
                <InputFecha label="Hasta" value={hasta} onChange={setHasta} />
                <BtnExportar onClick={buscar} loading={buscando} icono={Search} label="Buscar cobros" color={COLOR_AMBER} />
            </div>

            {cobros !== null && (
                <ListaSeleccionable
                    items={cobros}
                    loadingId={loadingId}
                    emptyMsg="No hay pagos registrados en ese rango de fechas."
                    onSelect={generarRecibo}
                    renderItem={c => {
                        const color = ESTADO_COLOR[c.estado] ?? COLOR_GRIS;
                        return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Receipt size={16} color={color} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary,#111)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{nombreCompleto(c.paciente)}</span>
                                        <span style={{ fontSize: '11px', fontWeight: 700, color, backgroundColor: `${color}18`, padding: '1px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                                            {ESTADO_LABEL[c.estado] ?? c.estado}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '11px', color: COLOR_GRIS, display: 'flex', gap: '10px', marginTop: '2px' }}>
                                        <span>{c.servicio?.nombre ?? '—'}</span>
                                        <span style={{ fontWeight: 600 }}>{formatCLP(c.monto_total)}</span>
                                        <span><Calendar size={11} style={{ verticalAlign: 'middle' }} /> {formatFechaHora(c.fecha_pago)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }}
                />
            )}

            <Alerta tipo={alerta?.tipo} mensaje={alerta?.mensaje} />
            <p style={{ fontSize: '11px', color: COLOR_GRIS }}>
                Haz clic en un cobro para abrir el recibo en una nueva ventana e imprimirlo o guardarlo como PDF.
            </p>
        </SeccionCard>
    );
};

/* ══════════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════════ */
const ReportesManager = () => {
    const { token } = useAuth();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '820px' }}>
            <div style={{ padding: '14px 18px', backgroundColor: '#F5F3FF', borderRadius: '10px', border: '1px solid #DDD6FE', fontSize: '13px', color: '#5B21B6', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileDown size={18} color="#7C3AED" />
                <span>Exporta reportes financieros, listados de citas, documentos de sesión para pacientes y recibos de pago.</span>
            </div>
            <ReporteFinanciero token={token} />
            <ReporteCitas      token={token} />
            <PDFSesion         token={token} />
            <ReciboPago        token={token} />
        </div>
    );
};

export default ReportesManager;
