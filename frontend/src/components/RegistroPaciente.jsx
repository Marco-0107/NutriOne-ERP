import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	AlertCircle,
	ArrowLeft,
	CalendarDays,
	CheckCircle2,
	CreditCard,
	Mail,
	MapPin,
	Phone,
	User,
	UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../helpers/api';

const INITIAL_FORM = {
	nombres: '',
	apellido_paterno: '',
	apellido_materno: '',
	rut: '',
	fecha_nacimiento: '',
	sexo: '',
	correo: '',
	telefono: '',
	direccion: '',
	comuna: '',
	region: '',
	prevision: '',
	contacto_emergencia_nombre: '',
	contacto_emergencia_telefono: '',
};

const SECTION_STYLES = {
	wrapper: {
		background: 'var(--bg-card)',
		border: '1px solid var(--border-color)',
		borderRadius: 'var(--radius-lg)',
		padding: '28px',
		boxShadow: 'var(--shadow-sm)',
		marginBottom: '24px',
	},
	sectionTitle: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		fontSize: '15px',
		fontWeight: 700,
		color: 'var(--morado-primario)',
		marginBottom: '20px',
		paddingBottom: '12px',
		borderBottom: '1px solid var(--border-color)',
	},
	sectionIcon: {
		background: 'var(--lavanda-suave)',
		borderRadius: '8px',
		padding: '6px',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
};

const FieldGrid = ({ children, cols = 2 }) => (
	<div
		className="rp-field-grid"
		style={{
			display: 'grid',
			gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
			gap: '16px',
		}}
	>
		{children}
	</div>
);

const FormSection = ({ icon: Icon, title, children }) => (
	<div className="rp-section-wrapper" style={SECTION_STYLES.wrapper}>
		<div style={SECTION_STYLES.sectionTitle}>
			<span style={SECTION_STYLES.sectionIcon}>
				<Icon size={16} color="var(--morado-primario)" />
			</span>
			{title}
		</div>
		{children}
	</div>
);

const RegistroPaciente = () => {
	const { token } = useAuth();
	const navigate = useNavigate();

	const [form, setForm] = useState(INITIAL_FORM);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	const handleChange = (field) => (e) => {
		setForm((prev) => ({ ...prev, [field]: e.target.value }));
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		// Basic validations
		if (!form.nombres.trim()) return setError('El nombre es requerido.');
		if (!form.apellido_paterno.trim()) return setError('El apellido paterno es requerido.');
		if (!form.rut.trim()) return setError('El RUT es requerido.');
		if (!form.correo.trim()) return setError('El correo electrónico es requerido.');
		if (!form.fecha_nacimiento) return setError('La fecha de nacimiento es requerida.');
		if (!form.sexo) return setError('El sexo es requerido.');

		setLoading(true);

		try {
			const body = {
				nombres: form.nombres.trim(),
				apellido_paterno: form.apellido_paterno.trim(),
				...(form.apellido_materno.trim() && { apellido_materno: form.apellido_materno.trim() }),
				rut: form.rut.trim(),
				fecha_nacimiento: form.fecha_nacimiento,
				sexo: form.sexo,
				correo: form.correo.trim(),
				...(form.telefono.trim() && { telefono: form.telefono.trim() }),
				...(form.direccion.trim() && { direccion: form.direccion.trim() }),
				...(form.comuna.trim() && { comuna: form.comuna.trim() }),
				...(form.region.trim() && { region: form.region.trim() }),
				...(form.prevision.trim() && { prevision: form.prevision.trim() }),
				...(form.contacto_emergencia_nombre.trim() && {
					contacto_emergencia_nombre: form.contacto_emergencia_nombre.trim(),
				}),
				...(form.contacto_emergencia_telefono.trim() && {
					contacto_emergencia_telefono: form.contacto_emergencia_telefono.trim(),
				}),
			};

			const response = await fetch(apiUrl('/pacientes'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(body),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.message || 'Error al registrar el paciente.');
				return;
			}

			setSuccess(true);
		} catch {
			setError('Error de conexión con el servidor.');
		} finally {
			setLoading(false);
		}
	};

	if (success) {
		return (
			<div style={{ animation: 'slideIn 0.3s ease-out' }}>
				<div
					className="rp-success-card"
					style={{
						maxWidth: '560px',
						margin: '0 auto',
						textAlign: 'center',
						padding: '60px 40px',
						background: 'var(--bg-card)',
						border: '1px solid var(--border-color)',
						borderRadius: 'var(--radius-lg)',
						boxShadow: 'var(--shadow-md)',
					}}
				>
					<div
						style={{
							width: '72px',
							height: '72px',
							borderRadius: '50%',
							background: 'rgba(20, 184, 166, 0.12)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							margin: '0 auto 20px',
						}}
					>
						<CheckCircle2 size={36} color="#14B8A6" />
					</div>
					<h2
						style={{
							fontSize: '22px',
							fontWeight: 800,
							color: 'var(--text-primary)',
							marginBottom: '10px',
						}}
					>
						¡Paciente registrado!
					</h2>
					<p
						style={{
							fontSize: '14px',
							color: 'var(--text-secondary)',
							lineHeight: 1.6,
							marginBottom: '28px',
						}}
					>
						Los datos personales han sido guardados correctamente en el sistema. Ya puedes agendar
						citas para este paciente.
					</p>
					<div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
						<button
							type="button"
							className="btn btn-secondary"
							onClick={() => {
								setForm(INITIAL_FORM);
								setSuccess(false);
							}}
						>
							<UserRound size={16} />
							Registrar otro paciente
						</button>
						<button
							type="button"
							className="btn btn-primary"
							onClick={() => navigate('/calendario')}
						>
							<CalendarDays size={16} />
							Ir al Calendario
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div style={{ animation: 'slideIn 0.3s ease-out' }}>
			{/* Header */}
			<div className="action-bar" style={{ marginBottom: '28px', gap: '16px', flexWrap: 'wrap' }}>
				<div>
					<h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
						Registro de Paciente
					</h2>
					<p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
						Completa los datos personales del nuevo paciente para registrarlo en el sistema.
					</p>
				</div>
				<button
					type="button"
					className="btn btn-secondary"
					onClick={() => navigate('/calendario')}
				>
					<ArrowLeft size={16} />
					Volver al Calendario
				</button>
			</div>

			<form onSubmit={handleSubmit}>
				{/* Error alert */}
				{error && (
					<div className="alert alert-danger" style={{ marginBottom: '20px' }}>
						<AlertCircle size={18} />
						<span>{error}</span>
					</div>
				)}

				{/* Sección 1: Datos de identidad */}
				<FormSection icon={User} title="Datos de Identidad">
					<FieldGrid cols={2}>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label">
								Nombres <span style={{ color: 'var(--danger)' }}>*</span>
							</label>
							<input
								id="reg-nombres"
								type="text"
								className="form-input"
								placeholder="Ej: María Jesús"
								value={form.nombres}
								onChange={handleChange('nombres')}
								required
							/>
						</div>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label">
								Apellido Paterno <span style={{ color: 'var(--danger)' }}>*</span>
							</label>
							<input
								id="reg-apellido-paterno"
								type="text"
								className="form-input"
								placeholder="Ej: González"
								value={form.apellido_paterno}
								onChange={handleChange('apellido_paterno')}
								required
							/>
						</div>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label">Apellido Materno</label>
							<input
								id="reg-apellido-materno"
								type="text"
								className="form-input"
								placeholder="Ej: Rojas"
								value={form.apellido_materno}
								onChange={handleChange('apellido_materno')}
							/>
						</div>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label">
								RUT <span style={{ color: 'var(--danger)' }}>*</span>
							</label>
							<input
								id="reg-rut"
								type="text"
								className="form-input"
								placeholder="Ej: 12.345.678-9"
								value={form.rut}
								onChange={handleChange('rut')}
								required
							/>
						</div>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label">
								Fecha de Nacimiento <span style={{ color: 'var(--danger)' }}>*</span>
							</label>
							<input
								id="reg-fecha-nacimiento"
								type="date"
								className="form-input"
								value={form.fecha_nacimiento}
								onChange={handleChange('fecha_nacimiento')}
								required
							/>
						</div>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label">
								Sexo <span style={{ color: 'var(--danger)' }}>*</span>
							</label>
							<select
								id="reg-sexo"
								className="form-input"
								value={form.sexo}
								onChange={handleChange('sexo')}
								required
							>
								<option value="">Selecciona una opción</option>
								<option value="masculino">Masculino</option>
								<option value="femenino">Femenino</option>
								<option value="otro">Otro</option>
								<option value="prefiero_no_decir">Prefiero no decir</option>
							</select>
						</div>
					</FieldGrid>
				</FormSection>

				{/* Sección 2: Contacto */}
				<FormSection icon={Mail} title="Información de Contacto">
					<FieldGrid cols={2}>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label">
								Correo Electrónico <span style={{ color: 'var(--danger)' }}>*</span>
							</label>
							<input
								id="reg-correo"
								type="email"
								className="form-input"
								placeholder="ejemplo@correo.com"
								value={form.correo}
								onChange={handleChange('correo')}
								required
							/>
						</div>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label">Teléfono</label>
							<input
								id="reg-telefono"
								type="tel"
								className="form-input"
								placeholder="+56 9 1234 5678"
								value={form.telefono}
								onChange={handleChange('telefono')}
							/>
						</div>
					</FieldGrid>
				</FormSection>

				{/* Sección 3: Domicilio */}
				<FormSection icon={MapPin} title="Domicilio">
					<div className="form-group" style={{ marginBottom: '16px' }}>
						<label className="form-label">Dirección</label>
						<input
							id="reg-direccion"
							type="text"
							className="form-input"
							placeholder="Ej: Av. Providencia 1234, Depto 56"
							value={form.direccion}
							onChange={handleChange('direccion')}
						/>
					</div>
					<FieldGrid cols={2}>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label">Comuna</label>
							<input
								id="reg-comuna"
								type="text"
								className="form-input"
								placeholder="Ej: Providencia"
								value={form.comuna}
								onChange={handleChange('comuna')}
							/>
						</div>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label">Región</label>
							<input
								id="reg-region"
								type="text"
								className="form-input"
								placeholder="Ej: Región Metropolitana"
								value={form.region}
								onChange={handleChange('region')}
							/>
						</div>
					</FieldGrid>
				</FormSection>

				{/* Sección 4: Previsión */}
				<FormSection icon={CreditCard} title="Previsión de Salud">
					<div className="form-group" style={{ marginBottom: 0 }}>
						<label className="form-label">Previsión</label>
						<select
							id="reg-prevision"
							className="form-input"
							value={form.prevision}
							onChange={handleChange('prevision')}
						>
							<option value="">Selecciona una opción</option>
							<option value="fonasa_a">FONASA Tramo A</option>
							<option value="fonasa_b">FONASA Tramo B</option>
							<option value="fonasa_c">FONASA Tramo C</option>
							<option value="fonasa_d">FONASA Tramo D</option>
							<option value="isapre">ISAPRE</option>
							<option value="particular">Particular</option>
							<option value="otro">Otro</option>
						</select>
					</div>
				</FormSection>

				{/* Sección 5: Contacto de emergencia */}
				<FormSection icon={Phone} title="Contacto de Emergencia">
					<FieldGrid cols={2}>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label">Nombre completo</label>
							<input
								id="reg-contacto-nombre"
								type="text"
								className="form-input"
								placeholder="Ej: Juan González"
								value={form.contacto_emergencia_nombre}
								onChange={handleChange('contacto_emergencia_nombre')}
							/>
						</div>
						<div className="form-group" style={{ marginBottom: 0 }}>
							<label className="form-label">Teléfono</label>
							<input
								id="reg-contacto-telefono"
								type="tel"
								className="form-input"
								placeholder="+56 9 8765 4321"
								value={form.contacto_emergencia_telefono}
								onChange={handleChange('contacto_emergencia_telefono')}
							/>
						</div>
					</FieldGrid>
				</FormSection>

				{/* Footer Actions */}
				<div
					style={{
						display: 'flex',
						justifyContent: 'flex-end',
						gap: '12px',
						paddingTop: '8px',
						flexWrap: 'wrap',
					}}
				>
					<button
						type="button"
						className="btn btn-secondary"
						onClick={() => navigate('/calendario')}
						disabled={loading}
					>
						Cancelar
					</button>
					<button
						id="reg-submit"
						type="submit"
						className="btn btn-primary"
						disabled={loading}
					>
						<UserRound size={16} />
						{loading ? 'Registrando...' : 'Registrar Paciente'}
					</button>
				</div>
			</form>
		</div>
	);
};

export default RegistroPaciente;
