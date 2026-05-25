"use strict";
const passport         = require("passport");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const { AppDataSource } = require("../config/configDb");
const { ACCESS_TOKEN_SECRET } = require("../config/configEnv");

/** Relaciones para cargar el usuario con sus roles y permisos */
const USER_RELATIONS = {
    usuarioRoles: {
        role: {
            rolPermisos: {
                permiso: true
            }
        }
    }
};

const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey:    ACCESS_TOKEN_SECRET,
};

/**
 * Estrategia JWT de Passport.
 * Valida el token Bearer, carga el usuario activo con relaciones
 * y lo adjunta a req.user.
 */
passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
        try {
            const usuarioRepo = AppDataSource.getRepository("Usuario");

            const user = await usuarioRepo.findOne({
                where:     { id: payload.id, estado: "activo" },
                relations: USER_RELATIONS,
            });

            if (!user) {
                return done(null, false, { message: "Usuario no encontrado o inactivo" });
            }

            return done(null, user);
        } catch (error) {
            return done(error, false);
        }
    })
);

module.exports = passport;
