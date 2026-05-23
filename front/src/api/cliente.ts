/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Cliente HTTP base del frontend. Se ocupa de construir las
 *   peticiones al backend, adjuntar el token JWT cuando existe,
 *   procesar respuestas y unificar el manejo de errores.
 * -----------------------------------------------------------
 */

// Cliente HTTP base para hablar con la API del proyecto.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
const IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL || '';
const TOKEN_KEY = 'style_matcher_token';

// Estas utilidades encapsulan dónde y cómo se persiste el JWT en el navegador.
export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

class ErrorApi extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ErrorApi';
  }
}

async function extraerMensajeError(response: Response): Promise<string> {
  try {
    // FastAPI suele devolver el detalle en JSON, así que lo priorizamos.
    const contenido = await response.clone().json();
    if (typeof contenido?.detail === 'string') {
      return contenido.detail;
    }
  } catch {
    // Si la respuesta no es JSON, usamos el texto plano.
  }

  return response.text().catch(() => 'Error desconocido');
}

async function procesarRespuesta<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const mensajeError = await extraerMensajeError(response);
    throw new ErrorApi(response.status, mensajeError);
  }

  // Algunas operaciones como DELETE responden sin cuerpo y no deben parsearse como JSON.
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  // Construimos la URL final a partir del endpoint y de los parámetros opcionales.
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== '') {
        url.searchParams.append(clave, String(valor));
      }
    });
  }

  const token = getAuthToken();
  const headers: HeadersInit = {
    Accept: 'application/json',
  };
  // El token se añade automáticamente para que cada llamada protegida no tenga que repetirlo.
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers,
  });

  return procesarRespuesta<T>(response);
}

export async function apiPost<T>(
  endpoint: string,
  body?: FormData | object,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  // Este helper cubre tanto JSON como formularios multipart para imágenes.
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== '') {
        url.searchParams.append(clave, String(valor));
      }
    });
  }

  const esFormulario = body instanceof FormData;
  const token = getAuthToken();

  const headers: HeadersInit = esFormulario
    ? {}
    : {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers,
    body: esFormulario ? body : body ? JSON.stringify(body) : undefined,
  });

  return procesarRespuesta<T>(response);
}

export async function apiDelete<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>,
): Promise<T> {
  // El borrado reutiliza la misma convención de token y parámetros de la capa API.
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([clave, valor]) => {
      if (valor !== undefined && valor !== '') {
        url.searchParams.append(clave, String(valor));
      }
    });
  }

  const token = getAuthToken();
  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers,
  });

  return procesarRespuesta<T>(response);
}

export function getImageUrl(urlImagen: string): string {
  // El backend guarda rutas como "datos/imagenes/068/0684021057.jpg"
  // y aquí convertimos esa parte final en una URL pública servida por FastAPI o Blob Storage.
  if (urlImagen.startsWith('http://') || urlImagen.startsWith('https://')) {
    return urlImagen;
  }

  const rutaRelativa = urlImagen.replace('datos/imagenes/', '');

  if (IMAGE_BASE_URL) {
    return `${IMAGE_BASE_URL.replace(/\/$/, '')}/${rutaRelativa}`;
  }

  return `${API_BASE_URL}/imagenes/${rutaRelativa}`;
}

export { API_BASE_URL, ErrorApi };
