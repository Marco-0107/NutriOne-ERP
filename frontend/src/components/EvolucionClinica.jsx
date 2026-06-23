import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChevronLeft, AlertCircle, Clock3 } from 'lucide-react';
import { apiUrl } from '../helpers/api';
import EvolucionDashboard from './EvolucionDashboard';

// ── Componente principal ──────────────────────────────────────────────────────
const EvolucionClinica = () => {
    const { id }       = useParams();
    const navigate     = useNavigate();
    const { token }    = useAuth();

    const [paciente,   setPaciente]   = useState(null);
    const [fichas,     setFichas]     = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState('');

    useEffect(() => {
        if (!id || !token) return;
        setLoading(true);
        setError('');
        Promise.all([
            fetch(apiUrl('/pacientes'),                 { headers: { Authorization: `Bearer ${token}` } }),
            fetch(apiUrl(`/fichas/paciente/${id}`),     { headers: { Authorization: `Bearer ${token}` } }),
        ])
            .then(async ([resPac, resFichas]) => {
                const dataPac    = await resPac.json();
                const dataFichas = await resFichas.json();
                if (!resPac.ok)    throw new Error(dataPac.message    || 'Error al obtener paciente');
                if (!resFichas.ok) throw new Error(dataFichas.message || 'Error al obtener fichas');
                const pac = (dataPac.data || []).find(p => String(p.id) === String(id));
                if (!pac) throw new Error('Paciente no encontrado');
                setPaciente(pac);
                setFichas(dataFichas.data || []);
            })
            .catch(err => setError(err.message || 'Error de conexión'))
            .finally(() => setLoading(false));
    }, [id, token]);

    // ── Loading / Error ───────────────────────────────────────────────────────
    if (loading) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', color: 'var(--text-muted)', gap: '12px' }}>
            <Clock3 size={36} style={{ opacity: 0.4 }} />
            <p style={{ fontWeight: 600 }}>Cargando evolución clínica...</p>
        </div>
    );

    if (error) return (
        <div style={{ animation: 'slideIn 0.3s ease-out' }}>
            <button className="btn btn-secondary" style={{ marginBottom: '24px' }} onClick={() => navigate('/pacientes')}>
                <ChevronLeft size={16} /> Volver a Pacientes
            </button>
            <div className="alert alert-danger"><AlertCircle size={18} /><span>{error}</span></div>
        </div>
    );

    return (
        <EvolucionDashboard
            paciente={paciente}
            fichas={fichas}
            headerActions={
                <button
                    className="btn btn-secondary"
                    style={{ marginBottom: '24px', fontSize: '13px', padding: '8px 16px' }}
                    onClick={() => navigate('/pacientes')}
                >
                    <ChevronLeft size={16} /> Volver a Pacientes
                </button>
            }
        />
    );
};

export default EvolucionClinica;
