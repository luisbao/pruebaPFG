# -----------------------------------------------------------
# Proyecto: Proyecto de Fin de Grado
# Autor: Luis Bao Bello
#
# Descripción:
#   Imagen Docker del backend. Instala las dependencias Python,
#   copia la API FastAPI y prepara la estructura de datos esperada
#   para ejecutar el servicio.
# -----------------------------------------------------------

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    HF_HOME=/tmp/huggingface \
    TRANSFORMERS_CACHE=/tmp/huggingface \
    DATABASE_URL=sqlite:///./datos/prendas.db

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requisitos_instalacion.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY back ./back

RUN mkdir -p /app/datos /app/semilla

RUN chmod +x ./back/start.sh

EXPOSE 8000

CMD ["./back/start.sh"]
