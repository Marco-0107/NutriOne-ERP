import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, AlertCircle, HeartPulse, Ruler, Sparkles } from 'lucide-react';
import { apiUrl } from '../helpers/api';
import {
	evaluarPaciente,
	PAL_CATEGORIAS,
	sugeridoMacros,
} from '../helpers/calculosNutricionales';

/**
 * Calculadora antropométrica / energética (Sprint 4).
 *
 * Recibe los datos base de la atención (edad, sexo, peso, talla, cintura) por
 * props y permite ingresar el resto de mediciones. Calcula TODO en vivo con el
 * helper espejo y notifica al padre vía onChange para persistir al guardar.
 *
 * Props:
 *  - datosBase:   { edad, sexo, peso, talla, circunferenciaCintura } (talla en cm)
 *  - initial:     evaluación existente (entidad) o null, para precargar
 *  - token:       JWT (para cargar el catálogo de patologías)
 *  - canGestionar: bool — si puede guardar (controla solo avisos, no el cálculo)
 *  - onChange:    (data) => void  con { input, ev, diagnostico, resumen, macrosValidos, requiereMacros, tieneMediciones }
 */

const TONO = {
	bien:  { bg: 'rgba(34,197,94,0.10)',  fg: '#15803D', bd: 'rgba(34,197,94,0.30)' },
	medio: { bg: 'rgba(245,158,11,0.12)', fg: '#B45309', bd: 'rgba(245,158,11,0.30)' },
	mal:   { bg: 'rgba(239,68,68,0.10)',  fg: '#B91C1C', bd: 'rgba(239,68,68,0.30)' },
	neutro:{ bg: 'var(--lavanda-suave)',  fg: 'var(--morado-primario)', bd: 'var(--border-color)' },
};

const tonoDe = (clasif) => {
	if (!clasif) return 'neutro';
	const c = clasif.toLowerCase();
	const BIEN = ['normal', 'eutrófico', 'sin riesgo', 'sin depleción', 'ginoide', 'sin pérdida significativa', 'talla normal alta'];
	const MEDIO = ['sobrepeso', 'riesgo de desnutrir', 'riesgo de sobrepeso', 'talla normal baja', 'talla alta', 'riesgo aumentado', 'mixta', 'pérdida significativa', 'evaluar con p/t'];
	if (BIEN.includes(c)) return 'bien';
	if (MEDIO.includes(c)) return 'medio';
	if (
		c.includes('obes') || c.includes('desnutrici') || c === 'talla baja' || c.includes('muy alto') ||
		c.includes('metabólico') || c.includes('depleción') || c === 'androide' || c.includes('severa') ||
		c === 'bajo peso' || c === 'déficit' || c === 'exceso'
	) return 'mal';
	return 'neutro';
};

const fmt = (v, suf = '') => (v === null || v === undefined ? 'N/D' : `${v}${suf}`);

/** Chip que muestra un resultado con su clasificación coloreada. */
const Resultado = ({ label, valor, suf, clasif }) => {
	const t = TONO[tonoDe(clasif)];
	return (
		<div style={{ border: `1px solid ${t.bd}`, background: t.bg, borderRadius: '10px', padding: '8px 10px' }}>
			<div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>{label}</div>
			<div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>{fmt(valor, suf)}</div>
			{clasif && <div style={{ fontSize: '11px', fontWeight: 700, color: t.fg, marginTop: '2px' }}>{clasif}</div>}
		</div>
	);
};

const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));

/** Construye el texto resumen que se guarda en ficha.calculos. */
function construirResumen(ev) {
	if (!ev) return '';
	const a = ev.antropometria, en = ev.energetico, m = ev.macros.distribucion;
	const L = [];
	L.push('[CÁLCULOS NUTRICIONALES]');
	L.push(`Etapa: ${ev.etapa.etiqueta}${a.imc.valor != null ? ` · IMC ${a.imc.valor} (${a.imc.clasificacion || 's/clasif'})` : ''}`);
	if (a.pesos.ideal != null) L.push(`Peso (kg): ideal ${a.pesos.ideal} / mín ${a.pesos.minimo} / máx ${a.pesos.maximo}${a.pesos.meta != null ? ` / meta ${a.pesos.meta}` : ''}`);
	const idx = [];
	if (a.cintura.clasificacion) idx.push(`cintura ${a.cintura.clasificacion}`);
	if (a.icc.valor != null) idx.push(`ICC ${a.icc.valor} (${a.icc.clasificacion})`);
	if (a.ica.valor != null) idx.push(`ICA ${a.ica.valor} (${a.ica.clasificacion})`);
	if (idx.length) L.push(`Índices: ${idx.join(' · ')}`);
	if (a.grasa.valor != null) L.push(`% grasa: ${a.grasa.valor}% (${a.grasa.clasificacion || a.grasa.metodo})`);
	if (a.reservas.cmb != null) L.push(`Reservas: CMB ${a.reservas.cmb} mm · AMB ${a.reservas.amb} mm² · AGB ${a.reservas.agb} mm²`);
	if (en.geb != null) L.push(`GEB ${en.geb} kcal · GET ${en.get} kcal (PAL ${en.pal}${en.fp ? ` · FP ${en.fp}` : ''})`);
	if (m && m.pro.gramos != null) L.push(`Macros: PRO ${m.pro.pct}%/${m.pro.gramos}g · CHO ${m.cho.pct}%/${m.cho.gramos}g · LIP ${m.lip.pct}%/${m.lip.gramos}g`);
	return L.join('\n');
}

const CalculosNutricionales = ({ datosBase = {}, initial = null, token, canGestionar = true, onChange }) => {
	// ── Estado de mediciones adicionales ──────────────────────────────────────
	const [med, setMed] = useState({
		pesoHabitual: '', periodoPP: '',
		muneca: '', cadera: '', cuello: '', pantorrilla: '', braquial: '', cefalico: '',
		tricipital: '', bicipital: '', subescapular: '', crestaIliaca: '', supraespinal: '', abdominal: '',
	});
	const [cfg, setCfg] = useState({
		actividadCategoria: 'sedentario', palOverride: '',
		hospitalizado: false, patologia: '', fp: '',
		imcMeta: '', maduracion: 'prepuber', embarazada: false, nodriza: false,
	});
	const [macros, setMacros] = useState({ pro: '', cho: '', lip: '' });
	const [macrosTocado, setMacrosTocado] = useState(false);
	const [diagnostico, setDiagnostico] = useState('');
	const [diagTocado, setDiagTocado] = useState(false);
	const [patologias, setPatologias] = useState([]);
	const [pediatriaServer, setPediatriaServer] = useState(null); // indicadores OMS (del backend)

	// ── Precarga desde una evaluación existente ───────────────────────────────
	useEffect(() => {
		if (!initial) return;
		setMed({
			pesoHabitual: initial.peso_habitual ?? '', periodoPP: '',
			muneca: initial.perimetro_muneca ?? '', cadera: initial.perimetro_cadera ?? '',
			cuello: initial.perimetro_cuello ?? '', pantorrilla: initial.perimetro_pantorrilla ?? '',
			braquial: initial.perimetro_braquial ?? '', cefalico: initial.perimetro_cefalico ?? '',
			tricipital: initial.pliegue_tricipital ?? '', bicipital: initial.pliegue_bicipital ?? '',
			subescapular: initial.pliegue_subescapular ?? '', crestaIliaca: initial.pliegue_cresta_iliaca ?? '',
			supraespinal: initial.pliegue_supraespinal ?? '', abdominal: initial.pliegue_abdominal ?? '',
		});
		setCfg((p) => ({
			...p,
			actividadCategoria: initial.nivel_actividad || 'sedentario',
			palOverride: initial.pal ?? '',
			hospitalizado: !!initial.es_hospitalizado,
			patologia: initial.patologia ?? '',
			fp: initial.fp ?? '',
		}));
		if (initial.pro_porcentaje != null) {
			setMacros({ pro: initial.pro_porcentaje, cho: initial.cho_porcentaje, lip: initial.lip_porcentaje });
			setMacrosTocado(true);
		}
		if (initial.diagnostico_generado) { setDiagnostico(initial.diagnostico_generado); setDiagTocado(true); }
	}, [initial]);

	// ── Catálogo de patologías (solo si se marca hospitalizado) ───────────────
	useEffect(() => {
		if (!cfg.hospitalizado || patologias.length || !token) return;
		fetch(apiUrl('/calculos/patologias'), { headers: { Authorization: `Bearer ${token}` } })
			.then((r) => (r.ok ? r.json() : { data: [] }))
			.then((d) => setPatologias(d.data || []))
			.catch(() => setPatologias([]));
	}, [cfg.hospitalizado, token, patologias.length]);

	// ── Construcción del input para el motor ──────────────────────────────────
	const input = useMemo(() => ({
		sexo: datosBase.sexo || null,
		edadAnios: num(datosBase.edad),
		pesoActual: num(datosBase.peso),
		tallaCm: num(datosBase.talla),
		pesoHabitual: num(med.pesoHabitual),
		periodoPP: med.periodoPP || null,
		imcMeta: num(cfg.imcMeta),
		maduracion: cfg.maduracion,
		embarazada: cfg.embarazada,
		nodriza: cfg.nodriza,
		perimetros: {
			muneca: num(med.muneca), cintura: num(datosBase.circunferenciaCintura), cadera: num(med.cadera),
			cuello: num(med.cuello), pantorrilla: num(med.pantorrilla), braquial: num(med.braquial), cefalico: num(med.cefalico),
		},
		pliegues: {
			tricipital: num(med.tricipital), bicipital: num(med.bicipital), subescapular: num(med.subescapular),
			crestaIliaca: num(med.crestaIliaca), supraespinal: num(med.supraespinal), abdominal: num(med.abdominal),
		},
		actividad: { categoria: cfg.actividadCategoria, pal: num(cfg.palOverride) },
		hospitalizado: cfg.hospitalizado,
		patologia: cfg.patologia || null,
		fp: num(cfg.fp),
		macros: { proPct: num(macros.pro), choPct: num(macros.cho), lipPct: num(macros.lip) },
	}), [datosBase, med, cfg, macros]);

	const ev = useMemo(() => evaluarPaciente(input), [input]);
	const etapa = ev.etapa.etapa;
	const esPediatrico = ev.etapa.esPediatrico;

	// Macros sugeridos al cambiar de etapa (si el usuario no los tocó).
	useEffect(() => {
		if (macrosTocado) return;
		const s = sugeridoMacros(etapa);
		setMacros({ pro: s.pro, cho: s.cho, lip: s.lip });
	}, [etapa, macrosTocado]);

	// Diagnóstico autogenerado (hasta que el usuario lo edite).
	useEffect(() => {
		if (!diagTocado) setDiagnostico(ev.diagnostico || '');
	}, [ev.diagnostico, diagTocado]);

	// ── Notificar al padre ────────────────────────────────────────────────────
	const tieneMediciones = useMemo(() => {
		const p = input.perimetros, pl = input.pliegues;
		return [
			input.pesoHabitual, ...Object.values(p), ...Object.values(pl),
		].some((v) => v !== null) || cfg.hospitalizado;
	}, [input, cfg.hospitalizado]);

	const notifSig = JSON.stringify({ input, diagnostico });
	useEffect(() => {
		onChange?.({
			input,
			ev,
			diagnostico,
			resumen: construirResumen(ev),
			macrosValidos: ev.macros.validacion.valido,
			requiereMacros: ev.energetico.get != null,
			tieneMediciones,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [notifSig]);

	// Indicadores pediátricos (P/E, T/E, IMC/E, PCe/E): los calcula el backend con
	// las tablas OMS. Se piden con debounce solo en etapa pediátrica.
	useEffect(() => {
		if (!esPediatrico || !token) { setPediatriaServer(null); return; }
		const id = setTimeout(async () => {
			try {
				const r = await fetch(apiUrl('/calculos/preview'), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
					body: JSON.stringify(input),
				});
				const d = await r.json();
				if (r.ok) setPediatriaServer(d.data?.pediatria || null);
			} catch { /* sin red: se mantiene lo último */ }
		}, 500);
		return () => clearTimeout(id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [notifSig, esPediatrico, token]);

	const setM = (k) => (e) => setMed((p) => ({ ...p, [k]: e.target.value }));
	const setC = (k) => (e) => setCfg((p) => ({ ...p, [k]: e.target.value }));
	const setMacro = (k) => (e) => { setMacrosTocado(true); setMacros((p) => ({ ...p, [k]: e.target.value })); };

	const a = ev.antropometria;
	const rangos = ev.macros.rangos;
	const enRango = ev.macros.enRango;
	const validacion = ev.macros.validacion;
	const palCat = PAL_CATEGORIAS[cfg.actividadCategoria];

	const inputMini = { padding: '6px 8px', fontSize: '13px' };
	const seccionTitulo = (icon, texto, color) => (
		<div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', fontWeight: 800, color, letterSpacing: '0.5px', textTransform: 'uppercase', margin: '6px 0 10px' }}>
			{icon}{texto}
		</div>
	);

	return (
		<div style={{ padding: '16px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
			{/* Banner de etapa */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'var(--lavanda-suave)', borderRadius: '10px', padding: '8px 12px', flexWrap: 'wrap' }}>
				<span style={{ fontSize: '13px', color: 'var(--morado-primario)', fontWeight: 700 }}>
					Etapa: {ev.etapa.etiqueta}{ev.edadTexto ? ` · ${ev.edadTexto}` : ''}
				</span>
				<label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
					<input type="checkbox" checked={cfg.embarazada} onChange={(e) => setCfg((p) => ({ ...p, embarazada: e.target.checked, nodriza: false }))} style={{ accentColor: 'var(--morado-primario)' }} />
					Embarazada
				</label>
			</div>

			{/* ── MEDICIONES ── */}
			<div>
				{seccionTitulo(<Ruler size={13} />, 'Mediciones antropométricas', 'var(--morado-primario)')}
				<p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '-4px 0 10px' }}>
					Peso, talla, sexo, edad y cintura se toman de la atención (arriba). Perímetros en cm; pliegues en mm.
				</p>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
					<Campo label="Peso habitual (kg)" value={med.pesoHabitual} onChange={setM('pesoHabitual')} style={inputMini} />
					<div className="form-group" style={{ marginBottom: 0 }}>
						<label className="form-label" style={{ fontSize: '11px' }}>Periodo pérdida</label>
						<select className="form-input" style={inputMini} value={med.periodoPP} onChange={setM('periodoPP')}>
							<option value="">—</option><option value="1s">1 semana</option><option value="1m">1 mes</option>
							<option value="3m">3 meses</option><option value="6m">6 meses</option>
						</select>
					</div>
					<Campo label="P. muñeca (cm)" value={med.muneca} onChange={setM('muneca')} style={inputMini} />
					<Campo label="P. cadera (cm)" value={med.cadera} onChange={setM('cadera')} style={inputMini} />
					<Campo label="P. cuello (cm)" value={med.cuello} onChange={setM('cuello')} style={inputMini} />
					<Campo label="P. pantorrilla (cm)" value={med.pantorrilla} onChange={setM('pantorrilla')} style={inputMini} />
					<Campo label="P. braquial (cm)" value={med.braquial} onChange={setM('braquial')} style={inputMini} />
					<Campo label="P. cefálico (cm)" value={med.cefalico} onChange={setM('cefalico')} style={inputMini} />
					<Campo label="Pliegue tricipital (mm)" value={med.tricipital} onChange={setM('tricipital')} style={inputMini} />
					<Campo label="Pliegue bicipital (mm)" value={med.bicipital} onChange={setM('bicipital')} style={inputMini} />
					<Campo label="Pliegue subescapular (mm)" value={med.subescapular} onChange={setM('subescapular')} style={inputMini} />
					<Campo label="Pliegue cresta ilíaca (mm)" value={med.crestaIliaca} onChange={setM('crestaIliaca')} style={inputMini} />
					<Campo label="Pliegue supraespinal (mm)" value={med.supraespinal} onChange={setM('supraespinal')} style={inputMini} />
					<Campo label="Pliegue abdominal (mm)" value={med.abdominal} onChange={setM('abdominal')} style={inputMini} />
					<Campo label="IMC meta (obesidad)" value={cfg.imcMeta} onChange={setC('imcMeta')} style={inputMini} />
				</div>
			</div>

			{/* ── RESULTADOS ANTROPOMÉTRICOS ── */}
			<div>
				{seccionTitulo(<Sparkles size={13} />, 'Resultados antropométricos', '#0F766E')}
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
					<Resultado label="IMC (kg/m²)" valor={a.imc.valor} clasif={a.imc.clasificacion} />
					<Resultado label="Peso ideal (kg)" valor={a.pesos.ideal} />
					<Resultado label="Peso mín–máx (kg)" valor={a.pesos.minimo != null ? `${a.pesos.minimo}–${a.pesos.maximo}` : null} />
					<Resultado label="Peso meta (kg)" valor={a.pesos.meta} />
					<Resultado label="% pérdida peso" valor={a.perdidaPeso.valor} suf="%" clasif={a.perdidaPeso.clasificacion} />
					<Resultado label="Contextura" valor={a.contextura.valor} clasif={a.contextura.clasificacion} />
					<Resultado label="Cuello" valor={a.cuello.valor} suf=" cm" clasif={a.cuello.clasificacion} />
					<Resultado label="Cintura" valor={a.cintura.valor} suf=" cm" clasif={a.cintura.clasificacion} />
					<Resultado label="ICA" valor={a.ica.valor} clasif={a.ica.clasificacion} />
					<Resultado label="ICC" valor={a.icc.valor} clasif={a.icc.clasificacion} />
					<Resultado label="Pantorrilla" valor={a.pantorrilla.valor} suf=" cm" clasif={a.pantorrilla.clasificacion} />
					<Resultado label={`% grasa${a.grasa.metodo ? ` (${a.grasa.metodo})` : ''}`} valor={a.grasa.valor} suf="%" clasif={a.grasa.clasificacion} />
					<Resultado label="CMB (mm)" valor={a.reservas.cmb} />
					<Resultado label="AMB (mm²)" valor={a.reservas.amb} />
					<Resultado label="AGB (mm²)" valor={a.reservas.agb} />
				</div>
			</div>

			{/* ── INDICADORES PEDIÁTRICOS (OMS) ── */}
			{esPediatrico && (
				<div>
					{seccionTitulo(<Sparkles size={13} />, 'Indicadores pediátricos (MINSAL · Z-score / percentil)', '#0F766E')}
					{!pediatriaServer ? (
						<p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Calculando con tablas MINSAL…</p>
					) : (
						<>
							{pediatriaServer.calificacion?.clasificacion && (() => {
								const t = TONO[tonoDe(pediatriaServer.calificacion.clasificacion)];
								return (
									<div style={{ border: `1px solid ${t.bd}`, background: t.bg, borderRadius: '10px', padding: '10px 12px', marginBottom: '10px' }}>
										<span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Calificación nutricional ({pediatriaServer.calificacion.indicador}): </span>
										<span style={{ fontSize: '15px', fontWeight: 800, color: t.fg }}>{pediatriaServer.calificacion.clasificacion}</span>
										{pediatriaServer.calificacion.z != null && <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}> · Z {pediatriaServer.calificacion.z}</span>}
									</div>
								);
							})()}
							<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
								{[
									['peso_edad', 'P/E (peso/edad)'],
									['talla_edad', 'T/E (talla/edad)'],
									['peso_talla', 'P/T (peso/talla)'],
									['imc_edad', 'IMC/E'],
								].map(([k, label]) => {
									const r = pediatriaServer[k];
									const disp = r && r.disponible;
									const t = TONO[disp ? tonoDe(r.clasificacion) : 'neutro'];
									return (
										<div key={k} style={{ border: `1px solid ${t.bd}`, background: t.bg, borderRadius: '10px', padding: '8px 10px' }}>
											<div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '2px' }}>
												{label}{r && r.subtabla ? ` · ${r.subtabla}` : ''}
											</div>
											{disp ? (
												<div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
													Z {r.z} · P{r.percentil}
													<span style={{ color: t.fg, fontWeight: 700 }}> · {r.clasificacion}</span>
												</div>
											) : (
												<div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>N/D{r && r.motivo ? ` — ${r.motivo}` : ''}</div>
											)}
										</div>
									);
								})}
							</div>
						</>
					)}
				</div>
			)}

			{/* ── REQUERIMIENTO ENERGÉTICO ── */}
			<div>
				{seccionTitulo(<Activity size={13} />, 'Requerimiento energético (GEB → GET)', '#B45309')}
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
					<div className="form-group" style={{ marginBottom: 0 }}>
						<label className="form-label" style={{ fontSize: '11px' }}>Nivel de actividad</label>
						<select className="form-input" style={inputMini} value={cfg.actividadCategoria} onChange={(e) => setCfg((p) => ({ ...p, actividadCategoria: e.target.value, palOverride: '' }))}>
							{Object.entries(PAL_CATEGORIAS).map(([k, v]) => (
								<option key={k} value={k}>{v.etiqueta} ({v.min}–{v.max})</option>
							))}
						</select>
					</div>
					<Campo label={`PAL (def ${palCat?.sugerido})`} value={cfg.palOverride} onChange={setC('palOverride')} style={inputMini} placeholder={String(palCat?.sugerido ?? '')} />
					<div className="form-group" style={{ marginBottom: 0, display: 'flex', alignItems: 'flex-end' }}>
						<label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer', paddingBottom: '6px' }}>
							<input type="checkbox" checked={cfg.hospitalizado} onChange={(e) => setCfg((p) => ({ ...p, hospitalizado: e.target.checked }))} style={{ accentColor: 'var(--morado-primario)' }} />
							<HeartPulse size={13} /> Hospitalizado
						</label>
					</div>
				</div>
				{cfg.hospitalizado && (
					<div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px', marginBottom: '12px' }}>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label" style={{ fontSize: '11px' }}>Patología (Factor Patología)</label>
							<select className="form-input" style={inputMini} value={cfg.patologia} onChange={(e) => {
								const sel = patologias.find((x) => x.patologia === e.target.value);
								const s = (datosBase.sexo || '').toLowerCase().startsWith('m') ? 'hombres' : 'mujeres';
								setCfg((p) => ({ ...p, patologia: e.target.value, fp: sel ? sel[s].sugerido : '' }));
							}}>
								<option value="">Seleccionar patología…</option>
								{patologias.map((x) => <option key={x.patologia} value={x.patologia}>{x.patologia}</option>)}
							</select>
						</div>
						<Campo label="FP" value={cfg.fp} onChange={setC('fp')} style={inputMini} />
					</div>
				)}
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
					<Resultado label="GEB / basal (kcal/día)" valor={ev.energetico.geb} />
					<Resultado label="PAL aplicado" valor={ev.energetico.pal} />
					<Resultado label="GET / total (kcal/día)" valor={ev.energetico.get} clasif={cfg.hospitalizado && ev.energetico.fp ? `FP ${ev.energetico.fp}` : null} />
				</div>
				{ev.energetico.geb == null && num(datosBase.edad) != null && num(datosBase.edad) < 18 && (
					<p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
						GEB no disponible: las ecuaciones FAO del documento cubren edad ≥ 18 años.
					</p>
				)}
			</div>

			{/* ── MACRONUTRIENTES ── */}
			<div>
				{seccionTitulo(<Activity size={13} />, `Macronutrientes (rangos ${ev.etapa.etiqueta})`, 'var(--morado-primario)')}
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
					{[
						{ k: 'pro', nom: 'Proteínas', rango: rangos.pro, dist: ev.macros.distribucion?.pro, ok: enRango.pro },
						{ k: 'cho', nom: 'Carbohidratos', rango: rangos.cho, dist: ev.macros.distribucion?.cho, ok: enRango.cho },
						{ k: 'lip', nom: 'Lípidos', rango: rangos.lip, dist: ev.macros.distribucion?.lip, ok: enRango.lip },
					].map(({ k, nom, rango, dist, ok }) => (
						<div key={k} style={{ border: `1px solid ${ok ? 'rgba(34,197,94,0.3)' : 'var(--border-color)'}`, borderRadius: '10px', padding: '10px' }}>
							<div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>{nom}</div>
							<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
								<input type="number" className="form-input" style={{ ...inputMini, width: '70px' }} value={macros[k]} onChange={setMacro(k)} />
								<span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>%</span>
							</div>
							<div style={{ fontSize: '11px', color: ok ? '#15803D' : '#B45309', marginTop: '4px', fontWeight: 600 }}>
								Rango {rango[0]}–{rango[1]}%
							</div>
							<div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
								{dist?.gramos != null ? `${dist.gramos} g · ${dist.kcal} kcal` : 'N/D'}
							</div>
						</div>
					))}
				</div>
				<div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: validacion.valido ? '#15803D' : '#B91C1C' }}>
					{!validacion.valido && <AlertCircle size={15} />}
					Suma: {validacion.suma}% {validacion.valido ? '✓' : `— ${validacion.mensaje}`}
				</div>
			</div>

			{/* ── DIAGNÓSTICO ── */}
			<div>
				{seccionTitulo(<Sparkles size={13} />, 'Diagnóstico nutricional (editable)', '#0F766E')}
				<textarea
					className="form-input"
					rows="4"
					value={diagnostico}
					onChange={(e) => { setDiagTocado(true); setDiagnostico(e.target.value); }}
					placeholder="El diagnóstico se genera automáticamente; puedes editarlo."
				/>
				<button
					type="button"
					onClick={() => { setDiagTocado(false); setDiagnostico(ev.diagnostico || ''); }}
					style={{ marginTop: '6px', fontSize: '12px', color: 'var(--morado-primario)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
				>
					↺ Regenerar diagnóstico automático
				</button>
				{!canGestionar && (
					<p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
						No tienes permiso <code>calculos:gestionar</code>: los cálculos se mostrarán pero no se guardarán.
					</p>
				)}
			</div>
		</div>
	);
};

/** Input numérico compacto reutilizable. */
const Campo = ({ label, value, onChange, style, placeholder }) => (
	<div className="form-group" style={{ marginBottom: 0 }}>
		<label className="form-label" style={{ fontSize: '11px' }}>{label}</label>
		<input type="number" step="0.1" min="0" className="form-input" style={style} value={value} onChange={onChange} placeholder={placeholder} />
	</div>
);

export default CalculosNutricionales;
