/**
 * Catálogo de Permisos del Sistema NutriOne-ERP
 *
 * Cada permiso define:
 *  - nombre:      Etiqueta legible del permiso (se muestra en el frontend)
 *  - codigo:      Identificador único granular (se usa en el backend/frontend para validar acceso)
 *  - modulo:      Módulo al que pertenece el permiso (para agruparlos en la UI)
 *  - descripcion: Descripción breve de lo que otorga este permiso
 *
 */

const SEED_PERMISSIONS = [
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
    // ─────────────── Módulo: Usuarios ───────────────
    {
        nombre: "Ver Pestaña de Usuarios",
        codigo: "usuarios:ver",
        modulo: "Usuarios",
        descripcion: "Permite ver la pestaña de usuarios en la barra lateral y listar los usuarios del sistema"
    },
    {
        nombre: "Crear Usuarios",
        codigo: "usuarios:crear",
        modulo: "Usuarios",
        descripcion: "Permite registrar nuevos usuarios en el sistema"
    },
    {
        nombre: "Editar Usuarios",
        codigo: "usuarios:editar",
        modulo: "Usuarios",
        descripcion: "Permite editar los datos de usuarios existentes"
    },
    {
        nombre: "Eliminar Usuarios",
        codigo: "usuarios:eliminar",
        modulo: "Usuarios",
        descripcion: "Permite eliminar usuarios del sistema"
    },

    // ─────────────── Módulo: Pacientes ───────────────
    {
        nombre: "Ver Pestaña de Pacientes",
        codigo: "pacientes:ver",
        modulo: "Pacientes",
        descripcion: "Permite ver la pestaña de pacientes en la barra lateral y listar los pacientes registrados"
    },
    {
        nombre: "Crear Pacientes",
        codigo: "pacientes:crear",
        modulo: "Pacientes",
        descripcion: "Permite registrar nuevos pacientes en el sistema"
    },
    {
        nombre: "Editar Pacientes",
        codigo: "pacientes:editar",
        modulo: "Pacientes",
        descripcion: "Permite editar los datos de pacientes existentes"
    },
    {
        nombre: "Eliminar Pacientes",
        codigo: "pacientes:eliminar",
        modulo: "Pacientes",
        descripcion: "Permite eliminar pacientes del sistema"
    },
    // ─────────────── Módulo: Ficha Clinica ───────────────
    {
        nombre: "Ver fichas",
        codigo: "fichas:ver",
        modulo: "Fichas Clinicas",
        descripcion: "Permite acceder a la sección de fichas clínicas y visualizar los registros"
    },
    {
        nombre: "Iniciar atención",
        codigo: "fichas:crear",
        modulo: "Fichas Clinicas",
        descripcion: "Permite iniciar una atención médica creando una nueva ficha clínica para una cita"
    },
    {
        nombre: "Editar atención",
        codigo: "fichas:editar",
        modulo: "Fichas Clinicas",
        descripcion: "Permite editar una ficha clínica ya registrada"
    },
    {
        nombre: "Eliminar atención",
        codigo: "fichas:eliminar",
        modulo: "Fichas Clinicas",
        descripcion: "Permite eliminar una ficha clínica del sistema"
    },
    // ─────────────── Módulo: Citas ───────────────
    {
        nombre: "Ver Pestaña de Citas",
        codigo: "citas:ver",
        modulo: "Citas",
        descripcion: "Permite ver la pestaña de agenda/citas y listar las citas existentes"
    },
    {
        nombre: "Crear Citas",
        codigo: "citas:crear",
        modulo: "Citas",
        descripcion: "Permite agendar nuevas citas para los pacientes"
    },
    {
        nombre: "Editar Citas",
        codigo: "citas:editar",
        modulo: "Citas",
        descripcion: "Permite editar citas existentes"
    },
    {
        nombre: "Eliminar Citas",
        codigo: "citas:eliminar",
        modulo: "Citas",
        descripcion: "Permite eliminar citas del sistema"
    },
    {
        nombre: "Cancelar Citas",
        codigo: "citas:cancelar",
        modulo: "Citas",
        descripcion: "Permite cancelar citas agendadas"
    },
    // ─────────────── Módulo: Disponibilidad ───────────────
    {
        nombre: "Ver Disponibilidad",
        codigo: "disponibilidad:ver",
        modulo: "Disponibilidad",
        descripcion: "Permite ver la configuración de disponibilidad horaria"
    },
    {
        nombre: "Gestionar Disponibilidad",
        codigo: "disponibilidad:gestionar",
        modulo: "Disponibilidad",
        descripcion: "Permite crear, editar y eliminar bloques de disponibilidad horaria"
    },

    // ─────────────── Módulo: Calendario ───────────────}
    {
        nombre: "Ver Calendario",
        codigo: "calendario:ver",
        modulo: "Calendario",
        descripcion: "Permite acceder a la vista de calendario para visualizar citas"
    },
    // ─────────────── Módulo: Cálculos Nutricionales ───────────────
    {
        nombre: "Ver Cálculos Nutricionales",
        codigo: "calculos:ver",
        modulo: "Cálculos Nutricionales",
        descripcion: "Permite ver la calculadora antropométrica/energética dentro de la atención y consultar el historial de evaluaciones"
    },
    {
        nombre: "Gestionar Cálculos Nutricionales",
        codigo: "calculos:gestionar",
        modulo: "Cálculos Nutricionales",
        descripcion: "Permite guardar y actualizar la evaluación nutricional (mediciones y resultados) de una atención"
    }
];

module.exports = { SEED_PERMISSIONS };
