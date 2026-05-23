"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Router de conjuntos guardados. Permite almacenar, consultar
  y eliminar looks personalizados creados por cada usuario.
-----------------------------------------------------------
"""

from collections import defaultdict

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..base_datos import get_db
from ..esquemas import (
    ConjuntoCrear,
    OutfitDetallado,
    OutfitItemConPrenda,
    OutfitItemPublic,
    OutfitPublic,
    Prenda as PrendaSchema,
)
from ..modelos import Outfit, OutfitItem, Prenda, Usuario
from ..seguridad import get_current_user

router = APIRouter(prefix="/outfits", tags=["outfits"])

ORDEN_ROLES_OUTFIT = {
    "vestido": 0,
    "parte_arriba": 1,
    "parte_abajo": 2,
    "calzado": 3,
}


def serializar_item_outfit(item: OutfitItem, prenda: Prenda) -> OutfitItemConPrenda:
    """Combina el item del outfit con la ficha pública de la prenda."""
    return OutfitItemConPrenda(
        item=OutfitItemPublic.model_validate(item),
        prenda=PrendaSchema.model_validate(prenda),
    )


def serializar_outfit(
    outfit: Outfit,
    items_con_prenda: list[tuple[OutfitItem, Prenda]],
) -> OutfitDetallado:
    """Construye la respuesta completa de un look guardado."""
    items_ordenados = sorted(
        items_con_prenda,
        key=lambda fila: (ORDEN_ROLES_OUTFIT.get(fila[0].rol, 99), fila[0].id),
    )
    return OutfitDetallado(
        outfit=OutfitPublic.model_validate(outfit),
        items=[serializar_item_outfit(item, prenda) for item, prenda in items_ordenados],
    )


def obtener_outfit_usuario_o_404(
    outfit_id: int,
    usuario_actual: Usuario,
    db: Session,
) -> Outfit:
    """Comprueba que el look exista y pertenezca al usuario autenticado."""
    outfit = (
        db.query(Outfit)
        .filter(Outfit.id == outfit_id, Outfit.usuario_id == usuario_actual.id)
        .first()
    )
    if not outfit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Look no encontrado",
        )
    return outfit


def obtener_items_outfit(outfit_id: int, db: Session) -> list[tuple[OutfitItem, Prenda]]:
    """Recupera todas las prendas asociadas a un look guardado."""
    return (
        db.query(OutfitItem, Prenda)
        .join(Prenda, OutfitItem.prenda_id == Prenda.id)
        .filter(OutfitItem.outfit_id == outfit_id)
        .all()
    )


def validar_prendas_outfit(datos_outfit: ConjuntoCrear, db: Session) -> None:
    """Verifica que todas las prendas del look existan antes de guardarlo."""
    ids_prenda = [item.prenda_id for item in datos_outfit.items]
    prendas_existentes = (
        db.query(Prenda.id)
        .filter(Prenda.id.in_(ids_prenda))
        .all()
    )
    ids_existentes = {prenda_id for (prenda_id,) in prendas_existentes}
    ids_faltantes = [str(prenda_id) for prenda_id in ids_prenda if prenda_id not in ids_existentes]

    if ids_faltantes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontraron las prendas: {', '.join(ids_faltantes)}",
        )


@router.post("", response_model=OutfitDetallado, status_code=status.HTTP_201_CREATED)
def crear_outfit_guardado(
    datos_outfit: ConjuntoCrear,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Guarda un look del usuario con las prendas seleccionadas."""
    validar_prendas_outfit(datos_outfit, db)

    outfit = Outfit(
        usuario_id=usuario_actual.id,
        titulo=datos_outfit.titulo.strip() if datos_outfit.titulo else None,
        imagen_referencia=datos_outfit.imagen_referencia,
    )
    db.add(outfit)
    db.flush()

    for item in datos_outfit.items:
        db.add(
            OutfitItem(
                outfit_id=outfit.id,
                prenda_id=item.prenda_id,
                rol=item.rol,
            )
        )

    db.commit()
    db.refresh(outfit)

    return serializar_outfit(outfit, obtener_items_outfit(outfit.id, db))


@router.get("", response_model=list[OutfitDetallado])
def listar_outfits(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Lista los looks guardados por el usuario con paginación simple."""
    outfits = (
        db.query(Outfit)
        .filter(Outfit.usuario_id == usuario_actual.id)
        .order_by(Outfit.creado_en.desc(), Outfit.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    if not outfits:
        return []

    ids_outfit = [outfit.id for outfit in outfits]
    filas_items = (
        db.query(OutfitItem, Prenda)
        .join(Prenda, OutfitItem.prenda_id == Prenda.id)
        .filter(OutfitItem.outfit_id.in_(ids_outfit))
        .all()
    )

    items_por_outfit: dict[int, list[tuple[OutfitItem, Prenda]]] = defaultdict(list)
    for item, prenda in filas_items:
        items_por_outfit[item.outfit_id].append((item, prenda))

    return [
        serializar_outfit(outfit, items_por_outfit.get(outfit.id, []))
        for outfit in outfits
    ]


@router.get("/{outfit_id}", response_model=OutfitDetallado)
def obtener_outfit(
    outfit_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Devuelve el detalle completo de un look guardado."""
    outfit = obtener_outfit_usuario_o_404(outfit_id, usuario_actual, db)
    return serializar_outfit(outfit, obtener_items_outfit(outfit.id, db))


@router.delete("/{outfit_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_outfit(
    outfit_id: int,
    db: Session = Depends(get_db),
    usuario_actual: Usuario = Depends(get_current_user),
):
    """Elimina un look guardado junto con sus prendas asociadas."""
    outfit = obtener_outfit_usuario_o_404(outfit_id, usuario_actual, db)

    db.query(OutfitItem).filter(OutfitItem.outfit_id == outfit.id).delete(
        synchronize_session=False
    )
    db.delete(outfit)
    db.commit()
    return None
