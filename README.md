# Sistema de recomendación de prendas mediante modelo multimodal basado en embeddings

**Autor:** Luis Bao Bello  
**Proyecto de Fin de Grado**

---

## Descripción general

Este repositorio contiene el código fuente y la documentación técnica del Proyecto de Fin de Grado **“Sistema de recomendación de prendas mediante modelo multimodal basado en embeddings”**.

La solución se organiza como una aplicación web completa compuesta por:

- Un **backend** desarrollado con **FastAPI**, encargado de gestionar el catálogo, la autenticación, la persistencia de datos y el motor de recomendación visual.
- Un **frontend** desarrollado con **React, TypeScript y Vite**, que proporciona la interfaz de usuario y permite interactuar con el sistema de recomendación.

El sistema permite consultar prendas, gestionar favoritos y outfits, y obtener recomendaciones visuales basadas en embeddings generados a partir de imágenes del catálogo.

---

## Estructura principal del proyecto

```text
.
├── back/
├── front/
├── Dockerfile
├── .dockerignore
├── .gitignore
├── README.md
└── requisitos_instalacion.txt
```

### Descripción de los elementos principales

| Ruta / fichero | Descripción |
| --- | --- |
| `back/` | Contiene el backend de la aplicación. Incluye la API FastAPI, modelos de base de datos, esquemas de validación, rutas HTTP, servicios de recomendación visual y segmentación, scripts de preparación de datos y ficheros necesarios para el despliegue del backend. |
| `front/` | Contiene la aplicación web. Está desarrollada con React, TypeScript y Vite, e incluye páginas, componentes reutilizables, clientes API, contextos de estado, tipos y utilidades. |
| `Dockerfile` | Define la imagen Docker del backend utilizada en el despliegue. Se encuentra en la raíz para poder acceder al código de `back/`, al fichero `requisitos_instalacion.txt` y a la estructura general del proyecto. |
| `.dockerignore` | Excluye del contexto de construcción dependencias locales, salidas de build, cachés y datos pesados que no deben copiarse dentro de la imagen Docker. |
| `.gitignore` | Evita versionar entornos locales, dependencias instaladas, builds, cachés y datos pesados del catálogo. |
| `requisitos_instalacion.txt` | Define las dependencias Python necesarias para ejecutar el backend. |

---

## Documentación incluida

La entrega contiene tres ficheros README principales:

| Fichero | Contenido |
| --- | --- |
| `README.md` | Visión general de la entrega, estructura del repositorio, ejecución local, datos y despliegue. |
| `front/README.md` | Descripción de la estructura interna del frontend y de sus principales módulos. |
| `back/README.md` | Descripción de la estructura interna del backend, servicios, rutas, modelos y scripts auxiliares. |

---

## Ejecución local

### 1. Preparar el entorno del backend

El backend se ejecuta desde la raíz del proyecto. Primero, se debe crear y activar un entorno virtual de Python:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

A continuación, se instalan las dependencias necesarias:

```bash
pip install -r requisitos_instalacion.txt
```

### 2. Iniciar la API

Desde la raíz del proyecto, ejecutar:

```bash
PYTHONPATH=. uvicorn back.main:app --reload --host 127.0.0.1 --port 8000
```

Una vez iniciado el servidor, la documentación interactiva de la API estará disponible en:

```text
http://127.0.0.1:8000/docs
```

---

## Ejecución del frontend

El frontend se ejecuta desde la carpeta `front/`.

```bash
cd front
npm install
npm run dev
```

La aplicación web estará disponible en:

```text
http://127.0.0.1:8080
```

---

## Datos e imágenes

El origen de datos del proyecto es el dataset público de H&M disponible en Kaggle:

```text
https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations
```

Por motivos de tamaño, la entrega no incluye:

- Los CSV originales del dataset.
- La base de datos SQLite procesada.
- Las imágenes completas del catálogo.
- La carpeta local `datos/`.

La carpeta `datos/` queda, por tanto, fuera del repositorio y del archivo ZIP de entrega.

### Imágenes en entorno local

En local, el backend puede exponer las imágenes del catálogo mediante la ruta:

```text
/imagenes
```

Para ello, debe existir el directorio configurado mediante la variable `IMAGE_STATIC_DIR`.

Por defecto, se utiliza:

```text
datos/imagenes
```

### Imágenes en despliegue

En el entorno desplegado, las imágenes no se sirven desde el backend.  
El frontend construye las URL de las imágenes a partir de la variable:

```text
VITE_IMAGE_BASE_URL
```

Esta variable apunta al contenedor correspondiente en **Azure Blob Storage**.

---

## Base de datos

La base de datos principal del sistema es:

```text
datos/prendas.db
```

Esta base de datos contiene:

- Catálogo depurado de prendas.
- Embeddings visuales.
- Usuarios registrados.
- Favoritos.
- Outfits guardados.

Para ejecutar el sistema localmente con el catálogo completo, o para reconstruir una imagen Docker equivalente a la demo desplegada, esta base de datos debe generarse mediante los scripts del backend o incorporarse manualmente al entorno de ejecución.

---

## Despliegue

La demo desplegada utiliza una arquitectura basada en servicios de Azure:

| Componente | Servicio utilizado |
| --- | --- |
| Frontend estático | Azure Storage Static Website |
| Backend FastAPI | Azure Container Apps |
| Imagen Docker del backend | Azure Container Registry |
| Imágenes del catálogo | Azure Blob Storage |
| Base de datos | SQLite preparada a partir del catálogo procesado |

Esta separación permite servir el frontend como contenido estático, desplegar el backend como contenedor y alojar las imágenes del catálogo en almacenamiento externo.

---

## Notas de entrega

Las carpetas generadas, dependencias locales y datos pesados no forman parte del código fuente principal del proyecto.

No deben considerarse parte de la entrega principal:

- `front/node_modules/`
- `front/dist/`
- `datos/`
- Imágenes completas del dataset.
- CSV originales del dataset.
- Salidas auxiliares regenerables.
- Cachés locales.

Las dependencias del frontend se reconstruyen mediante:

```bash
npm install
```

La versión de producción del frontend se genera con:

```bash
npm run build
```

---

## Resumen

Este repositorio recoge la implementación completa del sistema de recomendación visual de prendas, incluyendo backend, frontend, scripts de preparación de datos, configuración de despliegue y documentación técnica necesaria para comprender, ejecutar y evaluar el proyecto.