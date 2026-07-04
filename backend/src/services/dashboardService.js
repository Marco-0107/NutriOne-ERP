"use strict";
const { getDeudaTotalConsultorio, getMovimientosCaja } = require("./cajaService");
const { getCitasService } = require("./citaService");

// Agrega deuda total y movimientos de caja del consultorio para el dashboard.
const getResumenFinanciero = async ({ desde, hasta } = {}) => {
    const [deudaTotal, movimientos] = await Promise.all([
        getDeudaTotalConsultorio(),
        getMovimientosCaja({ desde, hasta }),
    ]);

    return {
        deuda_total:            deudaTotal,
        ingresos_periodo:       movimientos.total_ingresos,
        subtotales_por_metodo:  movimientos.subtotales_por_metodo,
    };
};

// Usa los getters locales (no toISOString, que siempre expresa el resultado en UTC
// y desplaza al día siguiente cualquier hora local nocturna en zonas UTC-negativas como Chile).
const formatFechaISO = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Conteo simple de citas de hoy y de los próximos 7 días, agrupadas por estado.
// No cruza contra Disponibilidad: no calcula porcentaje de ocupación real.
const getResumenAgenda = async () => {
    const hoy = new Date();
    const hoyStr = formatFechaISO(hoy);

    const hastaSemana = new Date(hoy);
    hastaSemana.setDate(hastaSemana.getDate() + 6);
    const hastaSemanaStr = formatFechaISO(hastaSemana);

    const citasSemana = await getCitasService({ desde: hoyStr, hasta: hastaSemanaStr });

    const citasPorEstado = citasSemana.reduce((acc, c) => {
        acc[c.estado] = (acc[c.estado] || 0) + 1;
        return acc;
    }, {});

    return {
        citas_hoy:         citasSemana.filter((c) => c.fecha === hoyStr).length,
        citas_semana:      citasSemana.length,
        citas_por_estado:  citasPorEstado,
    };
};

module.exports = {
    getResumenFinanciero,
    getResumenAgenda,
};
