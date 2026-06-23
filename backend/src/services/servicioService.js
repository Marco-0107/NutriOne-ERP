const { AppDataSource } = require("../config/configDb");

const formatServicio = (servicio) => ({
    id:               servicio.id,
    nombre:           servicio.nombre,
    descripcion:      servicio.descripcion ?? null,
    precio:           servicio.precio,
    duracion_minutos: servicio.duracion_minutos,
    prevision:        servicio.prevision,
    estado:           servicio.estado,
    usuario: servicio.usuario
        ? {
            id:               servicio.usuario.id,
            nombres:          servicio.usuario.nombres,
            apellido_paterno: servicio.usuario.apellido_paterno,
            apellido_materno: servicio.usuario.apellido_materno,
        }
        : null,
});

const getServiciosService = async (filtros = {}) => {
    const repo = AppDataSource.getRepository("Servicio");
    const where = {};

    if (filtros.id_user) where.usuario = { id: Number(filtros.id_user) };
    if (filtros.estado)  where.estado  = filtros.estado;
    else                 where.estado  = "activo";

    const servicios = await repo.find({
        where,
        relations: { usuario: true },
        order: { nombre: "ASC" },
    });
    return servicios.map(formatServicio);
};

const getServicioByIdService = async (servicioId) => {
    const repo = AppDataSource.getRepository("Servicio");
    const servicio = await repo.findOne({
        where: { id: servicioId },
        relations: { usuario: true },
    });
    if (!servicio) throw { status: 404, message: "Servicio no encontrado" };
    return formatServicio(servicio);
};

const createServicioService = async (nutricionistaId, datos) => {
    const usuarioRepo = AppDataSource.getRepository("Usuario");
    const usuario = await usuarioRepo.findOne({ where: { id: Number(nutricionistaId), estado: "activo" } });
    if (!usuario) throw { status: 404, message: "Profesional no encontrado" };

    const repo = AppDataSource.getRepository("Servicio");
    const nuevo = repo.create({
        nombre:           datos.nombre,
        descripcion:      datos.descripcion ?? null,
        precio:           datos.precio,
        duracion_minutos: datos.duracion_minutos,
        prevision:        datos.prevision ?? "particular",
        estado:           "activo",
        usuario,
    });
    const saved = await repo.save(nuevo);

    const full = await repo.findOne({ where: { id: saved.id }, relations: { usuario: true } });
    return formatServicio(full);
};

const updateServicioService = async (servicioId, datos) => {
    const repo = AppDataSource.getRepository("Servicio");
    const servicio = await repo.findOne({ where: { id: servicioId }, relations: { usuario: true } });
    if (!servicio) throw { status: 404, message: "Servicio no encontrado" };

    if (datos.nombre           !== undefined) servicio.nombre           = datos.nombre;
    if (datos.descripcion      !== undefined) servicio.descripcion      = datos.descripcion;
    if (datos.precio           !== undefined) servicio.precio           = datos.precio;
    if (datos.duracion_minutos !== undefined) servicio.duracion_minutos = datos.duracion_minutos;
    if (datos.prevision        !== undefined) servicio.prevision        = datos.prevision;
    if (datos.estado           !== undefined) servicio.estado           = datos.estado;

    const updated = await repo.save(servicio);
    return formatServicio(updated);
};

const deleteServicioService = async (servicioId) => {
    const repo = AppDataSource.getRepository("Servicio");
    const servicio = await repo.findOneBy({ id: servicioId });
    if (!servicio) throw { status: 404, message: "Servicio no encontrado" };

    servicio.estado = "inactivo";
    await repo.save(servicio);
    return { message: "Servicio eliminado con éxito" };
};

module.exports = {
    getServiciosService,
    getServicioByIdService,
    createServicioService,
    updateServicioService,
    deleteServicioService,
};
