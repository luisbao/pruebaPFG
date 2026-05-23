/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Estructura base de página del frontend. Envuelve el contenido
 *   principal con la cabecera y el pie comunes para mantener una
 *   navegación consistente en toda la aplicación.
 * -----------------------------------------------------------
 */

import { PiePagina } from './PiePagina';
import { Cabecera } from './Cabecera';

interface EstructuraPaginaProps {
  children: React.ReactNode;
}

export function EstructuraPagina({ children }: EstructuraPaginaProps) {
  return (
    // Este layout envuelve las páginas públicas con la misma cabecera y pie.
    <div className="min-h-screen flex flex-col">
      <Cabecera />
      <main className="flex-1">{children}</main>
      <PiePagina />
    </div>
  );
}
