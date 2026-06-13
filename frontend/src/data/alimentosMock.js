// Datos estáticos de muestra — reemplazar por API real en sprint futuro.
// Valores nutricionales expresados por 100g de alimento.

export const CATEGORIAS = [
    { id: 1, nombre: 'Frutas',         icono: '🍎' },
    { id: 2, nombre: 'Verduras',        icono: '🥦' },
    { id: 3, nombre: 'Carnes',          icono: '🍗' },
    { id: 4, nombre: 'Lácteos',         icono: '🥛' },
    { id: 5, nombre: 'Cereales',        icono: '🌾' },
    { id: 6, nombre: 'Legumbres',       icono: '🫘' },
    { id: 7, nombre: 'Aceites y grasas',icono: '🫙' },
    { id: 8, nombre: 'Huevos',          icono: '🥚' },
];

// medidas: lista de medidas caseras con su equivalencia en gramos
export const ALIMENTOS = [
    {
        id: 1, nombre: 'Manzana roja', id_categoria: 1,
        por_100g: { calorias: 52, proteinas: 0.3, carbohidratos: 14.0, grasas: 0.2, fibra: 2.4, sodio: 1 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'unidad mediana (~182g)', gramos: 182 },
            { nombre: 'unidad pequeña (~120g)', gramos: 120 },
            { nombre: 'taza en trozos', gramos: 109 },
        ],
    },
    {
        id: 2, nombre: 'Plátano', id_categoria: 1,
        por_100g: { calorias: 89, proteinas: 1.1, carbohidratos: 23.0, grasas: 0.3, fibra: 2.6, sodio: 1 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'unidad mediana (~118g)', gramos: 118 },
            { nombre: 'unidad grande (~136g)', gramos: 136 },
            { nombre: 'taza en rodajas', gramos: 150 },
        ],
    },
    {
        id: 3, nombre: 'Naranja', id_categoria: 1,
        por_100g: { calorias: 47, proteinas: 0.9, carbohidratos: 11.8, grasas: 0.1, fibra: 2.4, sodio: 0 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'unidad mediana (~131g)', gramos: 131 },
            { nombre: 'taza en gajos', gramos: 180 },
        ],
    },
    {
        id: 4, nombre: 'Tomate', id_categoria: 2,
        por_100g: { calorias: 18, proteinas: 0.9, carbohidratos: 3.9, grasas: 0.2, fibra: 1.2, sodio: 5 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'unidad mediana (~123g)', gramos: 123 },
            { nombre: 'taza picado', gramos: 180 },
            { nombre: 'cucharada', gramos: 15 },
        ],
    },
    {
        id: 5, nombre: 'Espinaca', id_categoria: 2,
        por_100g: { calorias: 23, proteinas: 2.9, carbohidratos: 3.6, grasas: 0.4, fibra: 2.2, sodio: 79 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'taza cruda', gramos: 30 },
            { nombre: 'taza cocida', gramos: 180 },
        ],
    },
    {
        id: 6, nombre: 'Zanahoria', id_categoria: 2,
        por_100g: { calorias: 41, proteinas: 0.9, carbohidratos: 9.6, grasas: 0.2, fibra: 2.8, sodio: 69 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'unidad mediana (~61g)', gramos: 61 },
            { nombre: 'taza rallada', gramos: 110 },
        ],
    },
    {
        id: 7, nombre: 'Pechuga de pollo (cocida)', id_categoria: 3,
        por_100g: { calorias: 165, proteinas: 31.0, carbohidratos: 0.0, grasas: 3.6, fibra: 0.0, sodio: 74 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'porción mediana (~150g)', gramos: 150 },
            { nombre: 'porción pequeña (~100g)', gramos: 100 },
        ],
    },
    {
        id: 8, nombre: 'Carne de vacuno magra (cocida)', id_categoria: 3,
        por_100g: { calorias: 217, proteinas: 26.1, carbohidratos: 0.0, grasas: 12.0, fibra: 0.0, sodio: 57 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'filete mediano (~180g)', gramos: 180 },
            { nombre: 'porción pequeña (~100g)', gramos: 100 },
        ],
    },
    {
        id: 9, nombre: 'Salmón (cocido)', id_categoria: 3,
        por_100g: { calorias: 208, proteinas: 20.4, carbohidratos: 0.0, grasas: 13.4, fibra: 0.0, sodio: 59 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'filete mediano (~170g)', gramos: 170 },
            { nombre: 'porción pequeña (~100g)', gramos: 100 },
        ],
    },
    {
        id: 10, nombre: 'Leche entera', id_categoria: 4,
        por_100g: { calorias: 61, proteinas: 3.2, carbohidratos: 4.8, grasas: 3.3, fibra: 0.0, sodio: 43 },
        medidas: [
            { nombre: 'gramos (ml)', gramos: 1 },
            { nombre: 'taza (240ml)', gramos: 240 },
            { nombre: 'vaso (200ml)', gramos: 200 },
        ],
    },
    {
        id: 11, nombre: 'Yogur natural', id_categoria: 4,
        por_100g: { calorias: 59, proteinas: 3.5, carbohidratos: 4.7, grasas: 3.3, fibra: 0.0, sodio: 36 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'pote individual (125g)', gramos: 125 },
            { nombre: 'taza', gramos: 245 },
        ],
    },
    {
        id: 12, nombre: 'Arroz blanco cocido', id_categoria: 5,
        por_100g: { calorias: 130, proteinas: 2.7, carbohidratos: 28.2, grasas: 0.3, fibra: 0.4, sodio: 1 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'taza cocido', gramos: 186 },
            { nombre: 'cucharada', gramos: 12 },
        ],
    },
    {
        id: 13, nombre: 'Avena (cruda)', id_categoria: 5,
        por_100g: { calorias: 389, proteinas: 16.9, carbohidratos: 66.3, grasas: 6.9, fibra: 10.6, sodio: 2 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'taza cruda', gramos: 90 },
            { nombre: 'cucharada', gramos: 10 },
        ],
    },
    {
        id: 14, nombre: 'Pan marraqueta', id_categoria: 5,
        por_100g: { calorias: 275, proteinas: 8.5, carbohidratos: 55.0, grasas: 1.2, fibra: 2.3, sodio: 545 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: '1 marraqueta (~100g)', gramos: 100 },
            { nombre: 'media marraqueta', gramos: 50 },
        ],
    },
    {
        id: 15, nombre: 'Lentejas cocidas', id_categoria: 6,
        por_100g: { calorias: 116, proteinas: 9.0, carbohidratos: 20.1, grasas: 0.4, fibra: 7.9, sodio: 2 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'taza cocida', gramos: 198 },
            { nombre: 'porción (~150g)', gramos: 150 },
        ],
    },
    {
        id: 16, nombre: 'Porotos negros cocidos', id_categoria: 6,
        por_100g: { calorias: 132, proteinas: 8.9, carbohidratos: 23.7, grasas: 0.5, fibra: 8.7, sodio: 1 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'taza cocida', gramos: 172 },
        ],
    },
    {
        id: 17, nombre: 'Aceite de oliva', id_categoria: 7,
        por_100g: { calorias: 884, proteinas: 0.0, carbohidratos: 0.0, grasas: 100.0, fibra: 0.0, sodio: 2 },
        medidas: [
            { nombre: 'gramos (ml)', gramos: 1 },
            { nombre: 'cucharada (14g)', gramos: 14 },
            { nombre: 'cucharadita (5g)', gramos: 5 },
        ],
    },
    {
        id: 18, nombre: 'Huevo entero', id_categoria: 8,
        por_100g: { calorias: 155, proteinas: 12.6, carbohidratos: 1.1, grasas: 10.6, fibra: 0.0, sodio: 124 },
        medidas: [
            { nombre: 'gramos', gramos: 1 },
            { nombre: 'unidad grande (~50g)', gramos: 50 },
            { nombre: 'unidad mediana (~44g)', gramos: 44 },
        ],
    },
];

export const getCategoriaById = (id) => CATEGORIAS.find(c => c.id === id);

export const buscarAlimentos = (termino) => {
    if (!termino || termino.trim().length < 2) return [];
    const q = termino.toLowerCase().trim();
    return ALIMENTOS.filter(a => a.nombre.toLowerCase().includes(q)).slice(0, 8);
};

export const calcularNutrientes = (alimento, gramos) => {
    if (!alimento || !gramos || gramos <= 0) return null;
    const f = gramos / 100;
    return {
        calorias:      +(alimento.por_100g.calorias      * f).toFixed(1),
        proteinas:     +(alimento.por_100g.proteinas     * f).toFixed(1),
        carbohidratos: +(alimento.por_100g.carbohidratos * f).toFixed(1),
        grasas:        +(alimento.por_100g.grasas        * f).toFixed(1),
        fibra:         +(alimento.por_100g.fibra         * f).toFixed(1),
        sodio:         +(alimento.por_100g.sodio         * f).toFixed(1),
    };
};
