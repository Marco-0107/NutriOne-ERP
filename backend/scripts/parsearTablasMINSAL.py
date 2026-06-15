#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parsea las tablas LMS oficiales del manual MINSAL Chile
("Patrones de Crecimiento para la Evaluación Nutricional de niños, niñas y
adolescentes desde el nacimiento a 19 años", 2018) y genera los JSON que consume
el backend (src/data/oms/<indicador>.json).

Indicadores por EDAD: peso_edad (P/E), talla_edad (T/E), imc_edad (IMC/E).
  Fila: años:meses  Meses  L  M  S  [-2DE ... +3DE]   (L,M,S = 3 primeros nº tras "Meses")

Peso por TALLA (P/T): dos sub-tablas → "longitud" (0–2a, 45–110 cm acostado) y
  "estatura" (2–5a, 65–120 cm de pie). Fila: Talla(cm)  L  M  S  [-2DE ...].
  Se guarda en peso_talla.json con datos.{M,F}.{longitud,estatura}.

(El perímetro cefálico viene solo como GRÁFICO en este manual, sin tabla numérica.)

NO inventa datos: solo transcribe el PDF. Por defecto DRY-RUN; usar --write.

Uso:  python3 scripts/parsearTablasMINSAL.py "<pdf-o-txt>" [--write]
"""

import json
import os
import re
import subprocess
import sys
import tempfile

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "src", "data", "oms")
REFERENCIA = "MINSAL Chile 2018 (patrones OMS) — niños/niñas 0–19a"

# Fila por edad: años:meses  Meses  L  M  S   (dos bloques por línea → finditer)
FILA_EDAD = re.compile(
    r"(\d+):(\d+)\s+(\d+)\s+(-?\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)"
)
# Fila por talla (P/T): Talla  L  M  S
FILA_TALLA = re.compile(
    r"(\d{2,3}(?:[.,]\d+)?)\s+(-?\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)\s+(\d+(?:[.,]\d+)?)"
)

RANGO_M = {"peso_edad": (1.5, 75), "talla_edad": (40, 185), "imc_edad": (9, 32)}

def num(s):
    return float(s.replace(",", "."))

def detectar_indicador(t):
    t = t.lower()
    if "peso por talla" in t or "peso por longitud" in t or "peso por estatura" in t:
        return "peso_talla"
    if "peso por edad" in t or "peso/edad" in t:
        return "peso_edad"
    if "longitud por edad" in t or "talla por edad" in t or "estatura por edad" in t or "talla/edad" in t:
        return "talla_edad"
    if "imc por edad" in t or "índice de masa" in t or "indice de masa" in t or "imc/edad" in t:
        return "imc_edad"
    return None

def detectar_sexo(t):
    t = t.lower()
    if "niñas" in t or "niña " in t or "adolescentes de" in t and "niñas" in t:
        return "F"
    if "niños" in t or "niño " in t:
        return "M"
    return None

def extraer_texto(ruta):
    if ruta.endswith(".txt"):
        return open(ruta, encoding="utf-8").read()
    fd, tmp = tempfile.mkstemp(suffix=".txt"); os.close(fd)
    subprocess.run(["pdftotext", "-layout", ruta, tmp], check=True)
    txt = open(tmp, encoding="utf-8").read(); os.remove(tmp)
    return txt

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    write = "--write" in sys.argv
    if not args:
        print("Uso: parsearTablasMINSAL.py <pdf-o-txt> [--write]"); return 1
    texto = extraer_texto(args[0])

    edad = {k: {"M": {}, "F": {}} for k in RANGO_M}      # ind -> sexo -> {meses:(L,M,S)}
    pt = {"M": {"longitud": {}, "estatura": {}}, "F": {"longitud": {}, "estatura": {}}}
    ind = sex = subt = None

    for linea in texto.splitlines():
        di = detectar_indicador(linea)
        if di:
            ind = di
        ds = detectar_sexo(linea)
        if ds:
            sex = ds
        low = linea.lower()
        if "longitud" in low:
            subt = "longitud"
        elif "estatura" in low or "peso por talla" in low:
            subt = "estatura"

        if sex is None:
            continue

        if ind in RANGO_M:
            lo, hi = RANGO_M[ind]
            for m in FILA_EDAD.finditer(linea):
                meses = int(m.group(3)); L, M, S = num(m.group(4)), num(m.group(5)), num(m.group(6))
                if lo <= M <= hi and 0.005 <= S <= 0.30 and -5 <= L <= 5 and meses <= 240:
                    edad[ind][sex].setdefault(meses, (round(L, 6), round(M, 6), round(S, 6)))

        elif ind == "peso_talla" and subt:
            for m in FILA_TALLA.finditer(linea):
                talla, L, M, S = num(m.group(1)), num(m.group(2)), num(m.group(3)), num(m.group(4))
                if 40 <= talla <= 125 and 2 <= M <= 40 and 0.04 <= S <= 0.20 and -5 <= L <= 5:
                    pt[sex][subt].setdefault(round(talla, 1), (round(L, 6), round(M, 6), round(S, 6)))

    # Reporte
    print()
    for ind_, sexos in edad.items():
        print(f"[{ind_}]  M:{len(sexos['M'])}  F:{len(sexos['F'])}")
        for s in ("M", "F"):
            xs = sorted(sexos[s])
            if xs:
                print(f"   {s}: meses {xs[0]}–{xs[-1]} | {xs[0]}m→L{sexos[s][xs[0]][0]} M{sexos[s][xs[0]][1]} S{sexos[s][xs[0]][2]}")
    print(f"[peso_talla]  M.long:{len(pt['M']['longitud'])} M.est:{len(pt['M']['estatura'])} "
          f"F.long:{len(pt['F']['longitud'])} F.est:{len(pt['F']['estatura'])}")
    for s in ("M", "F"):
        for sub in ("longitud", "estatura"):
            xs = sorted(pt[s][sub])
            if xs:
                print(f"   {s}.{sub}: {xs[0]}–{xs[-1]}cm | {xs[0]}cm→L{pt[s][sub][xs[0]][0]} M{pt[s][sub][xs[0]][1]} S{pt[s][sub][xs[0]][2]}")

    if not write:
        print("\nDRY-RUN. Para escribir: agrega --write"); return 0

    os.makedirs(OUT_DIR, exist_ok=True)

    def filas(d):
        return [{"x": x, "L": d[x][0], "M": d[x][1], "S": d[x][2]} for x in sorted(d)]

    for ind_, sexos in edad.items():
        if not sexos["M"] and not sexos["F"]:
            continue
        salida = {"indicador": ind_, "referencia": REFERENCIA, "variableX": "edad_meses",
                  "uso_clinico": True, "fuente": "Manual MINSAL 2018 (scripts/parsearTablasMINSAL.py)",
                  "datos": {"M": filas(sexos["M"]), "F": filas(sexos["F"])}}
        ruta = os.path.join(OUT_DIR, f"{ind_}.json")
        json.dump(salida, open(ruta, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"  → {os.path.relpath(ruta)}")

    if any(pt[s][sub] for s in ("M", "F") for sub in ("longitud", "estatura")):
        salida = {"indicador": "peso_talla", "referencia": REFERENCIA, "variableX": "talla_cm",
                  "uso_clinico": True, "subtablas": ["longitud (0-2a, acostado)", "estatura (2-5a, de pie)"],
                  "fuente": "Manual MINSAL 2018 (scripts/parsearTablasMINSAL.py)",
                  "datos": {s: {sub: filas(pt[s][sub]) for sub in ("longitud", "estatura")} for s in ("M", "F")}}
        ruta = os.path.join(OUT_DIR, "peso_talla.json")
        json.dump(salida, open(ruta, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"  → {os.path.relpath(ruta)}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
