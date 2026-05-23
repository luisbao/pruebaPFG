#!/bin/sh
# -----------------------------------------------------------
# Proyecto: Proyecto de Fin de Grado
# Autor: Luis Bao Bello
#
# Descripción:
#   Script de arranque del contenedor del backend. Prepara la
#   carpeta local de datos, copia una base SQLite semilla si se
#   ha incorporado al contenedor y lanza Uvicorn sobre FastAPI.
# -----------------------------------------------------------

set -eu

mkdir -p /app/datos

if [ ! -f /app/datos/prendas.db ] && [ -f /app/semilla/prendas.db ]; then
  cp /app/semilla/prendas.db /app/datos/prendas.db
fi

exec uvicorn back.main:app --host 0.0.0.0 --port "${PORT:-8000}"
