"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Utilidades compartidas para resolver el color final de una
  prenda a partir de los campos de color del dataset de H&M.
  La lógica es conservadora: solo sustituye colores inválidos
  cuando el valor alternativo resulta suficientemente claro.
-----------------------------------------------------------
"""

INVALIDOS_COLOR = {"", "Unknown", "undefined"}

MAPA_GRUPO_A_COLOR = {
    "White": "White",
    "Off White": "White",
    "Black": "Black",
    "Grey": "Grey",
    "Light Grey": "Grey",
    "Dark Grey": "Grey",
    "Dark Blue": "Blue",
}


def resolver_color_prenda(
    color_percibido: str | None,
    grupo_color: str | None,
) -> str:
    """
    Devuelve el color final de catálogo.

    Reglas:
    - Si el color percibido es válido, se mantiene.
    - Si no lo es, se intenta usar el grupo de color solo cuando
      pertenece a un conjunto de equivalencias seguras.
    - Si tampoco hay alternativa fiable, se conserva "Unknown".
    """

    color_percibido_limpio = (color_percibido or "").strip()
    grupo_color_limpio = (grupo_color or "").strip()

    if color_percibido_limpio and color_percibido_limpio not in INVALIDOS_COLOR:
        return color_percibido_limpio

    if grupo_color_limpio in MAPA_GRUPO_A_COLOR:
        return MAPA_GRUPO_A_COLOR[grupo_color_limpio]

    return "Unknown"
