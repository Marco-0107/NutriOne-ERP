import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	AlertCircle,
	Ban,
	CalendarDays,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	CircleCheckBig,
	Clock3,
	ClipboardPlus,
	Calculator,
	Apple,
	MapPin,
	Plus,
	Sparkles,
	UserRoundPlus,
	UserRound,
	Weight,
	Wallet,
	ShieldCheck,
	FileText,
	Loader,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../helpers/api';
import { generarPDFSesion, fetchCitaCompleta } from '../helpers/reportes';
import { validarFechaNoPasada, validarFechaNoFutura } from '../helpers/validaciones';
import CalculosNutricionales from './CalculosNutricionales';
import PanelMinuta from './PanelMinuta';

const WEEKDAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const WEEKDAY_SHORT = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];

const EVENT_STYLES = {
	confirmada: { accent: '#14B8A6', background: 'rgba(20, 184, 166, 0.08)', text: '#0F766E', label: 'Confirmada', icon: CircleCheckBig },
	pendiente: { accent: '#F59E0B', background: 'rgba(245, 158, 11, 0.10)', text: '#B45309', label: 'Pendiente', icon: AlertCircle },
	completada: { accent: '#22C55E', background: 'rgba(34, 197, 94, 0.08)', text: '#15803D', label: 'Completada', icon: CircleCheckBig },
	cancelada: { accent: '#EF4444', background: 'rgba(239, 68, 68, 0.08)', text: '#B91C1C', label: 'Cancelada', icon: AlertCircle },
	default: { accent: '#6B7280', background: 'rgba(107, 114, 128, 0.10)', text: '#374151', label: 'Programada', icon: Sparkles },
};

const INITIAL_CREATE_FORM = {
	id_paciente: '',
	id_usuario: '',
	id_servicio: '',
	fecha: '',
	hora_inicio: '',
	hora_fin: '',
	observacion: '',
};

const formatCLP = (value) =>
	new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(value) || 0);

const PREVISION_LABELS = { particular: 'Particular', fonasa: 'Fonasa', isapre: 'Isapre' };

const formatDate = (date) =>
	new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(date);

const toISODateLocal = (date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

const getWeekStart = (date) => {
	const clone = new Date(date);
	const currentDay = clone.getDay();
	const diff = currentDay === 0 ? -6 : 1 - currentDay;
	clone.setDate(clone.getDate() + diff);
	clone.setHours(0, 0, 0, 0);
	return clone;
};

const shiftWeek = (date, offset) => {
	const clone = new Date(date);
	clone.setDate(clone.getDate() + offset * 7);
	return clone;
};

const getFullName = (person) => {
	if (!person) return '';
	return [person.nombres, person.apellido_paterno, person.apellido_materno].filter(Boolean).join(' ').trim();
};

const Calendario = () => {
	const { token, user, hasPermission } = useAuth();
	const navigate = useNavigate();
	const [weekAnchor, setWeekAnchor] = useState(() => new Date());
	const [citas, setCitas] = useState([]);
	const [pacientes, setPacientes] = useState([]);
	const [nutricionistas, setNutricionistas] = useState([]);
	const [servicios, setServicios] = useState([]);
	const [slots, setSlots] = useState([]);
	const [loading, setLoading] = useState(true);
	const [pacientesLoading, setPacientesLoading] = useState(false);
	const [nutricionistasLoading, setNutricionistasLoading] = useState(false);
	const [serviciosLoading, setServiciosLoading] = useState(false);
	const [slotsLoading, setSlotsLoading] = useState(false);
	const [error, setError] = useState('');
	const [pacientesError, setPacientesError] = useState('');
	const [createOpen, setCreateOpen] = useState(false);
	const [createError, setCreateError] = useState('');
	const [createLoading, setCreateLoading] = useState(false);
	const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
	const [cancelOpen, setCancelOpen] = useState(false);
	const [cancelCita, setCancelCita] = useState(null);
	const [cancelMotivo, setCancelMotivo] = useState('');
	const [cancelLoading, setCancelLoading] = useState(false);
	const [cancelError, setCancelError] = useState('');

	// ── Atención médica (Ficha Clínica) ──────────────────────────────────────
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
	const [atencionOpen, setAtencionOpen] = useState(false);
	const [atencionCita, setAtencionCita] = useState(null);
	const [atencionFicha, setAtencionFicha] = useState(null); // ficha existente o null
	const [atencionForm, setAtencionForm] = useState(INITIAL_ATENCION_FORM);
	const [atencionLoading, setAtencionLoading] = useState(false);
	const [atencionFetchLoading, setAtencionFetchLoading] = useState(false);
	const [atencionError, setAtencionError] = useState('');
	const [atencionSuccess, setAtencionSuccess] = useState(false);
	const [usaNombreSocial, setUsaNombreSocial] = useState(false);
	const [panelCalculadoraOpen, setPanelCalculadoraOpen] = useState(false);
	const [panelAlimentosOpen, setPanelAlimentosOpen] = useState(false);
	const [atencionEvaluacion, setAtencionEvaluacion] = useState(null); // evaluación nutricional existente
	const [minutaState, setMinutaState]               = useState(null); // minuta dietética de la atención
	const [objetivoCalorico, setObjetivoCalorico]     = useState(null); // GET en kcal/día
	const calculoDataRef = useRef(null); // datos en vivo de la calculadora (sin re-render)
	const [pdfLoadingCitaId, setPdfLoadingCitaId] = useState(null);

	const [dayGroupIndex, setDayGroupIndex] = useState(0);

	const weekStart = useMemo(() => getWeekStart(weekAnchor), [weekAnchor]);

	const weekDays = useMemo(() => {
		return Array.from({ length: 7 }, (_, index) => {
			const date = new Date(weekStart);
			date.setDate(weekStart.getDate() + index);
			return {
				date,
				label: WEEKDAY_LABELS[index],
				shortLabel: WEEKDAY_SHORT[index],
				isToday: date.toDateString() === new Date().toDateString(),
			};
		});
	}, [weekStart]);

	const currentUserId = user?.id || '';
	const isCurrentUserNutricionista = Array.isArray(user?.roles)
		&& user.roles.some((role) => String(role).trim().toLowerCase() === 'nutricionista');

	const fetchCitas = async () => {
		setLoading(true);
		setError('');

		try {
			const desde = toISODateLocal(weekDays[0].date);
			const hasta = toISODateLocal(weekDays[6].date);
			const usuarioParam = isCurrentUserNutricionista ? `&id_usuario=${currentUserId}` : '';
			const response = await fetch(apiUrl(`/citas?desde=${desde}&hasta=${hasta}${usuarioParam}`), {
				headers: { Authorization: `Bearer ${token}` },
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.message || 'Error al obtener las citas del calendario');
			}

			setCitas(data.data || []);
		} catch (err) {
			setError(err.message || 'Error de conexión con el servidor');
			setCitas([]);
		} finally {
			setLoading(false);
		}
	};

	const fetchPacientes = async () => {
		if (!token) {
			setPacientes([]);
			return;
		}

		setPacientesLoading(true);
		setPacientesError('');

		try {
			const response = await fetch(apiUrl('/pacientes'), {
				headers: { Authorization: `Bearer ${token}` },
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.message || 'Error al obtener pacientes');
			}

			setPacientes(data.data || []);
		} catch (err) {
			setPacientes([]);
			setPacientesError(err.message || 'No se pudo cargar la lista de pacientes');
		} finally {
			setPacientesLoading(false);
		}
	};

	useEffect(() => {
		fetchCitas();
	}, [weekDays]);

	const fetchSlots = async (nutricionistaId, fecha, duracionMinutos) => {
		if (!nutricionistaId || !fecha) { setSlots([]); return; }
		setSlotsLoading(true);
		try {
			const duracionParam = duracionMinutos ? `&duracion=${duracionMinutos}` : '';
			const response = await fetch(apiUrl(`/public/disponibilidad/${nutricionistaId}?fecha=${fecha}${duracionParam}`));
			const data = await response.json();
			setSlots(response.ok ? (data.data || []) : []);
		} catch {
			setSlots([]);
		} finally {
			setSlotsLoading(false);
		}
	};

	const fetchServicios = async (nutricionistaId) => {
		if (!nutricionistaId || !token) { setServicios([]); return; }
		setServiciosLoading(true);
		try {
			const response = await fetch(apiUrl(`/servicios?id_user=${nutricionistaId}`), {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await response.json();
			setServicios(response.ok ? (data.data || []) : []);
		} catch {
			setServicios([]);
		} finally {
			setServiciosLoading(false);
		}
	};

	const fetchNutricionistas = async () => {
		setNutricionistasLoading(true);
		try {
			const response = await fetch(apiUrl('/public/nutricionistas'));
			const data = await response.json();
			setNutricionistas(response.ok ? (data.data || []) : []);
		} catch {
			setNutricionistas([]);
		} finally {
			setNutricionistasLoading(false);
		}
	};

	useEffect(() => {
		if (createOpen) {
			fetchPacientes();
			if (!isCurrentUserNutricionista) fetchNutricionistas();
			else fetchServicios(currentUserId);
		}
	}, [createOpen, token]);

	const eventsByDay = useMemo(() => {
		return weekDays.map((day) => {
			const dayKey = toISODateLocal(day.date);
			return citas.filter((cita) => toISODateLocal(new Date(`${cita.fecha}T12:00:00`)) === dayKey);
		});
	}, [citas, weekDays]);

	const stats = useMemo(() => {
		const total = citas.length;
		const confirmed = citas.filter((event) => event.estado === 'confirmada').length;
		const pending = citas.filter((event) => event.estado === 'pendiente').length;
		return { total, confirmed, pending };
	}, [citas]);

	const weekLabel = `${formatDate(weekDays[0].date)} - ${formatDate(weekDays[6].date)}`;
	const goToCurrentWeek = () => setWeekAnchor(new Date());

	// Auto-selecciona el grupo que contiene el día actual al cambiar de semana
	useEffect(() => {
		const todayIndex = weekDays.findIndex((d) => d.isToday);
		if (todayIndex >= 0) {
			setDayGroupIndex(todayIndex < 3 ? 0 : todayIndex < 6 ? 1 : 2);
		} else {
			setDayGroupIndex(0);
		}
	}, [weekStart]);

	const getCitaStyle = (estado) => EVENT_STYLES[estado] || EVENT_STYLES.default;

	const formatPacienteOption = (paciente) => {
		const nombreCompleto = getFullName(paciente.usuario) || `Paciente ${paciente.id}`;
		const rut = paciente.usuario?.rut ? ` - ${paciente.usuario.rut}` : '';
		return `${nombreCompleto}${rut}`;
	};

	const openCreateModal = (cita = null) => {
		const fecha = cita?.fecha || toISODateLocal(new Date());
		setCreateForm({
			id_paciente: cita?.paciente?.id ? String(cita.paciente.id) : '',
			id_usuario: currentUserId ? String(currentUserId) : '',
			id_servicio: cita?.servicio?.id ? String(cita.servicio.id) : '',
			fecha,
			hora_inicio: '',
			hora_fin: '',
			observacion: '',
		});
		setCreateError('');
		setSlots([]);
		setServicios([]);
		setCreateOpen(true);
		if (isCurrentUserNutricionista && currentUserId) {
			const duracion = cita?.servicio?.duracion_minutos;
			fetchSlots(currentUserId, fecha, duracion);
		}
	};

	const closeCreateModal = () => {
		setCreateOpen(false);
		setCreateError('');
		setCreateForm(INITIAL_CREATE_FORM);
		setSlots([]);
		setServicios([]);
	};

	const handleCreateChange = (field) => (e) => {
		setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));
	};

	const handleFechaChange = (e) => {
		const fecha = e.target.value;
		const nutId = isCurrentUserNutricionista ? currentUserId : createForm.id_usuario;
		const servicioSeleccionado = servicios.find((s) => String(s.id) === createForm.id_servicio);
		setCreateForm((prev) => ({ ...prev, fecha, hora_inicio: '', hora_fin: '' }));
		fetchSlots(nutId, fecha, servicioSeleccionado?.duracion_minutos);
	};

	const handleNutricionistaChange = (e) => {
		const id_usuario = e.target.value;
		setCreateForm((prev) => ({ ...prev, id_usuario, id_servicio: '', hora_inicio: '', hora_fin: '' }));
		fetchServicios(id_usuario);
		fetchSlots(id_usuario, createForm.fecha);
	};

	const handleServicioChange = (e) => {
		const id_servicio = e.target.value;
		const servicioSeleccionado = servicios.find((s) => String(s.id) === id_servicio);
		const nutId = isCurrentUserNutricionista ? currentUserId : createForm.id_usuario;
		setCreateForm((prev) => ({ ...prev, id_servicio, hora_inicio: '', hora_fin: '' }));
		fetchSlots(nutId, createForm.fecha, servicioSeleccionado?.duracion_minutos);
	};

	const handleSlotChange = (e) => {
		const selected = slots.find((s) => s.hora_inicio === e.target.value);
		setCreateForm((prev) => ({
			...prev,
			hora_inicio: selected?.hora_inicio ?? '',
			hora_fin:    selected?.hora_fin    ?? '',
		}));
	};

	const handleCreateSubmit = async (e) => {
		e.preventDefault();
		setCreateError('');

		const nutricionistaId = isCurrentUserNutricionista ? currentUserId : createForm.id_usuario;

		if (!createForm.id_paciente)  return setCreateError('Debes seleccionar un paciente.');
		if (!nutricionistaId)         return setCreateError('Debes seleccionar un nutricionista.');
		if (!createForm.fecha)        return setCreateError('La fecha es requerida.');
		if (!validarFechaNoPasada(createForm.fecha)) return setCreateError('No puedes agendar una cita en una fecha pasada.');
		if (!createForm.hora_inicio)  return setCreateError('Debes seleccionar un horario disponible.');

		setCreateLoading(true);

		const body = {
			id_paciente: Number(createForm.id_paciente),
			id_usuario:  Number(nutricionistaId),
			fecha:       createForm.fecha,
			hora_inicio: createForm.hora_inicio,
			hora_fin:    createForm.hora_fin,
			...(createForm.id_servicio && { id_servicio: Number(createForm.id_servicio) }),
			...(createForm.observacion  && { observacion: createForm.observacion }),
		};

		try {
			const response = await fetch(apiUrl('/citas'), {
				method:  'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body:    JSON.stringify(body),
			});

			const data = await response.json();
			if (!response.ok) {
				setCreateError(data.message || 'Error al crear la cita');
				return;
			}

			closeCreateModal();
			fetchCitas();
		} catch {
			setCreateError('Error de conexión con el servidor');
		} finally {
			setCreateLoading(false);
		}
	};

	// ── Handlers: Atención Médica ────────────────────────────────────────────
	const calcularEdadDesdeNacimiento = (fechaNacimiento) => {
		if (!fechaNacimiento) return '';
		const hoy = new Date();
		const nac = new Date(fechaNacimiento);
		let edad = hoy.getFullYear() - nac.getFullYear();
		const cumpleEsteAnio = new Date(hoy.getFullYear(), nac.getMonth(), nac.getDate());
		if (hoy < cumpleEsteAnio) edad--;
		return edad >= 0 ? edad : '';
	};

	const handlePDFSesion = async (cita) => {
		if (cita.estado !== 'completada') return;
		setPdfLoadingCitaId(cita.id_cita);
		try {
			const { cita: citaFull, ficha, evaluacion } = await fetchCitaCompleta(cita.id_cita, token);
			generarPDFSesion(citaFull, ficha, evaluacion);
		} catch (err) {
			alert(`Error al generar PDF: ${err.message}`);
		} finally { setPdfLoadingCitaId(null); }
	};

	const openAtencionModal = async (cita) => {
		setAtencionCita(cita);
		setAtencionError('');
		setAtencionSuccess(false);
		setAtencionFicha(null);
		setAtencionEvaluacion(null);
		calculoDataRef.current = null;
		const today = new Date().toISOString().split('T')[0];
		const edadAuto = calcularEdadDesdeNacimiento(cita.paciente?.fecha_nacimiento);
		setAtencionForm({
			...INITIAL_ATENCION_FORM,
			fecha_atencion: cita.fecha || today,
			edad: edadAuto,
		});
		setAtencionOpen(true);
		setMinutaState(null);
		setObjetivoCalorico(null);

		// Intentar cargar ficha existente
		setAtencionFetchLoading(true);
		try {
			const res = await fetch(apiUrl(`/fichas/cita/${cita.id_cita}`), {
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await res.json();
			if (res.ok && data.data) {
				const f = data.data;
				setAtencionFicha(f);
				// Si la ficha ya tiene nombre social, activar el toggle automáticamente
				if (f.nombre_social) setUsaNombreSocial(true);
				setAtencionForm({
					tipo:                    f.tipo                    ?? 'Control nutricional',
					fecha_atencion:          f.fecha_atencion           ?? cita.fecha ?? today,
					edad:                    f.edad                    ?? edadAuto,
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
				// Cargar minuta guardada
				if (f.minuta) setMinutaState(f.minuta);

				// Cargar evaluación nutricional existente (si hay y se tiene permiso)
				try {
					const evRes = await fetch(apiUrl(`/calculos/ficha/${f.id_ficha}`), {
						headers: { Authorization: `Bearer ${token}` },
					});
					const evData = await evRes.json();
					if (evRes.ok && evData.data) {
						setAtencionEvaluacion(evData.data);
						if (evData.data.get) setObjetivoCalorico(Number(evData.data.get));
					}
				} catch { /* sin evaluación previa */ }
			}
		} catch { /* silencioso */ } finally {
			setAtencionFetchLoading(false);
		}
	};

	const closeAtencionModal = () => {
		setAtencionOpen(false);
		setAtencionCita(null);
		setAtencionFicha(null);
		setAtencionError('');
		setAtencionSuccess(false);
		setUsaNombreSocial(false);
		setPanelCalculadoraOpen(false);
		setPanelAlimentosOpen(false);
		setAtencionEvaluacion(null);
		setMinutaState(null);
		setObjetivoCalorico(null);
		calculoDataRef.current = null;
	};

	const handleAtencionChange = (field) => (e) =>
		setAtencionForm((prev) => ({ ...prev, [field]: e.target.value }));

	const handleAtencionSubmit = async (e) => {
		e.preventDefault();
		setAtencionError('');

		if (!atencionForm.tipo.trim())            return setAtencionError('El tipo de atención es requerido.');
		if (!atencionForm.fecha_atencion)          return setAtencionError('La fecha de atención es requerida.');
		if (!validarFechaNoFutura(atencionForm.fecha_atencion)) return setAtencionError('La fecha de atención no puede ser futura.');
		if (!String(atencionForm.edad).trim())     return setAtencionError('La edad del paciente es requerida.');

		// Validación de la calculadora: si hay requerimiento energético, los macros deben sumar 100%.
		const calc = calculoDataRef.current;
		if (calc?.requiereMacros && !calc.macrosValidos)
			return setAtencionError('La distribución de macronutrientes debe sumar 100% antes de guardar.');

		setAtencionLoading(true);
		try {
			const body = {
				tipo:                    atencionForm.tipo.trim(),
				fecha_atencion:          atencionForm.fecha_atencion,
				edad:                    Number(atencionForm.edad),
				...(atencionForm.nombre_social.trim()            && { nombre_social:           atencionForm.nombre_social.trim() }),
				...(atencionForm.sexo                            && { sexo:                    atencionForm.sexo }),
				...(atencionForm.peso                            && { peso:                    parseFloat(atencionForm.peso) }),
				...(atencionForm.talla                           && { talla:                   parseFloat(atencionForm.talla) }),
				...(atencionForm.presion_arterial.trim()         && { presion_arterial:         atencionForm.presion_arterial.trim() }),
				...(atencionForm.circunferencia_cintura          && { circunferencia_cintura:   parseFloat(atencionForm.circunferencia_cintura) }),
				...(atencionForm.motivo_consulta.trim()          && { motivo_consulta:         atencionForm.motivo_consulta.trim() }),
				...(atencionForm.diagnostico_nutricional.trim()  && { diagnostico_nutricional:  atencionForm.diagnostico_nutricional.trim() }),
				...(atencionForm.calculos.trim()                 && { calculos:                 atencionForm.calculos.trim() }),
				...(atencionForm.indicaciones.trim()             && { indicaciones:             atencionForm.indicaciones.trim() }),
				...(atencionForm.recomendaciones.trim()          && { recomendaciones:          atencionForm.recomendaciones.trim() }),
				...(atencionForm.derivaciones.trim()             && { derivaciones:             atencionForm.derivaciones.trim() }),
				...(atencionForm.observacion.trim()              && { observacion:              atencionForm.observacion.trim() }),
			};

			// Volcar diagnóstico y resumen generados por la calculadora hacia la ficha.
			if (calc?.diagnostico) body.diagnostico_nutricional = calc.diagnostico;
			if (calc?.resumen)     body.calculos                = calc.resumen;

			// Incluir la minuta dietética (siempre, incluso si está vacía).
			body.minuta = minutaState ?? null;

			let res;
			if (atencionFicha) {
				// Actualizar ficha existente
				res = await fetch(apiUrl(`/fichas/${atencionFicha.id_ficha}`), {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
					body: JSON.stringify(body),
				});
			} else {
				// Crear nueva ficha
				res = await fetch(apiUrl(`/fichas/cita/${atencionCita.id_cita}`), {
					method: 'POST',
					headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
					body: JSON.stringify(body),
				});
			}

			const data = await res.json();
			if (!res.ok) {
				setAtencionError(data.message || 'Error al guardar la ficha clínica.');
				return;
			}

			// Persistir la evaluación nutricional asociada a la ficha (best-effort).
			const fichaId = atencionFicha ? atencionFicha.id_ficha : data?.data?.id_ficha;
			const valePersistir = calc && (calc.tieneMediciones || calc.ev?.antropometria?.imc?.valor != null);
			if (fichaId && valePersistir && hasPermission('calculos:gestionar')) {
				try {
					const evUrl    = atencionEvaluacion ? apiUrl(`/calculos/${atencionEvaluacion.id}`) : apiUrl(`/calculos/ficha/${fichaId}`);
					const evMethod = atencionEvaluacion ? 'PUT' : 'POST';
					const evRes = await fetch(evUrl, {
						method: evMethod,
						headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
						body: JSON.stringify(calc.input),
					});
					if (!evRes.ok) {
						const ed = await evRes.json().catch(() => ({}));
						console.error('No se pudo guardar la evaluación nutricional:', ed.message || evRes.status);
					}
				} catch (err) {
					console.error('Error de red al guardar la evaluación nutricional:', err);
				}
			}

			setAtencionSuccess(true);
			fetchCitas(); // refrescar calendario para reflejar el nuevo estado
		} catch {
			setAtencionError('Error de conexión con el servidor.');
		} finally {
			setAtencionLoading(false);
		}
	};

	// ── Handlers: Cancelar Cita ──────────────────────────────────────────────
	const openCancelModal = (cita) => {
		setCancelCita(cita);
		setCancelMotivo('');
		setCancelError('');
		setCancelOpen(true);
	};

	const closeCancelModal = () => {
		setCancelOpen(false);
		setCancelCita(null);
		setCancelMotivo('');
		setCancelError('');
	};

	const handleCancelSubmit = async (e) => {
		e.preventDefault();
		if (cancelMotivo.trim().length < 5)
			return setCancelError('El motivo debe tener al menos 5 caracteres.');

		setCancelLoading(true);
		setCancelError('');
		try {
			const response = await fetch(apiUrl(`/citas/${cancelCita.id_cita}/cancelar`), {
				method:  'PATCH',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
				body:    JSON.stringify({ motivo_cancelacion: cancelMotivo.trim() }),
			});
			const data = await response.json();
			if (!response.ok) {
				setCancelError(data.message || 'Error al cancelar la cita');
				return;
			}
			closeCancelModal();
			fetchCitas();
		} catch {
			setCancelError('Error de conexión con el servidor');
		} finally {
			setCancelLoading(false);
		}
	};

	const canEditAtencion = atencionCita
		? (atencionCita.estado === 'completada' ? hasPermission('fichas:editar') : hasPermission('fichas:crear'))
		: false;

	return (
		<div style={{ animation: 'slideIn 0.3s ease-out' }}>
			<div className="action-bar" style={{ marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
				<div>
					<h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Calendario semanal</h2>
					<p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
						Visualiza tu agenda de lunes a domingo con tarjetas que resumen lo más importante de cada cita.
					</p>
				</div>

				<div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
					<button className="btn btn-secondary" type="button" onClick={() => setWeekAnchor((current) => shiftWeek(current, -1))}>
						<ChevronLeft size={18} />
						Anterior
					</button>
					<button className="btn btn-secondary" type="button" onClick={goToCurrentWeek}>
						<CalendarDays size={18} />
						Esta semana
					</button>
					<button className="btn btn-secondary" type="button" onClick={() => setWeekAnchor((current) => shiftWeek(current, 1))}>
						Siguiente
						<ChevronRight size={18} />
					</button>
					{hasPermission('pacientes:crear') && (
						<button
							className="btn btn-secondary"
							type="button"
							id="btn-registrar-paciente"
							onClick={() => navigate('/registro-paciente')}
							style={{ border: '1px solid var(--morado-secundario)', color: 'var(--morado-primario)' }}
						>
							<UserRoundPlus size={18} />
							Registrar Paciente
						</button>
					)}
					{hasPermission('citas:crear') && (
						<button className="btn btn-primary" type="button" onClick={() => openCreateModal()}>
							<Plus size={18} />
							Nueva cita
						</button>
					)}
				</div>
			</div>

			{error && (
				<div className="alert alert-danger" style={{ marginBottom: '18px' }}>
					<AlertCircle size={18} />
					<span>{error}</span>
				</div>
			)}

			{/* Barra compacta: semana + stats + controles */}
			<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: '16px', flexWrap: 'wrap', boxShadow: 'var(--shadow-sm)' }}>
				{/* Izquierda: semana + pills de stats */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
					<div>
						<div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Semana activa</div>
						<div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{weekLabel}</div>
					</div>
					<div style={{ width: '1px', height: '28px', background: 'var(--border-color)' }} />
					{[
						{ label: 'Total', value: stats.total, tone: 'var(--morado-primario)' },
						{ label: 'Confirmadas', value: stats.confirmed, tone: 'var(--bienestar)' },
						{ label: 'Pendientes', value: stats.pending, tone: 'var(--advertencia)' },
					].map((item) => (
						<div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '999px', padding: '4px 12px' }}>
							<span style={{ fontSize: '15px', fontWeight: 800, color: item.tone, lineHeight: 1 }}>{item.value}</span>
							<span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</span>
						</div>
					))}
				</div>
				{/* Derecha: tabs de días + badge */}
				<div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--lavanda-suave)', padding: '5px 12px', borderRadius: '999px', color: 'var(--morado-primario)', fontSize: '12px', fontWeight: 700 }}>
						<Clock3 size={13} />
						Por hora y día
					</div>
					<div style={{ display: 'flex', borderRadius: '8px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
						{[{ label: 'Lun – Mié', index: 0 }, { label: 'Jue – Sáb', index: 1 }, { label: 'Dom', index: 2 }].map(({ label, index }) => (
							<button
								key={index}
								type="button"
								onClick={() => setDayGroupIndex(index)}
								style={{
									padding: '5px 13px',
									fontSize: '12px',
									fontWeight: dayGroupIndex === index ? 700 : 500,
									background: dayGroupIndex === index ? 'var(--morado-primario)' : 'var(--bg-card)',
									color: dayGroupIndex === index ? 'white' : 'var(--text-secondary)',
									border: 'none',
									borderRight: index < 2 ? '1px solid var(--border-color)' : 'none',
									cursor: 'pointer',
									transition: 'all 0.15s',
									whiteSpace: 'nowrap',
								}}
							>
								{label}
							</button>
						))}
					</div>
				</div>
			</div>

			<div>
				<div className="calendar-days-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${dayGroupIndex === 2 ? 1 : 3}, 1fr)`, gap: '14px' }}>
					{weekDays.map((day, index) => {
						const groupStart = dayGroupIndex * 3;
						const groupEnd = dayGroupIndex === 2 ? 7 : groupStart + 3;
						if (index < groupStart || index >= groupEnd) return null;
						const dayEvents = eventsByDay[index];

						return (
							<section
								key={day.label}
								className="calendar-day-section"
								style={{
									background: 'var(--bg-card)',
									border: `1px solid ${day.isToday ? 'var(--morado-secundario)' : 'var(--border-color)'}`,
									borderRadius: 'var(--radius-md)',
									boxShadow: day.isToday ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
									height: '560px',
									display: 'flex',
									flexDirection: 'column',
									overflow: 'hidden',
								}}
							>
								<header style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', background: day.isToday ? 'rgba(109, 40, 217, 0.06)' : 'var(--bg-card)' }}>
									<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '10px' }}>
										<div>
											<div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.4px', color: 'var(--text-muted)' }}>{day.shortLabel}</div>
											<div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{day.label}</div>
										</div>
										<div style={{ minWidth: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: day.isToday ? 'var(--accent-gradient)' : 'var(--lavanda-suave)', color: day.isToday ? 'white' : 'var(--morado-primario)', fontWeight: 800, fontSize: '18px' }}>
											{day.date.getDate()}
										</div>
									</div>
									<div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{formatDate(day.date)}</div>
								</header>

								<div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1, overflowY: 'auto' }}>
									{loading ? (
										<div style={{ flexGrow: 1, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', color: 'var(--text-muted)', textAlign: 'center', minHeight: '180px' }}>
											<div>
												<Clock3 size={28} style={{ marginBottom: '10px', opacity: 0.45 }} />
												<div style={{ fontWeight: 700, marginBottom: '4px' }}>Cargando citas</div>
												<div style={{ fontSize: '13px', lineHeight: 1.4 }}>Estamos consultando las citas registradas para esta semana.</div>
											</div>
										</div>
									) : dayEvents.length === 0 ? (
										<div style={{ flexGrow: 1, border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', color: 'var(--text-muted)', textAlign: 'center', minHeight: '180px' }}>
											<div>
												<CalendarDays size={28} style={{ marginBottom: '10px', opacity: 0.45 }} />
												<div style={{ fontWeight: 700, marginBottom: '4px' }}>Sin citas</div>
												<div style={{ fontSize: '13px', lineHeight: 1.4 }}>Este día está libre o aún no tiene citas registradas en la base de datos.</div>
											</div>
										</div>
									) : (
										dayEvents.map((cita) => {
											const style = getCitaStyle(cita.estado);
											const StatusIcon = style.icon;
											const patientName = getFullName(cita.paciente) || 'Paciente no disponible';
											const serviceName = cita.servicio?.nombre || cita.origen || 'Consulta';

											return (
												<article
													key={cita.id_cita}
													style={{
														borderRadius: '10px',
														border: '1px solid rgba(0,0,0,0.05)',
														background: style.background,
														borderLeft: `4px solid ${style.accent}`,
														padding: '10px 12px',
														display: 'flex',
														flexDirection: 'column',
														gap: '6px',
													}}
												>
													{/* Fila 1: hora + badge de estado */}
													<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
														<div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 700, color: style.accent }}>
															<Clock3 size={13} />
															{cita.hora_inicio.substring(0, 5)} – {cita.hora_fin.substring(0, 5)}
														</div>
														<div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: 700, color: style.text, background: 'rgba(255,255,255,0.65)', borderRadius: '999px', padding: '3px 8px', whiteSpace: 'nowrap' }}>
															<StatusIcon size={11} />
															{style.label}
														</div>
													</div>

													{/* Fila 2: nombre del paciente */}
													<div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
														<UserRound size={13} style={{ color: style.accent, flexShrink: 0 }} />
														<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{patientName}</span>
													</div>

													{/* Fila 3: nombre del servicio */}
													<div style={{ fontSize: '12px', color: 'var(--text-secondary)', paddingLeft: '19px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
														{serviceName}
													</div>

													{/* Botones de acción */}
													<div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
														{cita.estado !== 'cancelada' && (
															(cita.estado === 'completada'
																? hasPermission('fichas:editar')
																: hasPermission('fichas:crear')
															) && (
																<button
																	type="button"
																	onClick={() => openAtencionModal(cita)}
																	style={{
																		display: 'inline-flex',
																		alignItems: 'center',
																		gap: '4px',
																		fontSize: '11px',
																		fontWeight: 600,
																		color: cita.estado === 'completada' ? '#0F766E' : '#6D28D9',
																		background: cita.estado === 'completada' ? 'rgba(20,184,166,0.10)' : 'rgba(109,40,217,0.08)',
																		border: cita.estado === 'completada' ? '1px solid rgba(20,184,166,0.25)' : '1px solid rgba(109,40,217,0.20)',
																		borderRadius: '6px',
																		padding: '4px 8px',
																		cursor: 'pointer',
																		transition: 'all 0.15s',
																	}}
																>
																	<ClipboardPlus size={11} />
																	{cita.estado === 'completada' ? 'Ver atención' : 'Iniciar atención'}
																</button>
															)
														)}
														{cita.estado === 'completada' && (
															<button
																type="button"
																onClick={() => handlePDFSesion(cita)}
																disabled={pdfLoadingCitaId === cita.id_cita}
																style={{
																	display: 'inline-flex', alignItems: 'center', gap: '4px',
																	fontSize: '11px', fontWeight: 600,
																	color: '#2563EB',
																	background: 'rgba(59,130,246,0.08)',
																	border: '1px solid rgba(59,130,246,0.22)',
																	borderRadius: '6px', padding: '4px 8px',
																	cursor: pdfLoadingCitaId === cita.id_cita ? 'wait' : 'pointer',
																	opacity: pdfLoadingCitaId === cita.id_cita ? 0.6 : 1,
																}}
															>
																{pdfLoadingCitaId === cita.id_cita
																	? <Loader size={11} style={{ animation: 'spin 1s linear infinite' }} />
																	: <FileText size={11} />
																}
																PDF sesión
															</button>
														)}
														{hasPermission('citas:cancelar') && cita.estado !== 'cancelada' && (
															<button
																type="button"
																onClick={() => openCancelModal(cita)}
																style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#B91C1C', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
															>
																<Ban size={11} />
																Cancelar
															</button>
														)}
													</div>
												</article>
											);
										})
									)}
								</div>
							</section>
						);
					})}
				</div>
			</div>

			{createOpen && (
				<div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeCreateModal()}>
					<div className="modal-content" style={{ maxWidth: '620px' }}>
						<div className="modal-header">
							<h3 className="modal-title">Agendar cita para paciente</h3>
							<button className="btn-close" onClick={closeCreateModal} aria-label="Cerrar">×</button>
						</div>
						<form onSubmit={handleCreateSubmit}>
							<div className="modal-body">
								{createError && <div className="alert alert-danger" style={{ marginBottom: '16px' }}><AlertCircle size={18} /><span>{createError}</span></div>}
								<div className="form-group">
									<label className="form-label">Paciente</label>
										<select className="form-input" value={createForm.id_paciente} onChange={handleCreateChange('id_paciente')} required>
											<option value="">Selecciona un paciente</option>
											{pacientes.map((paciente) => (
												<option key={paciente.id} value={paciente.id}>{formatPacienteOption(paciente)}</option>
											))}
										</select>
										{pacientesLoading && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Cargando pacientes...</div>}
										{pacientesError && <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '6px' }}>{pacientesError}</div>}
								</div>
								<div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
									<div className="form-group">
										<label className="form-label">Fecha</label>
										<input type="date" className="form-input" value={createForm.fecha} onChange={handleFechaChange} required />
									</div>
										{isCurrentUserNutricionista ? (
											<div className="form-group">
												<label className="form-label">Nutricionista asignado</label>
												<input className="form-input" value={`${user?.nombres || ''} ${user?.apellido_paterno || ''}`.trim()} disabled />
											</div>
										) : (
											<div className="form-group">
												<label className="form-label">Nutricionista</label>
												<select className="form-input" value={createForm.id_usuario} onChange={handleNutricionistaChange} required>
													<option value="">Selecciona un nutricionista</option>
													{nutricionistas.map((n) => (
														<option key={n.id} value={n.id}>
															{[n.nombres, n.apellido_paterno, n.apellido_materno].filter(Boolean).join(' ')}
														</option>
													))}
												</select>
												{nutricionistasLoading && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Cargando nutricionistas...</div>}
											</div>
										)}
								</div>
								<div className="form-group">
									<label className="form-label">Servicio</label>
									<select
										className="form-input"
										value={createForm.id_servicio}
										onChange={handleServicioChange}
										disabled={!(isCurrentUserNutricionista ? currentUserId : createForm.id_usuario)}
									>
										<option value="">Sin servicio asociado</option>
										{servicios.map((s) => (
											<option key={s.id} value={s.id}>
												{s.nombre} · {s.duracion_minutos} min · {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(s.precio)} ({s.prevision})
											</option>
										))}
									</select>
									{serviciosLoading && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>Cargando servicios...</div>}
								</div>
								<div className="form-group">
									<label className="form-label">Horario disponible</label>
									{!createForm.fecha || !(isCurrentUserNutricionista ? currentUserId : createForm.id_usuario) ? (
										<div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '10px 12px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
											Selecciona nutricionista y fecha para ver los horarios disponibles.
										</div>
									) : slotsLoading ? (
										<div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '10px 0' }}>Cargando horarios...</div>
									) : slots.length === 0 ? (
										<div style={{ fontSize: '13px', color: 'var(--danger)', padding: '10px 12px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
											Sin horarios disponibles para esta fecha.
										</div>
									) : (
										<select className="form-input" value={createForm.hora_inicio} onChange={handleSlotChange} required>
											<option value="">Selecciona un horario</option>
											{slots.map((s) => (
												<option key={s.hora_inicio} value={s.hora_inicio}>
													{s.hora_inicio} – {s.hora_fin}
												</option>
											))}
										</select>
									)}
								</div>
								<div className="form-group">
									<label className="form-label">Observación</label>
									<textarea className="form-input" rows="4" value={createForm.observacion} onChange={handleCreateChange('observacion')} placeholder="Notas para esta cita" />
								</div>
							</div>
							<div className="modal-footer">
								<button type="button" className="btn btn-secondary" onClick={closeCreateModal} disabled={createLoading}>Cancelar</button>
								<button type="submit" className="btn btn-primary" disabled={createLoading}>
									{createLoading ? 'Creando...' : 'Crear cita'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{cancelOpen && cancelCita && (
				<div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeCancelModal()}>
					<div className="modal-content" style={{ maxWidth: '480px' }}>
						<div className="modal-header">
							<h3 className="modal-title">Cancelar cita</h3>
							<button className="btn-close" onClick={closeCancelModal} aria-label="Cerrar">×</button>
						</div>
						<form onSubmit={handleCancelSubmit}>
							<div className="modal-body">
								{cancelError && (
									<div className="alert alert-danger" style={{ marginBottom: '16px' }}>
										<AlertCircle size={18} /><span>{cancelError}</span>
									</div>
								)}
								<p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
									Estás cancelando la cita del <strong>{cancelCita.fecha}</strong> de <strong>{cancelCita.hora_inicio?.substring(0, 5)} – {cancelCita.hora_fin?.substring(0, 5)}</strong>. El horario quedará disponible nuevamente para nuevas reservas.
								</p>
								<div className="form-group">
									<label className="form-label">Motivo de cancelación</label>
									<textarea
										className="form-input"
										rows="3"
										value={cancelMotivo}
										onChange={(e) => setCancelMotivo(e.target.value)}
										placeholder="Escribe el motivo (mínimo 5 caracteres)"
										required
									/>
								</div>
							</div>
							<div className="modal-footer">
								<button type="button" className="btn btn-secondary" onClick={closeCancelModal} disabled={cancelLoading}>
									Volver
								</button>
								<button type="submit" className="btn btn-primary" disabled={cancelLoading} style={{ background: '#EF4444', borderColor: '#EF4444' }}>
									<Ban size={16} />
									{cancelLoading ? 'Cancelando...' : 'Confirmar cancelación'}
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* ══════════════════ MODAL: ATENCIÓN MÉDICA ══════════════════ */}
			{atencionOpen && atencionCita && (
				<div className="modal-overlay">
					<div className="modal-content" style={{ maxWidth: '740px' }}>
						<div className="modal-header">
							<div>
								<h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<ClipboardPlus size={20} color="var(--morado-primario)" />
									{atencionFicha ? 'Ficha clínica registrada' : 'Iniciar atención médica'}
								</h3>
								<p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
									Paciente:&nbsp;
									<strong style={{ color: 'var(--text-primary)' }}>
										{getFullName(atencionCita.paciente) || 'Paciente no disponible'}
									</strong>
									&nbsp;·&nbsp;{atencionCita.fecha}&nbsp;
									{atencionCita.hora_inicio?.substring(0, 5)} – {atencionCita.hora_fin?.substring(0, 5)}
								</p>
							</div>
							<button className="btn-close" onClick={closeAtencionModal} aria-label="Cerrar">×</button>
						</div>

						{atencionFetchLoading ? (
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
									{atencionFicha ? 'Ficha actualizada correctamente' : 'Atención registrada correctamente'}
								</h4>
								<p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
									La ficha clínica ha sido guardada. La cita ahora figura como <strong>completada</strong>.
								</p>
								<button className="btn btn-primary" onClick={closeAtencionModal}>
									Cerrar
								</button>
							</div>
						) : (
							<form onSubmit={handleAtencionSubmit}>
								<div className="modal-body">
									{atencionError && (
										<div className="alert alert-danger" style={{ marginBottom: '16px' }}>
											<AlertCircle size={18} /><span>{atencionError}</span>
										</div>
									)}

									{/* Tipo y fecha — encabezado de datos generales */}
									<div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
										<div className="form-group" style={{ marginBottom: 0 }}>
											<label className="form-label">Tipo de atención <span style={{ color: 'var(--danger)' }}>*</span></label>
											<select id="at-tipo" className="form-input" value={atencionForm.tipo} onChange={handleAtencionChange('tipo')} required>
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
											<input id="at-fecha" type="date" className="form-input" value={atencionForm.fecha_atencion} onChange={handleAtencionChange('fecha_atencion')} required />
										</div>
									</div>

									{/* ══ SECCIÓN 1: DATOS PERSONALES ══ */}
									<div style={{ background: 'var(--lavanda-suave)', borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: '16px', fontSize: '12px', fontWeight: 800, color: 'var(--morado-primario)', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
										<UserRound size={14} />
										Datos personales
									</div>
									<div className="form-group" style={{ marginBottom: '8px' }}>
										<label className="form-label">Nombre completo</label>
										<input
											type="text"
											className="form-input"
											value={getFullName(atencionCita.paciente) || ''}
											readOnly
											disabled
											style={{ background: 'var(--bg-base)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
										/>
									</div>
									{/* Toggle nombre social */}
									<div style={{ marginBottom: usaNombreSocial ? '8px' : '14px' }}>
										<label
											htmlFor="toggle-nombre-social"
											style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none', fontSize: '13px', color: usaNombreSocial ? 'var(--morado-primario)' : 'var(--text-muted)', fontWeight: usaNombreSocial ? 700 : 500, transition: 'color 0.2s' }}
										>
											<input
												id="toggle-nombre-social"
												type="checkbox"
												checked={usaNombreSocial}
												onChange={(e) => {
													setUsaNombreSocial(e.target.checked);
													if (!e.target.checked) setAtencionForm((prev) => ({ ...prev, nombre_social: '' }));
												}}
												style={{ accentColor: 'var(--morado-primario)', width: '15px', height: '15px', cursor: 'pointer' }}
											/>
											El paciente usa nombre social
										</label>
									</div>
									{usaNombreSocial && (
										<div className="form-group" style={{ marginBottom: '14px', animation: 'slideIn 0.2s ease-out' }}>
											<label className="form-label">Nombre social</label>
											<input
												id="at-nombre-social"
												type="text"
												className="form-input"
												placeholder="Nombre por el que prefiere ser llamado/a"
												value={atencionForm.nombre_social}
												onChange={handleAtencionChange('nombre_social')}
												autoFocus
											/>
										</div>
									)}
									<div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
										<div className="form-group" style={{ marginBottom: 0 }}>
											<label className="form-label">Sexo</label>
											<select id="at-sexo" className="form-input" value={atencionForm.sexo} onChange={handleAtencionChange('sexo')}>
												<option value="">Seleccionar</option>
												<option value="Femenino">Femenino</option>
												<option value="Masculino">Masculino</option>
												<option value="Otro">Otro</option>
												<option value="Prefiero no indicar">Prefiero no indicar</option>
											</select>
										</div>
										<div className="form-group" style={{ marginBottom: 0 }}>
											<label className="form-label">Edad <span style={{ color: 'var(--danger)' }}>*</span></label>
											<input id="at-edad" type="number" min="0" max="120" className="form-input" placeholder="Ej: 34" value={atencionForm.edad} onChange={handleAtencionChange('edad')} required />
										</div>
									</div>

									{/* ══ SECCIÓN 2: DATOS DE ATENCIÓN ══ */}
									<div style={{ background: 'rgba(20,184,166,0.07)', borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: '16px', fontSize: '12px', fontWeight: 800, color: '#0F766E', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
										<Weight size={14} />
										Datos de atención
									</div>
									<div className="form-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
										<div className="form-group" style={{ marginBottom: 0 }}>
											<label className="form-label">Peso (kg)</label>
											<input id="at-peso" type="number" step="0.01" min="0" className="form-input" placeholder="Ej: 72.5" value={atencionForm.peso} onChange={handleAtencionChange('peso')} />
										</div>
										<div className="form-group" style={{ marginBottom: 0 }}>
											<label className="form-label">Talla (cm)</label>
											<input id="at-talla" type="number" step="0.1" min="0" className="form-input" placeholder="Ej: 168.0" value={atencionForm.talla} onChange={handleAtencionChange('talla')} />
										</div>
										<div className="form-group" style={{ marginBottom: 0 }}>
											<label className="form-label">Presión arterial</label>
											<input id="at-presion" type="text" className="form-input" placeholder="Ej: 120/80" value={atencionForm.presion_arterial} onChange={handleAtencionChange('presion_arterial')} />
										</div>
										<div className="form-group" style={{ marginBottom: 0 }}>
											<label className="form-label">Circunferencia de cintura (cm)</label>
											<input id="at-cintura" type="number" step="0.1" min="0" className="form-input" placeholder="Ej: 88.5" value={atencionForm.circunferencia_cintura} onChange={handleAtencionChange('circunferencia_cintura')} />
										</div>
									</div>

									{/* ══ PANEL: CALCULADORA ANTROPOMÉTRICA / ENERGÉTICA ══ */}
									<div style={{ border: '1px solid rgba(109,40,217,0.18)', borderRadius: 'var(--radius-md)', marginBottom: '14px', overflow: 'hidden' }}>
										<button
											type="button"
											onClick={() => setPanelCalculadoraOpen((v) => !v)}
											style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'rgba(109,40,217,0.05)', border: 'none', cursor: 'pointer', gap: '10px' }}
										>
											<span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, color: 'var(--morado-primario)', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
												<Calculator size={14} />
												Calculadora antropométrica
											</span>
											<ChevronDown size={16} color="var(--morado-primario)" style={{ transition: 'transform 0.2s', transform: panelCalculadoraOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
										</button>
										{panelCalculadoraOpen && (
											hasPermission('calculos:ver') ? (
												<CalculosNutricionales
													datosBase={{
														edad: atencionForm.edad,
														sexo: atencionForm.sexo,
														peso: atencionForm.peso,
														talla: atencionForm.talla,
														circunferenciaCintura: atencionForm.circunferencia_cintura,
													}}
													initial={atencionEvaluacion}
													token={token}
													canGestionar={hasPermission('calculos:gestionar')}
													onChange={(d) => {
										calculoDataRef.current = d;
										const get = d?.ev?.energetico?.get ?? null;
										setObjetivoCalorico(get ? Number(get) : null);
									}}
												/>
											) : (
												<div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
													No tienes permiso para usar la calculadora (<code>calculos:ver</code>).
												</div>
											)
										)}
									</div>

									{/* ══ PANEL: CONSULTA DE ALIMENTOS (placeholder) ══ */}
									<div style={{ border: '1px solid rgba(34,197,94,0.20)', borderRadius: 'var(--radius-md)', marginBottom: '22px', overflow: 'hidden' }}>
										<button
											type="button"
											onClick={() => setPanelAlimentosOpen((v) => !v)}
											style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', background: 'rgba(34,197,94,0.05)', border: 'none', cursor: 'pointer', gap: '10px' }}
										>
											<span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 800, color: '#15803D', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
												<Apple size={14} />
												Consulta de valores nutricionales
											</span>
											<ChevronDown size={16} color="#15803D" style={{ transition: 'transform 0.2s', transform: panelAlimentosOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
										</button>
										{panelAlimentosOpen && (
											<PanelMinuta
												value={minutaState}
												onChange={setMinutaState}
												objetivoCalorico={objetivoCalorico}
												token={token}
												disabled={!canEditAtencion}
											/>
										)}
									</div>

									{/* ══ SECCIÓN 3: CONCLUSIONES ══ */}
									<div style={{ background: 'rgba(245,158,11,0.08)', borderRadius: 'var(--radius-md)', padding: '10px 16px', marginBottom: '16px', fontSize: '12px', fontWeight: 800, color: '#92400E', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>
										<ClipboardPlus size={14} />
										Conclusiones de la cita
									</div>
									<div className="form-group" style={{ marginBottom: '14px' }}>
										<label className="form-label">Recomendaciones</label>
										<textarea id="at-recomendaciones" className="form-input" rows="3" placeholder="Recomendaciones generales para el paciente..." value={atencionForm.recomendaciones} onChange={handleAtencionChange('recomendaciones')} />
									</div>
									<div className="form-group" style={{ marginBottom: '14px' }}>
										<label className="form-label">Indicaciones</label>
										<textarea id="at-indicaciones" className="form-input" rows="3" placeholder="Plan alimentario, indicaciones clínicas, próxima consulta..." value={atencionForm.indicaciones} onChange={handleAtencionChange('indicaciones')} />
									</div>
									<div className="form-group" style={{ marginBottom: 0 }}>
										<label className="form-label">Derivaciones</label>
										<textarea id="at-derivaciones" className="form-input" rows="2" placeholder="Derivaciones a otros especialistas (médico, psicólogo, kinesiólogo...)" value={atencionForm.derivaciones} onChange={handleAtencionChange('derivaciones')} />
									</div>
								</div>

								<div className="modal-footer">
									<button type="button" className="btn btn-secondary" onClick={closeAtencionModal} disabled={atencionLoading}>Cancelar</button>
									<button id="at-submit" type="submit" className="btn btn-primary" disabled={atencionLoading}>
										<ClipboardPlus size={16} />
										{atencionLoading ? 'Guardando...' : atencionFicha ? 'Actualizar ficha' : 'Guardar atención'}
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default Calendario;