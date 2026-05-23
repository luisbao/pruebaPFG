/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Conjunto de utilidades auxiliares para trabajar con looks
 *   guardados. Encapsula etiquetas, orden visual y formateo
 *   de fechas para no repetir esa lógica en varias páginas.
 * -----------------------------------------------------------
 */

import type { OutfitItemConPrenda, RolOutfit } from '@/tipos/api';

// Estas tablas pequeñas nos permiten reutilizar etiquetas y orden sin repetir condicionales.
const ETIQUETAS_ROL: Record<RolOutfit, string> = {
  vestido: 'Vestido',
  parte_arriba: 'Parte de arriba',
  parte_abajo: 'Parte de abajo',
  calzado: 'Calzado',
};

const ORDEN_ROL: Record<RolOutfit, number> = {
  vestido: 0,
  parte_arriba: 1,
  parte_abajo: 2,
  calzado: 3,
};

export function obtenerEtiquetaRol(rol: RolOutfit): string {
  return ETIQUETAS_ROL[rol] ?? rol;
}

export function ordenarItemsOutfit(items: OutfitItemConPrenda[]): OutfitItemConPrenda[] {
  // Los looks se muestran siempre en el mismo orden visual para que sean fáciles de leer.
  return [...items].sort(
    (itemA, itemB) => ORDEN_ROL[itemA.item.rol] - ORDEN_ROL[itemB.item.rol],
  );
}

export function formatearFechaOutfit(fechaIso: string): string {
  // Normalizamos las fechas en español para no repetir este formateo en cada página.
  return new Intl.DateTimeFormat('es-ES', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(fechaIso));
}
