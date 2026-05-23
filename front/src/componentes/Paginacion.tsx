/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Componente de paginación simple para moverse entre bloques
 *   de resultados. Encapsula los controles de avanzar,
 *   retroceder y el estado visible de la navegación.
 * -----------------------------------------------------------
 */

import { Button } from '@/componentes/base/boton';
import { cn } from '@/utilidades/clases';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginacionProps {
  desplazamiento: number;
  limite: number;
  hayMas: boolean;
  onAnterior: () => void;
  onSiguiente: () => void;
  className?: string;
}

export function Paginacion({
  desplazamiento,
  limite,
  hayMas,
  onAnterior,
  onSiguiente,
  className,
}: PaginacionProps) {
  // Calculamos la página actual a partir del desplazamiento real que usa la API.
  const paginaActual = Math.floor(desplazamiento / limite) + 1;
  const hayPaginaAnterior = desplazamiento > 0;

  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      <Button
        variant="outline"
        onClick={onAnterior}
        disabled={!hayPaginaAnterior}
        className="gap-2"
      >
        <ChevronLeft className="w-4 h-4" />
        Anterior
      </Button>

      <span className="text-sm text-muted-foreground">Página {paginaActual}</span>

      <Button
        variant="outline"
        onClick={onSiguiente}
        disabled={!hayMas}
        className="gap-2"
      >
        Siguiente
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
