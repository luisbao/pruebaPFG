"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Router de recomendación visual. Reúne los endpoints que
  permiten recomendar prendas por imagen, por prenda o generar
  conjuntos a partir de una imagen de referencia.
-----------------------------------------------------------
"""

import logging
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from ..base_datos import get_db
from ..esquemas import (
    OutfitRespuesta,
    PrendaConSimilitud,
)
from ..servicios.recomendacion_visual import (
    crear_outfit_por_imagen,
    recomendar_prendas_por_id,
    recomendar_prendas_por_imagen,
)

logger = logging.getLogger(__name__)
router = APIRouter(tags=["recomendacion"])


def validar_archivo_imagen(archivo_imagen: UploadFile) -> None:
    """Comprueba que el archivo subido sea una imagen."""
    if not archivo_imagen.content_type or not archivo_imagen.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo debe ser una imagen")


async def guardar_archivo_temporal(
    archivo_imagen: UploadFile,
    nombre_por_defecto: str,
) -> Path:
    """Guarda la imagen subida en un archivo temporal para procesarla con PIL."""
    extension = Path(archivo_imagen.filename or nombre_por_defecto).suffix or ".jpg"

    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as temporal:
        contenido = await archivo_imagen.read()
        temporal.write(contenido)
        return Path(temporal.name)


def serializar_recomendaciones(
    recomendaciones: list[tuple[object, float]],
) -> list[PrendaConSimilitud]:
    """Convierte el resultado del servicio en la respuesta pública de la API."""
    return [
        PrendaConSimilitud(prenda=prenda, similitud=similitud)
        for prenda, similitud in recomendaciones
    ]


@router.post("/por-prenda/{prenda_id}", response_model=list[PrendaConSimilitud])
def recomendar_por_prenda(
    prenda_id: int,
    limite: int = 20,
    db: Session = Depends(get_db),
):
    """Devuelve prendas similares a una prenda ya existente en el catálogo."""
    recomendaciones = recomendar_prendas_por_id(
        prenda_id=prenda_id,
        limite=limite,
        session=db,
    )
    return serializar_recomendaciones(recomendaciones)


@router.post("/por-imagen", response_model=list[PrendaConSimilitud])
async def recomendar_por_imagen(
    archivo_imagen: UploadFile = File(...),
    limite: int = 20,
    db: Session = Depends(get_db),
):
    """Calcula el embedding de la imagen subida y devuelve las prendas más parecidas."""
    validar_archivo_imagen(archivo_imagen)
    ruta_temporal = await guardar_archivo_temporal(archivo_imagen, "imagen.jpg")

    try:
        recomendaciones = recomendar_prendas_por_imagen(
            ruta_imagen=ruta_temporal,
            limite=limite,
            session=db,
        )
    finally:
        try:
            ruta_temporal.unlink()
        except FileNotFoundError:
            pass

    return serializar_recomendaciones(recomendaciones)


@router.post("/crear-outfit", response_model=OutfitRespuesta)
async def crear_outfit(
    archivo_imagen: UploadFile = File(...),
    limite_por_tipo: int = 3,
    genero: str | None = Query(
        None,
        description="Género deseado: Men/Women o equivalente en español",
    ),
    tipo_outfit: str = Query(
        "por_partes",
        description="Tipo de outfit: por_partes o prenda_completa",
    ),
    categoria_parte_arriba: str | None = Query(
        None,
        description="Categoría preferida para la parte superior del outfit",
    ),
    categoria_parte_abajo: str | None = Query(
        None,
        description="Categoría preferida para la parte inferior del outfit",
    ),
    categoria_calzado: str | None = Query(
        None,
        description="Categoría preferida para el calzado del outfit",
    ),
    categoria_prenda_completa: str | None = Query(
        None,
        description="Categoría preferida para prenda completa: Dress o Jumpsuit/Playsuit",
    ),
    db: Session = Depends(get_db),
):
    """Genera un outfit sugerido a partir de una imagen de referencia."""
    validar_archivo_imagen(archivo_imagen)
    ruta_temporal = await guardar_archivo_temporal(archivo_imagen, "outfit.jpg")

    try:
        outfit = crear_outfit_por_imagen(
            ruta_imagen=ruta_temporal,
            limite_por_tipo=limite_por_tipo,
            genero=genero,
            tipo_outfit=tipo_outfit,
            categoria_parte_arriba=categoria_parte_arriba,
            categoria_parte_abajo=categoria_parte_abajo,
            categoria_calzado=categoria_calzado,
            categoria_prenda_completa=categoria_prenda_completa,
            session=db,
        )
    except Exception:
        logger.exception("Error al generar el outfit desde la imagen")
        raise HTTPException(
            status_code=500,
            detail="Error procesando la imagen",
        )
    finally:
        try:
            ruta_temporal.unlink()
        except FileNotFoundError:
            logger.warning("No se encontró el archivo temporal a eliminar")

    return OutfitRespuesta(
        modo=outfit.get("modo", "por_partes"),
        parte_arriba=serializar_recomendaciones(outfit.get("parte_arriba", [])),
        parte_abajo=serializar_recomendaciones(outfit.get("parte_abajo", [])),
        calzado=serializar_recomendaciones(outfit.get("calzado", [])),
        prenda_completa=serializar_recomendaciones(outfit.get("prenda_completa", [])),
    )
