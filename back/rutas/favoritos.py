"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Router del armario digital. Aquí se exponen los endpoints
  necesarios para crear, listar y eliminar las prendas
  favoritas asociadas a cada usuario autenticado.
-----------------------------------------------------------
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..base_datos import get_db
from ..esquemas import FavoritoConPrenda, FavoritoCreate, FavoritoPublic, Prenda as PrendaSchema
from ..modelos import Prenda, PrendaFavorita, Usuario
from ..seguridad import get_current_user

router = APIRouter(prefix="/favoritos", tags=["favoritos"])


def serializar_favorito(
    favorito: PrendaFavorita,
    prenda: Prenda,
) -> FavoritoConPrenda:
    """Prepara una respuesta útil para el frontend con el favorito y su prenda."""
    return FavoritoConPrenda(
        favorito=FavoritoPublic.model_validate(favorito),
        prenda=PrendaSchema.model_validate(prenda),
    )


def obtener_prenda_o_404(prenda_id: int, db: Session) -> Prenda:
    """Comprueba que la prenda exista antes de crear o devolver favoritos."""
    prenda = db.query(Prenda).filter(Prenda.id == prenda_id).first()
    if not prenda:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prenda con id {prenda_id} no encontrada",
        )
    return prenda


@router.post("", response_model=FavoritoConPrenda)
def crear_favorito(
    datos_favorito: FavoritoCreate,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Guarda una prenda en el armario digital del usuario autenticado."""
    prenda = obtener_prenda_o_404(datos_favorito.prenda_id, db)

    favorito_existente = (
        db.query(PrendaFavorita)
        .filter(
            PrendaFavorita.usuario_id == usuario_actual.id,
            PrendaFavorita.prenda_id == datos_favorito.prenda_id,
        )
        .first()
    )
    if favorito_existente:
        return serializar_favorito(favorito_existente, prenda)

    favorito = PrendaFavorita(
        usuario_id=usuario_actual.id,
        prenda_id=datos_favorito.prenda_id,
    )
    db.add(favorito)
    db.commit()
    db.refresh(favorito)

    return serializar_favorito(favorito, prenda)


@router.get("", response_model=list[FavoritoConPrenda])
def listar_favoritos(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Devuelve las prendas favoritas del usuario con paginación simple."""
    filas = (
        db.query(PrendaFavorita, Prenda)
        .join(Prenda, PrendaFavorita.prenda_id == Prenda.id)
        .filter(PrendaFavorita.usuario_id == usuario_actual.id)
        .order_by(PrendaFavorita.creado_en.desc(), PrendaFavorita.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return [
        serializar_favorito(favorito, prenda)
        for favorito, prenda in filas
    ]


@router.get("/ids", response_model=list[int])
def listar_ids_favoritos(
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Devuelve solo los ids de prenda para marcar favoritos en la interfaz."""
    favoritos = (
        db.query(PrendaFavorita.prenda_id)
        .filter(PrendaFavorita.usuario_id == usuario_actual.id)
        .all()
    )
    return [prenda_id for (prenda_id,) in favoritos]


@router.delete("/{prenda_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_favorito(
    prenda_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Elimina una prenda del armario digital usando su id de catálogo."""
    obtener_prenda_o_404(prenda_id, db)

    favorito = (
        db.query(PrendaFavorita)
        .filter(
            PrendaFavorita.usuario_id == usuario_actual.id,
            PrendaFavorita.prenda_id == prenda_id,
        )
        .first()
    )
    if not favorito:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La prenda no está guardada en favoritos",
        )

    db.delete(favorito)
    db.commit()
    return None
