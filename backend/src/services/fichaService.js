import { AppDataSource } from "../config/configDb";
import Usuario from "../entity/Usuario";
import { getRepository } from "typeorm";

export async function getUserById(id) {
    try {
        const { id, rut, nombres, apellidos, correo } = query;

        const user = AppDataSource.getRepository(Usuario);

        const foundUser = await user.findOne({
            where: [{ id: id }, { rut: rut }, { nombres: nombres }, { apellidos: apellidos }, { correo: correo }],
        });

        if (!foundUser) return [null, "Usuario no encontrado"];

        const { contraseña, ...userData } = foundUser;

        return [userData, null];

    } catch (error) {
        console.error("Error al obtener usuario:", error);
        return [null, "Error interno del servidor"];
    }
}

export async function getAllUsers() {
    try {
        const userRepository = AppDataSource.getRepository(Usuario);
        const users = await userRepository.find();

        if (!users || users.length === 0) return [null, "No se encontraron usuarios"];

        const usersData = users.map(({ contraseña, ...user }) => user);

        return [usersData, null];
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        return [null, "Error interno del servidor"];
    }
}

export async function createUser(body) {
    try {
        const userRepository = AppDataSource.getRepository(Usuario);
        const existingUser = await userRepository.findOne({
            where: [{ id: body.id }, { rut: body.rut }, { correo: body.correo }]
        });

        if (existingUser) return [null, "Ya existe un usuario con el mismo ID, RUT o correo"];

        const newUser = userRepository.create({
            rut: body.rut,
            nombres: body.nombres,
            apellidos: body.apellidos,
            correo: body.correo,
            contraseña: body.contraseña,
            fecha_creacion: new Date(),
            fecha_actualizacion: new Date(),
        });

        const savedUser = await userRepository.save(newUser);

        const { contraseña, ...userData } = savedUser;

        return [userData, null];
    } catch (error) {
        console.error("Error al crear usuario:", error);
        return [null, "Error interno del servidor"];
    }
}