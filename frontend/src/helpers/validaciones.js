// Validaciones de formato compartidas por los formularios del frontend.

const calcularDigitoVerificador = (rutBody) => {
	let suma = 0;
	let multiplo = 2;
	for (let i = rutBody.length - 1; i >= 0; i--) {
		suma += parseInt(rutBody[i], 10) * multiplo;
		multiplo = multiplo < 7 ? multiplo + 1 : 2;
	}
	const resto = 11 - (suma % 11);
	if (resto === 11) return '0';
	if (resto === 10) return 'K';
	return String(resto);
};

// Valida formato (NN.NNN.NNN-D) y dígito verificador módulo 11.
export const validarRut = (rut) => {
	if (!rut) return false;
	const clean = rut.replace(/[^0-9kK]/g, '');
	if (clean.length < 2) return false;

	const body = clean.slice(0, -1);
	const dv = clean.slice(-1).toUpperCase();
	if (!/^\d+$/.test(body)) return false;

	return calcularDigitoVerificador(body) === dv;
};

export const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());

export const validarTelefono = (telefono) => /^\+?56[2-9]\d{8}$|^\+?[1-9]\d{7,14}$/.test((telefono || '').trim());

// No permite fechas de nacimiento futuras ni anteriores a hace 120 años.
export const validarFechaNacimiento = (fechaStr) => {
	if (!fechaStr) return false;
	const fecha = new Date(`${fechaStr}T12:00:00`);
	if (Number.isNaN(fecha.getTime())) return false;

	const hoy = new Date();
	const hace120Anios = new Date();
	hace120Anios.setFullYear(hoy.getFullYear() - 120);

	return fecha <= hoy && fecha >= hace120Anios;
};

export const validarFechaNoPasada = (fechaStr) => {
	if (!fechaStr) return false;
	const fecha = new Date(`${fechaStr}T12:00:00`);
	if (Number.isNaN(fecha.getTime())) return false;

	const hoy = new Date();
	hoy.setHours(0, 0, 0, 0);
	return fecha >= hoy;
};

export const validarFechaNoFutura = (fechaStr) => {
	if (!fechaStr) return false;
	const fecha = new Date(`${fechaStr}T12:00:00`);
	if (Number.isNaN(fecha.getTime())) return false;

	const hoy = new Date();
	hoy.setHours(23, 59, 59, 999);
	return fecha <= hoy;
};
