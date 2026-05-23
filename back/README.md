# Backend

**Autor:** Luis Bao Bello  
**Proyecto de Fin de Grado**

---

## Descripción general

Esta carpeta contiene el backend del proyecto **“Sistema de recomendación de prendas mediante modelo multimodal basado en embeddings”**.

El backend está implementado con **FastAPI** y constituye la capa encargada de exponer la API consumida por el frontend. Sus responsabilidades principales son:

- Servir el catálogo de prendas.
- Gestionar usuarios.
- Autenticar peticiones mediante JWT.
- Ejecutar la recomendación visual.
- Generar outfits.
- Gestionar favoritos y conjuntos guardados.
- Proporcionar acceso a las imágenes en entorno local.
- Conectar con la base de datos SQLite del sistema.

La lógica principal de recomendación se encuentra en esta capa, incluyendo el uso de modelos preentrenados, cálculo de embeddings visuales, comparación por similitud y generación de resultados para el usuario.

---

## Estructura de la carpeta

```text
back/
├── rutas/
├── scripts/
├── servicios/
├── __init__.py
├── base_datos.py
├── esquemas.py
├── main.py
├── modelos.py
├── seguridad.py
├── utilidades_catalogo.py
├── utilidades_color.py
└── start.sh
```

### Descripción de los elementos principales

| Fichero / carpeta | Descripción |
| --- | --- |
| `rutas/` | Contiene los módulos que definen los endpoints HTTP de la API. |
| `scripts/` | Incluye scripts auxiliares para preparar datos, cargar prendas, calcular embeddings y evaluar el recomendador. |
| `servicios/` | Contiene la lógica de negocio principal, especialmente la recomendación visual y el parsing de ropa. |
| `main.py` | Crea la aplicación FastAPI, registra las rutas principales, configura CORS y monta `/imagenes` en ejecución local cuando existe la carpeta configurada. |
| `base_datos.py` | Configura la conexión con SQLite mediante SQLAlchemy y define la sesión de base de datos usada por las rutas. |
| `modelos.py` | Contiene los modelos ORM de la aplicación. |
| `esquemas.py` | Define los esquemas Pydantic utilizados para validar entradas y salidas de la API. |
| `seguridad.py` | Implementa la lógica de autenticación, hash de contraseñas, verificación de credenciales, creación de tokens JWT y resolución del usuario autenticado. |
| `utilidades_catalogo.py` | Agrupa funciones auxiliares relacionadas con el filtrado del catálogo y la visibilidad de prendas. |
| `utilidades_color.py` | Contiene funciones auxiliares para normalización y tratamiento de colores. |
| `start.sh` | Script de arranque utilizado por el contenedor del backend. |

El `Dockerfile` utilizado para el despliegue se encuentra en la raíz del proyecto, de forma que la imagen pueda construirse con acceso al contexto completo de la entrega.

---

## Rutas HTTP

La carpeta `rutas/` contiene los módulos que exponen la API REST del backend.

```text
rutas/
├── auth.py
├── favoritos.py
├── outfits.py
├── prendas.py
└── recomendacion.py
```

### Descripción de rutas

| Fichero | Responsabilidad |
| --- | --- |
| `auth.py` | Implementa el registro de usuarios, inicio de sesión, consulta del usuario actual y eliminación de cuenta. |
| `prendas.py` | Expone el catálogo de prendas, incluyendo listado, filtros disponibles y detalle de prenda. |
| `recomendacion.py` | Expone la recomendación por prenda, la recomendación por imagen y la creación de outfits. |
| `favoritos.py` | Gestiona las prendas favoritas del usuario autenticado. |
| `outfits.py` | Gestiona los outfits guardados y el detalle de cada conjunto. |

---

## Servicios

La carpeta `servicios/` contiene la lógica principal asociada al procesamiento visual y a la generación de recomendaciones.

```text
servicios/
├── parsing_ropa.py
└── recomendacion_visual.py
```

### `recomendacion_visual.py`

Este módulo contiene la lógica principal del recomendador visual. Entre sus funciones principales se encuentran:

- Carga del modelo CLIP.
- Cálculo de embeddings visuales.
- Comparación de prendas mediante similitud coseno.
- Filtrado de candidatos.
- Recomendación a partir de una prenda existente.
- Recomendación a partir de una imagen subida por el usuario.
- Generación de outfits completos.

### `parsing_ropa.py`

Este módulo contiene la integración del modelo **SegFormer** para parsing de ropa.

Se utiliza para intentar separar distintas partes del outfit, como:

- Parte superior.
- Parte inferior.
- Vestido.
- Calzado.

Si la segmentación no produce una región válida, el sistema recurre al embedding global de la imagen como mecanismo de respaldo.

---

## Scripts auxiliares

La carpeta `scripts/` contiene utilidades empleadas durante la preparación del catálogo, el cálculo de embeddings y la evaluación interna del sistema.

```text
scripts/
├── calcular_embeddings.py
├── cargar_prendas_hm.py
├── evaluar_umbral_similitud.py
├── normalizar_colores_catalogo.py
└── preparar_imagenes_embeddings.py
```

### Descripción de scripts

| Script | Descripción |
| --- | --- |
| `cargar_prendas_hm.py` | Genera la base inicial del catálogo a partir de `articles.csv` y de las imágenes disponibles. |
| `calcular_embeddings.py` | Calcula y almacena los embeddings visuales de las prendas. |
| `normalizar_colores_catalogo.py` | Ajusta valores de color del catálogo cuando existe una alternativa más fiable en el dataset original. |
| `preparar_imagenes_embeddings.py` | Prepara una selección de imágenes asociadas a prendas con embedding, útil para subir únicamente el subconjunto necesario a Azure Blob Storage. |
| `evaluar_umbral_similitud.py` | Ejecuta la evaluación interna del recomendador y genera métricas de coherencia y similitud. |

---

## Modelos de datos

El fichero `modelos.py` define los modelos ORM utilizados por SQLAlchemy.

Los principales modelos del sistema son:

- Prendas del catálogo.
- Embeddings visuales.
- Usuarios.
- Prendas favoritas.
- Outfits guardados.
- Elementos que componen cada outfit.

Estos modelos permiten persistir tanto la información del catálogo como los datos generados por la interacción del usuario con la aplicación.

---

## Esquemas de validación

El fichero `esquemas.py` define los esquemas Pydantic utilizados por la API.

Estos esquemas permiten:

- Validar datos de entrada.
- Controlar la estructura de las respuestas.
- Separar los modelos internos de base de datos de los objetos expuestos por la API.
- Documentar automáticamente los contratos de los endpoints en Swagger.

---

## Seguridad y autenticación

La autenticación se gestiona en el fichero:

```text
seguridad.py
```

Este módulo se encarga de:

- Aplicar hash a las contraseñas.
- Verificar credenciales de usuario.
- Crear tokens JWT.
- Validar tokens recibidos en las peticiones.
- Resolver el usuario autenticado en rutas protegidas.

Las rutas que gestionan información personal del usuario, como favoritos u outfits guardados, requieren autenticación.

---

## Datos esperados

Por defecto, el backend trabaja con la siguiente estructura local:

```text
datos/prendas.db
datos/imagenes/
```

### Base de datos

```text
datos/prendas.db
```

Esta base de datos contiene:

- Catálogo de prendas.
- Embeddings visuales.
- Usuarios.
- Favoritos.
- Outfits guardados.
- Elementos de cada outfit.

### Imágenes locales

```text
datos/imagenes/
```

En ejecución local, esta carpeta se utiliza para servir imágenes mediante la ruta:

```text
/imagenes
```

siempre que el directorio exista y esté configurado correctamente.

En el entorno desplegado en Azure, las imágenes no se sirven desde el backend. En ese caso, el frontend construye sus URL mediante la variable:

```text
VITE_IMAGE_BASE_URL
```

apuntando a **Azure Blob Storage**.

---

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Ruta de conexión a la base de datos SQLite. |
| `SECRET_KEY` | Clave utilizada para firmar los tokens JWT. |
| `CORS_ORIGINS` | Orígenes permitidos para las peticiones del frontend. |
| `IMAGE_STATIC_DIR` | Directorio local de imágenes utilizado para montar `/imagenes`. |

---

## Ejecución local

El backend se ejecuta desde la raíz del proyecto.

### 1. Crear y activar el entorno virtual

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Instalar dependencias

```bash
pip install -r requisitos_instalacion.txt
```

### 3. Iniciar la API

```bash
PYTHONPATH=. uvicorn back.main:app --reload --host 127.0.0.1 --port 8000
```

La API queda disponible en:

```text
http://127.0.0.1:8000
```

La documentación interactiva generada por FastAPI queda disponible en:

```text
http://127.0.0.1:8000/docs
```

En la primera ejecución puede ser necesaria conexión a internet para descargar los modelos preentrenados utilizados por **CLIP** y **SegFormer**.

---

## Flujo general del backend

El funcionamiento general del backend puede resumirse así:

1. El frontend envía una petición a la API.
2. FastAPI recibe la solicitud en una de las rutas definidas en `rutas/`.
3. La ruta valida los datos mediante esquemas Pydantic.
4. Si es necesario, se consulta o actualiza la base de datos mediante SQLAlchemy.
5. En las operaciones de recomendación, se invocan los servicios visuales.
6. El sistema calcula similitudes, filtra candidatos y genera resultados.
7. La API devuelve una respuesta estructurada al frontend.

---

## Despliegue

El backend se despliega como un contenedor Docker.

El `Dockerfile`, situado en la raíz del proyecto, se encarga de:

- Copiar el código de `back/`.
- Instalar las dependencias definidas en `requisitos_instalacion.txt`.
- Preparar la estructura necesaria para ejecutar el backend.
- Usar `start.sh` como script de arranque del contenedor.

Para ejecutar el prototipo con el catálogo completo es necesario aportar previamente la base de datos:

```text
datos/prendas.db
```

o generarla mediante los scripts incluidos en el backend.

---

## Consideraciones de entrega

Por motivos de tamaño, la entrega no incluye los datos pesados del catálogo ni las imágenes completas del dataset.

No deben considerarse parte del código fuente principal:

- La carpeta `datos/`.
- La base de datos generada `datos/prendas.db`.
- Las imágenes completas del catálogo.
- Archivos temporales o salidas regenerables.
- Cachés de modelos o dependencias.

Estos elementos pueden reconstruirse mediante los scripts auxiliares o incorporarse manualmente al entorno de ejecución cuando sea necesario.

---

## Resumen

El backend implementa la lógica principal del sistema de recomendación de prendas. Expone una API REST mediante FastAPI, gestiona la persistencia con SQLite y SQLAlchemy, aplica autenticación mediante JWT y ejecuta el motor de recomendación visual basado en embeddings.

Esta capa concentra la funcionalidad crítica del proyecto y actúa como intermediaria entre la interfaz web, la base de datos, los modelos de visión artificial y los datos del catálogo.