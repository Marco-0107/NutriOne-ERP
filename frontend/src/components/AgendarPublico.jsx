import React, { useState, useEffect } from 'react';
import { apiUrl } from '../helpers/api';

const AgendarPublico = () => {
    const [step, setStep] = useState(1);
    const [nutricionistas, setNutricionistas] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [bookedCita, setBookedCita] = useState(null);

    // Form data state
    const [formData, setFormData] = useState({
        rut: '',
        nombres: '',
        apellido_paterno: '',
        apellido_materno: '',
        fecha_nacimiento: '',
        id_usuario: '',
        fecha: '',
        hora_inicio: '',
        hora_fin: '',
        observacion: ''
    });

    // Format date in Spanish: Lunes 14 de Junio del 2026
    const formatFechaBonita = (fechaStr) => {
        if (!fechaStr) return '';
        const cleanDate = fechaStr.substring(0, 10);
        const [year, month, day] = cleanDate.split('-');
        const dateObj = new Date(year, month - 1, day);
        
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        const diaSemana = dias[dateObj.getDay()];
        const nombreMes = meses[dateObj.getMonth()];
        
        return `${diaSemana} ${parseInt(day)} de ${nombreMes} del ${year}`;
    };

    // Fetch nutricionistas on load
    useEffect(() => {
        const fetchNutricionistas = async () => {
            try {
                const res = await fetch(apiUrl('/public/nutricionistas'));
                const json = await res.json();
                if (json.success) {
                    setNutricionistas(json.data);
                } else {
                    setError('No se pudieron cargar los nutricionistas disponibles.');
                }
            } catch (err) {
                console.error(err);
                setError('Error al conectar con el servidor.');
            }
        };
        fetchNutricionistas();
    }, []);

    // Fetch slots when nutricionista or date changes
    useEffect(() => {
        if (formData.id_usuario && formData.fecha) {
            const fetchSlots = async () => {
                setLoadingSlots(true);
                setError('');
                setSlots([]);
                try {
                    const res = await fetch(apiUrl(`/public/disponibilidad/${formData.id_usuario}?fecha=${formData.fecha}`));
                    const json = await res.json();
                    if (json.success) {
                        setSlots(json.data);
                        if (json.data.length === 0) {
                            setError('No hay horarios disponibles para esta fecha. Intente con otro día.');
                        }
                    } else {
                        setError(json.message || 'Error al obtener horarios disponibles.');
                    }
                } catch (err) {
                    console.error(err);
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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSlotSelect = (slot) => {
        setFormData(prev => ({
            ...prev,
            hora_inicio: slot.hora_inicio,
            hora_fin: slot.hora_fin
        }));
    };

    // Format RUT automatically: 12.345.678-9
    const formatRut = (value) => {
        let clean = value.replace(/[^0-9kK]/g, '');
        if (clean.length === 0) return '';
        
        let body = clean.slice(0, -1);
        let dv = clean.slice(-1).toUpperCase();
        
        // Format body with dots
        let formatted = '';
        while (body.length > 3) {
            formatted = '.' + body.slice(-3) + formatted;
            body = body.slice(0, -3);
        }
        formatted = body + formatted;
        
        return `${formatted}-${dv}`;
    };

    const handleRutChange = (e) => {
        const formatted = formatRut(e.target.value);
        setFormData(prev => ({
            ...prev,
            rut: formatted
        }));
    };

    // Validate Step 1: Patient Data
    const validateStep1 = () => {
        const { rut, nombres, apellido_paterno, apellido_materno, fecha_nacimiento } = formData;
        if (!rut || !nombres || !apellido_paterno || !apellido_materno || !fecha_nacimiento) {
            setError('Todos los campos de datos personales son obligatorios.');
            return false;
        }
        const rutPattern = /^\d{1,3}(\.\d{3}){1,2}-[\dkK]$/i;
        if (!rutPattern.test(rut)) {
            setError('El RUT ingresado no tiene un formato válido (ej: 12.345.678-9).');
            return false;
        }
        setError('');
        return true;
    };

    const nextStep = () => {
        if (step === 1) {
            if (validateStep1()) {
                setStep(2);
            }
        }
    };

    const prevStep = () => {
        setError('');
        setStep(1);
    };

    // Submit booking
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.hora_inicio || !formData.hora_fin) {
            setError('Debe seleccionar un bloque de horario para agendar su cita.');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const res = await fetch(apiUrl('/public/agendar'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const json = await res.json();
            if (json.success) {
                setBookedCita(json.data);
                setStep(3);
            } else {
                setError(json.message || 'Ocurrió un error al agendar su cita.');
            }
        } catch (err) {
            console.error(err);
            setError('Error al enviar la solicitud al servidor. Inténtelo de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    // Prevent selecting past dates
    const getMinDate = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

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
                        <div className={`public-step ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                            <div className="public-step-num">{step > 1 ? '✓' : '1'}</div>
                            <span className="public-step-text">Tus Datos</span>
                        </div>
                        <div className={`public-step ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                            <div className="public-step-num">{step > 2 ? '✓' : '2'}</div>
                            <span className="public-step-text">Fecha y Hora</span>
                        </div>
                        <div className={`public-step ${step === 3 ? 'active' : ''}`}>
                            <div className="public-step-num">3</div>
                            <span className="public-step-text">Confirmación</span>
                        </div>
                    </div>

                    {/* General Errors */}
                    {error && (
                        <div className="public-error-box">
                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>⚠️</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Step 1: Patient Personal Information */}
                    {step === 1 && (
                        <div className="form-container">
                            <h3 style={{ marginBottom: '20px', fontWeight: 600, color: 'var(--gris-oscuro)' }}>Datos Personales</h3>
                            <div className="public-form-grid">
                                <div className="form-group public-form-full">
                                    <label htmlFor="rut" className="form-label">RUT del Paciente</label>
                                    <input 
                                        type="text" 
                                        id="rut" 
                                        name="rut" 
                                        placeholder="Ej: 12.345.678-9" 
                                        className="form-input"
                                        value={formData.rut}
                                        onChange={handleRutChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="nombres" className="form-label">Nombres</label>
                                    <input 
                                        type="text" 
                                        id="nombres" 
                                        name="nombres" 
                                        placeholder="Ej: Juan Andrés" 
                                        className="form-input"
                                        value={formData.nombres}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="apellido_paterno" className="form-label">Apellido Paterno</label>
                                    <input 
                                        type="text" 
                                        id="apellido_paterno" 
                                        name="apellido_paterno" 
                                        placeholder="Ej: Pérez" 
                                        className="form-input"
                                        value={formData.apellido_paterno}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="apellido_materno" className="form-label">Apellido Materno</label>
                                    <input 
                                        type="text" 
                                        id="apellido_materno" 
                                        name="apellido_materno" 
                                        placeholder="Ej: González" 
                                        className="form-input"
                                        value={formData.apellido_materno}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="fecha_nacimiento" className="form-label">Fecha de Nacimiento</label>
                                    <input 
                                        type="date" 
                                        id="fecha_nacimiento" 
                                        name="fecha_nacimiento" 
                                        className="form-input"
                                        value={formData.fecha_nacimiento}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="public-btn-group" style={{ justifyContent: 'flex-end' }}>
                                <button type="button" onClick={nextStep} className="public-btn public-btn-primary">
                                    Siguiente Paso →
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Appointment Specifics */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit}>
                            <h3 style={{ marginBottom: '20px', fontWeight: 600, color: 'var(--gris-oscuro)' }}>Elige tu Horario</h3>
                            <div className="public-form-grid">
                                <div className="form-group">
                                    <label htmlFor="id_usuario" className="form-label">Selecciona Nutricionista</label>
                                    <select 
                                        id="id_usuario" 
                                        name="id_usuario" 
                                        className="form-input"
                                        value={formData.id_usuario}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">-- Seleccionar --</option>
                                        {nutricionistas.map(n => (
                                            <option key={n.id} value={n.id}>
                                                {n.nombres} {n.apellido_paterno}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="fecha" className="form-label">Fecha de Atención</label>
                                    <input 
                                        type="date" 
                                        id="fecha" 
                                        name="fecha" 
                                        min={getMinDate()}
                                        className="form-input"
                                        value={formData.fecha}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>

                                <div className="form-group public-form-full">
                                    <label className="form-label">Horarios Disponibles</label>
                                    {loadingSlots ? (
                                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '10px' }}>
                                            Buscando horarios disponibles...
                                        </p>
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
                                            {formData.id_usuario && formData.fecha 
                                                ? 'No hay disponibilidad para este día.' 
                                                : 'Seleccione un nutricionista y una fecha para ver horarios.'
                                            }
                                        </p>
                                    )}
                                </div>

                                <div className="form-group public-form-full">
                                    <label htmlFor="observacion" className="form-label">Motivo de la Cita / Comentario (Opcional)</label>
                                    <textarea 
                                        id="observacion" 
                                        name="observacion" 
                                        rows="3" 
                                        placeholder="Ej: Primera consulta, control de peso, cambio de dieta..." 
                                        className="form-input"
                                        value={formData.observacion}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="public-btn-group">
                                <button type="button" onClick={prevStep} className="public-btn public-btn-secondary">
                                    ← Volver
                                </button>
                                <button 
                                    type="submit" 
                                    className="public-btn public-btn-primary"
                                    disabled={submitting || !formData.hora_inicio}
                                >
                                    {submitting ? 'Agendando...' : 'Confirmar y Agendar Cita ✓'}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step 3: Success Confirmation */}
                    {step === 3 && bookedCita && (
                        <div className="public-success-card">
                            <div className="public-success-icon">✓</div>
                            <h2 style={{ color: 'var(--exito)', marginBottom: '10px', fontWeight: 'bold' }}>¡Cita Agendada Exitosamente!</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                                Tu cita ha sido registrada con éxito en el sistema. A continuación se detallan los datos:
                            </p>

                            <div style={{ 
                                background: 'var(--bg-primary)', 
                                padding: '25px', 
                                borderRadius: 'var(--radius-md)', 
                                border: '1px solid var(--border-color)',
                                textAlign: 'left',
                                maxWidth: '480px',
                                margin: '0 auto 30px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Paciente:</span>
                                    <span>{bookedCita.paciente.nombres} {bookedCita.paciente.apellido_paterno}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Nutricionista:</span>
                                    <span>{bookedCita.nutricionista.nombres}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Fecha:</span>
                                    <span>{formatFechaBonita(bookedCita.fecha)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Horario:</span>
                                    <span>{bookedCita.hora_inicio.substring(0, 5)} - {bookedCita.hora_fin.substring(0, 5)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Estado:</span>
                                    <span style={{ color: 'var(--morado-primario)', fontWeight: 600 }}>Pendiente</span>
                                </div>
                            </div>

                            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                Puedes tomar una captura de pantalla de este comprobante para tu respaldo.
                            </p>

                            <div className="public-btn-group" style={{ justifyContent: 'center' }}>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setFormData({
                                            rut: '',
                                            nombres: '',
                                            apellido_paterno: '',
                                            apellido_materno: '',
                                            fecha_nacimiento: '',
                                            id_usuario: '',
                                            fecha: '',
                                            hora_inicio: '',
                                            hora_fin: '',
                                            observacion: ''
                                        });
                                        setStep(1);
                                        setBookedCita(null);
                                    }} 
                                    className="public-btn public-btn-primary"
                                >
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
