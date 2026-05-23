"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Router del catálogo de prendas. Ofrece endpoints para listar
  prendas con filtros, consultar el detalle de una prenda y
  obtener las opciones de filtrado disponibles.
-----------------------------------------------------------
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..base_datos import get_db
from ..esquemas import OpcionesFiltros, Prenda as PrendaSchema
from ..modelos import Prenda
from ..utilidades_catalogo import obtener_condiciones_prenda_visible

router = APIRouter(
    prefix="/prendas",
    tags=["prendas"],
)


@router.get(
    "",
    response_model=list[PrendaSchema],
    summary="Listar prendas con filtros opcionales",
    description="Devuelve una lista de prendas y permite filtrar por género, categoría y color.",
)
def listar_prendas(
    limite: int = Query(50, ge=1, le=100),
    salto: int = Query(0, ge=0),
    genero: str | None = Query(None),
    categoria: str | None = Query(None),
    color: str | None = Query(None),
    db: Session = Depends(get_db),
):
    consulta = db.query(Prenda).filter(*obtener_condiciones_prenda_visible())

    if genero:
        consulta = consulta.filter(Prenda.genero == genero)
    if categoria:
        consulta = consulta.filter(Prenda.categoria == categoria)
    if color:
        consulta = consulta.filter(Prenda.color == color)

    return consulta.offset(salto).limit(limite).all()


@router.get("/opciones-filtros", response_model=OpcionesFiltros)
def obtener_opciones_filtros(
    genero: str | None = Query(None),
    db: Session = Depends(get_db),
) -> OpcionesFiltros:
    """Devuelve los valores únicos que alimentan los filtros del frontend."""
    generos = (
        db.query(Prenda.genero)
        .filter(Prenda.genero.isnot(None))
        .distinct()
        .order_by(Prenda.genero.asc())
        .all()
    )

    categorias = (
        db.query(Prenda.categoria)
        .filter(*obtener_condiciones_prenda_visible())
        .filter(Prenda.genero == genero if genero else True)
        .distinct()
        .order_by(Prenda.categoria.asc())
        .all()
    )
    colores = (
        db.query(Prenda.color)
        .filter(*obtener_condiciones_prenda_visible())
        .filter(Prenda.genero == genero if genero else True)
        .distinct()
        .order_by(Prenda.color.asc())
        .all()
    )

    return OpcionesFiltros(
        generos=[genero[0] for genero in generos],
        categorias=[categoria[0] for categoria in categorias],
        colores=[color[0] for color in colores],
    )


@router.get("/{prenda_id}", response_model=PrendaSchema)
def obtener_prenda(
    prenda_id: int,
    db: Session = Depends(get_db),
):
    """Recupera una prenda concreta por su identificador interno."""
    prenda = db.query(Prenda).filter(Prenda.id == prenda_id).first()
    if not prenda:
        raise HTTPException(
            status_code=404,
            detail=f"Prenda con id {prenda_id} no encontrada",
        )
    return prenda
