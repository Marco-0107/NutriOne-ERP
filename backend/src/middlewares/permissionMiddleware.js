const permissionMiddleware = (requiredPermission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permisos) {
            return res.status(403).json({ message: "Acceso denegado: permisos no definidos" });
        }

        const hasPermission = req.user.permisos.includes(requiredPermission);
        if (!hasPermission) {
            return res.status(403).json({ message: `Acceso denegado: se requiere el permiso '${requiredPermission}'` });
        }

        next();
    };
};

module.exports = permissionMiddleware;
