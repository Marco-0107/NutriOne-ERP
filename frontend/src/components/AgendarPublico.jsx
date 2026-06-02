import React, { useState, useEffect, useCallback } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { apiUrl } from '../helpers/api';

// Steps: 1=datos, 2=verificar SMS, 3=horario, 4=confirmación
const AgendarPublico = () => {
    const { executeRecaptcha } = useGoogleReCaptcha();

    const [step, setStep]                       = useState(1);
    const [nutricionistas, setNutricionistas]   = useState([]);
    const [slots, setSlots]                     = useState([]);
    const [loadingSlots, setLoadingSlots]       = useState(false);
    const [error, setError]                     = useState('');
    const [submitting, setSubmitting]           = useState(false);
    const [sendingOtp, setSendingOtp]           = useState(false);
    const [verifyingOtp, setVerifyingOtp]       = useState(false);
    const [bookedCita, setBookedCita]           = useState(null);
    const [devOtp, setDevOtp]                   = useState(null);     // only in mock mode
    const [codigoSms, setCodigoSms]             = useState('');
    const [verificationToken, setVerificationToken] = useState('');
    const [cooldown, setCooldown]               = useState(0);

    const [formData, setFormData] = useState({
        rut: '',
        nombres: '',
        apellido_paterno: '',
        apellido_materno: '',
        fecha_nacimiento: '',
        telefono: '',
        id_usuario: '',
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
        observacion: '',
    });

    // Cooldown timer for resend button
    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    const formatFechaBonita = (fechaStr) => {
        if (!fechaStr) return '';
        const cleanDate = fechaStr.substring(0, 10);
        const [year, month, day] = cleanDate.split('-');
        const dateObj = new Date(year, month - 1, day);
        const dias   = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses  = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${dias[dateObj.getDay()]} ${parseInt(day)} de ${meses[dateObj.getMonth()]} del ${year}`;
    };

    useEffect(() => {
        const fetchNutricionistas = async () => {
            try {
                const res  = await fetch(apiUrl('/public/nutricionistas'));
                const json = await res.json();
                if (json.success) {
                    setNutricionistas(json.data);
                } else {
                    setError('No se pudieron cargar los nutricionistas disponibles.');
                }
            } catch (err) {
                console.error('[DEBUG fetchNutricionistas]', err);
                setError('Error al conectar con el servidor.');
            }
        };
        fetchNutricionistas();
    }, []);

    useEffect(() => {
        if (formData.id_usuario && formData.fecha) {
            const fetchSlots = async () => {
                setLoadingSlots(true);
                setError('');
                setSlots([]);
                try {
                    const res  = await fetch(apiUrl(`/public/disponibilidad/${formData.id_usuario}?fecha=${formData.fecha}`));
                    const json = await res.json();
                    if (json.success) {
                        setSlots(json.data);
                        if (json.data.length === 0) {
                            setError('No hay horarios disponibles para esta fecha. Intente con otro día.');
                        }
                    } else {
                        setError(json.message || 'Error al obtener horarios disponibles.');
                    }
                } catch {
                    setError('Error al consultar disponibilidad.');
                } finally {
                    setLoadingSlots(false);
                }
            };
            fetchSlots();
        }
    }, [formData.id_usuario, formData.fecha]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSlotSelect = (slot) => {
        setFormData(prev => ({ ...prev, hora_inicio: slot.hora_inicio, hora_fin: slot.hora_fin }));
    };

    const formatRut = (value) => {
        let clean = value.replace(/[^0-9kK]/g, '');
        if (clean.length === 0) return '';
        let body = clean.slice(0, -1);
        let dv   = clean.slice(-1).toUpperCase();
        let formatted = '';
        while (body.length > 3) {
            formatted = '.' + body.slice(-3) + formatted;
            body = body.slice(0, -3);
        }
        formatted = body + formatted;
        return `${formatted}-${dv}`;
    };

    const handleRutChange = (e) => {
        setFormData(prev => ({ ...prev, rut: formatRut(e.target.value) }));
    };

    const validateStep1 = () => {
        const { rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento, telefono } = formData;
        if (!rut || !nombres || !apellido_paterno || !apellido_materno || !fecha_nacimiento || !telefono) {
            setError('Todos los campos son obligatorios, incluyendo el teléfono.');
            return false;
        }
        if (!/^\d{1,3}(\.\d{3}){1,2}-[\dkK]$/i.test(rut)) {
            setError('El RUT ingresado no tiene un formato válido (ej: 12.345.678-9).');
            return false;
        }
        if (!/^\+?56[2-9]\d{8}$|^\+?[1-9]\d{7,14}$/.test(telefono)) {
            setError('El teléfono debe ser un número válido (ej: +56912345678).');
            return false;
        }
        setError('');
        return true;
    };

    // Step 1 → 2: validate data, get reCAPTCHA token, send OTP
    const handleSendOtp = useCallback(async () => {
        if (!validateStep1()) return;

        if (!executeRecaptcha) {
            setError('reCAPTCHA no está listo. Espera un momento y vuelve a intentarlo.');
            return;
        }

        setSendingOtp(true);
        setError('');
        setDevOtp(null);

        try {
            const recaptchaToken = await executeRecaptcha('enviar_otp');

            const res  = await fetch(apiUrl('/public/enviar-otp'), {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ telefono: formData.telefono, recaptcha_token: recaptchaToken }),
            });
            const json = await res.json();

            if (json.success) {
                if (json.dev_otp) setDevOtp(json.dev_otp);
                setCooldown(60);
                setStep(2);
            } else {
                if (res.status === 429) setCooldown(60);
                setError(json.message || 'Error al enviar el código.');
            }
        } catch (err) {
            console.error('[DEBUG handleSendOtp]', err);
            setError('Error al conectar con el servidor.');
        } finally {
            setSendingOtp(false);
        }
    }, [formData.telefono, executeRecaptcha]);

    // Resend OTP from step 2
    const handleResendOtp = useCallback(async () => {
        if (cooldown > 0 || !executeRecaptcha) return;
        setSendingOtp(true);
        setError('');
        setDevOtp(null);
        setCodigoSms('');

        try {
            const recaptchaToken = await executeRecaptcha('reenviar_otp');
            const res  = await fetch(apiUrl('/public/enviar-otp'), {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ telefono: formData.telefono, recaptcha_token: recaptchaToken }),
            });
            const json = await res.json();

            if (json.success) {
                if (json.dev_otp) setDevOtp(json.dev_otp);
                setCooldown(60);
            } else {
                if (res.status === 429) setCooldown(60);
                setError(json.message || 'Error al reenviar el código.');
            }
        } catch {
            setError('Error al conectar con el servidor.');
        } finally {
            setSendingOtp(false);
        }
    }, [cooldown, formData.telefono, executeRecaptcha]);

    // Verify OTP → move to step 3
    const handleVerifyOtp = async () => {
        if (codigoSms.length !== 6) {
            setError('Ingresa el código de 6 dígitos que recibiste.');
            return;
        }

        setVerifyingOtp(true);
        setError('');

        try {
            const res  = await fetch(apiUrl('/public/verificar-otp'), {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ telefono: formData.telefono, codigo: codigoSms }),
            });
            const json = await res.json();

            if (json.success) {
                setVerificationToken(json.verification_token);
                setStep(3);
            } else {
                setError(json.message || 'Código incorrecto.');
            }
        } catch {
            setError('Error al verificar el código.');
        } finally {
            setVerifyingOtp(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.hora_inicio || !formData.hora_fin) {
            setError('Debe seleccionar un bloque de horario para agendar su cita.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res  = await fetch(apiUrl('/public/agendar'), {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ ...formData, verification_token: verificationToken }),
            });
            const json = await res.json();

            if (json.success) {
                setBookedCita(json.data);
                setStep(4);
            } else {
                setError(json.message || 'Ocurrió un error al agendar su cita.');
            }
        } catch {
            setError('Error al enviar la solicitud al servidor. Inténtelo de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    const getMinDate = () => {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    };

    const resetForm = () => {
        setFormData({ rut: '', nombres: '', apellido_paterno: '', apellido_materno: '', fecha_nacimiento: '', telefono: '', id_usuario: '', fecha: '', hora_inicio: '', hora_fin: '', observacion: '' });
        setStep(1);
        setBookedCita(null);
        setDevOtp(null);
        setCodigoSms('');
        setVerificationToken('');
        setError('');
        setCooldown(0);
    };

    const stepLabels = ['Tus Datos', 'Verificar SMS', 'Fecha y Hora', 'Confirmación'];

    return (
        <div className="public-booking-container">
            <div className="public-booking-card">
                <div className="public-booking-header">
                    <h1>NutriOne Portal Citas</h1>
                    <p>Reserva tu hora de atención nutricional de manera rápida y sencilla</p>
                </div>

                <div className="public-booking-body">
                    {/* Progress Steps */}
                    <div className="public-step-indicator">
                        {stepLabels.map((label, idx) => {
                            const num = idx + 1;
                            return (
                                <div key={num} className={`public-step ${step === num ? 'active' : ''} ${step > num ? 'completed' : ''}`}>
                                    <div className="public-step-num">{step > num ? '✓' : num}</div>
                                    <span className="public-step-text">{label}</span>
                                </div>
                            );
                        })}
                    </div>

                    {error && (
                        <div className="public-error-box">
                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Step 1: Datos personales */}
                    {step === 1 && (
                        <div className="form-container">
                            <h3 style={{ marginBottom: '20px', fontWeight: 600, color: 'var(--gris-oscuro)' }}>Datos Personales</h3>
                            <div className="public-form-grid">
                                <div className="form-group public-form-full">
                                    <label htmlFor="rut" className="form-label">RUT del Paciente</label>
                                    <input type="text" id="rut" name="rut" placeholder="Ej: 12.345.678-9" className="form-input" value={formData.rut} onChange={handleRutChange} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="nombres" className="form-label">Nombres</label>
                                    <input type="text" id="nombres" name="nombres" placeholder="Ej: Juan Andrés" className="form-input" value={formData.nombres} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="apellido_paterno" className="form-label">Apellido Paterno</label>
                                    <input type="text" id="apellido_paterno" name="apellido_paterno" placeholder="Ej: Pérez" className="form-input" value={formData.apellido_paterno} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="apellido_materno" className="form-label">Apellido Materno</label>
                                    <input type="text" id="apellido_materno" name="apellido_materno" placeholder="Ej: González" className="form-input" value={formData.apellido_materno} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="fecha_nacimiento" className="form-label">Fecha de Nacimiento</label>
                                    <input type="date" id="fecha_nacimiento" name="fecha_nacimiento" className="form-input" value={formData.fecha_nacimiento} onChange={handleInputChange} required />
                                </div>
                                <div className="form-group public-form-full">
                                    <label htmlFor="telefono" className="form-label">Teléfono (para verificación)</label>
                                    <input type="tel" id="telefono" name="telefono" placeholder="Ej: +56912345678" className="form-input" value={formData.telefono} onChange={handleInputChange} required />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        Se enviará un código de verificación a este número.
                                    </small>
                                </div>
                            </div>

                            <div className="public-btn-group" style={{ justifyContent: 'flex-end' }}>
                                <button type="button" onClick={handleSendOtp} className="public-btn public-btn-primary" disabled={sendingOtp}>
                                    {sendingOtp ? 'Enviando código...' : 'Enviar código SMS →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Verificar SMS */}
                    {step === 2 && (
                        <div className="form-container">
                            <h3 style={{ marginBottom: '8px', fontWeight: 600, color: 'var(--gris-oscuro)' }}>Verificar Número de Teléfono</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                                Ingresa el código de 6 dígitos enviado al número <strong>{formData.telefono}</strong>.
                            </p>

                            {/* Dev mode notice */}
                            {devOtp && (
                                <div style={{
                                    background: '#FEF3C7',
                                    border: '1px solid #F59E0B',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '14px 18px',
                                    marginBottom: '20px',
                                    fontSize: '13px',
                                    color: '#92400E',
                                }}>
                                    <strong>⚠️ MODO DESARROLLO</strong> — En producción este código llegaría por SMS al teléfono indicado.<br/>
                                    <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '4px', display: 'block', marginTop: '8px', color: '#78350F' }}>
                                        {devOtp}
                                    </span>
                                </div>
                            )}

                            <div className="form-group" style={{ maxWidth: '220px', margin: '0 auto 24px' }}>
                                <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>Código de verificación</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="000000"
                                    className="form-input"
                                    value={codigoSms}
                                    onChange={(e) => setCodigoSms(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '6px', fontWeight: 700 }}
                                />
                            </div>

                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={cooldown > 0 || sendingOtp}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: cooldown > 0 ? 'var(--text-muted)' : 'var(--morado-primario)',
                                        cursor: cooldown > 0 ? 'default' : 'pointer',
                                        fontSize: '13px',
                                        textDecoration: 'underline',
                                    }}
                                >
                                    {cooldown > 0 ? `Reenviar código en ${cooldown}s` : 'Reenviar código'}
                                </button>
                            </div>

                            <div className="public-btn-group">
                                <button type="button" onClick={() => { setStep(1); setError(''); setCodigoSms(''); setDevOtp(null); }} className="public-btn public-btn-secondary">
                                    ← Volver
                                </button>
                                <button type="button" onClick={handleVerifyOtp} className="public-btn public-btn-primary" disabled={verifyingOtp || codigoSms.length !== 6}>
                                    {verifyingOtp ? 'Verificando...' : 'Verificar Código →'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Fecha y Hora */}
                    {step === 3 && (
                        <form onSubmit={handleSubmit}>
                            <h3 style={{ marginBottom: '20px', fontWeight: 600, color: 'var(--gris-oscuro)' }}>Elige tu Horario</h3>
                            <div className="public-form-grid">
                                <div className="form-group">
                                    <label htmlFor="id_usuario" className="form-label">Selecciona Nutricionista</label>
                                    <select id="id_usuario" name="id_usuario" className="form-input" value={formData.id_usuario} onChange={handleInputChange} required>
                                        <option value="">-- Seleccionar --</option>
                                        {nutricionistas.map(n => (
                                            <option key={n.id} value={n.id}>{n.nombres} {n.apellido_paterno}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="fecha" className="form-label">Fecha de Atención</label>
                                    <input type="date" id="fecha" name="fecha" min={getMinDate()} className="form-input" value={formData.fecha} onChange={handleInputChange} required />
                                </div>

                                <div className="form-group public-form-full">
                                    <label className="form-label">Horarios Disponibles</label>
                                    {loadingSlots ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '10px' }}>Buscando horarios disponibles...</p>
                                    ) : slots.length > 0 ? (
                                        <div className="public-slots-grid">
                                            {slots.map((s, idx) => (
                                                <button
                                                    key={idx}
                                                    type="button"
                                                    className={`public-slot-btn ${formData.hora_inicio === s.hora_inicio ? 'selected' : ''}`}
                                                    onClick={() => handleSlotSelect(s)}
                                                >
                                                    {s.hora_inicio.substring(0, 5)} - {s.hora_fin.substring(0, 5)}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '10px' }}>
                                            {formData.id_usuario && formData.fecha ? 'No hay disponibilidad para este día.' : 'Seleccione un nutricionista y una fecha para ver horarios.'}
                                        </p>
                                    )}
                                </div>

                                <div className="form-group public-form-full">
                                    <label htmlFor="observacion" className="form-label">Motivo de la Cita / Comentario (Opcional)</label>
                                    <textarea id="observacion" name="observacion" rows="3" placeholder="Ej: Primera consulta, control de peso, cambio de dieta..." className="form-input" value={formData.observacion} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="public-btn-group">
                                <button type="button" onClick={() => { setStep(2); setError(''); }} className="public-btn public-btn-secondary">
                                    ← Volver
                                </button>
                                <button type="submit" className="public-btn public-btn-primary" disabled={submitting || !formData.hora_inicio}>
                                    {submitting ? 'Agendando...' : 'Confirmar y Agendar Cita ✓'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 4: Confirmación */}
                    {step === 4 && bookedCita && (
                        <div className="public-success-card">
                            <div className="public-success-icon">✓</div>
                            <h2 style={{ color: 'var(--exito)', marginBottom: '10px', fontWeight: 'bold' }}>¡Cita Agendada Exitosamente!</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                                Tu cita ha sido registrada con éxito en el sistema. A continuación se detallan los datos:
                            </p>

                            <div style={{ background: 'var(--bg-primary)', padding: '25px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'left', maxWidth: '480px', margin: '0 auto 30px' }}>
                                {[
                                    ['Paciente',      `${bookedCita.paciente.nombres} ${bookedCita.paciente.apellido_paterno}`],
                                    ['Nutricionista', bookedCita.nutricionista.nombres],
                                    ['Fecha',         formatFechaBonita(bookedCita.fecha)],
                                    ['Horario',       `${bookedCita.hora_inicio.substring(0, 5)} - ${bookedCita.hora_fin.substring(0, 5)}`],
                                ].map(([label, value], i, arr) => (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: i < arr.length - 1 ? '12px' : 0, borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: i < arr.length - 1 ? '8px' : 0 }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{label}:</span>
                                        <span>{value}</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Estado:</span>
                                    <span style={{ color: 'var(--morado-primario)', fontWeight: 600 }}>Pendiente</span>
                                </div>
                            </div>

                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                Puedes tomar una captura de pantalla de este comprobante para tu respaldo.
                            </p>

                            <div className="public-btn-group" style={{ justifyContent: 'center' }}>
                                <button type="button" onClick={resetForm} className="public-btn public-btn-primary">
                                    Reservar Otra Cita
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgendarPublico;
