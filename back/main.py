"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Punto de entrada del backend FastAPI. Aquí se configura la
  aplicación principal, CORS, los recursos estáticos y el
  registro de routers que exponen la API del proyecto.
-----------------------------------------------------------
"""

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(title="Sistema de Recomendación de Moda")

ORIGENES_DESARROLLO = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]

ORIGENES_PERMITIDOS = [
    origen.strip()
    for origen in os.getenv("CORS_ORIGINS", ",".join(ORIGENES_DESARROLLO)).split(",")
    if origen.strip()
]

# Durante desarrollo permitimos que el frontend local consuma la API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGENES_PERMITIDOS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exponemos las imágenes del catálogo como archivos estáticos.
RUTA_IMAGENES = Path(os.getenv("IMAGE_STATIC_DIR", "datos/imagenes"))
if RUTA_IMAGENES.exists():
    app.mount(
        "/imagenes",
        StaticFiles(directory=RUTA_IMAGENES),
        name="imagenes",
    )


@app.get("/salud")
def salud():
    return {"estado": "ok"}


from .rutas.auth import router as rutas_auth
from .rutas.favoritos import router as rutas_favoritos
from .rutas.outfits import router as rutas_outfits
from .rutas.prendas import router as rutas_prendas
from .rutas.recomendacion import router as rutas_recomendacion

app.include_router(rutas_prendas, tags=["prendas"])
app.include_router(rutas_recomendacion, prefix="/recomendacion", tags=["recomendacion"])
app.include_router(rutas_auth, tags=["auth"])
app.include_router(rutas_favoritos, tags=["favoritos"])
app.include_router(rutas_outfits, tags=["outfits"])
