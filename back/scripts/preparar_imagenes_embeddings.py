"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Script de preparación de imágenes para despliegue. Genera una
  carpeta con las imágenes asociadas a prendas que tienen embedding
  calculado, conservando la estructura de rutas del catálogo.
-----------------------------------------------------------
"""

import os
import shutil
import sqlite3
from pathlib import Path


RUTA_DB = Path("datos/prendas.db")
RUTA_IMAGENES = Path("datos/imagenes")
RUTA_DESTINO = Path("datos/imagenes_embeddings")


def main() -> None:
    shutil.rmtree(RUTA_DESTINO, ignore_errors=True)
    RUTA_DESTINO.mkdir(parents=True, exist_ok=True)

    with sqlite3.connect(RUTA_DB) as conexion:
        rutas = {
            fila[0].replace("datos/imagenes/", "")
            for fila in conexion.execute(
                """
                SELECT DISTINCT p.url_imagen
                FROM prendas p
                JOIN embeddings_prenda e ON e.prenda_id = p.id
                WHERE p.url_imagen IS NOT NULL
                """
            )
        }

    faltantes: list[str] = []
    creadas = 0
    for ruta_relativa in sorted(rutas):
        origen = RUTA_IMAGENES / ruta_relativa
        destino = RUTA_DESTINO / ruta_relativa
        destino.parent.mkdir(parents=True, exist_ok=True)

        if not origen.exists():
            faltantes.append(ruta_relativa)
            continue

        try:
            os.link(origen, destino)
        except OSError:
            shutil.copy2(origen, destino)
        creadas += 1

    print(
        f"rutas_unicas={len(rutas)} "
        f"enlaces_creados={creadas} "
        f"faltantes={len(faltantes)}"
    )


if __name__ == "__main__":
    main()
