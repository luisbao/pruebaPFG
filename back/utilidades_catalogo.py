"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Reúne filtros reutilizables para limitar el catálogo visible
  a prendas con metadatos mínimos coherentes. Permite excluir
  registros residuales que no se quieren contemplar en la
  experiencia principal del sistema.
-----------------------------------------------------------
"""

from .modelos import Prenda


def obtener_condiciones_prenda_visible():
    """Devuelve las condiciones base para considerar una prenda visible."""
    return (
        Prenda.categoria.isnot(None),
        Prenda.categoria != "",
        Prenda.categoria != "Unknown",
        Prenda.color.isnot(None),
        Prenda.color != "",
        Prenda.color != "Unknown",
        Prenda.color != "undefined",
    )
