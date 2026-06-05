import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
	AlertCircle,
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
	const [loading, setLoading] = useState(true);
	const [pacientesLoading, setPacientesLoading] = useState(false);
	const [error, setError] = useState('');
	const [pacientesError, setPacientesError] = useState('');
	const [createOpen, setCreateOpen] = useState(false);
	const [createError, setCreateError] = useState('');
	const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
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
			const response = await fetch(apiUrl(`/public/citas/calendario?desde=${toISODateLocal(weekDays[0].date)}&hasta=${toISODateLocal(weekDays[6].date)}`), {
			});

			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.message || 'Error al obtener las citas del calendario');
			}

			setCitas(data.data?.citas || []);
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

	useEffect(() => {
		if (createOpen) {
			fetchPacientes();
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
		setCreateForm({
			id_paciente: cita?.paciente?.id ? String(cita.paciente.id) : '',
			id_usuario: currentUserId ? String(currentUserId) : '',
			id_servicio: cita?.servicio?.id ? String(cita.servicio.id) : '',
			fecha: cita?.fecha || toISODateLocal(new Date()),
			hora_inicio: cita?.hora_inicio ? cita.hora_inicio.substring(0, 5) : '',
			hora_fin: cita?.hora_fin ? cita.hora_fin.substring(0, 5) : '',
			observacion: '',
		});
		setCreateError('');
		setCreateOpen(true);
	};

	const closeCreateModal = () => {
		setCreateOpen(false);
		setCreateError('');
		setCreateForm(INITIAL_CREATE_FORM);
	};

	const handleCreateChange = (field) => (e) => {
		setCreateForm((prev) => ({ ...prev, [field]: e.target.value }));
	};

	const handleCreateSubmit = (e) => {
		e.preventDefault();
		closeCreateModal();
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
											const nutritionistName = getFullName(cita.usuario) || 'Nutricionista';
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
										<input type="date" className="form-input" value={createForm.fecha} onChange={handleCreateChange('fecha')} required />
									</div>
										{isCurrentUserNutricionista ? (
											<div className="form-group">
												<label className="form-label">Nutricionista asignado</label>
												<input className="form-input" value={`${user?.nombres || ''} ${user?.apellido_paterno || ''}`.trim()} disabled />
											</div>
										) : (
											<div className="form-group">
												<label className="form-label">Nutricionista</label>
												<input className="form-input" value={createForm.id_usuario} onChange={handleCreateChange('id_usuario')} placeholder="ID del nutricionista" required />
											</div>
										)}
								</div>
								<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
									<div className="form-group">
										<label className="form-label">Hora inicio</label>
										<input type="time" className="form-input" value={createForm.hora_inicio} onChange={handleCreateChange('hora_inicio')} required />
									</div>
									<div className="form-group">
										<label className="form-label">Hora fin</label>
										<input type="time" className="form-input" value={createForm.hora_fin} onChange={handleCreateChange('hora_fin')} required />
									</div>
								</div>
								<div className="form-group">
									<label className="form-label">Observación</label>
									<textarea className="form-input" rows="4" value={createForm.observacion} onChange={handleCreateChange('observacion')} placeholder="Notas para esta cita" />
								</div>
							</div>
							<div className="modal-footer">
								<button type="button" className="btn btn-secondary" onClick={closeCreateModal}>Cancelar</button>
								<button type="submit" className="btn btn-primary">Crear cita</button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};

export default Calendario;