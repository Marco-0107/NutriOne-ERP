"use strict";
const express = require("express");
const { getCategorias, buscarAlimentos, getAlimentoById } = require("../controllers/alimentoController");

const router = express.Router();

router.get("/categorias", getCategorias);
router.get("/buscar",     buscarAlimentos);
router.get("/:id",        getAlimentoById);

module.exports = router;
