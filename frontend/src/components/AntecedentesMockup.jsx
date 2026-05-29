import React from 'react';
import { Search, FilePlus2, Filter, CalendarDays } from 'lucide-react';

//Cuándo se implemente la API, reemplazar MOCK_ROWS por datos reales obtenidos del backend.
//Agregar useEffect para llamar a la API y useState para almacenar los datos obtenidos.
//Habilitar la búsqueda y los filtros para que interactúen con los datos reales.

const MOCK_ROWS = [
    {
        id: 'AC-001',
        paciente: 'Camila Rojas',
        fecha: '2026-05-12',
        control: 'Control Nutricional',
        diagnostico: 'Sobrepeso grado I',
        indicaciones: 'Plan hipocalorico + actividad fisica',
        estado: 'Pendiente de seguimiento'
    },
    {
        id: 'AC-002',
        paciente: 'Mateo Gonzalez',
        fecha: '2026-05-10',
        control: 'Control Metabolico',
        diagnostico: 'Resistencia a la insulina',
        indicaciones: 'Distribucion de carbohidratos por porcion',
        estado: 'En seguimiento'
    },
    {
        id: 'AC-003',
        paciente: 'Daniela Vega',
        fecha: '2026-05-09',
        control: 'Evaluacion inicial',
        diagnostico: 'Bajo peso',
        indicaciones: 'Aumento progresivo de densidad calorica',
        estado: 'Plan activo'
    }
];

const handleActionClick = (row) => {
    console.log('Accion sobre registro:', row.id);
};

const AntecedentesMockup = () => {
    return (
        <section style={{ animation: 'slideIn 0.3s ease-out' }}>
            <div className="action-bar">
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Fichas Clinicas
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                        Fichas con información sobre controles, observaciones, diagnosticos e indicaciones por paciente y al detalle.
                    </p>
                </div>
            </div>

            <div className="mockup-toolbar">
                <div className="mockup-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por paciente, diagnostico o control..."
                        className="mockup-input"
                        disabled
                    />
                </div>

                <div className="mockup-toolbar-actions">
                    <button className="btn btn-secondary" type="button" disabled>
                        <Filter size={15} />
                        Filtrar
                    </button>
                    <button className="btn btn-secondary" type="button" disabled>
                        <CalendarDays size={15} />
                        Rango de Fechas
                    </button>
                </div>
            </div>

            <div className="mockup-table-card">
                <div className="mockup-table-wrap">
                    <table className="mockup-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Paciente</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {MOCK_ROWS.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.id}</td>
                                    <td>{row.paciente}</td>
                                    <td>
                                        <span className="status-pill">{row.estado}</span>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            style={{ padding: '8px 12px', fontSize: '13px' }}
                                            onClick={() => handleActionClick(row)}
                                        >
                                            Ver detalle
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mockup-footnote">
                    DATOS DE EJEMPLO
                </div>
            </div>
        </section>
    );
};

export default AntecedentesMockup;
