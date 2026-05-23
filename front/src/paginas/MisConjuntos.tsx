/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Ruta de acceso a los looks guardados. Redirige al usuario
 *   al apartado unificado de "Mi armario" mostrando directamente
 *   la vista de conjuntos.
 * -----------------------------------------------------------
 */

import { Navigate } from 'react-router-dom';

export default function MisConjuntos() {
  return <Navigate to="/armario?vista=looks" replace />;
}
