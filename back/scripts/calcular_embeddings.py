"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Script de precálculo de embeddings visuales para el catálogo.
  Recorre las imágenes de prendas, obtiene su vector CLIP y lo
  guarda en la base de datos para acelerar las recomendaciones.
-----------------------------------------------------------
"""

import json
from pathlib import Path

import torch
from PIL import Image

from back.base_datos import Base, SessionLocal, engine
from back.modelos import EmbeddingPrenda, Prenda
from back.servicios.recomendacion_visual import obtener_modelo_y_procesador_clip

# Si se indica un número, el script procesa únicamente esa cantidad de prendas.
MAX_PRENDAS_PROCESAR = None

# El commit por lotes evita acumular demasiados cambios pendientes en memoria.
TAMANO_LOTE = 100


def main():
    Base.metadata.create_all(bind=engine)
    modelo_clip, procesador_clip, dispositivo = obtener_modelo_y_procesador_clip()

    session = SessionLocal()
    try:
        # Se calculan embeddings únicamente para prendas que todavía no lo tienen.
        prendas_sin_embedding = (
            session.query(Prenda)
            .outerjoin(EmbeddingPrenda, Prenda.id == EmbeddingPrenda.prenda_id)
            .filter(EmbeddingPrenda.id.is_(None))
            .all()
        )

        if MAX_PRENDAS_PROCESAR:
            prendas_sin_embedding = prendas_sin_embedding[:MAX_PRENDAS_PROCESAR]

        total_prendas = len(prendas_sin_embedding)
        print(f"Procesando {total_prendas} prendas sin embedding...")

        if total_prendas == 0:
            print("No hay prendas sin embedding. Finalizando.")
            return

        contador = 0
        for prenda in prendas_sin_embedding:
            ruta_imagen = Path(prenda.url_imagen)
            if not ruta_imagen.exists():
                print(
                    f"Imagen no encontrada para la prenda {prenda.id}: {ruta_imagen}. Se omite."
                )
                continue

            try:
                with Image.open(ruta_imagen) as imagen_original:
                    imagen = imagen_original.convert("RGB")
                entradas = procesador_clip(images=imagen, return_tensors="pt").to(dispositivo)

                with torch.no_grad():
                    caracteristicas = modelo_clip.get_image_features(**entradas)
                    vector = caracteristicas[0]
                    vector_normalizado = vector / vector.norm(p=2)
            except Exception as error:
                print(f"Error procesando la prenda {prenda.id}: {error}")
                continue

            session.add(
                EmbeddingPrenda(
                    prenda_id=prenda.id,
                    vector=json.dumps(vector_normalizado.cpu().tolist()),
                )
            )
            contador += 1

            if contador % TAMANO_LOTE == 0:
                session.commit()
                print(f"{contador} embeddings calculados...")

        session.commit()
        print(f"Proceso completado. Total de embeddings nuevos: {contador}")
    except Exception as error:
        session.rollback()
        print(f"Error general durante el cálculo de embeddings: {error}")
    finally:
        session.close()


if __name__ == "__main__":
    main()
