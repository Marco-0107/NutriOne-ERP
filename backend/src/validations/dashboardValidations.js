"use strict";
const Joi = require("joi");

const resumenFinancieroSchema = Joi.object({
    desde: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({ 'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD' }),
    hasta: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional().messages({ 'string.pattern.base': 'La fecha debe tener formato YYYY-MM-DD' }),
});

module.exports = {
    resumenFinancieroSchema,
};
