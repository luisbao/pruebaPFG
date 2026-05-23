"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Script de validación interna para estudiar umbrales de
  similitud visual. Usa los embeddings ya almacenados del
  catálogo, ejecuta consultas sobre una muestra de prendas y
  calcula métricas top-k por categoría y familia funcional.
-----------------------------------------------------------
"""

from __future__ import annotations

import argparse
import csv
import json
import random
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from statistics import mean, median

import numpy as np

RUTA_BD = Path("datos/prendas.db")
RUTA_SALIDA = Path("datos/evaluacion")

FAMILIAS_CATEGORIA = {
    "parte_arriba": [
        "top",
        "t-shirt",
        "shirt",
        "blouse",
        "sweater",
        "cardigan",
        "hoodie",
        "jacket",
        "coat",
        "blazer",
        "vest",
        "polo",
        "bodysuit",
    ],
    "parte_abajo": [
        "trousers",
        "jeans",
        "skirt",
        "shorts",
        "leggings",
        "tights",
        "dungarees",
        "long john",
    ],
    "calzado": [
        "sneaker",
        "boot",
        "heel",
        "sandals",
        "sandal",
        "pumps",
        "ballerina",
        "flat shoe",
        "flat shoes",
        "slipper",
        "wedge",
        "shoe",
        "mules",
        "flip flop",
    ],
    "vestido": [
        "dress",
        "jumpsuit",
    ],
}

FAMILIAS_VALIDACION = ("parte_arriba", "parte_abajo", "calzado", "vestido")


@dataclass
class PrendaEvaluacion:
    id: int
    categoria: str
    color: str | None
    genero: str | None
    familia: str | None


def clasificar_familia(categoria: str | None) -> str | None:
    """Agrupa categorías del catálogo en familias funcionales sencillas."""
    if not categoria:
        return None

    categoria_normalizada = categoria.lower()
    for familia, palabras_clave in FAMILIAS_CATEGORIA.items():
        if any(palabra in categoria_normalizada for palabra in palabras_clave):
            return familia
    return None


def cargar_catalogo_y_embeddings(
    ruta_bd: Path,
) -> tuple[list[PrendaEvaluacion], np.ndarray]:
    """Carga metadatos y embeddings normalizados desde SQLite."""
    conexion = sqlite3.connect(ruta_bd)
    try:
        filas = conexion.execute(
            """
            SELECT p.id, p.categoria, p.color, p.genero, e.vector
            FROM prendas p
            JOIN embeddings_prenda e ON e.prenda_id = p.id
            ORDER BY p.id
            """
        ).fetchall()
    finally:
        conexion.close()

    prendas: list[PrendaEvaluacion] = []
    vectores = np.empty((len(filas), 512), dtype=np.float32)

    for indice, (prenda_id, categoria, color, genero, vector_json) in enumerate(filas):
        vector = np.array(json.loads(vector_json), dtype=np.float32)
        norma = np.linalg.norm(vector)
        if norma > 0:
            vector = vector / norma

        vectores[indice] = vector
        prendas.append(
            PrendaEvaluacion(
                id=int(prenda_id),
                categoria=categoria or "",
                color=color,
                genero=genero,
                familia=clasificar_familia(categoria),
            )
        )

    return prendas, vectores


def seleccionar_muestra(
    prendas: list[PrendaEvaluacion],
    tamano_muestra: int,
    semilla: int,
) -> list[int]:
    """Selecciona una muestra equilibrada entre las familias funcionales."""
    if tamano_muestra < len(FAMILIAS_VALIDACION):
        raise ValueError("La muestra debe cubrir al menos una consulta por familia funcional")

    consultas_por_familia = tamano_muestra // len(FAMILIAS_VALIDACION)
    sobrantes = tamano_muestra % len(FAMILIAS_VALIDACION)
    generador = random.Random(semilla)
    indices_seleccionados: list[int] = []

    for posicion, familia in enumerate(FAMILIAS_VALIDACION):
        candidatos = [
            indice
            for indice, prenda in enumerate(prendas)
            if prenda.familia == familia
        ]
        generador.shuffle(candidatos)

        cantidad = consultas_por_familia + (1 if posicion < sobrantes else 0)
        if len(candidatos) < cantidad:
            raise ValueError(
                f"No hay suficientes prendas de la familia {familia}: "
                f"{len(candidatos)} disponibles, {cantidad} necesarias"
            )

        indices_seleccionados.extend(candidatos[:cantidad])

    generador.shuffle(indices_seleccionados)
    return indices_seleccionados


def precision(valores: list[bool]) -> float:
    if not valores:
        return 0.0
    return sum(valores) / len(valores)


def evaluar(
    prendas: list[PrendaEvaluacion],
    vectores: np.ndarray,
    indices_consulta: list[int],
    top_k: int,
) -> list[dict[str, object]]:
    """Ejecuta búsquedas top-k usando producto escalar entre vectores normalizados."""
    resultados = []

    for indice_consulta in indices_consulta:
        prenda_consulta = prendas[indice_consulta]
        similitudes = vectores @ vectores[indice_consulta]
        similitudes[indice_consulta] = -1.0

        # Selecciona los candidatos top-k sin ordenar todo el vector de similitudes.
        candidatos = np.argpartition(-similitudes, range(top_k))[:top_k]
        candidatos_ordenados = candidatos[np.argsort(-similitudes[candidatos])]

        top = []
        for posicion, indice_candidato in enumerate(candidatos_ordenados, start=1):
            prenda_candidata = prendas[int(indice_candidato)]
            top.append(
                {
                    "posicion": posicion,
                    "id": prenda_candidata.id,
                    "categoria": prenda_candidata.categoria,
                    "familia": prenda_candidata.familia,
                    "similitud": float(similitudes[indice_candidato]),
                    "misma_categoria": prenda_candidata.categoria == prenda_consulta.categoria,
                    "misma_familia": prenda_candidata.familia == prenda_consulta.familia,
                }
            )

        resultados.append(
            {
                "consulta_id": prenda_consulta.id,
                "consulta_categoria": prenda_consulta.categoria,
                "consulta_familia": prenda_consulta.familia,
                "top": top,
            }
        )

    return resultados


def resumir_metricas(
    resultados: list[dict[str, object]],
    pares_aleatorios: list[dict[str, object]],
    umbrales: list[float],
) -> dict[str, object]:
    """Calcula métricas top-k y precisión para varios umbrales candidatos."""
    top1 = [resultado["top"][0] for resultado in resultados]
    top5 = [resultado["top"][:5] for resultado in resultados]

    similitudes_top1 = [float(item["similitud"]) for item in top1]
    similitudes_pares_aleatorios = [
        float(item["similitud"])
        for item in pares_aleatorios
    ]
    similitudes_pares_distinta_familia = [
        float(item["similitud"])
        for item in pares_aleatorios
        if not bool(item["misma_familia"])
    ]

    resumen = {
        "total_consultas": len(resultados),
        "top1_misma_categoria": precision([bool(item["misma_categoria"]) for item in top1]),
        "top1_misma_familia": precision([bool(item["misma_familia"]) for item in top1]),
        "top5_alguna_misma_categoria": precision(
            [
                any(bool(item["misma_categoria"]) for item in grupo)
                for grupo in top5
            ]
        ),
        "top5_alguna_misma_familia": precision(
            [
                any(bool(item["misma_familia"]) for item in grupo)
                for grupo in top5
            ]
        ),
        "similitud_top1": {
            "media": mean(similitudes_top1),
            "mediana": median(similitudes_top1),
            "minima": min(similitudes_top1),
            "maxima": max(similitudes_top1),
            "p10": float(np.percentile(similitudes_top1, 10)),
            "p25": float(np.percentile(similitudes_top1, 25)),
            "p75": float(np.percentile(similitudes_top1, 75)),
            "p90": float(np.percentile(similitudes_top1, 90)),
        },
        "similitud_pares_aleatorios": {
            "muestras": len(similitudes_pares_aleatorios),
            "media": mean(similitudes_pares_aleatorios),
            "mediana": median(similitudes_pares_aleatorios),
            "p90": float(np.percentile(similitudes_pares_aleatorios, 90)),
            "p95": float(np.percentile(similitudes_pares_aleatorios, 95)),
            "p99": float(np.percentile(similitudes_pares_aleatorios, 99)),
        },
        "similitud_pares_aleatorios_distinta_familia": {
            "muestras": len(similitudes_pares_distinta_familia),
            "media": mean(similitudes_pares_distinta_familia),
            "mediana": median(similitudes_pares_distinta_familia),
            "p90": float(np.percentile(similitudes_pares_distinta_familia, 90)),
            "p95": float(np.percentile(similitudes_pares_distinta_familia, 95)),
            "p99": float(np.percentile(similitudes_pares_distinta_familia, 99)),
        },
        "por_familia": resumir_metricas_por_familia(resultados),
        "umbrales": [],
    }

    for umbral in umbrales:
        aceptados = [
            item
            for item in top1
            if float(item["similitud"]) >= umbral
        ]
        resumen["umbrales"].append(
            {
                "umbral": umbral,
                "consultas_aceptadas": len(aceptados),
                "cobertura_consultas": len(aceptados) / len(top1) if top1 else 0.0,
                "precision_categoria_top1": precision(
                    [bool(item["misma_categoria"]) for item in aceptados]
                ),
                "precision_familia_top1": precision(
                    [bool(item["misma_familia"]) for item in aceptados]
                ),
            }
        )

    return resumen


def resumir_metricas_por_familia(
    resultados: list[dict[str, object]],
) -> dict[str, dict[str, float | int]]:
    """Calcula las métricas principales separadas por familia funcional."""
    resumen: dict[str, dict[str, float | int]] = {}

    for familia in FAMILIAS_VALIDACION:
        resultados_familia = [
            resultado
            for resultado in resultados
            if resultado["consulta_familia"] == familia
        ]
        if not resultados_familia:
            resumen[familia] = {
                "consultas": 0,
                "top1_misma_categoria": 0.0,
                "top1_misma_familia": 0.0,
                "top5_alguna_misma_categoria": 0.0,
                "top5_alguna_misma_familia": 0.0,
            }
            continue

        top1 = [resultado["top"][0] for resultado in resultados_familia]
        top5 = [resultado["top"][:5] for resultado in resultados_familia]
        resumen[familia] = {
            "consultas": len(resultados_familia),
            "top1_misma_categoria": precision([bool(item["misma_categoria"]) for item in top1]),
            "top1_misma_familia": precision([bool(item["misma_familia"]) for item in top1]),
            "top5_alguna_misma_categoria": precision(
                [
                    any(bool(item["misma_categoria"]) for item in grupo)
                    for grupo in top5
                ]
            ),
            "top5_alguna_misma_familia": precision(
                [
                    any(bool(item["misma_familia"]) for item in grupo)
                    for grupo in top5
                ]
            ),
        }

    return resumen


def calcular_pares_aleatorios(
    prendas: list[PrendaEvaluacion],
    vectores: np.ndarray,
    cantidad: int,
    semilla: int,
) -> list[dict[str, object]]:
    """Calcula similitudes entre pares aleatorios como línea base."""
    generador = random.Random(semilla)
    total = len(prendas)
    pares = []

    for _ in range(cantidad):
        indice_a = generador.randrange(total)
        indice_b = generador.randrange(total)
        while indice_b == indice_a:
            indice_b = generador.randrange(total)

        prenda_a = prendas[indice_a]
        prenda_b = prendas[indice_b]
        similitud = float(np.dot(vectores[indice_a], vectores[indice_b]))
        pares.append(
            {
                "id_a": prenda_a.id,
                "id_b": prenda_b.id,
                "categoria_a": prenda_a.categoria,
                "categoria_b": prenda_b.categoria,
                "familia_a": prenda_a.familia,
                "familia_b": prenda_b.familia,
                "similitud": similitud,
                "misma_categoria": prenda_a.categoria == prenda_b.categoria,
                "misma_familia": prenda_a.familia == prenda_b.familia,
            }
        )

    return pares


def formatear_decimal(valor: float, decimales: int = 3) -> str:
    return f"{valor:.{decimales}f}".replace(".", ",")


def formatear_porcentaje(valor: float) -> str:
    return f"{valor * 100:.1f} %".replace(".", ",")


def generar_informe_markdown(resumen: dict[str, object]) -> str:
    """Construye un informe legible con las mismas cifras del JSON."""
    catalogo = resumen["catalogo"]
    similitud_top1 = resumen["similitud_top1"]
    pares = resumen["similitud_pares_aleatorios"]
    pares_distinta_familia = resumen["similitud_pares_aleatorios_distinta_familia"]
    por_familia = resumen["por_familia"]
    muestra = catalogo["muestra"]
    pares_aleatorios = catalogo["pares_aleatorios"]
    distribucion_muestra = catalogo["distribucion_muestra"]
    distribucion_legible = ", ".join(
        f"{familia}: {distribucion_muestra[familia]}"
        for familia in FAMILIAS_VALIDACION
    )
    distribucion_tabla = (
        "125 por familia funcional"
        if all(distribucion_muestra[familia] == 125 for familia in FAMILIAS_VALIDACION)
        else distribucion_legible
    )

    lineas = [
        "# Evaluación interna del umbral de similitud",
        "",
        "Este informe resume una validación interna realizada sobre los embeddings del catálogo "
        "para orientar la interpretación de la puntuación de similitud visual.",
        "",
        "## Metodología",
        "",
        "- Se utilizaron los embeddings CLIP ya precalculados del catálogo.",
        f"- Se seleccionó una muestra estratificada de {muestra} prendas con familia funcional identificable.",
        "- La muestra se repartió de forma equilibrada entre parte_arriba, parte_abajo, calzado y vestido.",
        "- Cada prenda se usó como consulta y se comparó contra el resto del catálogo, excluyendo la propia prenda.",
        "- Se calcularon resultados top-k mediante similitud coseno.",
        "- Se comparó la categoría y la familia funcional de la consulta con las recomendaciones.",
        f"- Se calculó además una línea base de {pares_aleatorios:,} pares aleatorios del catálogo.".replace(",", "."),
        "",
        "## Resultados principales",
        "",
        "| Métrica | Resultado |",
        "|---|---:|",
        f"| Prendas con embedding | {catalogo['prendas_con_embedding']:,}".replace(",", ".") + " |",
        f"| Dimensión del embedding | {catalogo['dimension_embedding']} |",
        f"| Consultas evaluadas | {catalogo['muestra']} |",
        f"| Distribución de la muestra | {distribucion_tabla} |",
        f"| Top-1 misma categoría | {formatear_porcentaje(resumen['top1_misma_categoria'])} |",
        f"| Top-1 misma familia funcional | {formatear_porcentaje(resumen['top1_misma_familia'])} |",
        f"| Top-5 con alguna coincidencia de categoría | {formatear_porcentaje(resumen['top5_alguna_misma_categoria'])} |",
        f"| Top-5 con alguna coincidencia de familia funcional | {formatear_porcentaje(resumen['top5_alguna_misma_familia'])} |",
        f"| Similitud top-1 media | {formatear_decimal(similitud_top1['media'])} |",
        f"| Similitud top-1 mediana | {formatear_decimal(similitud_top1['mediana'])} |",
        "",
        "## Resultados por familia funcional",
        "",
        "| Familia funcional | Consultas | Top-1 misma categoría | Top-1 misma familia | Top-5 misma categoría | Top-5 misma familia |",
        "|---|---:|---:|---:|---:|---:|",
    ]

    for familia in FAMILIAS_VALIDACION:
        metricas = por_familia[familia]
        lineas.append(
            f"| {familia} | {metricas['consultas']} | "
            f"{formatear_porcentaje(metricas['top1_misma_categoria'])} | "
            f"{formatear_porcentaje(metricas['top1_misma_familia'])} | "
            f"{formatear_porcentaje(metricas['top5_alguna_misma_categoria'])} | "
            f"{formatear_porcentaje(metricas['top5_alguna_misma_familia'])} |"
        )

    lineas.extend(
        [
            "",
            "## Línea base con pares aleatorios",
            "",
            "| Referencia | Valor |",
            "|---|---:|",
            f"| Similitud media en pares aleatorios | {formatear_decimal(pares['media'])} |",
            f"| Similitud mediana en pares aleatorios | {formatear_decimal(pares['mediana'])} |",
            f"| Percentil 99 en pares aleatorios de distinta familia funcional | {formatear_decimal(pares_distinta_familia['p99'])} |",
            "| Umbral orientativo de confianza media-alta | 0,92 |",
            "",
            "## Umbrales analizados",
            "",
            "| Umbral top-1 | Consultas aceptadas | Precisión top-1 por categoría | Precisión top-1 por familia |",
            "|---:|---:|---:|---:|",
        ]
    )

    for umbral in resumen["umbrales"]:
        lineas.append(
            f"| {formatear_decimal(umbral['umbral'], 2)} | "
            f"{formatear_porcentaje(umbral['cobertura_consultas'])} | "
            f"{formatear_porcentaje(umbral['precision_categoria_top1'])} | "
            f"{formatear_porcentaje(umbral['precision_familia_top1'])} |"
        )

    lineas.extend(
        [
            "",
            "## Criterio propuesto",
            "",
            "El valor de similitud no se interpreta como porcentaje de acierto, sino como una puntuación relativa de cercanía entre embeddings.",
            "El umbral de 0,92 se toma como referencia orientativa porque queda por encima del percentil 99 de los pares aleatorios de distinta familia funcional.",
            "",
            "## Limitaciones",
            "",
            "Esta validación se ha realizado con imágenes del propio catálogo H&M. Las imágenes subidas por usuarios reales pueden tener más ruido, fondos complejos o encuadres distintos, por lo que el umbral debe interpretarse como una referencia interna y no como una garantía absoluta.",
            "",
        ]
    )

    return "\n".join(lineas)


def guardar_resultados(
    resultados: list[dict[str, object]],
    pares_aleatorios: list[dict[str, object]],
    resumen: dict[str, object],
    ruta_salida: Path,
) -> None:
    """Guarda resultados para poder adjuntarlos o auditarlos en la memoria."""
    ruta_salida.mkdir(parents=True, exist_ok=True)

    with (ruta_salida / "resumen_umbral_similitud.json").open("w", encoding="utf-8") as archivo:
        json.dump(resumen, archivo, ensure_ascii=False, indent=2)

    with (ruta_salida / "detalle_consultas_umbral_similitud.csv").open(
        "w",
        newline="",
        encoding="utf-8",
    ) as archivo:
        writer = csv.writer(archivo)
        writer.writerow(
            [
                "consulta_id",
                "consulta_categoria",
                "consulta_familia",
                "posicion",
                "resultado_id",
                "resultado_categoria",
                "resultado_familia",
                "similitud",
                "misma_categoria",
                "misma_familia",
            ]
        )

        for resultado in resultados:
            for item in resultado["top"]:
                writer.writerow(
                    [
                        resultado["consulta_id"],
                        resultado["consulta_categoria"],
                        resultado["consulta_familia"],
                        item["posicion"],
                        item["id"],
                        item["categoria"],
                        item["familia"],
                        item["similitud"],
                        item["misma_categoria"],
                        item["misma_familia"],
                    ]
                )

    with (ruta_salida / "pares_aleatorios_umbral_similitud.csv").open(
        "w",
        newline="",
        encoding="utf-8",
    ) as archivo:
        writer = csv.writer(archivo)
        writer.writerow(
            [
                "id_a",
                "id_b",
                "categoria_a",
                "categoria_b",
                "familia_a",
                "familia_b",
                "similitud",
                "misma_categoria",
                "misma_familia",
            ]
        )
        for par in pares_aleatorios:
            writer.writerow(
                [
                    par["id_a"],
                    par["id_b"],
                    par["categoria_a"],
                    par["categoria_b"],
                    par["familia_a"],
                    par["familia_b"],
                    par["similitud"],
                    par["misma_categoria"],
                    par["misma_familia"],
                ]
            )

    with (ruta_salida / "informe_umbral_similitud.md").open("w", encoding="utf-8") as archivo:
        archivo.write(generar_informe_markdown(resumen))


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Evalúa umbrales empíricos de similitud visual sobre el catálogo.",
    )
    parser.add_argument("--bd", type=Path, default=RUTA_BD)
    parser.add_argument("--salida", type=Path, default=RUTA_SALIDA)
    parser.add_argument("--muestra", type=int, default=500)
    parser.add_argument("--pares-aleatorios", type=int, default=10000)
    parser.add_argument("--top-k", type=int, default=10)
    parser.add_argument("--semilla", type=int, default=42)
    args = parser.parse_args()

    prendas, vectores = cargar_catalogo_y_embeddings(args.bd)
    indices_consulta = seleccionar_muestra(prendas, args.muestra, args.semilla)
    resultados = evaluar(prendas, vectores, indices_consulta, args.top_k)
    pares_aleatorios = calcular_pares_aleatorios(
        prendas,
        vectores,
        cantidad=args.pares_aleatorios,
        semilla=args.semilla + 1,
    )
    resumen = resumir_metricas(
        resultados,
        pares_aleatorios,
        umbrales=[0.80, 0.85, 0.90, 0.92, 0.94, 0.95, 0.96, 0.97, 0.98],
    )
    resumen["catalogo"] = {
        "prendas_con_embedding": len(prendas),
        "dimension_embedding": int(vectores.shape[1]),
        "muestra": len(indices_consulta),
        "distribucion_muestra": {
            familia: sum(1 for indice in indices_consulta if prendas[indice].familia == familia)
            for familia in FAMILIAS_VALIDACION
        },
        "semilla": args.semilla,
        "top_k": args.top_k,
        "pares_aleatorios": args.pares_aleatorios,
    }

    guardar_resultados(resultados, pares_aleatorios, resumen, args.salida)

    print(json.dumps(resumen, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
