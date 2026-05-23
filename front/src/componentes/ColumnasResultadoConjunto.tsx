/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Componente encargado de presentar las propuestas de outfit
 *   como looks completos diferenciados. Cada bloque agrupa las
 *   prendas sugeridas para una misma opción y permite guardar
 *   directamente ese look desde su cabecera.
 * -----------------------------------------------------------
 */

import { Button } from '@/componentes/base/boton';
import { cn } from '@/utilidades/clases';
import type { ResultadoConjunto, PrendaConSimilitud } from '@/tipos/api';
import {
  ArrowDown,
  BookmarkPlus,
  Footprints,
  Shirt,
  Sparkles,
} from 'lucide-react';

import { TarjetaPrenda } from './TarjetaPrenda';

interface NavegacionDetallePrenda {
  rutaVolver: string;
  etiquetaVolver: string;
  estadoVolver?: unknown;
}

type RolLookVisual = 'parte_arriba' | 'parte_abajo' | 'calzado' | 'prenda_completa';

interface BloqueLook {
  rol: RolLookVisual;
  titulo: string;
  icono: React.ReactNode;
  item?: PrendaConSimilitud;
}

interface LookVisual {
  indice: number;
  bloques: BloqueLook[];
}

interface ColumnasResultadoConjuntoProps {
  resultado: ResultadoConjunto;
  navegacionDetalle?: NavegacionDetallePrenda;
  onGuardarLook?: (indiceLook: number) => void;
  guardandoLookIndice?: number | null;
}

function construirLooks(resultado: ResultadoConjunto): LookVisual[] {
  const limiteLooks = 3;

  if (resultado.modo === 'prenda_completa' || resultado.prenda_completa.length > 0) {
    const totalLooks = Math.min(
      limiteLooks,
      Math.max(resultado.prenda_completa.length, resultado.calzado.length),
    );

    return Array.from({ length: totalLooks }, (_, indice) => ({
      indice,
      bloques: [
        {
          rol: 'prenda_completa',
          titulo: 'Prenda completa',
          icono: <Sparkles className="h-5 w-5" />,
          item: resultado.prenda_completa[indice],
        },
        {
          rol: 'calzado',
          titulo: 'Calzado',
          icono: <Footprints className="h-5 w-5" />,
          item: resultado.calzado[indice],
        },
      ],
    })).filter((look) => look.bloques.some((bloque) => bloque.item));
  }

  const totalLooks = Math.min(
    limiteLooks,
    Math.max(
      resultado.parte_arriba.length,
      resultado.parte_abajo.length,
      resultado.calzado.length,
    ),
  );

  return Array.from({ length: totalLooks }, (_, indice) => ({
    indice,
    bloques: [
      {
        rol: 'parte_arriba',
        titulo: 'Parte de arriba',
        icono: <Shirt className="h-5 w-5" />,
        item: resultado.parte_arriba[indice],
      },
      {
        rol: 'parte_abajo',
        titulo: 'Parte de abajo',
        icono: <ArrowDown className="h-5 w-5" />,
        item: resultado.parte_abajo[indice],
      },
      {
        rol: 'calzado',
        titulo: 'Calzado',
        icono: <Footprints className="h-5 w-5" />,
        item: resultado.calzado[indice],
      },
    ],
  })).filter((look) => look.bloques.some((bloque) => bloque.item));
}

interface BloquePrendaProps {
  titulo: string;
  icono: React.ReactNode;
  item?: PrendaConSimilitud;
  navegacionDetalle?: NavegacionDetallePrenda;
}

function BloquePrenda({ titulo, icono, item, navegacionDetalle }: BloquePrendaProps) {
  return (
    <div className="rounded-2xl border border-border bg-background/80 p-4">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
          {icono}
        </div>
        <h3 className="font-display text-lg font-medium">{titulo}</h3>
      </div>

      {item ? (
        <TarjetaPrenda
          prenda={item.prenda}
          similitud={item.similitud}
          navegacionDetalle={navegacionDetalle}
        />
      ) : (
        <div className="flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/30 px-6 text-center text-sm text-muted-foreground">
          No se encontró una sugerencia para esta parte en este look
        </div>
      )}
    </div>
  );
}

export function ColumnasResultadoConjunto({
  resultado,
  navegacionDetalle,
  onGuardarLook,
  guardandoLookIndice,
}: ColumnasResultadoConjuntoProps) {
  const looks = construirLooks(resultado);
  const columnasGrid =
    resultado.modo === 'prenda_completa' || resultado.prenda_completa.length > 0
      ? 'lg:grid-cols-2'
      : 'lg:grid-cols-3';

  return (
    <div className="space-y-8">
      {looks.map((look) => (
        <section
          key={look.indice}
          className="rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground">
                Look {look.indice + 1}
              </span>
              <p className="mt-3 text-sm text-muted-foreground">
                Esta propuesta agrupa las prendas de la opción {look.indice + 1}.
                Puedes revisar cada pieza, entrar al detalle o guardar el look
                completo directamente.
              </p>
            </div>

            {onGuardarLook && (
              <Button
                type="button"
                size="lg"
                className="gap-2 lg:min-w-48"
                onClick={() => onGuardarLook(look.indice)}
                disabled={guardandoLookIndice === look.indice}
              >
                <BookmarkPlus className="h-5 w-5" />
                {guardandoLookIndice === look.indice
                  ? 'Guardando look...'
                  : 'Guardar look'}
              </Button>
            )}
          </div>

          <div className={cn('grid grid-cols-1 gap-6', columnasGrid)}>
            {look.bloques.map((bloque) => (
              <BloquePrenda
                key={bloque.rol}
                titulo={bloque.titulo}
                icono={bloque.icono}
                item={bloque.item}
                navegacionDetalle={navegacionDetalle}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
