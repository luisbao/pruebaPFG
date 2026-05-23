/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Este módulo reúne las operaciones del frontend relacionadas
 *   con los conjuntos guardados por el usuario. Permite crear,
 *   listar, consultar y eliminar looks persistidos.
 * -----------------------------------------------------------
 */

import type { ConjuntoCrear, OutfitDetallado } from '@/tipos/api';

import { apiDelete, apiGet, apiPost } from './cliente';

// Los looks guardados tienen su propia capa para no mezclar esta lógica con recomendaciones.
export async function guardarOutfit(datosOutfit: ConjuntoCrear): Promise<OutfitDetallado> {
  return apiPost<OutfitDetallado>('/outfits', datosOutfit);
}

export async function getOutfits(limit = 20, offset = 0): Promise<OutfitDetallado[]> {
  return apiGet<OutfitDetallado[]>('/outfits', { limit, offset });
}

export async function getOutfit(outfitId: number): Promise<OutfitDetallado> {
  return apiGet<OutfitDetallado>(`/outfits/${outfitId}`);
}

export async function eliminarOutfit(outfitId: number): Promise<void> {
  await apiDelete<void>(`/outfits/${outfitId}`);
}
