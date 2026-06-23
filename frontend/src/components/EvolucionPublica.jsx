import React, { useState, useEffect, useCallback } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { ChevronLeft, LogOut } from 'lucide-react';
import { apiUrl } from '../helpers/api';
import EvolucionDashboard from './EvolucionDashboard';

// Steps: 1=identificación (RUT+teléfono), 2=verificar SMS, 3=evolución
const EvolucionPublica = () => {
    const { executeRecaptcha } = useGoogleReCaptcha();

    const [step, setStep]               = useState(1);
    const [rut, setRut]                 = useState('');
    const [telefono, setTelefono]       = useState('');
    const [codigoSms, setCodigoSms]     = useState('');
    const [verificationToken, setVerificationToken] = useState('');
    const [devOtp, setDevOtp]           = useState(null);
    const [cooldown, setCooldown]       = useState(0);

    const [sendingOtp, setSendingOtp]   = useState(false);
    const [verifyingOtp, setVerifyingOtp] = useState(false);
    const [loadingData, setLoadingData] = useState(false);
    const [error, setError]             = useState('');

    const [paciente, setPaciente]       = useState(null);
    const [fichas, setFichas]           = useState([]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

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

    const handleRutChange = (e) => setRut(formatRut(e.target.value));

    const validateStep1 = () => {
        if (!rut || !telefono) {
            setError('Debes ingresar tu RUT y tu número de teléfono.');
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
            const recaptchaToken = await executeRecaptcha('evolucion_enviar_otp');

            const res  = await fetch(apiUrl('/public/evolucion/enviar-otp'), {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ rut, telefono, recaptcha_token: recaptchaToken }),
            });
            const json = await res.json();

            if (json.success) {
                if (json.dev_otp) setDevOtp(json.dev_otp);
                setCooldown(60);
                setStep(2);
            } else {
                if (res.status === 429) setCooldown(60);
                setError(json.message || 'No fue posible enviar el código de verificación.');
            }
        } catch {
            setError('Error al conectar con el servidor.');
        } finally {
            setSendingOtp(false);
        }
    }, [rut, telefono, executeRecaptcha]);

    const handleResendOtp = useCallback(async () => {
        if (cooldown > 0 || !executeRecaptcha) return;
        setSendingOtp(true);
        setError('');
        setDevOtp(null);
        setCodigoSms('');

        try {
            const recaptchaToken = await executeRecaptcha('evolucion_reenviar_otp');
            const res  = await fetch(apiUrl('/public/evolucion/enviar-otp'), {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ rut, telefono, recaptcha_token: recaptchaToken }),
            });
            const json = await res.json();

            if (json.success) {
                if (json.dev_otp) setDevOtp(json.dev_otp);
                setCooldown(60);
            } else {
                if (res.status === 429) setCooldown(60);
                setError(json.message || 'No fue posible reenviar el código.');
            }
        } catch {
            setError('Error al conectar con el servidor.');
        } finally {
            setSendingOtp(false);
        }
    }, [cooldown, rut, telefono, executeRecaptcha]);

    const handleVerifyOtp = async () => {
        if (codigoSms.length !== 6) {
            setError('Ingresa el código de 6 dígitos que recibiste.');
            return;
        }

        setVerifyingOtp(true);
        setError('');

        try {
            const res  = await fetch(apiUrl('/public/evolucion/verificar-otp'), {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ telefono, codigo: codigoSms }),
            });
            const json = await res.json();

            if (!json.success) {
                setError(json.message || 'Código incorrecto.');
                return;
            }

            setVerificationToken(json.verification_token);
            await fetchEvolucion(json.verification_token);
        } catch {
            setError('Error al verificar el código.');
        } finally {
            setVerifyingOtp(false);
        }
    };

    const fetchEvolucion = async (token) => {
        setLoadingData(true);
        setError('');
        try {
            const res  = await fetch(apiUrl('/public/evolucion/consultar'), {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ rut, telefono, verification_token: token }),
            });
            const json = await res.json();

            if (!json.success) {
                setError(json.message || 'No fue posible obtener tu evolución.');
                return;
            }

            setPaciente(json.data.paciente);
            setFichas(json.data.fichas || []);
            setStep(3);
        } catch {
            setError('Error al conectar con el servidor.');
        } finally {
            setLoadingData(false);
        }
    };

    const resetFlow = () => {
        setStep(1);
        setRut('');
        setTelefono('');
        setCodigoSms('');
        setVerificationToken('');
        setDevOtp(null);
        setCooldown(0);
        setError('');
        setPaciente(null);
        setFichas([]);
    };

    // ── Step 3: mismo tablero que usa la nutricionista, en modo lectura ───────
    if (step === 3 && paciente) {
        return (
            <div className="public-booking-container" style={{ alignItems: 'flex-start', paddingTop: '32px' }}>
                <div style={{ width: '100%', maxWidth: '1080px' }}>
                    <EvolucionDashboard
                        paciente={paciente}
                        fichas={fichas}
                        headerActions={
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                                <button className="btn btn-secondary" onClick={resetFlow}>
                                    <LogOut size={16} /> Salir
                                </button>
                            </div>
                        }
                    />
                </div>
            </div>
        );
    }

    const stepLabels = ['Identificación', 'Verificar SMS', 'Tu Evolución'];

    return (
        <div className="public-booking-container">
            <div className="public-booking-card">
                <div className="public-booking-header">
                    <h1>Mi Evolución Nutricional</h1>
                    <p>Consulta tu progreso e indicaciones de forma segura, cuando quieras</p>
                </div>

                {step === 1 && (
                    <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 16px' }}>
                        ¿Necesitas agendar una hora? <a href="/agendar" style={{ color: 'var(--morado-primario)', fontWeight: 600 }}>Agenda tu cita aquí</a>
                    </p>
                )}

                <div className="public-booking-body">
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

                    {/* Step 1: RUT + Teléfono */}
                    {step === 1 && (
                        <div className="form-container">
                            <h3 style={{ marginBottom: '20px', fontWeight: 600, color: 'var(--gris-oscuro)' }}>Identifícate</h3>
                            <div className="public-form-grid">
                                <div className="form-group public-form-full">
                                    <label htmlFor="evo-rut" className="form-label">RUT</label>
                                    <input type="text" id="evo-rut" placeholder="Ej: 12.345.678-9" className="form-input" value={rut} onChange={handleRutChange} required />
                                </div>
                                <div className="form-group public-form-full">
                                    <label htmlFor="evo-telefono" className="form-label">Teléfono registrado</label>
                                    <input type="tel" id="evo-telefono" placeholder="Ej: +56912345678" className="form-input" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
                                    <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                                        Debe ser el mismo número registrado por tu nutricionista. Se enviará un código de verificación.
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
                                Ingresa el código de 6 dígitos enviado al número <strong>{telefono}</strong>.
                            </p>

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
                                    <ChevronLeft size={16} /> Volver
                                </button>
                                <button type="button" onClick={handleVerifyOtp} className="public-btn public-btn-primary" disabled={verifyingOtp || loadingData || codigoSms.length !== 6}>
                                    {verifyingOtp || loadingData ? 'Verificando...' : 'Ver mi evolución →'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EvolucionPublica;
