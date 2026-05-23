"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Servicio principal de recomendación visual del backend. Se
  encarga de cargar CLIP, calcular embeddings, comparar prendas
  y construir resultados tanto simples como por conjuntos.
-----------------------------------------------------------
"""

import json
import logging
from functools import lru_cache
from pathlib import Path

import numpy as np
import torch
from PIL import Image
from sqlalchemy.orm import Session
from transformers import CLIPModel, CLIPProcessor

from ..modelos import EmbeddingPrenda, Prenda
from ..utilidades_catalogo import obtener_condiciones_prenda_visible
from .parsing_ropa import ComponenteSegmentado, parsear_ropa_en_imagen

logger = logging.getLogger(__name__)

CATEGORIAS_OUTFIT = {
    "vestido": ["Dress", "Jumpsuit/Playsuit"],
    "parte_arriba": [
        "T-shirt",
        "Top",
        "Blouse",
        "Shirt",
        "Polo shirt",
        "Hoodie",
        "Sweater",
        "Cardigan",
        "Jacket",
        "Coat",
        "Blazer",
        "Vest top",
        "Bodysuit",
        "Outdoor Waistcoat",
        "Tailored Waistcoat",
    ],
    "parte_abajo": [
        "Trousers",
        "Skirt",
        "Shorts",
        "Leggings/Tights",
        "Dungarees",
        "Outdoor trousers",
    ],
    "calzado": [
        "Sneakers",
        "Boots",
        "Bootie",
        "Ballerinas",
        "Heels",
        "Heeled sandals",
        "Sandals",
        "Wedge",
        "Slippers",
        "Pumps",
        "Flat shoe",
        "Flat shoes",
        "Flip flop",
        "Other shoe",
    ],
}

def normalizar_genero(genero: str | None) -> str | None:
    """Acepta varias formas de entrada y las adapta al formato del catálogo."""
    if genero is None:
        return None

    genero_normalizado = genero.lower()
    if genero_normalizado in ["men", "hombre", "man", "m"]:
        return "Men"
    if genero_normalizado in ["women", "mujer", "woman", "w", "female", "f"]:
        return "Women"
    return None


def normalizar_tipo_outfit(tipo_outfit: str | None) -> str:
    """Adapta el modo elegido en el frontend a los valores internos aceptados."""
    if not tipo_outfit:
        return "por_partes"

    tipo_normalizado = tipo_outfit.lower()
    if tipo_normalizado in ["prenda_completa", "vestido", "mono", "completo"]:
        return "prenda_completa"
    return "por_partes"


def _obtener_candidatos_filtrados(
    tipo: str,
    session: Session,
    genero_filtrado: str | None,
    categoria_preferida: str | None = None,
):
    """Recupera prendas candidatas para una parte concreta del outfit."""
    categorias = CATEGORIAS_OUTFIT.get(tipo, [])
    categorias_consulta = categorias
    if categoria_preferida in categorias:
        categorias_consulta = [categoria_preferida]

    consulta = (
        session.query(EmbeddingPrenda, Prenda)
        .join(Prenda, EmbeddingPrenda.prenda_id == Prenda.id)
        .filter(*obtener_condiciones_prenda_visible())
        .filter(Prenda.categoria.in_(categorias_consulta))
    )

    if genero_filtrado:
        consulta = consulta.filter(Prenda.genero == genero_filtrado)

    filas = consulta.all()
    if filas or categorias_consulta == categorias:
        return filas

    logger.info(
        "Sin candidatos para %s con categoría %s. Se relaja a la familia funcional.",
        tipo,
        categoria_preferida,
    )
    consulta_relajada = (
        session.query(EmbeddingPrenda, Prenda)
        .join(Prenda, EmbeddingPrenda.prenda_id == Prenda.id)
        .filter(*obtener_condiciones_prenda_visible())
        .filter(Prenda.categoria.in_(categorias))
    )
    if genero_filtrado:
        consulta_relajada = consulta_relajada.filter(Prenda.genero == genero_filtrado)

    return consulta_relajada.all()


@lru_cache(maxsize=1)
def obtener_modelo_y_procesador_clip():
    """Carga CLIP una sola vez y lo reutiliza en memoria."""
    dispositivo = "cuda" if torch.cuda.is_available() else "cpu"
    modelo = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(dispositivo)
    procesador = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
    return modelo, procesador, dispositivo


def segmentar_prendas_en_imagen(ruta_imagen: Path) -> dict[str, Image.Image]:
    """Obtiene recortes válidos de parte superior, inferior y calzado si existen."""
    resultado_parsing = parsear_ropa_en_imagen(ruta_imagen)
    if not resultado_parsing.parsing_ok:
        logger.warning(
            "El parsing de ropa no pudo completarse: %s",
            resultado_parsing.motivo_error,
        )
        return {}

    recortes: dict[str, Image.Image] = {}
    if "upper_clothes" in resultado_parsing.componentes:
        recortes["parte_arriba"] = resultado_parsing.componentes["upper_clothes"].recorte
    elif "dress" in resultado_parsing.componentes:
        # Un vestido puede servir como referencia completa o como señal principal del torso.
        recortes["parte_arriba"] = resultado_parsing.componentes["dress"].recorte
        recortes["prenda_completa"] = resultado_parsing.componentes["dress"].recorte

    if "dress" in resultado_parsing.componentes:
        recortes["prenda_completa"] = resultado_parsing.componentes["dress"].recorte

    componente_inferior = _seleccionar_componente_inferior(resultado_parsing.componentes)
    if componente_inferior:
        recortes["parte_abajo"] = componente_inferior.recorte

    if "shoes" in resultado_parsing.componentes:
        recortes["calzado"] = resultado_parsing.componentes["shoes"].recorte

    return recortes


def _seleccionar_componente_inferior(
    componentes: dict[str, ComponenteSegmentado],
) -> ComponenteSegmentado | None:
    """Elige la mejor señal de parte inferior entre falda y pantalón."""
    candidatas = [
        componente
        for clave, componente in componentes.items()
        if clave in {"pants", "skirt"}
    ]
    if not candidatas:
        return None
    return max(candidatas, key=lambda componente: componente.pixeles)


def obtener_vector_desde_pil(imagen: Image.Image) -> list[float]:
    """Calcula el embedding CLIP normalizado a partir de una imagen en memoria."""
    modelo, procesador, dispositivo = obtener_modelo_y_procesador_clip()
    entradas = procesador(images=imagen, return_tensors="pt").to(dispositivo)

    with torch.no_grad():
        caracteristicas = modelo.get_image_features(**entradas)
        vector = caracteristicas[0]
        vector_normalizado = vector / vector.norm(p=2)

    return vector_normalizado.cpu().tolist()


def obtener_vector_desde_imagen(ruta_imagen: Path) -> list[float]:
    """Abre una imagen desde disco y devuelve su embedding CLIP normalizado."""
    if not ruta_imagen.exists():
        raise FileNotFoundError(f"Imagen no encontrada en ruta: {ruta_imagen}")

    modelo, procesador, dispositivo = obtener_modelo_y_procesador_clip()
    imagen = Image.open(ruta_imagen).convert("RGB")
    entradas = procesador(images=imagen, return_tensors="pt").to(dispositivo)

    with torch.no_grad():
        caracteristicas = modelo.get_image_features(**entradas)
        vector = caracteristicas[0]
        vector_normalizado = vector / vector.norm(p=2)

    return vector_normalizado.cpu().tolist()


def recomendar_prendas_por_vector(
    session: Session,
    vector_consulta: list[float],
    limite: int = 20,
    genero: str | None = None,
    categoria: str | None = None,
    color: str | None = None,
) -> list[tuple[Prenda, float]]:
    """Compara un embedding de consulta con el catálogo y ordena por similitud."""
    consulta = (
        session.query(EmbeddingPrenda, Prenda)
        .join(Prenda, EmbeddingPrenda.prenda_id == Prenda.id)
        .filter(*obtener_condiciones_prenda_visible())
    )
    if genero:
        consulta = consulta.filter(Prenda.genero == genero)
    if categoria:
        consulta = consulta.filter(Prenda.categoria == categoria)
    if color:
        consulta = consulta.filter(Prenda.color == color)

    filas = consulta.all()
    if not filas:
        return []

    vector_consulta_np = np.array(vector_consulta, dtype=float)
    recomendaciones: list[tuple[Prenda, float]] = []

    for embedding_objeto, prenda in filas:
        vector_bd = np.array(json.loads(embedding_objeto.vector), dtype=float)
        similitud = calcular_similitud_coseno(vector_consulta_np, vector_bd)
        recomendaciones.append((prenda, float(similitud)))

    recomendaciones.sort(key=lambda recomendacion: recomendacion[1], reverse=True)
    return recomendaciones[:limite]


def calcular_similitud_coseno(vec1: list[float], vec2: list[float]) -> float:
    """Calcula la similitud coseno entre dos vectores."""
    vector_1 = np.array(vec1, dtype=float)
    vector_2 = np.array(vec2, dtype=float)

    norma_1 = np.linalg.norm(vector_1)
    norma_2 = np.linalg.norm(vector_2)
    if norma_1 == 0 or norma_2 == 0:
        return 0.0

    producto_punto = np.dot(vector_1, vector_2)
    return float(producto_punto / (norma_1 * norma_2))


def recomendar_prendas_por_id(
    session: Session,
    prenda_id: int,
    limite: int = 20,
    genero: str | None = None,
    categoria: str | None = None,
    color: str | None = None,
) -> list[tuple[Prenda, float]]:
    """Busca prendas similares a una prenda del catálogo usando su embedding."""
    embedding_referencia = (
        session.query(EmbeddingPrenda)
        .filter(EmbeddingPrenda.prenda_id == prenda_id)
        .first()
    )
    if not embedding_referencia:
        return []

    try:
        vector_referencia = json.loads(embedding_referencia.vector)
    except (json.JSONDecodeError, TypeError):
        return []

    consulta = (
        session.query(EmbeddingPrenda, Prenda)
        .join(Prenda, EmbeddingPrenda.prenda_id == Prenda.id)
        .filter(*obtener_condiciones_prenda_visible())
        .filter(EmbeddingPrenda.prenda_id != prenda_id)
    )
    if genero:
        consulta = consulta.filter(Prenda.genero == genero)
    if categoria:
        consulta = consulta.filter(Prenda.categoria == categoria)
    if color:
        consulta = consulta.filter(Prenda.color == color)

    recomendaciones: list[tuple[Prenda, float]] = []
    for embedding_objeto, prenda in consulta.all():
        try:
            vector_candidato = json.loads(embedding_objeto.vector)
            similitud = calcular_similitud_coseno(vector_referencia, vector_candidato)
            recomendaciones.append((prenda, similitud))
        except (json.JSONDecodeError, TypeError, ValueError):
            continue

    recomendaciones.sort(key=lambda recomendacion: recomendacion[1], reverse=True)
    return recomendaciones[:limite]


def recomendar_prendas_por_imagen(
    ruta_imagen: Path,
    limite: int = 20,
    genero: str | None = None,
    categoria: str | None = None,
    color: str | None = None,
    session: Session | None = None,
) -> list[tuple[Prenda, float]]:
    """Genera el embedding de una imagen y busca prendas similares en el catálogo."""
    vector_consulta = obtener_vector_desde_imagen(ruta_imagen)
    return recomendar_prendas_por_vector(
        session=session,
        vector_consulta=vector_consulta,
        limite=limite,
        genero=genero,
        categoria=categoria,
        color=color,
    )


def crear_outfit_por_imagen(
    ruta_imagen: Path,
    limite_por_tipo: int,
    session: Session,
    genero: str | None = None,
    tipo_outfit: str | None = None,
    categoria_parte_arriba: str | None = None,
    categoria_parte_abajo: str | None = None,
    categoria_calzado: str | None = None,
    categoria_prenda_completa: str | None = None,
) -> dict[str, object]:
    """Propone un outfit completo usando segmentación y similitud visual."""
    genero_filtrado = normalizar_genero(genero)
    modo_outfit = normalizar_tipo_outfit(tipo_outfit)
    ruta = Path(ruta_imagen)

    # Intentamos segmentar la imagen para obtener embeddings más específicos.
    recortes = segmentar_prendas_en_imagen(ruta)

    embedding_global = obtener_vector_desde_imagen(ruta)
    if not embedding_global:
        return {
            "modo": modo_outfit,
            "parte_arriba": [],
            "parte_abajo": [],
            "calzado": [],
            "prenda_completa": [],
        }

    embedding_arriba = (
        obtener_vector_desde_pil(recortes["parte_arriba"])
        if "parte_arriba" in recortes
        else embedding_global
    )
    embedding_abajo = (
        obtener_vector_desde_pil(recortes["parte_abajo"])
        if "parte_abajo" in recortes
        else embedding_global
    )
    embedding_calzado = (
        obtener_vector_desde_pil(recortes["calzado"])
        if "calzado" in recortes
        else embedding_global
    )

    def calcular_recomendaciones(
        tipo: str,
        embedding: list[float],
        categoria_preferida: str | None = None,
    ) -> list[tuple[Prenda, float]]:
        """Ordena las candidatas de una familia funcional por similitud visual."""
        resultados_filtrados = _obtener_candidatos_filtrados(
            tipo,
            session,
            genero_filtrado,
            categoria_preferida,
        )

        candidatas_con_similitud: list[tuple[Prenda, float]] = []
        for embedding_objeto, prenda in resultados_filtrados:
            try:
                vector_candidato = np.array(json.loads(embedding_objeto.vector), dtype="float32")
                similitud = calcular_similitud_coseno(embedding, vector_candidato)
                candidatas_con_similitud.append((prenda, similitud))
            except Exception:
                continue

        candidatas_con_similitud.sort(
            key=lambda recomendacion: recomendacion[1],
            reverse=True,
        )
        return candidatas_con_similitud[:limite_por_tipo]

    if modo_outfit == "prenda_completa":
        embedding_prenda_completa = (
            obtener_vector_desde_pil(recortes["prenda_completa"])
            if "prenda_completa" in recortes
            else embedding_global
        )
        return {
            "modo": "prenda_completa",
            "parte_arriba": [],
            "parte_abajo": [],
            "prenda_completa": calcular_recomendaciones(
                "vestido",
                embedding_prenda_completa,
                categoria_prenda_completa,
            ),
            "calzado": calcular_recomendaciones(
                "calzado",
                embedding_calzado,
                categoria_calzado,
            ),
        }

    outfit: dict[str, object] = {
        "modo": "por_partes",
        "parte_arriba": [],
        "parte_abajo": [],
        "calzado": [],
        "prenda_completa": [],
    }

    tipos_y_embeddings = [
        ("parte_arriba", embedding_arriba),
        ("parte_abajo", embedding_abajo),
        ("calzado", embedding_calzado),
    ]
    categorias_preferidas = {
        "parte_arriba": categoria_parte_arriba,
        "parte_abajo": categoria_parte_abajo,
        "calzado": categoria_calzado,
    }

    for tipo, embedding in tipos_y_embeddings:
        outfit[tipo] = calcular_recomendaciones(
            tipo,
            embedding,
            categorias_preferidas.get(tipo),
        )

    return outfit
