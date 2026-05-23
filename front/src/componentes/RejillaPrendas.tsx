/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Rejilla reutilizable para representar prendas o resultados
 *   con similitud. Se encarga de distribuir las tarjetas en
 *   columnas responsivas y gestionar el caso sin resultados.
 * -----------------------------------------------------------
 */

import { cn } from '@/utilidades/clases';
import type { Prenda, PrendaConSimilitud } from '@/tipos/api';

import { TarjetaPrenda } from './TarjetaPrenda';

interface NavegacionDetallePrenda {
  rutaVolver: string;
  etiquetaVolver: string;
  estadoVolver?: unknown;
}

interface RejillaPrendasProps {
  productos: Prenda[] | PrendaConSimilitud[];
  className?: string;
  columnas?: 2 | 3 | 4;
  navegacionDetalle?: NavegacionDetallePrenda;
}

function esPrendaConSimilitud(
  item: Prenda | PrendaConSimilitud,
): item is PrendaConSimilitud {
  return 'prenda' in item && 'similitud' in item;
}

export function RejillaPrendas({
  productos,
  className,
  columnas = 4,
  navegacionDetalle,
}: RejillaPrendasProps) {
  // Mapeamos el número de columnas a utilidades de Tailwind para reutilizar esta rejilla.
  const clasesColumnas = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (productos.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground text-lg">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className={cn('grid gap-6', clasesColumnas[columnas], className)}>
      {productos.map((item, indice) => {
        const prenda = esPrendaConSimilitud(item) ? item.prenda : item;
        const similitud = esPrendaConSimilitud(item) ? item.similitud : undefined;

        return (
          <div
            key={prenda.id}
            className="animate-slide-up"
            style={{ animationDelay: `${indice * 50}ms` }}
          >
            <TarjetaPrenda
              prenda={prenda}
              similitud={similitud}
              navegacionDetalle={navegacionDetalle}
            />
          </div>
        );
      })}
    </div>
  );
}
