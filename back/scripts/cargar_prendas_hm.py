"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Script de carga inicial del catálogo H&M. Lee los archivos de
  origen, normaliza campos clave y vuelca las prendas válidas en
  la base de datos del proyecto.
-----------------------------------------------------------
"""

import csv
from pathlib import Path

from sqlalchemy.orm import sessionmaker

from back.base_datos import engine
from back.modelos import Base, Prenda
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


def main():
    csv_path = Path("datos/articles.csv")
    images_dir = Path("datos/imagenes")

    if not csv_path.exists():
        print("Error: no se encuentra datos/articles.csv")
        return
    if not images_dir.is_dir():
        print("Error: no se encuentra el directorio datos/imagenes/")
        return

    Base.metadata.create_all(bind=engine)

    session = SessionLocal()
    tamano_lote = 500
    contador = 0

    try:
        with csv_path.open("r", encoding="utf-8") as archivo_csv:
            lector = csv.DictReader(archivo_csv)
            for fila in lector:
                grupo_indice = fila.get("index_group_name", "")
                if grupo_indice not in ["Ladieswear", "Menswear"]:
                    continue

                codigo_articulo = normalizar_codigo_articulo(fila.get("article_id", ""))
                if not codigo_articulo:
                    continue

                carpeta = codigo_articulo[:3]
                url_imagen = f"datos/imagenes/{carpeta}/{codigo_articulo}.jpg"
                ruta_imagen = Path(url_imagen)

                if not ruta_imagen.exists():
                    continue

                # Evita insertar de nuevo prendas ya cargadas.
                existe_prenda = (
                    session.query(Prenda)
                    .filter(Prenda.codigo_articulo == codigo_articulo)
                    .first()
                )
                if existe_prenda:
                    continue

                nombre = fila.get("prod_name", "")[:255]
                descripcion_detallada = fila.get("detail_desc", "")
                descripcion = (
                    descripcion_detallada[:500]
                    if descripcion_detallada
                    else nombre[:500]
                )
                categoria = fila.get("product_type_name", "").strip()
                if not categoria or categoria.lower() == "unknown":
                    continue

                color = resolver_color_prenda(
                    fila.get("perceived_colour_master_name", ""),
                    fila.get("colour_group_name", ""),
                )

                nueva_prenda = Prenda(
                    codigo_articulo=codigo_articulo,
                    nombre=nombre,
                    descripcion=descripcion,
                    categoria=categoria,
                    color=color,
                    genero="Women" if grupo_indice == "Ladieswear" else "Men",
                    url_imagen=url_imagen,
                )

                session.add(nueva_prenda)
                contador += 1

                if contador % tamano_lote == 0:
                    session.commit()
                    print(f"{contador} prendas cargadas...")
        session.commit()
    except Exception as error:
        session.rollback()
        print(f"Error durante la carga: {error}")
    finally:
        session.close()
        print(f"Total prendas cargadas: {contador}")


if __name__ == "__main__":
    main()
