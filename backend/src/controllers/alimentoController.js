"use strict";
const { AppDataSource }  = require("../config/configDb");
const { redisClient, isRedisReady } = require("../config/redisClient");

const CACHE_TTL = 3600; // 1 hora

async function fromCache(key) {
    if (!isRedisReady()) return null;
    try {
        const val = await redisClient.get(key);
        return val ? JSON.parse(val) : null;
    } catch {
        return null;
    }
}

async function toCache(key, data) {
    if (!isRedisReady()) return;
    try {
        await redisClient.setEx(key, CACHE_TTL, JSON.stringify(data));
    } catch { /* defensivo */ }
}

// GET /api/alimentos/categorias
const getCategorias = async (req, res) => {
    try {
        const cached = await fromCache("alimentos:categorias");
        if (cached) return res.json({ success: true, data: cached });

        const repo  = AppDataSource.getRepository("CategoriaAlimento");
        const cats  = await repo.find({ order: { id: "ASC" } });
        const data  = cats.map(c => ({ id: c.id, nombre: c.nombre, icono: c.icono }));

        await toCache("alimentos:categorias", data);
        return res.json({ success: true, data });
    } catch (err) {
        console.error("[alimentoController.getCategorias]", err);
        return res.status(500).json({ success: false, message: "Error al obtener categorías" });
    }
};

// GET /api/alimentos/buscar?q=texto&limit=8
const buscarAlimentos = async (req, res) => {
    try {
        const q     = (req.query.q || "").trim();
        const limit = Math.min(parseInt(req.query.limit) || 8, 20);

        if (q.length < 2) {
            return res.json({ success: true, data: [] });
        }

        const cacheKey = `alimentos:buscar:${q.toLowerCase()}:${limit}`;
        const cached   = await fromCache(cacheKey);
        if (cached) return res.json({ success: true, data: cached });

        const repo = AppDataSource.getRepository("Alimento");
        const rows = await repo
            .createQueryBuilder("a")
            .leftJoinAndSelect("a.categoria", "cat")
            .where("lower(a.nombre) LIKE :q", { q: `%${q.toLowerCase()}%` })
            .orderBy("a.nombre", "ASC")
            .limit(limit)
            .getMany();

        const data = rows.map(a => ({
            id:         a.id,
            nombre:     a.nombre,
            id_categoria: a.categoria?.id ?? null,
            categoria:  a.categoria?.nombre ?? null,
            icono:      a.categoria?.icono ?? "🍽️",
            por_100g: {
                calorias:      parseFloat(a.energia_kcal),
                proteinas:     parseFloat(a.proteinas_g),
                carbohidratos: parseFloat(a.carbohidratos_g),
                grasas:        parseFloat(a.grasas_g),
                fibra:         parseFloat(a.fibra_g),
                sodio:         parseFloat(a.sodio_mg),
            },
        }));

        await toCache(cacheKey, data);
        return res.json({ success: true, data });
    } catch (err) {
        console.error("[alimentoController.buscarAlimentos]", err);
        return res.status(500).json({ success: false, message: "Error al buscar alimentos" });
    }
};

// GET /api/alimentos/:id
const getAlimentoById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "ID inválido" });
        }

        const cacheKey = `alimentos:id:${id}`;
        const cached   = await fromCache(cacheKey);
        if (cached) return res.json({ success: true, data: cached });

        const repo = AppDataSource.getRepository("Alimento");
        const a    = await repo
            .createQueryBuilder("a")
            .leftJoinAndSelect("a.categoria", "cat")
            .leftJoinAndSelect("a.medidas", "med")
            .where("a.id = :id", { id })
            .orderBy("med.id", "ASC")
            .getOne();

        if (!a) {
            return res.status(404).json({ success: false, message: "Alimento no encontrado" });
        }

        const data = {
            id:           a.id,
            nombre:       a.nombre,
            id_categoria: a.categoria?.id ?? null,
            categoria:    a.categoria?.nombre ?? null,
            icono:        a.categoria?.icono ?? "🍽️",
            por_100g: {
                calorias:      parseFloat(a.energia_kcal),
                proteinas:     parseFloat(a.proteinas_g),
                carbohidratos: parseFloat(a.carbohidratos_g),
                grasas:        parseFloat(a.grasas_g),
                fibra:         parseFloat(a.fibra_g),
                sodio:         parseFloat(a.sodio_mg),
            },
            medidas: (a.medidas || []).map(m => ({
                nombre: m.nombre,
                gramos: parseFloat(m.gramos),
            })),
        };

        await toCache(cacheKey, data);
        return res.json({ success: true, data });
    } catch (err) {
        console.error("[alimentoController.getAlimentoById]", err);
        return res.status(500).json({ success: false, message: "Error al obtener alimento" });
    }
};

module.exports = { getCategorias, buscarAlimentos, getAlimentoById };
