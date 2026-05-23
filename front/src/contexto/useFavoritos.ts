/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Hook de acceso al contexto de favoritos. Lo usan las tarjetas
 *   y pantallas que necesitan conocer o modificar el armario
 *   digital del usuario.
 * -----------------------------------------------------------
 */

import { useContext } from 'react';

import { FavoritosContext } from './favoritos-contexto';

export function useFavoritos() {
  const contexto = useContext(FavoritosContext);
  if (!contexto) {
    throw new Error('useFavoritos debe usarse dentro de un FavoritosProvider');
  }
  return contexto;
}
