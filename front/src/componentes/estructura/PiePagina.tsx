/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Pie de página compartido del frontend. Refuerza la identidad
 *   del proyecto y cierra visualmente las páginas públicas con
 *   una presentación homogénea.
 * -----------------------------------------------------------
 */

import { Sparkles } from 'lucide-react';

export function PiePagina() {
  return (
    // El pie mantiene una firma visual simple y consistente en todas las pantallas.
    <footer className="bg-primary text-primary-foreground py-12 mt-auto">
      <div className="fashion-container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="font-display text-xl font-medium">StyleMatch</span>
          </div>

          <p className="text-sm text-primary-foreground/70 text-center">
            Sistema de Recomendación de Moda - Proyecto de Fin de Grado
          </p>

          <p className="text-sm text-primary-foreground/50">
            © {new Date().getFullYear()} Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}
