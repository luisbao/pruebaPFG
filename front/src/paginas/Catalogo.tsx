/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Página principal del catálogo. Coordina la carga de prendas,
 *   las opciones de filtrado, la paginación y la representación
 *   visual de los resultados disponibles.
 * -----------------------------------------------------------
 */

import { MensajeError } from '@/componentes/MensajeError';
import { PanelFiltros } from '@/componentes/PanelFiltros';
import { PageLoader } from '@/componentes/IndicadorCarga';
import { Paginacion } from '@/componentes/Paginacion';
import { RejillaPrendas } from '@/componentes/RejillaPrendas';
import { EstructuraPagina } from '@/componentes/estructura/EstructuraPagina';
import { Button } from '@/componentes/base/boton';
import { getOpcionesFiltros, getPrendas } from '@/api/prendas';
import type { FiltrosPrenda, OpcionesFiltros, Prenda } from '@/tipos/api';
import { Filter, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const ITEMS_PER_PAGE = 24;

function leerFiltrosDesdeBusqueda(searchParams: URLSearchParams): FiltrosPrenda {
  const offset = Number(searchParams.get('offset') || '0');
  const limit = Number(searchParams.get('limit') || String(ITEMS_PER_PAGE));

  return {
    genero: searchParams.get('genero') || undefined,
    categoria: searchParams.get('categoria') || undefined,
    color: searchParams.get('color') || undefined,
    offset: Number.isNaN(offset) ? 0 : offset,
    limit: Number.isNaN(limit) ? ITEMS_PER_PAGE : limit,
  };
}

function construirBusquedaDesdeFiltros(filtros: FiltrosPrenda): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (filtros.genero) {
    searchParams.set('genero', filtros.genero);
  }
  if (filtros.categoria) {
    searchParams.set('categoria', filtros.categoria);
  }
  if (filtros.color) {
    searchParams.set('color', filtros.color);
  }

  searchParams.set('offset', String(filtros.offset || 0));
  searchParams.set('limit', String(filtros.limit || ITEMS_PER_PAGE));

  return searchParams;
}

function sanitizarFiltrosSegunOpciones(
  filtros: FiltrosPrenda,
  opciones: OpcionesFiltros,
): FiltrosPrenda {
  return {
    ...filtros,
    categoria:
      filtros.categoria && !opciones.categorias.includes(filtros.categoria)
        ? undefined
        : filtros.categoria,
    color:
      filtros.color && !opciones.colores.includes(filtros.color)
        ? undefined
        : filtros.color,
  };
}

export default function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [prendas, setPrendas] = useState<Prenda[]>([]);
  const [opciones, setOpciones] = useState<OpcionesFiltros | null>(null);
  const [filtros, setFiltros] = useState<FiltrosPrenda>(() =>
    leerFiltrosDesdeBusqueda(searchParams),
  );
  const [cargando, setCargando] = useState(true);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [mostrarFiltrosMovil, setMostrarFiltrosMovil] = useState(false);

  const cargarPrendas = useCallback(async (filtrosActuales: FiltrosPrenda) => {
    // El catálogo siempre se refresca desde backend para que filtros y paginación sean consistentes.
    setCargando(true);
    setMensajeError(null);

    try {
      const data = await getPrendas(filtrosActuales);
      setPrendas(data);
    } catch {
      setMensajeError('No se pudieron cargar los productos. Verifica que el backend esté funcionando.');
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarOpciones = useCallback(async (genero?: string) => {
    // Las opciones se adaptan al género activo para evitar combinaciones vacías.
    try {
      const data = await getOpcionesFiltros(genero);
      setOpciones(data);
      setFiltros((filtrosActuales) =>
        sanitizarFiltrosSegunOpciones(filtrosActuales, data),
      );
    } catch {
      setOpciones(null);
    }
  }, []);

  useEffect(() => {
    // Al cambiar el género actualizamos las opciones disponibles del catálogo.
    cargarOpciones(filtros.genero);
  }, [cargarOpciones, filtros.genero]);

  useEffect(() => {
    // La URL actúa como fuente de verdad para conservar filtros y paginación al volver del detalle.
    const filtrosDesdeUrl = leerFiltrosDesdeBusqueda(searchParams);
    setFiltros(filtrosDesdeUrl);
    cargarPrendas(filtrosDesdeUrl);
  }, [searchParams, cargarPrendas]);

  const actualizarBusquedaCatalogo = (nuevosFiltros: FiltrosPrenda) => {
    setFiltros(nuevosFiltros);
    setSearchParams(construirBusquedaDesdeFiltros(nuevosFiltros));
  };

  const aplicarFiltros = () => {
    // Al aplicar, reiniciamos la paginación para no dejar al usuario en offsets antiguos.
    const nuevosFiltros = { ...filtros, offset: 0 };
    actualizarBusquedaCatalogo(nuevosFiltros);
    setMostrarFiltrosMovil(false);
  };

  const limpiarFiltros = () => {
    // Limpiar devuelve el catálogo a su estado base y cierra el panel móvil si estaba abierto.
    const filtrosLimpios = { offset: 0, limit: ITEMS_PER_PAGE };
    actualizarBusquedaCatalogo(filtrosLimpios);
    setMostrarFiltrosMovil(false);
  };

  const irPaginaAnterior = () => {
    // La paginación se basa en offset para mantener compatibilidad con la API actual.
    const nuevoOffset = Math.max(0, (filtros.offset || 0) - ITEMS_PER_PAGE);
    const nuevosFiltros = { ...filtros, offset: nuevoOffset };
    actualizarBusquedaCatalogo(nuevosFiltros);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const irPaginaSiguiente = () => {
    // Al avanzar repetimos la consulta con el siguiente bloque de productos.
    const nuevoOffset = (filtros.offset || 0) + ITEMS_PER_PAGE;
    const nuevosFiltros = { ...filtros, offset: nuevoOffset };
    actualizarBusquedaCatalogo(nuevosFiltros);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cantidadFiltrosActivos = Object.entries(filtros).filter(
    ([key, value]) => !['offset', 'limit'].includes(key) && value !== undefined && value !== '',
  ).length;

  return (
    <EstructuraPagina>
      {/* Cabecera descriptiva de la página de catálogo. */}
      <section className="py-12 bg-secondary/30 border-b border-border">
        <div className="fashion-container">
          <h1 className="fashion-section-title mb-4">Catálogo</h1>
          <p className="text-muted-foreground text-lg">
            Explora nuestra colección de más de 46.000 productos
          </p>
        </div>
      </section>

      <div className="fashion-container py-8">
        <div className="flex gap-8">
          {/* Barra lateral fija en escritorio con todos los filtros. */}
          {opciones && (
            <div className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-24">
                <PanelFiltros
                  opciones={opciones}
                  filtros={filtros}
                  onFiltrosChange={setFiltros}
                  onAplicar={aplicarFiltros}
                  onLimpiar={limpiarFiltros}
                />
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {/* En móvil abrimos los filtros en una capa lateral. */}
            <div className="lg:hidden mb-6">
              <Button
                variant="outline"
                onClick={() => setMostrarFiltrosMovil(true)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filtros
                {cantidadFiltrosActivos > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-accent text-accent-foreground text-xs rounded-full">
                    {cantidadFiltrosActivos}
                  </span>
                )}
              </Button>
            </div>

            {/* El cuerpo central alterna entre carga, error y resultados. */}
            {cargando ? (
              <PageLoader texto="Cargando productos..." />
            ) : mensajeError ? (
              <MensajeError
                mensaje={mensajeError}
                onReintentar={() => cargarPrendas(filtros)}
              />
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-muted-foreground">
                    Mostrando {prendas.length} productos
                  </p>
                </div>

                <RejillaPrendas productos={prendas} columnas={3} />

                {prendas.length > 0 && (
                  <Paginacion
                    desplazamiento={filtros.offset || 0}
                    limite={ITEMS_PER_PAGE}
                    hayMas={prendas.length === ITEMS_PER_PAGE}
                    onAnterior={irPaginaAnterior}
                    onSiguiente={irPaginaSiguiente}
                    className="mt-12"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Panel lateral de filtros para pantallas pequeñas. */}
      {mostrarFiltrosMovil && opciones && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/50"
            onClick={() => setMostrarFiltrosMovil(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-medium">Filtros</h2>
              <button
                onClick={() => setMostrarFiltrosMovil(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                aria-label="Cerrar filtros"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <PanelFiltros
                opciones={opciones}
                filtros={filtros}
                onFiltrosChange={setFiltros}
                onAplicar={aplicarFiltros}
                onLimpiar={limpiarFiltros}
              />
            </div>
          </div>
        </div>
      )}
    </EstructuraPagina>
  );
}
