/**
 * Calcula la duración en minutos entre dos horarios en formato 'HH:MM' o 'HH:MM:SS'.
 * Ejemplo: calcularDuracionMinutos('09:00', '10:30') → 90
 */
function calcularDuracionMinutos(horaInicio, horaFin) {
    const [hI, mI] = horaInicio.split(':').map(Number);
    const [hF, mF] = horaFin.split(':').map(Number);
    return (hF * 60 + mF) - (hI * 60 + mI);
}

module.exports = { calcularDuracionMinutos };
