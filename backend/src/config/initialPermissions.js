/**
 * Catálogo de Permisos Iniciales del Sistema NutriOne-ERP
 *
 * Cada permiso define:
 *  - nombre:      Etiqueta legible del permiso (se muestra en el frontend)
 *  - codigo:      Identificador único granular (se usa en el backend/frontend para validar acceso)
 *  - modulo:      Módulo al que pertenece el permiso (para agruparlos en la UI)
 *  - descripcion: Descripción breve de lo que otorga este permiso
 *
 */

const INITIAL_PERMISSIONS = [
    // ─────────────── Módulo: Roles y Permisos ───────────────
    {
        nombre: "Ver Pestaña de Roles",
        codigo: "roles:ver",
        modulo: "Roles y Permisos",
        descripcion: "Permite ver la pestaña de roles en la barra lateral y listar los roles existentes"
    },
    {
        nombre: "Crear Roles",
        codigo: "roles:crear",
        modulo: "Roles y Permisos",
        descripcion: "Permite crear nuevos roles y asignarles permisos del sistema"
    },
    {
        nombre: "Editar Roles",
        codigo: "roles:editar",
        modulo: "Roles y Permisos",
        descripcion: "Permite editar roles existentes y actualizar sus asignaciones de permisos"
    },
    {
        nombre: "Eliminar Roles",
        codigo: "roles:eliminar",
        modulo: "Roles y Permisos",
        descripcion: "Permite eliminar roles del sistema (excepto el rol Administrador)"
    },
];

module.exports = { INITIAL_PERMISSIONS };
