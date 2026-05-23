import type { FavoritoConPrenda } from '@/tipos/api';

/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Archivo que centraliza las llamadas al backend para el
 *   armario digital del usuario. Desde aquí se consultan,
 *   añaden y eliminan las prendas favoritas.
 * -----------------------------------------------------------
 */

import { apiDelete, apiGet, apiPost } from './cliente';

// Esta capa deja el armario digital en operaciones simples para el resto de la UI.
export async function getFavoritos(limit = 100, offset = 0): Promise<FavoritoConPrenda[]> {
  return apiGet<FavoritoConPrenda[]>('/favoritos', { limit, offset });
}

export async function addFavorito(prendaId: number): Promise<FavoritoConPrenda> {
  return apiPost<FavoritoConPrenda>('/favoritos', { prenda_id: prendaId });
}

export async function removeFavorito(prendaId: number): Promise<void> {
  await apiDelete<void>(`/favoritos/${prendaId}`);
}

export async function getFavoritosIds(): Promise<number[]> {
  return apiGet<number[]>('/favoritos/ids');
}
