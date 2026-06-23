/**
 * Calcula la duración en minutos entre dos horarios en formato 'HH:MM' o 'HH:MM:SS'.
 * Ejemplo: calcularDuracionMinutos('09:00', '10:30') → 90
 */
function calcularDuracionMinutos(horaInicio, horaFin) {
    const [hI, mI] = horaInicio.split(':').map(Number);
    const [hF, mF] = horaFin.split(':').map(Number);
    return (hF * 60 + mF) - (hI * 60 + mI);
}

/**
 * Suma una cantidad de minutos a una hora 'HH:MM' y retorna 'HH:MM'.
 * Ejemplo: sumarMinutosAHora('09:00', 45) → '09:45'
 */
function sumarMinutosAHora(hora, minutos) {
    const [h, m] = hora.split(':').map(Number);
    const totalMin = h * 60 + m + minutos;
    const hF = Math.floor(totalMin / 60) % 24;
    const mF = totalMin % 60;
    return `${String(hF).padStart(2, '0')}:${String(mF).padStart(2, '0')}`;
}

module.exports = { calcularDuracionMinutos, sumarMinutosAHora };
