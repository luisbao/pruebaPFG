/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Contrato compartido del contexto de favoritos. Define el
 *   estado del armario digital y las acciones disponibles para
 *   marcar o desmarcar prendas.
 * -----------------------------------------------------------
 */

import { createContext } from 'react';

export interface FavoritosContextType {
  idsFavoritas: number[];
  cargandoFavoritos: boolean;
  versionFavoritos: number;
  estaProcesandoFavorito: (prendaId: number) => boolean;
  esFavorita: (prendaId: number) => boolean;
  alternarFavorito: (prendaId: number) => Promise<void>;
  recargarFavoritos: () => Promise<void>;
}

export const FavoritosContext = createContext<FavoritosContextType | undefined>(undefined);
