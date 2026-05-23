import { cn } from '@/utilidades/clases';
/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Conjunto de indicadores de carga reutilizables del frontend.
 *   Sirve para informar al usuario de que una consulta o una
 *   pantalla está esperando respuesta del backend.
 * -----------------------------------------------------------
 */

import { Loader2 } from 'lucide-react';

interface IndicadorCargaProps {
  className?: string;
  tamano?: 'sm' | 'md' | 'lg';
  texto?: string;
}

export function IndicadorCarga({
  className,
  tamano = 'md',
  texto,
}: IndicadorCargaProps) {
  // El tamaño se traduce a clases para reutilizar el mismo spinner en varios contextos.
  const clasesTamano = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-4', className)}>
      <Loader2 className={cn('animate-spin text-accent', clasesTamano[tamano])} />
      {texto && <p className="text-muted-foreground text-sm animate-pulse">{texto}</p>}
    </div>
  );
}

export function PageLoader({ texto = 'Cargando...' }: { texto?: string }) {
  return (
    // Esta variante ocupa más alto para páginas completas o paneles grandes.
    <div className="min-h-[400px] flex items-center justify-center">
      <IndicadorCarga tamano="lg" texto={texto} />
    </div>
  );
}
