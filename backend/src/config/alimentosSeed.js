"use strict";

/**
 * Datos nutricionales extraídos de la Tabla de Composición de Alimentos INTA 2018
 * (Instituto de Nutrición y Tecnología de los Alimentos, Universidad de Chile).
 * Valores expresados por 100g de alimento.
 * Fuente: Schmidt-Hebbel H, Pennacchiotti I, Masson L, Mella MA. TCA. UChile 2018.
 */

const CATEGORIAS = [
    { id: 1,  nombre: "Leche y Derivados",          icono: "🥛" },
    { id: 2,  nombre: "Huevos",                      icono: "🥚" },
    { id: 3,  nombre: "Carnes y Vísceras",           icono: "🍗" },
    { id: 4,  nombre: "Pescados y Mariscos",         icono: "🐟" },
    { id: 5,  nombre: "Leguminosas y Oleaginosas",   icono: "🫘" },
    { id: 6,  nombre: "Semillas y Frutos Secos",     icono: "🌰" },
    { id: 7,  nombre: "Cereales y Derivados",        icono: "🌾" },
    { id: 8,  nombre: "Papas y Tubérculos",          icono: "🥔" },
    { id: 9,  nombre: "Grasas y Aceites",            icono: "🫙" },
    { id: 10, nombre: "Verduras",                    icono: "🥦" },
    { id: 11, nombre: "Frutas",                      icono: "🍎" },
    { id: 12, nombre: "Azúcares y Miel",             icono: "🍯" },
];

// id_cat | nombre | kcal | prot | carb | grasas | fibra | sodio | medidas[]
const ALIMENTOS = [
    // ── 1. LECHE Y DERIVADOS ─────────────────────────────────────────────────
    { id_cat: 1, nombre: "Leche fluida entera",
      e: 64,  p: 3.3,  c: 4.7,  g: 3.7,  f: 0.0, na: 49.0,
      medidas: [["ml",1],["taza (240 ml)",240],["vaso (200 ml)",200]] },

    { id_cat: 1, nombre: "Leche fluida semidescremada",
      e: 42,  p: 3.3,  c: 5.2,  g: 1.2,  f: 0.0, na: 49.0,
      medidas: [["ml",1],["taza (240 ml)",240],["vaso (200 ml)",200]] },

    { id_cat: 1, nombre: "Leche fluida descremada",
      e: 32,  p: 3.5,  c: 5.1,  g: 0.1,  f: 0.0, na: 49.0,
      medidas: [["ml",1],["taza (240 ml)",240],["vaso (200 ml)",200]] },

    { id_cat: 1, nombre: "Leche en polvo entera",
      e: 489, p: 26.3, c: 38.4, g: 26.7, f: 0.0, na: 371.0,
      medidas: [["gramos",1],["cucharada sopera (10 g)",10],["taza",30]] },

    { id_cat: 1, nombre: "Yogur natural",
      e: 59,  p: 3.5,  c: 4.7,  g: 3.3,  f: 0.0, na: 36.0,
      medidas: [["gramos",1],["pote individual (125 g)",125],["taza (245 g)",245]] },

    { id_cat: 1, nombre: "Queso gauda",
      e: 356, p: 24.9, c: 2.1,  g: 27.8, f: 0.0, na: 819.0,
      medidas: [["gramos",1],["porción (30 g)",30],["lámina (~20 g)",20]] },

    { id_cat: 1, nombre: "Queso fresco",
      e: 264, p: 18.3, c: 2.1,  g: 21.0, f: 0.0, na: 450.0,
      medidas: [["gramos",1],["porción (40 g)",40],["cubo (~25 g)",25]] },

    { id_cat: 1, nombre: "Mantequilla",
      e: 748, p: 0.8,  c: 0.0,  g: 81.1, f: 0.0, na: 714.0,
      medidas: [["gramos",1],["cucharada (14 g)",14],["cucharadita (5 g)",5]] },

    { id_cat: 1, nombre: "Crema de leche",
      e: 296, p: 2.2,  c: 3.1,  g: 31.3, f: 0.0, na: 43.0,
      medidas: [["ml",1],["cucharada (15 ml)",15],["taza (240 ml)",240]] },

    // ── 2. HUEVOS ────────────────────────────────────────────────────────────
    { id_cat: 2, nombre: "Huevo entero",
      e: 143, p: 12.6, c: 0.7,  g: 9.5,  f: 0.0, na: 142.0,
      medidas: [["gramos",1],["unidad grande (~50 g)",50],["unidad mediana (~44 g)",44]] },

    { id_cat: 2, nombre: "Clara de huevo",
      e: 52,  p: 10.9, c: 0.7,  g: 0.2,  f: 0.0, na: 166.0,
      medidas: [["gramos",1],["clara de huevo grande (~33 g)",33]] },

    { id_cat: 2, nombre: "Yema de huevo",
      e: 322, p: 12.7, c: 3.6,  g: 26.5, f: 0.0, na: 48.0,
      medidas: [["gramos",1],["yema de huevo grande (~17 g)",17]] },

    // ── 3. CARNES Y VÍSCERAS ─────────────────────────────────────────────────
    { id_cat: 3, nombre: "Pollo entero cocido",
      e: 176, p: 22.4, c: 0.0,  g: 6.7,  f: 0.0, na: 70.0,
      medidas: [["gramos",1],["porción mediana (~150 g)",150],["porción pequeña (~100 g)",100]] },

    { id_cat: 3, nombre: "Pollo pechuga cocida",
      e: 130, p: 25.4, c: 0.0,  g: 2.8,  f: 0.0, na: 70.0,
      medidas: [["gramos",1],["pechuga mediana (~150 g)",150],["pechuga pequeña (~100 g)",100]] },

    { id_cat: 3, nombre: "Pollo pierna cocida",
      e: 199, p: 22.4, c: 1.5,  g: 11.5, f: 0.0, na: 70.0,
      medidas: [["gramos",1],["pierna con muslo (~150 g)",150],["porción (~100 g)",100]] },

    { id_cat: 3, nombre: "Pato cocido",
      e: 201, p: 23.5, c: 0.0,  g: 11.2, f: 0.0, na: 65.0,
      medidas: [["gramos",1],["porción (~150 g)",150],["porción pequeña (~100 g)",100]] },

    { id_cat: 3, nombre: "Pavo pierna cocida",
      e: 123, p: 22.0, c: 0.0,  g: 3.5,  f: 0.0, na: 70.0,
      medidas: [["gramos",1],["porción mediana (~150 g)",150],["porción pequeña (~100 g)",100]] },

    { id_cat: 3, nombre: "Vacuno filete",
      e: 124, p: 22.0, c: 0.0,  g: 3.9,  f: 0.0, na: 65.0,
      medidas: [["gramos",1],["filete mediano (~180 g)",180],["porción pequeña (~100 g)",100]] },

    { id_cat: 3, nombre: "Vacuno lomo vetado",
      e: 137, p: 21.0, c: 1.8,  g: 4.5,  f: 0.0, na: 75.0,
      medidas: [["gramos",1],["porción mediana (~200 g)",200],["porción pequeña (~100 g)",100]] },

    { id_cat: 3, nombre: "Cerdo chuleta",
      e: 204, p: 15.3, c: 0.5,  g: 20.7, f: 0.0, na: 66.0,
      medidas: [["gramos",1],["chuleta mediana (~120 g)",120],["porción pequeña (~80 g)",80]] },

    { id_cat: 3, nombre: "Hígado de vacuno",
      e: 136, p: 20.4, c: 3.9,  g: 3.6,  f: 0.0, na: 70.0,
      medidas: [["gramos",1],["porción mediana (~100 g)",100],["porción pequeña (~80 g)",80]] },

    // ── 4. PESCADOS Y MARISCOS ───────────────────────────────────────────────
    { id_cat: 4, nombre: "Congrio dorado",
      e: 85,  p: 19.0, c: 0.0,  g: 1.3,  f: 0.0, na: 76.0,
      medidas: [["gramos",1],["trozo mediano (~150 g)",150],["porción pequeña (~100 g)",100]] },

    { id_cat: 4, nombre: "Merluza",
      e: 81,  p: 16.5, c: 0.0,  g: 1.3,  f: 0.0, na: 67.0,
      medidas: [["gramos",1],["filete mediano (~150 g)",150],["filete pequeño (~100 g)",100]] },

    { id_cat: 4, nombre: "Salmón del Atlántico",
      e: 208, p: 20.4, c: 0.0,  g: 13.4, f: 0.0, na: 59.0,
      medidas: [["gramos",1],["filete mediano (~170 g)",170],["porción pequeña (~100 g)",100]] },

    { id_cat: 4, nombre: "Atún en conserva al agua",
      e: 128, p: 26.9, c: 0.0,  g: 2.1,  f: 0.0, na: 402.0,
      medidas: [["gramos",1],["lata pequeña (~85 g)",85],["cucharada (~20 g)",20]] },

    { id_cat: 4, nombre: "Jurel",
      e: 122, p: 23.0, c: 0.0,  g: 3.5,  f: 0.0, na: 76.0,
      medidas: [["gramos",1],["trozo mediano (~150 g)",150],["porción pequeña (~100 g)",100]] },

    { id_cat: 4, nombre: "Reineta",
      e: 130, p: 18.8, c: 0.0,  g: 6.2,  f: 0.0, na: 79.0,
      medidas: [["gramos",1],["trozo mediano (~150 g)",150],["porción pequeña (~100 g)",100]] },

    { id_cat: 4, nombre: "Camarón cocido",
      e: 98,  p: 22.0, c: 0.0,  g: 1.0,  f: 0.0, na: 150.0,
      medidas: [["gramos",1],["porción (~100 g)",100],["taza (~140 g)",140]] },

    // ── 5. LEGUMINOSAS Y OLEAGINOSAS ─────────────────────────────────────────
    { id_cat: 5, nombre: "Poroto cocido",
      e: 139, p: 9.1,  c: 19.1, g: 0.8,  f: 4.9, na: 2.0,
      medidas: [["gramos",1],["taza cocida (~170 g)",170],["porción (~100 g)",100]] },

    { id_cat: 5, nombre: "Lenteja cocida",
      e: 116, p: 9.0,  c: 20.1, g: 0.4,  f: 7.9, na: 2.0,
      medidas: [["gramos",1],["taza cocida (~198 g)",198],["porción (~150 g)",150]] },

    { id_cat: 5, nombre: "Garbanzo cocido",
      e: 164, p: 8.9,  c: 27.4, g: 2.6,  f: 7.6, na: 7.0,
      medidas: [["gramos",1],["taza cocida (~164 g)",164],["porción (~100 g)",100]] },

    { id_cat: 5, nombre: "Poroto de soya cocido",
      e: 141, p: 12.4, c: 6.9,  g: 6.4,  f: 4.2, na: 1.0,
      medidas: [["gramos",1],["taza cocida (~172 g)",172],["porción (~100 g)",100]] },

    { id_cat: 5, nombre: "Maní tostado",
      e: 567, p: 25.8, c: 16.1, g: 49.2, f: 8.5, na: 18.0,
      medidas: [["gramos",1],["puñado (~30 g)",30],["cucharada sopera (~15 g)",15]] },

    // ── 6. SEMILLAS Y FRUTOS SECOS ───────────────────────────────────────────
    { id_cat: 6, nombre: "Almendra",
      e: 579, p: 21.2, c: 21.6, g: 49.9, f: 12.5, na: 1.0,
      medidas: [["gramos",1],["puñado (~30 g)",30],["cucharada (~15 g)",15]] },

    { id_cat: 6, nombre: "Nuez",
      e: 654, p: 15.2, c: 13.7, g: 65.2, f: 6.7,  na: 2.0,
      medidas: [["gramos",1],["puñado (~28 g)",28],["unidad (~7 g)",7]] },

    { id_cat: 6, nombre: "Semilla de chía",
      e: 486, p: 16.5, c: 42.1, g: 30.7, f: 34.4, na: 16.0,
      medidas: [["gramos",1],["cucharada sopera (~10 g)",10],["cucharadita (~5 g)",5]] },

    { id_cat: 6, nombre: "Semilla de maravilla",
      e: 570, p: 21.0, c: 20.0, g: 51.5, f: 8.6,  na: 9.0,
      medidas: [["gramos",1],["cucharada sopera (~10 g)",10],["puñado (~30 g)",30]] },

    { id_cat: 6, nombre: "Sésamo",
      e: 573, p: 17.7, c: 23.5, g: 49.7, f: 11.8, na: 11.0,
      medidas: [["gramos",1],["cucharada sopera (~9 g)",9],["cucharadita (~3 g)",3]] },

    // ── 7. CEREALES Y DERIVADOS ──────────────────────────────────────────────
    { id_cat: 7, nombre: "Pan molde blanco",
      e: 244, p: 8.1,  c: 49.9, g: 1.4,  f: 3.2, na: 466.0,
      medidas: [["gramos",1],["rebanada (~25 g)",25],["dos rebanadas (~50 g)",50]] },

    { id_cat: 7, nombre: "Pan de centeno",
      e: 259, p: 8.5,  c: 48.3, g: 3.3,  f: 6.2, na: 603.0,
      medidas: [["gramos",1],["rebanada (~33 g)",33],["dos rebanadas (~66 g)",66]] },

    { id_cat: 7, nombre: "Pan marraqueta",
      e: 275, p: 8.5,  c: 55.0, g: 1.2,  f: 2.3, na: 545.0,
      medidas: [["gramos",1],["marraqueta entera (~100 g)",100],["media marraqueta (~50 g)",50]] },

    { id_cat: 7, nombre: "Galleta de agua",
      e: 428, p: 8.5,  c: 73.4, g: 4.0,  f: 1.3, na: 289.0,
      medidas: [["gramos",1],["galleta (~7 g)",7],["porción 5 galletas (~35 g)",35]] },

    { id_cat: 7, nombre: "Arroz blanco cocido",
      e: 130, p: 2.7,  c: 28.2, g: 0.3,  f: 0.4, na: 1.0,
      medidas: [["gramos",1],["taza cocida (~186 g)",186],["cucharada (~12 g)",12]] },

    { id_cat: 7, nombre: "Arroz integral cocido",
      e: 123, p: 2.9,  c: 24.5, g: 1.0,  f: 2.0, na: 1.0,
      medidas: [["gramos",1],["taza cocida (~195 g)",195],["cucharada (~12 g)",12]] },

    { id_cat: 7, nombre: "Avena cruda",
      e: 389, p: 16.9, c: 66.3, g: 6.9,  f: 10.6, na: 2.0,
      medidas: [["gramos",1],["taza cruda (~90 g)",90],["cucharada sopera (~10 g)",10]] },

    { id_cat: 7, nombre: "Pasta cocida",
      e: 160, p: 5.8,  c: 31.3, g: 0.9,  f: 1.8, na: 1.0,
      medidas: [["gramos",1],["taza cocida (~140 g)",140],["porción (~200 g)",200]] },

    { id_cat: 7, nombre: "Maíz amarillo cocido",
      e: 86,  p: 3.3,  c: 19.0, g: 1.3,  f: 2.0, na: 15.0,
      medidas: [["gramos",1],["choclo desgranado taza (~145 g)",145],["espiga mediana (~90 g)",90]] },

    // ── 8. PAPAS Y TUBÉRCULOS ────────────────────────────────────────────────
    { id_cat: 8, nombre: "Papa cocida",
      e: 79,  p: 2.0,  c: 17.5, g: 0.1,  f: 1.8, na: 5.0,
      medidas: [["gramos",1],["papa mediana (~150 g)",150],["papa pequeña (~100 g)",100]] },

    { id_cat: 8, nombre: "Papa frita casera",
      e: 312, p: 3.4,  c: 41.4, g: 14.9, f: 3.8, na: 246.0,
      medidas: [["gramos",1],["porción (~100 g)",100],["porción pequeña (~70 g)",70]] },

    { id_cat: 8, nombre: "Papa al horno",
      e: 93,  p: 2.5,  c: 21.2, g: 0.1,  f: 2.1, na: 6.0,
      medidas: [["gramos",1],["papa mediana (~150 g)",150],["papa pequeña (~100 g)",100]] },

    { id_cat: 8, nombre: "Camote cocido",
      e: 76,  p: 1.4,  c: 17.7, g: 0.1,  f: 2.5, na: 27.0,
      medidas: [["gramos",1],["camote mediano (~130 g)",130],["porción (~100 g)",100]] },

    // ── 9. GRASAS Y ACEITES ──────────────────────────────────────────────────
    { id_cat: 9, nombre: "Aceite vegetal",
      e: 897, p: 0.0,  c: 0.0,  g: 99.5, f: 0.0, na: 0.0,
      medidas: [["ml",1],["cucharada (14 ml)",14],["cucharadita (5 ml)",5]] },

    { id_cat: 9, nombre: "Aceite de oliva",
      e: 884, p: 0.0,  c: 0.0,  g: 100.0,f: 0.0, na: 2.0,
      medidas: [["ml",1],["cucharada (14 ml)",14],["cucharadita (5 ml)",5]] },

    { id_cat: 9, nombre: "Margarina",
      e: 720, p: 0.5,  c: 0.7,  g: 80.0, f: 0.0, na: 830.0,
      medidas: [["gramos",1],["cucharada (14 g)",14],["cucharadita (5 g)",5]] },

    { id_cat: 9, nombre: "Mayonesa",
      e: 680, p: 0.9,  c: 0.3,  g: 74.8, f: 0.0, na: 630.0,
      medidas: [["gramos",1],["cucharada (15 g)",15],["cucharadita (5 g)",5]] },

    // ── 10. VERDURAS ─────────────────────────────────────────────────────────
    { id_cat: 10, nombre: "Alcachofa",
      e: 64,  p: 3.3,  c: 11.4, g: 0.2,  f: 5.4, na: 94.0,
      medidas: [["gramos",1],["alcachofa mediana (~120 g)",120],["corazón (~60 g)",60]] },

    { id_cat: 10, nombre: "Apio",
      e: 16,  p: 0.7,  c: 3.0,  g: 0.2,  f: 1.6, na: 80.0,
      medidas: [["gramos",1],["tallo mediano (~40 g)",40],["taza picado (~100 g)",100]] },

    { id_cat: 10, nombre: "Brócoli",
      e: 34,  p: 2.8,  c: 7.0,  g: 0.4,  f: 2.6, na: 33.0,
      medidas: [["gramos",1],["taza picado (~91 g)",91],["porción (~150 g)",150]] },

    { id_cat: 10, nombre: "Cebolla",
      e: 40,  p: 1.1,  c: 9.3,  g: 0.1,  f: 1.7, na: 4.0,
      medidas: [["gramos",1],["cebolla mediana (~110 g)",110],["cebolla pequeña (~70 g)",70]] },

    { id_cat: 10, nombre: "Coliflor",
      e: 25,  p: 1.9,  c: 5.0,  g: 0.3,  f: 2.0, na: 30.0,
      medidas: [["gramos",1],["taza picada (~100 g)",100],["porción (~150 g)",150]] },

    { id_cat: 10, nombre: "Espárrago",
      e: 20,  p: 2.2,  c: 3.9,  g: 0.1,  f: 2.1, na: 2.0,
      medidas: [["gramos",1],["4 espárragos (~60 g)",60],["taza (~134 g)",134]] },

    { id_cat: 10, nombre: "Espinaca",
      e: 23,  p: 2.9,  c: 3.6,  g: 0.4,  f: 2.2, na: 79.0,
      medidas: [["gramos",1],["taza cruda (~30 g)",30],["taza cocida (~180 g)",180]] },

    { id_cat: 10, nombre: "Lechuga",
      e: 14,  p: 1.4,  c: 2.0,  g: 0.2,  f: 1.3, na: 10.0,
      medidas: [["gramos",1],["taza picada (~55 g)",55],["hoja grande (~35 g)",35]] },

    { id_cat: 10, nombre: "Tomate",
      e: 18,  p: 0.9,  c: 3.9,  g: 0.2,  f: 1.2, na: 5.0,
      medidas: [["gramos",1],["tomate mediano (~123 g)",123],["taza picado (~180 g)",180]] },

    { id_cat: 10, nombre: "Zanahoria",
      e: 41,  p: 0.9,  c: 9.6,  g: 0.2,  f: 2.8, na: 69.0,
      medidas: [["gramos",1],["zanahoria mediana (~61 g)",61],["taza rallada (~110 g)",110]] },

    { id_cat: 10, nombre: "Pepino",
      e: 15,  p: 0.7,  c: 3.6,  g: 0.1,  f: 0.5, na: 2.0,
      medidas: [["gramos",1],["pepino mediano (~200 g)",200],["taza en rodajas (~119 g)",119]] },

    { id_cat: 10, nombre: "Pimiento rojo",
      e: 31,  p: 1.0,  c: 6.0,  g: 0.3,  f: 2.1, na: 4.0,
      medidas: [["gramos",1],["pimiento mediano (~119 g)",119],["taza picado (~150 g)",150]] },

    { id_cat: 10, nombre: "Champiñón",
      e: 22,  p: 3.1,  c: 3.3,  g: 0.3,  f: 1.0, na: 5.0,
      medidas: [["gramos",1],["taza rebanado (~70 g)",70],["porción (~100 g)",100]] },

    { id_cat: 10, nombre: "Betarraga cocida",
      e: 44,  p: 1.7,  c: 10.0, g: 0.2,  f: 2.0, na: 77.0,
      medidas: [["gramos",1],["betarraga mediana (~80 g)",80],["taza rebanada (~170 g)",170]] },

    // ── 11. FRUTAS ───────────────────────────────────────────────────────────
    { id_cat: 11, nombre: "Cereza",
      e: 50,  p: 1.0,  c: 12.6, g: 0.7,  f: 1.6, na: 0.0,
      medidas: [["gramos",1],["taza (~138 g)",138],["porción 10 unidades (~68 g)",68]] },

    { id_cat: 11, nombre: "Chirimoya",
      e: 75,  p: 1.7,  c: 12.9, g: 0.6,  f: 3.0, na: 7.0,
      medidas: [["gramos",1],["chirimoya mediana (~460 g, pulpa ~350 g)",350],["porción (~150 g)",150]] },

    { id_cat: 11, nombre: "Ciruela",
      e: 46,  p: 0.7,  c: 9.9,  g: 0.3,  f: 1.4, na: 3.0,
      medidas: [["gramos",1],["ciruela mediana (~66 g)",66],["taza en mitades (~165 g)",165]] },

    { id_cat: 11, nombre: "Durazno",
      e: 39,  p: 0.9,  c: 9.5,  g: 0.3,  f: 1.5, na: 0.0,
      medidas: [["gramos",1],["durazno mediano (~150 g)",150],["taza en rodajas (~170 g)",170]] },

    { id_cat: 11, nombre: "Frutilla",
      e: 32,  p: 0.7,  c: 7.7,  g: 0.3,  f: 2.0, na: 1.0,
      medidas: [["gramos",1],["taza (~152 g)",152],["porción 8 unidades (~80 g)",80]] },

    { id_cat: 11, nombre: "Kiwi",
      e: 61,  p: 1.1,  c: 14.7, g: 0.5,  f: 3.0, na: 3.0,
      medidas: [["gramos",1],["kiwi mediano (~76 g)",76],["kiwi grande (~91 g)",91]] },

    { id_cat: 11, nombre: "Mandarina",
      e: 57,  p: 0.8,  c: 9.1,  g: 0.1,  f: 0.8, na: 5.0,
      medidas: [["gramos",1],["mandarina mediana (~88 g)",88],["taza gajos (~195 g)",195]] },

    { id_cat: 11, nombre: "Mango",
      e: 58,  p: 0.8,  c: 13.4, g: 0.3,  f: 1.6, na: 1.0,
      medidas: [["gramos",1],["mango mediano (pulpa ~200 g)",200],["taza picado (~165 g)",165]] },

    { id_cat: 11, nombre: "Manzana roja",
      e: 59,  p: 0.3,  c: 10.5, g: 0.2,  f: 2.3, na: 5.0,
      medidas: [["gramos",1],["manzana mediana (~182 g)",182],["manzana pequeña (~120 g)",120],["taza en trozos (~109 g)",109]] },

    { id_cat: 11, nombre: "Melón",
      e: 34,  p: 0.8,  c: 8.2,  g: 0.2,  f: 0.9, na: 16.0,
      medidas: [["gramos",1],["tajada mediana (~120 g)",120],["taza en cubos (~177 g)",177]] },

    { id_cat: 11, nombre: "Naranja",
      e: 47,  p: 0.9,  c: 11.8, g: 0.1,  f: 2.4, na: 0.0,
      medidas: [["gramos",1],["naranja mediana (~131 g)",131],["taza en gajos (~180 g)",180]] },

    { id_cat: 11, nombre: "Pera",
      e: 57,  p: 0.4,  c: 15.5, g: 0.1,  f: 3.1, na: 1.0,
      medidas: [["gramos",1],["pera mediana (~166 g)",166],["pera pequeña (~120 g)",120]] },

    { id_cat: 11, nombre: "Plátano",
      e: 89,  p: 1.1,  c: 23.0, g: 0.3,  f: 2.6, na: 1.0,
      medidas: [["gramos",1],["plátano mediano (~118 g)",118],["plátano grande (~136 g)",136],["taza en rodajas (~150 g)",150]] },

    { id_cat: 11, nombre: "Sandía",
      e: 30,  p: 0.6,  c: 7.6,  g: 0.2,  f: 0.4, na: 1.0,
      medidas: [["gramos",1],["tajada mediana (~280 g, pulpa ~200 g)",200],["taza en cubos (~152 g)",152]] },

    { id_cat: 11, nombre: "Uva",
      e: 69,  p: 0.7,  c: 18.1, g: 0.2,  f: 0.9, na: 2.0,
      medidas: [["gramos",1],["taza (~151 g)",151],["racimo pequeño (~80 g)",80]] },

    // ── 12. AZÚCARES Y MIEL ──────────────────────────────────────────────────
    { id_cat: 12, nombre: "Azúcar blanca",
      e: 387, p: 0.0,  c: 99.8, g: 0.0,  f: 0.0, na: 0.0,
      medidas: [["gramos",1],["cucharada sopera (~12 g)",12],["cucharadita (~4 g)",4]] },

    { id_cat: 12, nombre: "Azúcar rubia",
      e: 380, p: 0.0,  c: 98.5, g: 0.0,  f: 0.0, na: 2.0,
      medidas: [["gramos",1],["cucharada sopera (~12 g)",12],["cucharadita (~4 g)",4]] },

    { id_cat: 12, nombre: "Miel de abeja",
      e: 304, p: 0.3,  c: 82.4, g: 0.0,  f: 0.2, na: 4.0,
      medidas: [["gramos",1],["cucharada sopera (~21 g)",21],["cucharadita (~7 g)",7]] },

    { id_cat: 12, nombre: "Chancaca",
      e: 380, p: 0.4,  c: 97.0, g: 0.1,  f: 0.0, na: 30.0,
      medidas: [["gramos",1],["cucharada rallada (~15 g)",15]] },
];

async function seedAlimentos(AppDataSource) {
    const catRepo    = AppDataSource.getRepository("CategoriaAlimento");
    const aliRepo    = AppDataSource.getRepository("Alimento");
    const medRepo    = AppDataSource.getRepository("MedidaAlimento");

    const existentes = await catRepo.count();
    if (existentes > 0) {
        console.log("[Seed] Tablas de alimentos ya contienen datos. Se omite la siembra.");
        return;
    }

    console.log("[Seed] Sembrando categorías y alimentos INTA 2018...");

    for (const cat of CATEGORIAS) {
        const c = catRepo.create({ id: cat.id, nombre: cat.nombre, icono: cat.icono });
        await catRepo.save(c);
    }

    for (const a of ALIMENTOS) {
        const cat = await catRepo.findOne({ where: { id: a.id_cat } });
        const ali = aliRepo.create({
            nombre:          a.nombre,
            energia_kcal:    a.e,
            proteinas_g:     a.p,
            carbohidratos_g: a.c,
            grasas_g:        a.g,
            fibra_g:         a.f,
            sodio_mg:        a.na,
            categoria:       cat,
        });
        const saved = await aliRepo.save(ali);

        for (const [nombre, gramos] of a.medidas) {
            const med = medRepo.create({ nombre, gramos, alimento: saved });
            await medRepo.save(med);
        }
    }

    console.log(`[Seed] ${ALIMENTOS.length} alimentos sembrados exitosamente.`);
}

module.exports = { seedAlimentos };
