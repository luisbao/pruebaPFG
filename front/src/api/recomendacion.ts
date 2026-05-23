/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Este módulo agrupa las llamadas del frontend relacionadas
 *   con recomendación visual: búsqueda por imagen, similares a
 *   una prenda y generación de conjuntos.
 * -----------------------------------------------------------
 */

import { apiPost } from './cliente';
import type { CrearOutfitParams, ResultadoConjunto, PrendaConSimilitud } from '@/tipos/api';

export async function recomendarPorPrenda(
  prendaId: number,
  limite: number = 20,
): Promise<PrendaConSimilitud[]> {
  // Reutilizamos POST para mantener coherencia con la API del backend.
  return apiPost<PrendaConSimilitud[]>(
    `/recomendacion/por-prenda/${prendaId}`,
    undefined,
    { limite },
  );
}

export async function recomendarPorImagen(imagen: File): Promise<PrendaConSimilitud[]> {
  // Las búsquedas visuales se envían como multipart porque incluyen un archivo.
  const datosFormulario = new FormData();
  datosFormulario.append('archivo_imagen', imagen);

  return apiPost<PrendaConSimilitud[]>('/recomendacion/por-imagen', datosFormulario);
}

export async function crearOutfit(
  imagen: File,
  params?: CrearOutfitParams,
): Promise<ResultadoConjunto> {
  // El formulario mezcla imagen y filtros opcionales sin exponer esa complejidad a la página.
  const datosFormulario = new FormData();
  datosFormulario.append('archivo_imagen', imagen);

  const parametrosConsulta: Record<string, string | number | undefined> = {};
  if (params?.tipo_outfit) parametrosConsulta.tipo_outfit = params.tipo_outfit;
  if (params?.genero) parametrosConsulta.genero = params.genero;
  if (params?.categoria_parte_arriba) {
    parametrosConsulta.categoria_parte_arriba = params.categoria_parte_arriba;
  }
  if (params?.categoria_parte_abajo) {
    parametrosConsulta.categoria_parte_abajo = params.categoria_parte_abajo;
  }
  if (params?.categoria_calzado) {
    parametrosConsulta.categoria_calzado = params.categoria_calzado;
  }
  if (params?.categoria_prenda_completa) {
    parametrosConsulta.categoria_prenda_completa = params.categoria_prenda_completa;
  }

  return apiPost<ResultadoConjunto>(
    '/recomendacion/crear-outfit',
    datosFormulario,
    parametrosConsulta,
  );
}
