# Frontend

**Autor:** Luis Bao Bello  
**Proyecto de Fin de Grado**

---

## Descripción general

Esta carpeta contiene la aplicación web del proyecto **“Sistema de recomendación de prendas mediante modelo multimodal basado en embeddings”**.

El frontend está construido con **React**, **TypeScript** y **Vite**, y actúa como cliente del backend desarrollado con **FastAPI**. Su función principal es proporcionar una interfaz web desde la que el usuario puede interactuar con el sistema.

Desde esta capa se permite:

- Consultar el catálogo de prendas.
- Aplicar filtros de búsqueda.
- Ver el detalle de una prenda.
- Subir imágenes para obtener recomendaciones visuales.
- Crear outfits a partir de prendas recomendadas.
- Gestionar la sesión del usuario.
- Guardar prendas favoritas.
- Consultar outfits guardados.

La lógica de recomendación visual no se ejecuta en el frontend. Esta capa recoge la interacción del usuario, realiza peticiones a la API y representa las respuestas recibidas del backend.

---

## Estructura de la carpeta

```text
front/
├── public/
├── src/
├── .env.production.example
├── README.md
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

### Descripción de los elementos principales

| Ruta / fichero | Descripción |
| --- | --- |
| `public/` | Contiene recursos estáticos servidos directamente por Vite, como el favicon y la imagen de respaldo `imagen-no-disponible.svg`. |
| `src/` | Contiene el código principal de la aplicación React. |
| `.env.production.example` | Incluye un ejemplo de las variables de entorno necesarias para conectar el frontend desplegado con el backend y con Azure Blob Storage. |
| `package.json` | Define las dependencias, metadatos y scripts npm del proyecto. |
| `package-lock.json` | Fija las versiones exactas de las dependencias instaladas. |
| `vite.config.ts` | Contiene la configuración principal de Vite. |
| `tailwind.config.ts` | Define la configuración de Tailwind CSS. |
| `postcss.config.js` | Configura PostCSS para el procesamiento de estilos. |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | Contienen la configuración de TypeScript para la aplicación y las herramientas asociadas. |
| `eslint.config.js` | Define las reglas de análisis estático y estilo de código mediante ESLint. |
| `index.html` | Documento HTML base utilizado por Vite para montar la aplicación React. |

---

## Organización interna de `src`

```text
src/
├── api/
├── componentes/
├── contexto/
├── paginas/
├── tipos/
├── utilidades/
├── App.tsx
├── main.tsx
├── index.css
└── vite-env.d.ts
```

### Módulos principales

| Carpeta / fichero | Descripción |
| --- | --- |
| `api/` | Centraliza la comunicación con el backend. Incluye el cliente HTTP común y las llamadas a la API agrupadas por dominio. |
| `componentes/` | Agrupa componentes reutilizables de interfaz relacionados con el dominio de la aplicación. |
| `componentes/base/` | Contiene componentes visuales reutilizables de bajo nivel, como botones, tarjetas, campos de entrada, selectores, etiquetas y notificaciones. |
| `componentes/estructura/` | Define la estructura común de la aplicación, incluyendo cabecera, pie de página y contenedor general. |
| `contexto/` | Contiene estados globales de React, como la sesión del usuario y el estado compartido de favoritos. |
| `paginas/` | Incluye las vistas principales de la aplicación. |
| `tipos/` | Define tipos TypeScript compartidos para las respuestas de la API y las estructuras utilizadas en la interfaz. |
| `utilidades/` | Contiene funciones auxiliares para categorías de outfit, traducciones del catálogo, composición de clases CSS y transformación de conjuntos guardados. |
| `App.tsx` | Define el enrutado principal de la aplicación. |
| `main.tsx` | Punto de entrada de React. |
| `index.css` | Contiene los estilos globales y la configuración base de Tailwind CSS. |
| `vite-env.d.ts` | Define tipos auxiliares asociados al entorno de Vite. |

---

## Comunicación con el backend

La carpeta `api/` concentra las funciones encargadas de consumir la API del backend.

El fichero principal es:

```text
src/api/cliente.ts
```

Este fichero define:

- El cliente HTTP común.
- La URL base de la API.
- La resolución de rutas de imágenes.
- El tratamiento común de errores.
- La configuración necesaria para enviar y recibir datos del backend.

El resto de ficheros de `api/` agrupa llamadas por dominio funcional:

- Autenticación.
- Prendas.
- Recomendaciones.
- Favoritos.
- Conjuntos guardados.

---

## Páginas principales

La carpeta `paginas/` contiene las vistas principales de la aplicación:

| Página | Descripción |
| --- | --- |
| Inicio | Página inicial de la aplicación. |
| Catálogo | Vista del catálogo completo con filtros de búsqueda. |
| Detalle de prenda | Página individual de una prenda concreta. |
| Búsqueda por imagen | Vista para subir una imagen y obtener recomendaciones visuales. |
| Creación de outfit | Página para generar conjuntos de prendas. |
| Armario | Vista de prendas favoritas del usuario. |
| Conjuntos guardados | Listado de outfits guardados por el usuario. |
| Detalle de conjunto | Vista detallada de un outfit guardado. |
| Inicio de sesión | Formulario de autenticación. |
| Registro | Formulario de creación de cuenta. |
| Página no encontrada | Vista mostrada cuando la ruta solicitada no existe. |

---

## Variables de entorno

Por defecto, el frontend espera encontrar el backend en:

```text
http://127.0.0.1:8000
```

En despliegue se pueden definir las siguientes variables:

```text
VITE_API_BASE_URL=https://TU-BACKEND.azurecontainerapps.io
VITE_IMAGE_BASE_URL=https://TU-CUENTA.blob.core.windows.net/imagenes
```

### Descripción de variables

| Variable | Descripción |
| --- | --- |
| `VITE_API_BASE_URL` | Indica la URL pública del backend FastAPI. |
| `VITE_IMAGE_BASE_URL` | Indica la URL base de las imágenes del catálogo cuando se sirven desde Azure Blob Storage. |

Si `VITE_IMAGE_BASE_URL` no se define, el frontend construye las rutas de imagen contra el backend local mediante:

```text
/imagenes
```

---

## Comandos disponibles

### Instalar dependencias

```bash
npm install
```

### Ejecutar en modo desarrollo

```bash
npm run dev
```

El servidor local de desarrollo queda disponible en:

```text
http://127.0.0.1:8080
```

### Compilar para producción

```bash
npm run build
```

Este comando genera la versión optimizada de la aplicación en la carpeta:

```text
dist/
```

### Revisar el código con ESLint

```bash
npm run lint
```

---

## Rutas principales

| Ruta | Función |
| --- | --- |
| `/` | Página de inicio. |
| `/catalogo` | Catálogo de prendas con filtros. |
| `/prenda/:id` | Detalle de una prenda concreta. |
| `/buscar-por-imagen` | Recomendación de prendas a partir de una imagen subida por el usuario. |
| `/crear-outfit` | Creación de outfits mediante recomendaciones. |
| `/armario` | Prendas favoritas del usuario. |
| `/mis-conjuntos` | Outfits guardados por el usuario. |
| `/conjuntos/:id` | Detalle de un outfit guardado. |
| `/login` | Inicio de sesión. |
| `/registro` | Registro de usuario. |

---

## Flujo general de uso

El flujo principal de interacción del frontend con el sistema es el siguiente:

1. El usuario accede a la aplicación web.
2. El frontend consulta el catálogo o recibe una imagen subida por el usuario.
3. Se envía la petición correspondiente al backend FastAPI.
4. El backend procesa la solicitud y devuelve los datos o recomendaciones.
5. El frontend representa los resultados en la interfaz.
6. Si el usuario está autenticado, puede guardar prendas favoritas u outfits.

---

## Nota de entrega

Las carpetas generadas o dependencias locales no forman parte del código fuente principal.

No deben considerarse parte de la entrega principal:

- `node_modules/`
- `dist/`

La carpeta `node_modules/` se reconstruye mediante:

```bash
npm install
```

La carpeta `dist/` se genera mediante:

```bash
npm run build
```

---

## Resumen

El frontend proporciona la interfaz de usuario del sistema de recomendación de prendas. Está diseñado como una aplicación React modular, separando la comunicación con la API, los componentes reutilizables, las páginas principales, los estados globales y las utilidades auxiliares.

Su objetivo es ofrecer una experiencia clara y sencilla para consultar el catálogo, obtener recomendaciones visuales, gestionar favoritos y guardar outfits personalizados.