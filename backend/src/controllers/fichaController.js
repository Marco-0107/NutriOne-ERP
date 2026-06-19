const { AppDataSource } = require("../config/configDb");
const { badRequest, serverError } = require("../handlers/errorHandler");


/**
 * GET /fichas/cita/:id_cita
 * Obtiene la ficha clínica asociada a una cita.
 * Si no existe, retorna { data: null } con status 200.
 */
const getFichaByCita = async (req, res) => {
    const id_cita = parseInt(req.params.id_cita);
    if (isNaN(id_cita)) return badRequest(res, "El ID de la cita debe ser un número válido.");

    try {
        const ficha = await AppDataSource.getRepository("FichaClinica")
            .createQueryBuilder("ficha")
            .leftJoinAndSelect("ficha.cita", "cita")
            .leftJoinAndSelect("cita.paciente", "paciente")
            .leftJoinAndSelect("paciente.usuario", "pacienteUsuario")
            .leftJoinAndSelect("cita.usuario", "nutricionista")
            .where("cita.id_cita = :id_cita", { id_cita })
            .getOne();

        return res.json({ success: true, data: ficha ?? null });
    } catch (err) {
        return serverError(res, err, "fichaController.getFichaByCita");
    }
};

/**
 * POST /fichas/cita/:id_cita
 * Crea una nueva ficha clínica para la cita indicada.
 * Si ya existe una ficha para esa cita, retorna 409.
 */
const createFicha = async (req, res) => {
    const id_cita = parseInt(req.params.id_cita);
    if (isNaN(id_cita)) return badRequest(res, "El ID de la cita debe ser un número válido.");

    const { tipo, fecha_atencion, edad, nombre_social, sexo, peso, talla, presion_arterial, circunferencia_cintura, calculos, diagnostico_nutricional, motivo_consulta, observacion, indicaciones, recomendaciones, derivaciones } = req.body;

    if (!tipo)           return badRequest(res, "El tipo de atención es requerido.");
    if (!fecha_atencion) return badRequest(res, "La fecha de atención es requerida.");
    if (!edad)           return badRequest(res, "La edad es requerida.");

    try {
        // Verificar que la cita exista
        const cita = await AppDataSource.getRepository("Cita").findOne({
            where: { id_cita },
            relations: { fichaClinica: true },
        });
        if (!cita) return res.status(404).json({ success: false, message: "Cita no encontrada." });
        if (cita.fichaClinica) return res.status(409).json({ success: false, message: "Esta cita ya tiene una ficha clínica registrada." });

        const fichaRepo = AppDataSource.getRepository("FichaClinica");
        const nueva = fichaRepo.create({
            cita,
            tipo,
            fecha_atencion,
            edad: parseInt(edad),
            nombre_social:          nombre_social          ?? null,
            sexo:                   sexo                   ?? null,
            peso:                   peso  ? parseFloat(peso)  : null,
            talla:                  talla ? parseFloat(talla) : null,
            presion_arterial:       presion_arterial        ?? null,
            circunferencia_cintura: circunferencia_cintura ? parseFloat(circunferencia_cintura) : null,
            calculos:               calculos               ?? null,
            diagnostico_nutricional: diagnostico_nutricional ?? null,
            motivo_consulta:        motivo_consulta        ?? null,
            observacion:            observacion            ?? null,
            indicaciones:           indicaciones           ?? null,
            recomendaciones:        recomendaciones        ?? null,
            derivaciones:           derivaciones           ?? null,
            estado: "activo",
        });

        const saved = await fichaRepo.save(nueva);

        // Marcar la cita como completada
        await AppDataSource.getRepository("Cita").update({ id_cita }, { estado: "completada" });

        return res.status(201).json({ success: true, data: saved });
    } catch (err) {
        return serverError(res, err, "fichaController.createFicha");
    }
};

/**
 * PUT /fichas/:id_ficha
 * Actualiza una ficha clínica existente.
 */
const updateFicha = async (req, res) => {
    const id_ficha = parseInt(req.params.id_ficha);
    if (isNaN(id_ficha)) return badRequest(res, "El ID de la ficha debe ser un número válido.");

    const { tipo, fecha_atencion, edad, nombre_social, sexo, peso, talla, presion_arterial, circunferencia_cintura, calculos, diagnostico_nutricional, motivo_consulta, observacion, indicaciones, recomendaciones, derivaciones, estado } = req.body;

    try {
        const fichaRepo = AppDataSource.getRepository("FichaClinica");
        const ficha = await fichaRepo.findOneBy({ id_ficha });
        if (!ficha) return res.status(404).json({ success: false, message: "Ficha clínica no encontrada." });

        if (tipo                    !== undefined) ficha.tipo                    = tipo;
        if (fecha_atencion          !== undefined) ficha.fecha_atencion          = fecha_atencion;
        if (edad                    !== undefined) ficha.edad                    = parseInt(edad);
        if (nombre_social           !== undefined) ficha.nombre_social           = nombre_social;
        if (sexo                    !== undefined) ficha.sexo                    = sexo;
        if (peso                    !== undefined) ficha.peso                    = peso ? parseFloat(peso) : null;
        if (talla                   !== undefined) ficha.talla                   = talla ? parseFloat(talla) : null;
        if (presion_arterial        !== undefined) ficha.presion_arterial        = presion_arterial;
        if (circunferencia_cintura  !== undefined) ficha.circunferencia_cintura  = circunferencia_cintura ? parseFloat(circunferencia_cintura) : null;
        if (calculos                !== undefined) ficha.calculos                = calculos;
        if (diagnostico_nutricional !== undefined) ficha.diagnostico_nutricional = diagnostico_nutricional;
        if (motivo_consulta         !== undefined) ficha.motivo_consulta         = motivo_consulta;
        if (observacion             !== undefined) ficha.observacion             = observacion;
        if (indicaciones            !== undefined) ficha.indicaciones            = indicaciones;
        if (recomendaciones         !== undefined) ficha.recomendaciones         = recomendaciones;
        if (derivaciones            !== undefined) ficha.derivaciones            = derivaciones;
        if (estado                  !== undefined) ficha.estado                  = estado;

        const updated = await fichaRepo.save(ficha);
        return res.json({ success: true, data: updated });
    } catch (err) {
        return serverError(res, err, "fichaController.updateFicha");
    }
};

/**
 * GET /fichas/paciente/:id_paciente
 * Retorna todas las fichas clínicas del paciente ordenadas por fecha_atencion ASC.
 * Incluye datos de la cita y del profesional.
 */
const getFichasByPaciente = async (req, res) => {
    const id_paciente = parseInt(req.params.id_paciente);
    if (isNaN(id_paciente)) return badRequest(res, "El ID del paciente debe ser un número válido.");

    try {
        const fichas = await AppDataSource.getRepository("FichaClinica")
            .createQueryBuilder("ficha")
            .leftJoinAndSelect("ficha.cita", "cita")
            .leftJoinAndSelect("cita.paciente", "paciente")
            .leftJoinAndSelect("paciente.usuario", "pacienteUsuario")
            .leftJoinAndSelect("cita.usuario", "nutricionista")
            .where("pacienteUsuario.id = :id_paciente", { id_paciente })
            .orderBy("ficha.fecha_atencion", "ASC")
            .getMany();

        return res.json({ success: true, data: fichas });
    } catch (err) {
        return serverError(res, err, "fichaController.getFichasByPaciente");
    }
};

module.exports = { getFichaByCita, createFicha, updateFicha, getFichasByPaciente };
