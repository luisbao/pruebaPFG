/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Módulo de acceso al catálogo de prendas. Expone funciones
 *   para obtener listados, detalle de una prenda concreta y las
 *   opciones de filtrado necesarias para la interfaz.
 * -----------------------------------------------------------
 */

import type { FiltrosPrenda, OpcionesFiltros, Prenda } from '@/tipos/api';

import { apiGet } from './cliente';

export async function getPrendas(filtros?: FiltrosPrenda): Promise<Prenda[]> {
  const params: Record<string, string | number | undefined> = {};

  // Adaptamos los nombres del frontend a los parámetros que espera FastAPI.
  if (filtros) {
    if (filtros.genero) params.genero = filtros.genero;
    if (filtros.categoria) params.categoria = filtros.categoria;
    if (filtros.color) params.color = filtros.color;
    if (filtros.offset !== undefined) params.salto = filtros.offset;
    if (filtros.limit !== undefined) params.limite = filtros.limit;
  }

  return apiGet<Prenda[]>('/prendas', params);
}

export async function getPrenda(id: number): Promise<Prenda> {
  return apiGet<Prenda>(`/prendas/${id}`);
}

export async function getOpcionesFiltros(genero?: string): Promise<OpcionesFiltros> {
  // Este endpoint alimenta los selectores y chips de filtros del catálogo.
  return apiGet<OpcionesFiltros>('/prendas/opciones-filtros', {
    genero,
  });
}
