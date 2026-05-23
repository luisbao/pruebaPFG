"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Script de mantenimiento que recalcula el color de las prendas
  ya cargadas en la base de datos usando una regla conservadora.
  Corrige casos en los que el dataset traía "Unknown" o
  "undefined" aunque existía un color alternativo razonable.
-----------------------------------------------------------
"""

import csv
from pathlib import Path

from sqlalchemy.orm import sessionmaker

from back.base_datos import engine
from back.modelos import Prenda
from back.utilidades_color import resolver_color_prenda

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def normalizar_codigo_articulo(article_id: str) -> str | None:
    """Convierte el código original en el formato de 10 dígitos usado en H&M."""
    valor = article_id.strip()
    if not valor:
        return None

    if valor.replace(".", "").isdigit():
        return str(int(float(valor))).zfill(10)

    return valor.zfill(10)


def cargar_colores_normalizados() -> dict[str, str]:
    """Construye el color final esperado para cada artículo del CSV original."""
    csv_path = Path("datos/articles.csv")
    colores_por_articulo: dict[str, str] = {}

    with csv_path.open("r", encoding="utf-8") as archivo_csv:
        lector = csv.DictReader(archivo_csv)
        for fila in lector:
            if fila.get("index_group_name", "") not in ["Ladieswear", "Menswear"]:
                continue

            codigo_articulo = normalizar_codigo_articulo(fila.get("article_id", ""))
            if not codigo_articulo:
                continue

            colores_por_articulo[codigo_articulo] = resolver_color_prenda(
                fila.get("perceived_colour_master_name", ""),
                fila.get("colour_group_name", ""),
            )

    return colores_por_articulo


def main():
    colores_por_articulo = cargar_colores_normalizados()
    session = SessionLocal()
    actualizadas = 0

    try:
        prendas = session.query(Prenda).all()

        for prenda in prendas:
            color_normalizado = colores_por_articulo.get(prenda.codigo_articulo)
            if not color_normalizado or prenda.color == color_normalizado:
                continue

            prenda.color = color_normalizado
            actualizadas += 1

        session.commit()
        print(f"Prendas actualizadas: {actualizadas}")
    except Exception as error:
        session.rollback()
        print(f"Error al normalizar colores: {error}")
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main()
