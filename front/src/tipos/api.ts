/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Este archivo define los tipos compartidos entre pantallas,
 *   componentes y llamadas a la API. Sirve como contrato interno
 *   para manejar los datos del frontend de forma consistente.
 * -----------------------------------------------------------
 */

// Tipos compartidos para las respuestas y parámetros de la API.

export interface Prenda {
  id: number;
  nombre: string;
  descripcion: string;
  categoria: string;
  color: string;
  genero: string;
  url_imagen: string;
  codigo_articulo: string;
}

export interface PrendaConSimilitud {
  prenda: Prenda;
  similitud: number;
}

export interface FavoritoPublic {
  id: number;
  prenda_id: number;
  creado_en: string;
}

export interface FavoritoConPrenda {
  favorito: FavoritoPublic;
  prenda: Prenda;
}

export interface OpcionesFiltros {
  generos: string[];
  categorias: string[];
  colores: string[];
}

export interface ResultadoConjunto {
  modo: 'por_partes' | 'prenda_completa';
  parte_arriba: PrendaConSimilitud[];
  parte_abajo: PrendaConSimilitud[];
  calzado: PrendaConSimilitud[];
  prenda_completa: PrendaConSimilitud[];
}

export type RolOutfit = 'parte_arriba' | 'parte_abajo' | 'calzado' | 'vestido';

export interface OutfitItemCreate {
  prenda_id: number;
  rol: RolOutfit;
}

export interface ConjuntoCrear {
  titulo?: string;
  imagen_referencia?: string | null;
  items: OutfitItemCreate[];
}

export interface OutfitPublic {
  id: number;
  titulo: string | null;
  imagen_referencia: string | null;
  creado_en: string;
}

export interface OutfitItemPublic {
  id: number;
  prenda_id: number;
  rol: RolOutfit;
}

export interface OutfitItemConPrenda {
  item: OutfitItemPublic;
  prenda: Prenda;
}

export interface OutfitDetallado {
  outfit: OutfitPublic;
  items: OutfitItemConPrenda[];
}

// Este bloque reúne los filtros que el catálogo envía al backend.
export interface FiltrosPrenda {
  genero?: string;
  categoria?: string;
  color?: string;
  offset?: number;
  limit?: number;
}

// Parámetros opcionales del generador de outfits actual.
export interface CrearOutfitParams {
  tipo_outfit?: 'por_partes' | 'prenda_completa';
  genero?: string;
  categoria_parte_arriba?: string;
  categoria_parte_abajo?: string;
  categoria_calzado?: string;
  categoria_prenda_completa?: string;
}
