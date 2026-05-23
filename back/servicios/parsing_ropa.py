"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Servicio de parsing semántico de ropa. Carga el modelo de
  segmentación, detecta componentes de la imagen y calcula las
  cajas aproximadas que luego usa la recomendación de outfits.
-----------------------------------------------------------
"""

import logging
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image
from transformers import AutoModelForSemanticSegmentation, SegformerImageProcessor

logger = logging.getLogger(__name__)

MODELO_PARSING_ROPA = "sayeed99/segformer_b3_clothes"

NOMBRES_ETIQUETA_SEGMENTACION = {
    0: "background",
    1: "hat",
    2: "hair",
    3: "sunglasses",
    4: "upper-clothes",
    5: "skirt",
    6: "pants",
    7: "dress",
    8: "belt",
    9: "left-shoe",
    10: "right-shoe",
    11: "face",
    12: "left-leg",
    13: "right-leg",
    14: "left-arm",
    15: "right-arm",
    16: "bag",
    17: "scarf",
}

DEFINICIONES_COMPONENTES = {
    "upper_clothes": {
        "etiquetas": {4},
        "nombres": ["upper-clothes"],
        "min_pixeles": 300,
    },
    "skirt": {
        "etiquetas": {5},
        "nombres": ["skirt"],
        "min_pixeles": 250,
    },
    "pants": {
        "etiquetas": {6},
        "nombres": ["pants"],
        "min_pixeles": 250,
    },
    "dress": {
        "etiquetas": {7},
        "nombres": ["dress"],
        "min_pixeles": 350,
    },
    "shoes": {
        "etiquetas": {9, 10},
        "nombres": ["left-shoe", "right-shoe"],
        "min_pixeles": 120,
    },
}


@dataclass
class ComponenteSegmentado:
    clave: str
    bbox: tuple[int, int, int, int]
    pixeles: int
    proporcion: float
    etiquetas_ids: tuple[int, ...]
    etiquetas_nombres: tuple[str, ...]
    recorte: Image.Image


@dataclass
class ResultadoParsingRopa:
    parsing_ok: bool
    tamano_imagen: tuple[int, int] | None
    etiquetas_detectadas: list[str]
    componentes: dict[str, ComponenteSegmentado]
    motivo_error: str | None = None


@lru_cache(maxsize=1)
def obtener_modelo_segmentacion_ropa():
    """Carga el modelo de parsing de ropa una sola vez y lo reutiliza."""
    dispositivo = "cuda" if torch.cuda.is_available() else "cpu"
    procesador = SegformerImageProcessor.from_pretrained(MODELO_PARSING_ROPA)
    modelo = AutoModelForSemanticSegmentation.from_pretrained(MODELO_PARSING_ROPA).to(dispositivo)
    modelo.eval()
    return procesador, modelo, dispositivo


def _calcular_bbox_mascara(
    mascara: np.ndarray,
    tamano_imagen: tuple[int, int],
) -> tuple[int, int, int, int] | None:
    """Calcula una caja de recorte con un pequeño margen alrededor de la máscara."""
    coordenadas_y, coordenadas_x = np.where(mascara)
    if len(coordenadas_x) == 0 or len(coordenadas_y) == 0:
        return None

    x_min, x_max = coordenadas_x.min(), coordenadas_x.max()
    y_min, y_max = coordenadas_y.min(), coordenadas_y.max()

    ancho, alto = tamano_imagen
    margen_x = int(0.05 * ancho)
    margen_y = int(0.05 * alto)

    x_min = max(0, int(x_min) - margen_x)
    x_max = min(ancho, int(x_max) + margen_x)
    y_min = max(0, int(y_min) - margen_y)
    y_max = min(alto, int(y_max) + margen_y)

    if x_max <= x_min or y_max <= y_min:
        return None

    return (x_min, y_min, x_max, y_max)


def parsear_ropa_en_imagen(ruta_imagen: Path) -> ResultadoParsingRopa:
    """Ejecuta el human parsing y devuelve los componentes segmentados detectados."""
    try:
        if not ruta_imagen.exists():
            return ResultadoParsingRopa(
                parsing_ok=False,
                tamano_imagen=None,
                etiquetas_detectadas=[],
                componentes={},
                motivo_error=f"Imagen no encontrada: {ruta_imagen}",
            )

        imagen = Image.open(ruta_imagen).convert("RGB")
        tamano_imagen = imagen.size

        if tamano_imagen[0] < 64 or tamano_imagen[1] < 64:
            return ResultadoParsingRopa(
                parsing_ok=False,
                tamano_imagen=tamano_imagen,
                etiquetas_detectadas=[],
                componentes={},
                motivo_error="Imagen demasiado pequeña para el parsing",
            )

        procesador, modelo, dispositivo = obtener_modelo_segmentacion_ropa()
        entradas = procesador(images=imagen, return_tensors="pt").to(dispositivo)

        with torch.no_grad():
            logits = modelo(**entradas).logits

        logits_reescalados = F.interpolate(
            logits,
            size=tamano_imagen[::-1],
            mode="bilinear",
            align_corners=False,
        )
        segmentacion = torch.argmax(logits_reescalados, dim=1).squeeze().cpu().numpy()
        etiquetas_ids = [int(valor) for valor in np.unique(segmentacion)]
        etiquetas_detectadas = [
            NOMBRES_ETIQUETA_SEGMENTACION.get(etiqueta_id, str(etiqueta_id))
            for etiqueta_id in etiquetas_ids
        ]

        componentes: dict[str, ComponenteSegmentado] = {}
        pixeles_totales = max(1, tamano_imagen[0] * tamano_imagen[1])

        for clave, definicion in DEFINICIONES_COMPONENTES.items():
            mascara = np.isin(segmentacion, list(definicion["etiquetas"]))
            pixeles_componente = int(np.sum(mascara))
            if pixeles_componente < definicion["min_pixeles"]:
                continue

            bbox = _calcular_bbox_mascara(mascara, tamano_imagen)
            if not bbox:
                continue

            componentes[clave] = ComponenteSegmentado(
                clave=clave,
                bbox=bbox,
                pixeles=pixeles_componente,
                proporcion=round(pixeles_componente / pixeles_totales, 6),
                etiquetas_ids=tuple(sorted(definicion["etiquetas"])),
                etiquetas_nombres=tuple(definicion["nombres"]),
                recorte=imagen.crop(bbox),
            )

        return ResultadoParsingRopa(
            parsing_ok=True,
            tamano_imagen=tamano_imagen,
            etiquetas_detectadas=etiquetas_detectadas,
            componentes=componentes,
        )
    except Exception as error:
        logger.exception("Error ejecutando el parsing de ropa")
        return ResultadoParsingRopa(
            parsing_ok=False,
            tamano_imagen=None,
            etiquetas_detectadas=[],
            componentes={},
            motivo_error=str(error),
        )
