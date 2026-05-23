"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Configuración de acceso a la base de datos del backend.
  Define el motor de SQLAlchemy, la sesión de trabajo y el
  registro de modelos necesario para crear las tablas.
-----------------------------------------------------------
"""

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./datos/prendas.db")

if SQLALCHEMY_DATABASE_URL.startswith("sqlite:///"):
    ruta_sqlite = SQLALCHEMY_DATABASE_URL.replace("sqlite:///", "", 1)
    Path(ruta_sqlite).parent.mkdir(parents=True, exist_ok=True)

# SQLite necesita esta opción para compartir la conexión entre peticiones de FastAPI.
connect_args = (
    {"check_same_thread": False}
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite")
    else {}
)
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Importar los modelos aquí fuerza su registro antes de crear las tablas.
from .modelos import (  # noqa: E402
    EmbeddingPrenda,
    Outfit,
    OutfitItem,
    Prenda,
    PrendaFavorita,
    Usuario,
)

Base.metadata.create_all(bind=engine)


def get_db():
    """Abre una sesión de base de datos para la petición actual."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
