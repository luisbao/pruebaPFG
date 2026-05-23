/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Hook de acceso al contexto de autenticación. Permite consultar
 *   la sesión activa y ejecutar acciones de usuario desde las
 *   pantallas y componentes del frontend.
 * -----------------------------------------------------------
 */

import { useContext } from 'react';

import { AuthContext } from './auth-contexto';

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (contexto === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return contexto;
}
