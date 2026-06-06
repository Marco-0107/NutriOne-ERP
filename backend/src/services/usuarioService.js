const { AppDataSource } = require("../config/configDb");
const bcrypt = require("bcryptjs");

const formatUsuario = (usuario) => ({
    id:               usuario.id,
    rut:              usuario.rut,
    nombres:          usuario.nombres,
    apellido_paterno: usuario.apellido_paterno,
    apellido_materno: usuario.apellido_materno,
    correo:           usuario.correo,
    estado:           usuario.estado,
    fecha_creacion:   usuario.fecha_creacion,
});

/**
 * Retorna solo los usuarios que NO tienen registro de paciente.
 * Los pacientes son gestionados desde el módulo de pacientes.
 */
const getUsuariosService = async () => {
    const usuarioRepo = AppDataSource.getRepository("Usuario");
    const usuarios = await usuarioRepo
        .createQueryBuilder("usuario")
        .leftJoin("usuario.paciente", "paciente")
        .leftJoinAndSelect("usuario.usuarioRoles", "usuarioRol")
        .leftJoinAndSelect("usuarioRol.role", "role")
        .where("paciente.id IS NULL")
        .orderBy("usuario.id", "ASC")
        .getMany();
    return usuarios.map(u => {
        const rolActivo = u.usuarioRoles?.find(ur => ur.estado === "activo");
        return { ...formatUsuario(u), rol: rolActivo?.role?.nombre || null };
    });
};

const createUsuarioService = async ({
    rut, nombres, apellido_paterno, apellido_materno, correo, contrasena,
}) => {
    const usuarioRepo = AppDataSource.getRepository("Usuario");

    const existingRut = await usuarioRepo.findOne({ where: { rut } });
    if (existingRut) {
        throw { status: 409, message: `Ya existe un usuario con el RUT '${rut}'` };
    }

    const existingCorreo = await usuarioRepo.findOne({ where: { correo } });
    if (existingCorreo) {
        throw { status: 409, message: `Ya existe un usuario con el correo '${correo}'` };
    }

    const salt           = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(contrasena, salt);

    const newUsuario = usuarioRepo.create({
        rut,
        nombres,
        apellido_paterno,
        apellido_materno,
        correo,
        contrasena: hashedPassword,
        estado:     "activo",
    });

    const saved = await usuarioRepo.save(newUsuario);
    return formatUsuario(saved);
};

const updateUsuarioService = async (usuarioId, {
    rut, nombres, apellido_paterno, apellido_materno, correo,
}) => {
    const usuarioRepo = AppDataSource.getRepository("Usuario");

    const usuario = await usuarioRepo.findOneBy({ id: usuarioId });
    if (!usuario) {
        throw { status: 404, message: "Usuario no encontrado" };
    }

    if (rut && rut !== usuario.rut) {
        const conflict = await usuarioRepo.findOne({ where: { rut } });
        if (conflict && conflict.id !== usuarioId) {
            throw { status: 409, message: `Ya existe un usuario con el RUT '${rut}'` };
        }
    }

    if (correo && correo !== usuario.correo) {
        const conflict = await usuarioRepo.findOne({ where: { correo } });
        if (conflict && conflict.id !== usuarioId) {
            throw { status: 409, message: `Ya existe un usuario con el correo '${correo}'` };
        }
    }

    if (rut              !== undefined) usuario.rut              = rut;
    if (nombres          !== undefined) usuario.nombres          = nombres;
    if (apellido_paterno !== undefined) usuario.apellido_paterno = apellido_paterno;
    if (apellido_materno !== undefined) usuario.apellido_materno = apellido_materno;
    if (correo           !== undefined) usuario.correo           = correo;

    const updated = await usuarioRepo.save(usuario);
    return formatUsuario(updated);
};

const deleteUsuarioService = async (usuarioId) => {
    const usuarioRepo  = AppDataSource.getRepository("Usuario");
    const pacienteRepo = AppDataSource.getRepository("Paciente");

    const usuario = await usuarioRepo.findOneBy({ id: usuarioId });
    if (!usuario) {
        throw { status: 404, message: "Usuario no encontrado" };
    }

    // No permitir eliminar si es un paciente — usar el módulo de pacientes para eso
    const esPaciente = await pacienteRepo.findOne({ where: { usuario: { id: usuarioId } } });
    if (esPaciente) {
        throw { status: 400, message: "Este usuario es un paciente. Elimínalo desde la sección de Pacientes." };
    }

    await usuarioRepo.remove(usuario);
    return { message: "Usuario eliminado con éxito" };
};

const assignRolService = async (usuarioId, rolInput) => {
    const usuarioRepo    = AppDataSource.getRepository("Usuario");
    const roleRepo       = AppDataSource.getRepository("Role");
    const usuarioRolRepo = AppDataSource.getRepository("UsuarioRol");

    const usuario = await usuarioRepo.findOneBy({ id: usuarioId });
    if (!usuario) {
        throw { status: 404, message: "Usuario no encontrado" };
    }

    const role = await roleRepo
        .createQueryBuilder("role")
        .where("LOWER(role.nombre) = LOWER(:nombre)", { nombre: rolInput })
        .andWhere("role.estado = :estado", { estado: "activo" })
        .getOne();

    if (!role) {
        throw { status: 400, message: `El rol '${rolInput}' no existe en el sistema` };
    }

    const existentes = await usuarioRolRepo.find({
        where: { usuario: { id: usuarioId } },
    });
    if (existentes.length > 0) {
        await usuarioRolRepo.remove(existentes);
    }

    const nuevaAsignacion = usuarioRolRepo.create({
        usuario,
        role,
        estado: "activo",
    });
    await usuarioRolRepo.save(nuevaAsignacion);

    return {
        ...formatUsuario(usuario),
        rol: role.nombre,
    };
};

module.exports = {
    getUsuariosService,
    createUsuarioService,
    updateUsuarioService,
    deleteUsuarioService,
    assignRolService,
};
