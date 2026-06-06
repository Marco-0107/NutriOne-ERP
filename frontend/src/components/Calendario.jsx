import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	AlertCircle,
	Ban,
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	CircleCheckBig,
	Clock3,
	MapPin,
	Plus,
	Sparkles,
	UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../helpers/api';

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
	const [weekAnchor, setWeekAnchor] = useState(() => new Date());
	const [citas, setCitas] = useState([]);
	const [pacientes, setPacientes] = useState([]);
	const [nutricionistas, setNutricionistas] = useState([]);
	const [slots, setSlots] = useState([]);
	const [loading, setLoading] = useState(true);
	const [pacientesLoading, setPacientesLoading] = useState(false);
	const [nutricionistasLoading, setNutricionistasLoading] = useState(false);
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
	const daysScrollRef = useRef(null);

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

	const fetchSlots = async (nutricionistaId, fecha) => {
		if (!nutricionistaId || !fecha) { setSlots([]); return; }
		setSlotsLoading(true);
		try {
			const response = await fetch(apiUrl(`/public/disponibilidad/${nutricionistaId}?fecha=${fecha}`));
			const data = await response.json();
			setSlots(response.ok ? (data.data || []) : []);
		} catch {
			setSlots([]);
		} finally {
			setSlotsLoading(false);
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

	const scrollDays = (direction) => {
		const container = daysScrollRef.current;
		if (!container) return;

		const distance = Math.max(container.clientWidth * 0.8, 320);
		container.scrollBy({ left: direction * distance, behavior: 'smooth' });
	};

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
		setCreateOpen(true);
		if (isCurrentUserNutricionista && currentUserId) {
			fetchSlots(currentUserId, fecha);
		}
	};

	const closeCreateModal = () => {
		setCreateOpen(false);
		setCreateError('');
		setCreateForm(INITIAL_CREATE_FORM);
		setSlots([]);
	};

	const handleCreateChange = (field) => (e) => {
		setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));
	};

	const handleFechaChange = (e) => {
		const fecha = e.target.value;
		const nutId = isCurrentUserNutricionista ? currentUserId : createForm.id_usuario;
		setCreateForm((prev) => ({ ...prev, fecha, hora_inicio: '', hora_fin: '' }));
		fetchSlots(nutId, fecha);
	};

	const handleNutricionistaChange = (e) => {
		const id_usuario = e.target.value;
		setCreateForm((prev) => ({ ...prev, id_usuario, hora_inicio: '', hora_fin: '' }));
		fetchSlots(id_usuario, createForm.fecha);
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

			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', marginBottom: '24px' }}>
				{[
					{ label: 'Citas de la semana', value: stats.total, tone: 'var(--morado-primario)' },
					{ label: 'Confirmados', value: stats.confirmed, tone: 'var(--bienestar)' },
					{ label: 'Pendientes', value: stats.pending, tone: 'var(--advertencia)' },
				].map((item) => (
					<div key={item.label} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '18px 20px', boxShadow: 'var(--shadow-sm)' }}>
						<div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>{item.label}</div>
						<div style={{ fontSize: '28px', fontWeight: 800, color: item.tone, lineHeight: 1 }}>{item.value}</div>
					</div>
				))}
			</div>

			<div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(250,250,250,0.98) 100%)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', padding: '20px', marginBottom: '16px' }}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
					<div>
						<div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '4px' }}>Semana activa</div>
						<div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{weekLabel}</div>
					</div>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--lavanda-suave)', padding: '10px 14px', borderRadius: '999px', color: 'var(--morado-primario)', fontSize: '13px', fontWeight: 700 }}>
						<Clock3 size={16} />
						Ordenado por hora y día
					</div>
				</div>

				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
					<button className="btn btn-secondary" type="button" onClick={() => scrollDays(-1)}>
						<ChevronLeft size={18} />
						Mover a la izquierda
					</button>
					<button className="btn btn-secondary" type="button" onClick={() => scrollDays(1)}>
						Mover a la derecha
						<ChevronRight size={18} />
					</button>
				</div>
			</div>

			<div ref={daysScrollRef} style={{ overflowX: 'auto', paddingBottom: '8px' }}>
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(230px, 1fr))', gap: '14px', minWidth: 'max-content' }}>
					{weekDays.map((day, index) => {
						const dayEvents = eventsByDay[index];

						return (
							<section
								key={day.label}
								style={{
									background: 'var(--bg-card)',
									border: `1px solid ${day.isToday ? 'var(--morado-secundario)' : 'var(--border-color)'}`,
									borderRadius: 'var(--radius-md)',
									boxShadow: day.isToday ? 'var(--shadow-glow)' : 'var(--shadow-sm)',
									minHeight: '560px',
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

								<div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
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
											const nutritionistName = getFullName(cita.nutricionista ?? cita.usuario) || 'Nutricionista';
											const serviceName = cita.servicio?.nombre || cita.origen || 'Consulta';
											const note = cita.observacion || 'Sin observaciones registradas.';

											return (
												<article
													key={cita.id_cita}
													style={{
														borderRadius: '16px',
														border: '1px solid rgba(0,0,0,0.05)',
														background: style.background,
														borderLeft: `5px solid ${style.accent}`,
														padding: '14px',
														display: 'flex',
														flexDirection: 'column',
														gap: '10px',
													}}
												>
													<div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
														<div>
															<div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '3px' }}>{serviceName}</div>
															<div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{nutritionistName}</div>
														</div>
														<div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: style.text, background: 'rgba(255,255,255,0.6)', borderRadius: '999px', padding: '6px 10px', whiteSpace: 'nowrap' }}>
															<StatusIcon size={14} />
															{style.label}
														</div>
													</div>

													<div style={{ display: 'grid', gap: '8px' }}>
														<div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
															<Clock3 size={15} style={{ color: style.accent }} />
															{cita.hora_inicio.substring(0, 5)} - {cita.hora_fin.substring(0, 5)}
														</div>
														<div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
															<UserRound size={15} style={{ color: style.accent }} />
															{patientName}
														</div>
														<div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
															<MapPin size={15} style={{ color: style.accent }} />
															{serviceName}
														</div>
													</div>

													<p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.45 }}>
														{note}
													</p>

													{hasPermission('citas:cancelar') && cita.estado !== 'cancelada' && (
														<button
															type="button"
															onClick={() => openCancelModal(cita)}
															style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 600, color: '#B91C1C', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer' }}
														>
															<Ban size={13} />
															Cancelar cita
														</button>
													)}
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
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
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
		</div>
	);
};

export default Calendario;