/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Barra lateral de filtros del catálogo. Agrupa la selección
 *   de género, categoría y color, y coordina la edición local
 *   de filtros antes de aplicarlos.
 * -----------------------------------------------------------
 */

import { Button } from '@/componentes/base/boton';
import { Checkbox } from '@/componentes/base/casilla-verificacion';
import { cn } from '@/utilidades/clases';
import {
  traducirCategoriaCatalogo,
  traducirColorCatalogo,
} from '@/utilidades/traduccionesCatalogo';
import type { FiltrosPrenda, OpcionesFiltros } from '@/tipos/api';
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PanelFiltrosProps {
  opciones: OpcionesFiltros;
  filtros: FiltrosPrenda;
  onFiltrosChange: (filtros: FiltrosPrenda) => void;
  onAplicar: () => void;
  onLimpiar: () => void;
  className?: string;
}

interface FilterSectionProps {
  titulo: string;
  children: React.ReactNode;
  abiertaPorDefecto?: boolean;
}

function SeccionFiltro({
  titulo,
  children,
  abiertaPorDefecto = true,
}: FilterSectionProps) {
  // Cada bloque del filtro puede plegarse de forma independiente para ahorrar espacio.
  const [estaAbierta, setEstaAbierta] = useState(abiertaPorDefecto);

  return (
    <div className="border-b border-border pb-4">
      <button
        onClick={() => setEstaAbierta(!estaAbierta)}
        className="flex items-center justify-between w-full py-2 text-sm font-medium uppercase tracking-wide text-foreground hover:text-accent transition-colors"
      >
        {titulo}
        {estaAbierta ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {estaAbierta && <div className="mt-3 animate-fade-in">{children}</div>}
    </div>
  );
}

function obtenerCategoriasTraducidas(categorias: string[]) {
  return categorias
    .map((categoria) => ({
      value: categoria,
      label: traducirCategoriaCatalogo(categoria),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

function obtenerColoresTraducidos(colores: string[]) {
  return colores
    .map((color) => ({
      value: color,
      label: traducirColorCatalogo(color),
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}

export function PanelFiltros({
  opciones,
  filtros,
  onFiltrosChange,
  onAplicar,
  onLimpiar,
  className,
}: PanelFiltrosProps) {
  const [filtrosLocales, setFiltrosLocales] = useState<FiltrosPrenda>(filtros);
  const categoriasTraducidas = obtenerCategoriasTraducidas(opciones.categorias);
  const coloresTraducidos = obtenerColoresTraducidos(opciones.colores);

  useEffect(() => {
    // Si el padre reinicia filtros o cambia de página, sincronizamos el estado local.
    setFiltrosLocales(filtros);
  }, [filtros]);

  const actualizarFiltro = <K extends keyof FiltrosPrenda>(
    clave: K,
    valor: FiltrosPrenda[K],
  ) => {
    const nuevosFiltros = { ...filtrosLocales, [clave]: valor };
    setFiltrosLocales(nuevosFiltros);
    onFiltrosChange(nuevosFiltros);
  };

  const hayFiltrosActivos = Object.entries(filtrosLocales).some(
    ([clave, valor]) =>
      !['offset', 'limit'].includes(clave) && valor !== undefined && valor !== '',
  );

  return (
    // El sidebar agrupa todos los filtros en una única columna reutilizable.
    <aside className={cn('bg-card p-6 rounded-lg border border-border', className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-accent" />
          <h2 className="font-display text-lg font-medium">Filtros</h2>
        </div>
        {hayFiltrosActivos && (
          <button
            onClick={onLimpiar}
            className="text-xs text-muted-foreground hover:text-accent transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Limpiar
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Género */}
        <SeccionFiltro titulo="Género">
          <div className="space-y-3">
            {opciones.generos.map((genero) => (
              <label key={genero} className="flex items-center gap-3 cursor-pointer group">
                <Checkbox
                  checked={filtrosLocales.genero === genero}
                  onCheckedChange={(checked) =>
                    actualizarFiltro('genero', checked ? genero : undefined)
                  }
                />
                <span className="text-sm text-foreground group-hover:text-accent transition-colors">
                  {genero === 'Men' ? 'Hombre' : 'Mujer'}
                </span>
              </label>
            ))}
          </div>
        </SeccionFiltro>

        {/* Categoría */}
        <SeccionFiltro titulo="Categoría">
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {categoriasTraducidas.map((categoria) => (
              <label key={categoria.value} className="flex items-center gap-3 cursor-pointer group">
                <Checkbox
                  checked={filtrosLocales.categoria === categoria.value}
                  onCheckedChange={(checked) =>
                    actualizarFiltro('categoria', checked ? categoria.value : undefined)
                  }
                />
                <span className="text-sm text-foreground group-hover:text-accent transition-colors">
                  {categoria.label}
                </span>
              </label>
            ))}
          </div>
        </SeccionFiltro>

        {/* Color */}
        <SeccionFiltro titulo="Color">
          <div className="flex flex-wrap gap-2">
            {coloresTraducidos.slice(0, 12).map((color) => (
              <button
                key={color.value}
                onClick={() =>
                  actualizarFiltro(
                    'color',
                    filtrosLocales.color === color.value ? undefined : color.value,
                  )
                }
                className={cn(
                  'px-3 py-1.5 text-xs rounded-full border transition-all',
                  filtrosLocales.color === color.value
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border bg-secondary text-secondary-foreground hover:border-accent',
                )}
              >
                {color.label}
              </button>
            ))}
          </div>
        </SeccionFiltro>

      </div>

      <div className="mt-6 space-y-3">
        <Button onClick={onAplicar} className="w-full">
          Aplicar filtros
        </Button>
        <Button onClick={onLimpiar} variant="outline" className="w-full">
          Limpiar filtros
        </Button>
      </div>
    </aside>
  );
}
