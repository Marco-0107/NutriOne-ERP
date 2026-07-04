import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ─── Formatters ─────────────────────────────────────────────────── */
export const formatCLP = (v) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(v) || 0);

export const formatFecha = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatFechaHora = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const nombreCompleto = (obj) =>
    obj ? `${obj.nombres ?? ''} ${obj.apellido_paterno ?? ''} ${obj.apellido_materno ?? ''}`.trim().replace(/\s+/g, ' ') : '—';

/* ─── Cálculos de minuta ─────────────────────────────────────────── */
const calcNut = (ali) => ({
    kcal: Math.round(((ali.por_100g?.calorias      ?? 0) * ali.gramos) / 100),
    prot: +((        (ali.por_100g?.proteinas      ?? 0) * ali.gramos) / 100).toFixed(1),
    carb: +((        (ali.por_100g?.carbohidratos  ?? 0) * ali.gramos) / 100).toFixed(1),
    gras: +((        (ali.por_100g?.grasas         ?? 0) * ali.gramos) / 100).toFixed(1),
});

const sumarNut = (alimentos) => alimentos.reduce((acc, ali) => {
    const n = calcNut(ali);
    return { kcal: acc.kcal + n.kcal, prot: +(acc.prot + n.prot).toFixed(1), carb: +(acc.carb + n.carb).toFixed(1), gras: +(acc.gras + n.gras).toFixed(1) };
}, { kcal: 0, prot: 0, carb: 0, gras: 0 });

/* ══════════════════════════════════════════════════════════════════
   PDF DE SESIÓN CLÍNICA
   Genera un documento completo con todos los datos de la cita para
   entregar al paciente. Incluye ficha, evaluación nutricional y minuta.
══════════════════════════════════════════════════════════════════ */
export const generarPDFSesion = (cita, ficha, evaluacion) => {
    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W    = doc.internal.pageSize.getWidth();
    const ML   = 14;   // margin left
    const MR   = W - 14; // margin right

    const portal = `${window.location.origin}/evolucion-publica`;

    /* ── Encabezado ──────────────────────────────────────────────── */
    doc.setFillColor(109, 40, 217);
    doc.rect(0, 0, W, 32, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('NutriOne ERP', ML, 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Resumen de Sesión Clínica', ML, 19);
    doc.text(`Generado: ${formatFechaHora(new Date().toISOString())}`, MR, 19, { align: 'right' });

    /* ── Nombre paciente destacado ───────────────────────────────── */
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(nombreCompleto(cita?.paciente), ML, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`${formatFecha(ficha?.fecha_atencion ?? cita?.fecha)}  ·  ${ficha?.tipo ?? 'Control nutricional'}  ·  ${cita?.hora_inicio?.substring(0, 5) ?? ''} – ${cita?.hora_fin?.substring(0, 5) ?? ''}`, ML, 49);
    doc.text(`Profesional: ${nombreCompleto(cita?.nutricionista)}`, ML, 55);
    if (cita?.servicio?.nombre) doc.text(`Servicio: ${cita.servicio.nombre}`, ML, 61);

    let cursorY = 68;

    /* ── Sección: Medidas Antropométricas ────────────────────────── */
    const imc = ficha?.peso && ficha?.talla
        ? parseFloat((ficha.peso / ((ficha.talla / 100) ** 2)).toFixed(1))
        : null;

    const medidas = [
        ['Peso', ficha?.peso ? `${ficha.peso} kg` : null],
        ['Talla', ficha?.talla ? `${ficha.talla} cm` : null],
        ['IMC', imc ? `${imc}` : (evaluacion?.imc ? `${evaluacion.imc}` : null)],
        ['Clasificación IMC', evaluacion?.clasificacion_imc ?? null],
        ['Cintura', ficha?.circunferencia_cintura ? `${ficha.circunferencia_cintura} cm` : null],
        ['Presión arterial', ficha?.presion_arterial ?? null],
        ['Edad', ficha?.edad ? `${ficha.edad} años` : null],
        ['Sexo', ficha?.sexo ?? null],
    ].filter(([, v]) => v != null);

    if (medidas.length) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(109, 40, 217);
        doc.text('MEDIDAS ANTROPOMÉTRICAS', ML, cursorY);
        cursorY += 3;

        autoTable(doc, {
            startY: cursorY,
            body: medidas.map(([k, v]) => [k, v]),
            theme: 'striped',
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 120 } },
            headStyles: { fillColor: [109, 40, 217] },
        });
        cursorY = doc.lastAutoTable.finalY + 6;
    }

    /* ── Sección: Evaluación Nutricional (de EvaluacionNutricional) ─ */
    if (evaluacion) {
        if (cursorY > 240) { doc.addPage(); cursorY = 20; }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(109, 40, 217);
        doc.text('EVALUACIÓN NUTRICIONAL', ML, cursorY);
        cursorY += 3;

        const evRows = [
            ['Peso ideal',         evaluacion.peso_ideal    ? `${evaluacion.peso_ideal} kg`    : null],
            ['Peso meta',          evaluacion.peso_meta     ? `${evaluacion.peso_meta} kg`     : null],
            ['Rango peso normal',  (evaluacion.peso_minimo && evaluacion.peso_maximo) ? `${evaluacion.peso_minimo} – ${evaluacion.peso_maximo} kg` : null],
            ['% Pérdida de peso',  evaluacion.porcentaje_perdida_peso != null ? `${evaluacion.porcentaje_perdida_peso}%` : null],
            ['Contextura',         evaluacion.contextura    ?? null],
            ['% Grasa corporal',   evaluacion.porcentaje_grasa != null ? `${evaluacion.porcentaje_grasa}%` : null],
            ['Clasificación grasa',evaluacion.clasificacion_grasa ?? null],
            ['Cintura (clasif.)',   evaluacion.clasificacion_cintura ?? null],
            ['ICC',                evaluacion.icc != null ? `${evaluacion.icc}` : null],
            ['Clasificación ICC',  evaluacion.clasificacion_icc ?? null],
            ['GEB (kcal/día)',      evaluacion.geb ? `${evaluacion.geb} kcal/día` : null],
            ['GET (kcal/día)',      evaluacion.get ? `${evaluacion.get} kcal/día` : null],
            ['Nivel de actividad', evaluacion.nivel_actividad ?? null],
            ['PAL',                evaluacion.pal ? `${evaluacion.pal}` : null],
        ].filter(([, v]) => v != null);

        autoTable(doc, {
            startY: cursorY,
            body: evRows.map(([k, v]) => [k, v]),
            theme: 'striped',
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 1: { cellWidth: 110 } },
        });
        cursorY = doc.lastAutoTable.finalY + 4;

        /* Macros */
        const tienesMacros = evaluacion.pro_gramos != null || evaluacion.cho_gramos != null || evaluacion.lip_gramos != null;
        if (tienesMacros) {
            if (cursorY > 240) { doc.addPage(); cursorY = 20; }
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(60, 60, 60);
            doc.text('Distribución de Macronutrientes', ML, cursorY + 4);

            autoTable(doc, {
                startY: cursorY + 6,
                head: [['Macronutriente', '% del VCT', 'Gramos/día']],
                body: [
                    ['Proteínas',      evaluacion.pro_porcentaje != null ? `${evaluacion.pro_porcentaje}%` : '—', evaluacion.pro_gramos != null ? `${evaluacion.pro_gramos} g` : '—'],
                    ['Carbohidratos',  evaluacion.cho_porcentaje != null ? `${evaluacion.cho_porcentaje}%` : '—', evaluacion.cho_gramos != null ? `${evaluacion.cho_gramos} g` : '—'],
                    ['Lípidos',        evaluacion.lip_porcentaje != null ? `${evaluacion.lip_porcentaje}%` : '—', evaluacion.lip_gramos != null ? `${evaluacion.lip_gramos} g` : '—'],
                ],
                theme: 'grid',
                headStyles: { fillColor: [109, 40, 217], textColor: 255, fontSize: 9 },
                styles: { fontSize: 9, cellPadding: 3 },
                columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 50, halign: 'center' }, 2: { cellWidth: 60, halign: 'center' } },
            });
            cursorY = doc.lastAutoTable.finalY + 6;
        }
    }

    /* ── Sección: Diagnóstico y clínica ──────────────────────────── */
    const clinicos = [
        ['Motivo de consulta',      ficha?.motivo_consulta         ?? null],
        ['Diagnóstico nutricional', ficha?.diagnostico_nutricional ?? null],
        ['Diagnóstico generado',    evaluacion?.diagnostico_generado ?? null],
    ].filter(([, v]) => v);

    if (clinicos.length) {
        if (cursorY > 240) { doc.addPage(); cursorY = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(109, 40, 217);
        doc.text('DIAGNÓSTICO', ML, cursorY);
        cursorY += 3;

        autoTable(doc, {
            startY: cursorY,
            body: clinicos.map(([k, v]) => [k, v]),
            theme: 'striped',
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 }, 1: { cellWidth: 120 } },
        });
        cursorY = doc.lastAutoTable.finalY + 6;
    }

    /* ── Sección: Indicaciones y recomendaciones ─────────────────── */
    const indicaciones = [
        { titulo: 'INDICACIONES',    texto: ficha?.indicaciones    },
        { titulo: 'RECOMENDACIONES', texto: ficha?.recomendaciones },
        { titulo: 'DERIVACIONES',    texto: ficha?.derivaciones    },
        { titulo: 'OBSERVACIONES',   texto: ficha?.observacion     },
        { titulo: 'CÁLCULOS',        texto: ficha?.calculos        },
    ].filter(s => s.texto);

    for (const sec of indicaciones) {
        if (cursorY > 250) { doc.addPage(); cursorY = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(109, 40, 217);
        doc.text(sec.titulo, ML, cursorY);
        cursorY += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(50, 50, 50);
        const lines = doc.splitTextToSize(sec.texto, W - ML * 2);
        if (cursorY + lines.length * 5 > 270) { doc.addPage(); cursorY = 20; }
        doc.text(lines, ML, cursorY);
        cursorY += lines.length * 5 + 6;
    }

    /* ── Sección: Minuta dietética ───────────────────────────────── */
    const minuta = ficha?.minuta;
    const tiemposConAlimentos = minuta?.tiempos?.filter(t => t.alimentos?.length > 0) ?? [];

    if (tiemposConAlimentos.length) {
        if (cursorY > 200) { doc.addPage(); cursorY = 20; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(16, 185, 129);
        doc.text('MINUTA DIETÉTICA', ML, cursorY);
        cursorY += 3;

        const totalGlobal = sumarNut(tiemposConAlimentos.flatMap(t => t.alimentos));

        autoTable(doc, {
            startY: cursorY,
            head: [['Tiempo / Alimento', 'Gramos', 'Kcal', 'Prot. g', 'CH g', 'Grasas g']],
            body: tiemposConAlimentos.flatMap(t => {
                const tot = sumarNut(t.alimentos);
                return [
                    [{ content: t.nombre.toUpperCase(), colSpan: 6, styles: { fontStyle: 'bold', fillColor: [220, 252, 231], textColor: [5, 150, 105] } }],
                    ...t.alimentos.map(ali => {
                        const n = calcNut(ali);
                        return [`  ${ali.icono ?? ''} ${ali.nombre}`, `${ali.gramos} g`, n.kcal, n.prot, n.carb, n.gras];
                    }),
                    [{ content: `Subtotal ${t.nombre}`, colSpan: 2, styles: { fontStyle: 'bold', textColor: [5, 150, 105] } }, tot.kcal, tot.prot, tot.carb, tot.gras],
                ];
            }),
            foot: [[{ content: 'TOTAL DIARIO', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [5, 150, 105], textColor: 255 } }, totalGlobal.kcal, totalGlobal.prot, totalGlobal.carb, totalGlobal.gras]],
            theme: 'grid',
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontSize: 8 },
            footStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 20, halign: 'center' }, 2: { cellWidth: 18, halign: 'center' }, 3: { cellWidth: 20, halign: 'center' }, 4: { cellWidth: 18, halign: 'center' }, 5: { cellWidth: 22, halign: 'center' } },
        });
        cursorY = doc.lastAutoTable.finalY + 8;
    }

    /* ── Footer con portal del paciente ──────────────────────────── */
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const pageH = doc.internal.pageSize.getHeight();
        doc.setDrawColor(200, 200, 200);
        doc.line(ML, pageH - 20, MR, pageH - 20);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(120, 120, 120);
        doc.text(`NutriOne ERP — Documento de sesión clínica  ·  Página ${i} de ${totalPages}`, ML, pageH - 14);
        doc.setTextColor(109, 40, 217);
        doc.text('Consulta tu evolución en línea:', ML, pageH - 9);
        doc.setFont('helvetica', 'bold');
        doc.text(portal, ML + 52, pageH - 9);
    }

    const pacNombre = nombreCompleto(cita?.paciente).replace(/\s+/g, '_');
    doc.save(`sesion_${pacNombre}_${formatFecha(ficha?.fecha_atencion ?? cita?.fecha).replace(/\//g, '-')}.pdf`);
};

/* ══════════════════════════════════════════════════════════════════
   RECIBO HTML (imprimible / "Guardar como PDF" vía navegador)
══════════════════════════════════════════════════════════════════ */
export const generarReciboHTML = (cobro, cita) => {
    const paciente = cita?.paciente ? nombreCompleto(cita.paciente) : '—';
    const servicio = cita?.servicio?.nombre ?? '—';
    const pagos    = cobro.pagos ?? [];
    const portal   = `${window.location.origin}/evolucion-publica`;

    const filasPagos = pagos.map((p) => `
        <tr>
            <td>${formatFechaHora(p.fecha_pago)}</td>
            <td style="text-transform:capitalize">${p.metodo_pago}</td>
            <td style="text-align:right; font-weight:600;">${formatCLP(p.monto)}</td>
        </tr>
    `).join('');

    const estadoLabel = {
        pagado:         'Pagado',
        pagado_parcial: 'Pago Parcial',
        pendiente:      'Pendiente',
        anulado:        'Anulado',
    }[cobro.estado] ?? cobro.estado;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Recibo de Pago — Cobro #${cobro.id_cobro}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Inter',sans-serif;color:#1F2937;background:#fff;padding:24px;max-width:480px;margin:0 auto}
    .header{background:linear-gradient(135deg,#7C3AED,#5B21B6);color:#fff;padding:20px;border-radius:12px 12px 0 0}
    .header h1{font-size:20px;font-weight:700}
    .header p{font-size:11px;margin-top:4px;opacity:.85}
    .body{border:1px solid #E5E7EB;border-top:none;border-radius:0 0 12px 12px;padding:20px}
    .row{display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:1px solid #F3F4F6}
    .row:last-child{border-bottom:none}
    .label{color:#6B7280}
    .value{font-weight:600;text-align:right}
    .section-title{font-size:10px;font-weight:700;text-transform:uppercase;color:#9CA3AF;margin:16px 0 8px;letter-spacing:.05em}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{background:#F3F4F6;padding:7px 8px;text-align:left;font-weight:600;font-size:11px;color:#6B7280}
    td{padding:7px 8px;border-bottom:1px solid #F3F4F6}
    .total-row{display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding:12px 16px;background:#ECFDF5;border-radius:10px}
    .total-label{font-weight:600;font-size:13px;color:#059669}
    .total-value{font-weight:700;font-size:18px;color:#059669}
    .badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:11px;font-weight:600}
    .badge-pagado{background:#D1FAE5;color:#059669}
    .badge-parcial{background:#DBEAFE;color:#3B82F6}
    .portal{margin-top:16px;padding:12px;background:#F5F3FF;border-radius:10px;border:1px solid #DDD6FE;font-size:11px;color:#5B21B6;text-align:center}
    .portal a{color:#7C3AED;font-weight:600}
    .footer{text-align:center;font-size:10px;color:#9CA3AF;margin-top:14px}
    .print-btn{display:block;width:100%;margin-top:16px;padding:12px;background:#7C3AED;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600}
    @media print{.print-btn{display:none}}
  </style>
</head>
<body>
  <div class="header">
    <h1>NutriOne ERP</h1>
    <p>Recibo de Pago · Cobro #${cobro.id_cobro}</p>
  </div>
  <div class="body">
    <div class="section-title">Atención</div>
    <div class="row"><span class="label">Paciente</span><span class="value">${paciente}</span></div>
    <div class="row"><span class="label">Servicio</span><span class="value">${servicio}</span></div>
    <div class="row"><span class="label">Fecha de cita</span><span class="value">${formatFecha(cita?.fecha ?? null)}</span></div>
    <div class="row"><span class="label">Estado del cobro</span>
      <span><span class="badge badge-${cobro.estado === 'pagado' ? 'pagado' : 'parcial'}">${estadoLabel}</span></span>
    </div>

    <div class="section-title">Detalle de Pago</div>
    <div class="row"><span class="label">Monto total del servicio</span><span class="value">${formatCLP(cobro.monto_total)}</span></div>
    <div class="row"><span class="label">Total pagado</span><span class="value">${formatCLP(cobro.monto_pagado)}</span></div>
    ${cobro.saldo_pendiente > 0 ? `<div class="row"><span class="label">Saldo pendiente</span><span class="value" style="color:#EF4444">${formatCLP(cobro.saldo_pendiente)}</span></div>` : ''}

    ${pagos.length ? `
    <div class="section-title">Transacciones</div>
    <table>
      <thead><tr><th>Fecha</th><th>Método</th><th style="text-align:right">Monto</th></tr></thead>
      <tbody>${filasPagos}</tbody>
    </table>` : ''}

    <div class="total-row">
      <span class="total-label">Total recibido</span>
      <span class="total-value">${formatCLP(cobro.monto_pagado)}</span>
    </div>

    <div class="portal">
      ¿Quieres ver tu evolución en línea?<br/>
      Ingresa con tu RUT en <a href="${portal}" target="_blank">${portal}</a>
    </div>
  </div>
  <p class="footer">Generado el ${formatFechaHora(new Date().toISOString())} · NutriOne ERP</p>
  <button class="print-btn" onclick="window.print()">Imprimir / Guardar como PDF</button>
</body>
</html>`;
};

/* ─── Fetch helpers (necesitan token) ───────────────────────────── */
export const fetchCitaCompleta = async (citaId, token) => {
    const [resCita, resFicha] = await Promise.all([
        fetch(`/api/citas/${citaId}`,           { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/fichas/cita/${citaId}`,      { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const [jsonCita, jsonFicha] = await Promise.all([resCita.json(), resFicha.json()]);
    if (!resCita.ok) throw new Error(jsonCita.message || 'Error al obtener cita');

    const cita  = jsonCita.data;
    const ficha = jsonFicha.data ?? null;

    let evaluacion = null;
    if (ficha?.id_ficha) {
        const resEv = await fetch(`/api/calculos/ficha/${ficha.id_ficha}`, { headers: { Authorization: `Bearer ${token}` } });
        if (resEv.ok) {
            const jsonEv = await resEv.json();
            evaluacion = jsonEv.data ?? null;
        }
    }

    return { cita, ficha, evaluacion };
};

export const fetchCobroConCita = async (cobroId, token) => {
    const resCobro = await fetch(`/api/caja/cobros/${cobroId}`, { headers: { Authorization: `Bearer ${token}` } });
    const jsonCobro = await resCobro.json();
    if (!resCobro.ok) throw new Error(jsonCobro.message || 'Cobro no encontrado');

    const cobro = jsonCobro.data;
    let cita = null;

    if (cobro.cita?.id_cita) {
        const resCita = await fetch(`/api/citas/${cobro.cita.id_cita}`, { headers: { Authorization: `Bearer ${token}` } });
        if (resCita.ok) { const j = await resCita.json(); cita = j.data ?? null; }
    }

    return { cobro, cita };
};
