"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Definición de los modelos ORM del backend. Estos modelos
  representan las tablas principales de la base de datos, como
  prendas, embeddings, usuarios, favoritos y conjuntos.
-----------------------------------------------------------
"""

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)

from .base_datos import Base


# Guarda la ficha principal de cada artículo del catálogo.
class Prenda(Base):
    __tablename__ = "prendas"

    id = Column(Integer, primary_key=True, index=True)
    codigo_articulo = Column(String, unique=True, index=True, nullable=True)
    nombre = Column(String, index=True)
    descripcion = Column(String)
    categoria = Column(String)
    color = Column(String)
    genero = Column(String)
    url_imagen = Column(String)


# Relaciona cada prenda con su embedding visual precalculado.
class EmbeddingPrenda(Base):
    __tablename__ = "embeddings_prenda"

    id = Column(Integer, primary_key=True, index=True)
    prenda_id = Column(Integer, ForeignKey("prendas.id"), nullable=False)
    vector = Column(Text, nullable=False)


# Almacena las cuentas de usuario usadas por la autenticación.
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    nombre_usuario = Column(String, unique=True, index=True, nullable=False)
    contrasena_hash = Column(String, nullable=False)
    activo = Column(Boolean, default=True)
    creado_en = Column(DateTime, server_default=func.now())


# Guarda las prendas que cada usuario quiere conservar en su armario digital.
class PrendaFavorita(Base):
    __tablename__ = "prendas_favoritas"
    __table_args__ = (
        UniqueConstraint("usuario_id", "prenda_id", name="uq_favorito_usuario_prenda"),
    )

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    prenda_id = Column(Integer, ForeignKey("prendas.id"), nullable=False, index=True)
    creado_en = Column(DateTime, server_default=func.now())


# Guarda looks completos creados o guardados por cada usuario.
class Outfit(Base):
    __tablename__ = "outfits"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    titulo = Column(String, nullable=True)
    imagen_referencia = Column(String, nullable=True)
    creado_en = Column(DateTime, server_default=func.now())


# Representa cada prenda que forma parte de un look guardado.
class OutfitItem(Base):
    __tablename__ = "outfit_items"
    __table_args__ = (
        UniqueConstraint("outfit_id", "rol", name="uq_outfit_item_rol"),
    )

    id = Column(Integer, primary_key=True, index=True)
    outfit_id = Column(Integer, ForeignKey("outfits.id"), nullable=False, index=True)
    prenda_id = Column(Integer, ForeignKey("prendas.id"), nullable=False, index=True)
    rol = Column(String, nullable=False)
