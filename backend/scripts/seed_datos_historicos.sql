-- ============================================================
-- seed_datos_historicos.sql
-- Inserta atenciones pasadas para probar los gráficos de
-- Evolución Clínica en NutriOne-ERP.
--
-- Pacientes disponibles:
--   id=1 → Esteban Eliecer Soto  (nutricionista id=2)
--   id=2 → Juan Andres Perez     (nutricionista id=5)
--   id=3 → Juan Nuevo            (nutricionista id=5)
--   id=4 → Pepep Tapia           (nutricionista id=5)
--   id=6 → Pedro Engel           (nutricionista id=5)
-- ============================================================

BEGIN;

-- ────────────────────────────────────────────────────────────
-- 1. Crear un servicio base (requerido por citas.id_servicio)
-- ────────────────────────────────────────────────────────────
INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos, estado, id_user)
VALUES ('Control Nutricional', 'Atención nutricional de seguimiento', 15000, 45, 'activo', 2)
ON CONFLICT DO NOTHING;

-- Guardamos el id del servicio en una variable temporal
DO $$
DECLARE
    v_srv        INT;
    v_cita_id    INT;
    v_ficha_id   INT;
BEGIN
    SELECT id INTO v_srv FROM servicios WHERE nombre = 'Control Nutricional' LIMIT 1;

    -- ──────────────────────────────────────────────────────
    -- PACIENTE 1 – Esteban Eliecer Soto
    -- Evolución: sobrepeso que va bajando gradualmente
    -- Nutricionista: id=2 (Esteban Soto)
    -- ──────────────────────────────────────────────────────

    -- Control 1: hace 6 meses (Enero 2026)
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2025-12-15', '09:00', '09:45', 'completada', 'interna', 1, 2, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, indicaciones, recomendaciones, estado, id_cita)
    VALUES ('Control', '2025-12-15', 31, 92.5, 174.0, 'Masculino', 102.0, '128/82', 
            'Control rutinario de peso', 'Obesidad grado I. IMC: 30.6', 
            'Dieta hipocalórica 1800 kcal/día', 'Aumentar actividad física a 150 min/semana', 'activo', v_cita_id);

    -- Control 2: hace 5 meses (Febrero 2026)
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2026-01-20', '09:00', '09:45', 'completada', 'interna', 1, 2, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, indicaciones, recomendaciones, estado, id_cita)
    VALUES ('Control', '2026-01-20', 31, 90.2, 174.0, 'Masculino', 99.5, '126/80', 
            'Seguimiento de plan alimentario', 'Obesidad grado I. IMC: 29.8. Baja de 2.3 kg', 
            'Mantener plan hipocalórico. Incorporar colación saludable', 'Caminar 30 min diarios', 'activo', v_cita_id);

    -- Control 3: hace 4 meses (Marzo 2026)
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2026-02-18', '09:00', '09:45', 'completada', 'interna', 1, 2, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, indicaciones, recomendaciones, estado, id_cita)
    VALUES ('Control', '2026-02-18', 31, 87.8, 174.0, 'Masculino', 97.0, '122/78', 
            'Seguimiento mensual', 'Sobrepeso. IMC: 29.0. Progreso positivo', 
            'Continuar plan. Agregar 2 sesiones de natación', 'Reducir harinas refinadas', 'activo', v_cita_id);

    -- Control 4: hace 3 meses (Abril 2026)
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2026-03-17', '09:00', '09:45', 'completada', 'interna', 1, 2, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, indicaciones, recomendaciones, estado, id_cita)
    VALUES ('Control', '2026-03-17', 31, 85.5, 174.0, 'Masculino', 95.0, '120/78', 
            'Control mensual', 'Sobrepeso. IMC: 28.2. Tendencia positiva sostenida', 
            'Mantener plan actual. Incorporar legumbres 3x semana', 'Revisar calidad del sueño', 'activo', v_cita_id);

    -- Control 5: hace 2 meses (Mayo 2026)
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2026-04-14', '09:00', '09:45', 'completada', 'interna', 1, 2, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, indicaciones, recomendaciones, estado, id_cita)
    VALUES ('Control', '2026-04-14', 31, 83.1, 174.0, 'Masculino', 92.5, '118/76', 
            'Control mensual', 'Sobrepeso leve. IMC: 27.5. Excelente progreso', 
            'Fase de mantenimiento con dieta de 2000 kcal/día', 'Felicitar por logros', 'activo', v_cita_id);

    -- Control 6: hace 1 mes (Junio 2026) — Este es el que ya existe (id=8)
    -- ──────────────────────────────────────────────────────
    -- PACIENTE 2 – Juan Andres Perez
    -- Evolución: bajo peso → recuperación
    -- Nutricionista: id=5 (Maria Gonzalez)
    -- ──────────────────────────────────────────────────────

    -- Control 1: Octubre 2025
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2025-10-08', '10:00', '10:45', 'completada', 'interna', 2, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, indicaciones, estado, id_cita)
    VALUES ('Evaluación', '2025-10-08', 28, 52.0, 165.0, 'Femenino', 68.0, '110/70', 
            'Bajo peso. Poca energía y cansancio', 'Bajo peso. IMC: 19.1. Ingesta calórica insuficiente', 
            'Plan hipercalórico 2500 kcal/día con refuerzo proteico', 'activo', v_cita_id);

    -- Control 2: Noviembre 2025
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2025-11-12', '10:00', '10:45', 'completada', 'interna', 2, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, indicaciones, estado, id_cita)
    VALUES ('Control', '2025-11-12', 28, 54.2, 165.0, 'Femenino', 69.5, '112/72', 
            'Seguimiento plan hipercalórico', 'Bajo peso. IMC: 19.9. Ganancia de 2.2 kg', 
            'Continuar plan. Agregar merienda nocturna', 'activo', v_cita_id);

    -- Control 3: Diciembre 2025
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2025-12-10', '10:00', '10:45', 'completada', 'interna', 2, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, indicaciones, estado, id_cita)
    VALUES ('Control', '2025-12-10', 28, 56.0, 165.0, 'Femenino', 70.5, '114/72', 
            'Control mensual', 'Peso normal bajo. IMC: 20.6. Progresando', 
            'Reducir levemente calorías. Incorporar ejercicio de fuerza', 'activo', v_cita_id);

    -- Control 4: Enero 2026
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2026-01-14', '10:00', '10:45', 'completada', 'interna', 2, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, indicaciones, estado, id_cita)
    VALUES ('Control', '2026-01-14', 28, 57.5, 165.0, 'Femenino', 71.0, '116/74', 
            'Seguimiento', 'Peso normal. IMC: 21.1. Objetivo alcanzado', 
            'Mantener plan de 2200 kcal/día', 'activo', v_cita_id);

    -- Control 5: Marzo 2026
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2026-03-11', '10:00', '10:45', 'completada', 'interna', 2, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, indicaciones, estado, id_cita)
    VALUES ('Control', '2026-03-11', 29, 59.0, 165.0, 'Femenino', 72.0, '116/74', 
            'Control bimestral', 'Peso normal. IMC: 21.7. Alta médica nutricional', 
            'Continuar hábitos adquiridos', 'activo', v_cita_id);

    -- ──────────────────────────────────────────────────────
    -- PACIENTE 4 – Pepep Tapia
    -- Evolución: obesidad con altibajos
    -- Nutricionista: id=5 (Maria Gonzalez)
    -- ──────────────────────────────────────────────────────

    -- Control 1: Agosto 2025
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2025-08-05', '11:00', '11:45', 'completada', 'interna', 4, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, estado, id_cita)
    VALUES ('Evaluación', '2025-08-05', 45, 105.0, 168.0, 'Masculino', 112.0, '138/88', 
            'Derivado por endocrinólogo. Obesidad + diabetes tipo 2', 
            'Obesidad grado II. IMC: 37.2. Riesgo cardiovascular alto', 'activo', v_cita_id);

    -- Control 2: Septiembre 2025
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2025-09-09', '11:00', '11:45', 'completada', 'interna', 4, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, estado, id_cita)
    VALUES ('Control', '2025-09-09', 45, 102.8, 168.0, 'Masculino', 110.0, '135/86', 
            'Control mensual', 'Obesidad grado II. IMC: 36.4. Baja de 2.2 kg', 'activo', v_cita_id);

    -- Control 3: Octubre 2025
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2025-10-14', '11:00', '11:45', 'completada', 'interna', 4, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, estado, id_cita)
    VALUES ('Control', '2025-10-14', 45, 103.5, 168.0, 'Masculino', 111.0, '136/87', 
            'Fiestas patrias, ligero aumento', 'Obesidad grado II. IMC: 36.7. Leve aumento por festividades', 'activo', v_cita_id);

    -- Control 4: Noviembre 2025
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2025-11-18', '11:00', '11:45', 'completada', 'interna', 4, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, estado, id_cita)
    VALUES ('Control', '2025-11-18', 45, 101.0, 168.0, 'Masculino', 108.5, '132/84', 
            'Retomó rutina de ejercicios', 'Obesidad grado I. IMC: 35.8. Buen progreso', 'activo', v_cita_id);

    -- Control 5: Enero 2026
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2026-01-20', '11:00', '11:45', 'completada', 'interna', 4, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, estado, id_cita)
    VALUES ('Control', '2026-01-20', 45, 105.5, 168.0, 'Masculino', 113.0, '140/90', 
            'Excesos navideños', 'Obesidad grado II. IMC: 37.4. Aumento de peso en vacaciones', 'activo', v_cita_id);

    -- Control 6: Marzo 2026
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2026-03-10', '11:00', '11:45', 'completada', 'interna', 4, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, estado, id_cita)
    VALUES ('Control', '2026-03-10', 46, 100.0, 168.0, 'Masculino', 107.0, '130/82', 
            'Retomando plan post-verano', 'Obesidad grado I. IMC: 35.4. Baja de 5.5 kg en 2 meses', 'activo', v_cita_id);

    -- Control 7: Mayo 2026
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2026-05-12', '11:00', '11:45', 'completada', 'interna', 4, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, estado, id_cita)
    VALUES ('Control', '2026-05-12', 46, 96.8, 168.0, 'Masculino', 104.5, '128/80', 
            'Control mensual', 'Obesidad grado I. IMC: 34.3. Tendencia positiva mantenida', 'activo', v_cita_id);

    -- ──────────────────────────────────────────────────────
    -- PACIENTE 6 – Pedro Engel
    -- Evolución: normopeso, control preventivo
    -- Nutricionista: id=5 (Maria Gonzalez)
    -- ──────────────────────────────────────────────────────

    -- Control 1: Febrero 2026
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2026-02-05', '14:00', '14:45', 'completada', 'interna', 6, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, estado, id_cita)
    VALUES ('Evaluación', '2026-02-05', 35, 78.5, 178.0, 'Masculino', 90.0, '120/75', 
            'Control preventivo. Sin patologías', 
            'Sobrepeso leve. IMC: 24.8. Cintura en rango límite', 'activo', v_cita_id);

    -- Control 2: Marzo 2026
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2026-03-05', '14:00', '14:45', 'completada', 'interna', 6, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, estado, id_cita)
    VALUES ('Control', '2026-03-05', 35, 77.2, 178.0, 'Masculino', 89.0, '118/74', 
            'Control mensual', 'Peso normal. IMC: 24.3. Mejoría de cintura', 'activo', v_cita_id);

    -- Control 3: Abril 2026
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2026-04-07', '14:00', '14:45', 'completada', 'interna', 6, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, estado, id_cita)
    VALUES ('Control', '2026-04-07', 35, 76.1, 178.0, 'Masculino', 87.5, '116/74', 
            'Control mensual', 'Peso normal. IMC: 24.0. Cintura en rango normal', 'activo', v_cita_id);

    -- Control 4: Mayo 2026
    INSERT INTO citas (fecha, hora_inicio, hora_fin, estado, origen, id_paciente, id_usuario, id_servicio)
    VALUES ('2026-05-06', '14:00', '14:45', 'completada', 'interna', 6, 5, v_srv)
    RETURNING id_cita INTO v_cita_id;

    INSERT INTO ficha_clinica (tipo, fecha_atencion, edad, peso, talla, sexo, circunferencia_cintura, presion_arterial, motivo_consulta, diagnostico_nutricional, estado, id_cita)
    VALUES ('Control', '2026-05-06', 35, 75.5, 178.0, 'Masculino', 86.0, '115/73', 
            'Control mensual', 'Peso normal. IMC: 23.8. Excelente adherencia', 'activo', v_cita_id);

END $$;

COMMIT;

-- ────────────────────────────────────────────────────────────
-- Verificación rápida
-- ────────────────────────────────────────────────────────────
SELECT 
    c.id_cita,
    c.id_paciente,
    u.nombres || ' ' || u.apellido_paterno AS paciente,
    c.fecha,
    c.estado,
    f.peso,
    f.talla,
    f.circunferencia_cintura
FROM citas c
JOIN paciente p ON p.id = c.id_paciente
JOIN usuarios u ON u.id = p.id_user
LEFT JOIN ficha_clinica f ON f.id_cita = c.id_cita
ORDER BY c.id_paciente, c.fecha;
