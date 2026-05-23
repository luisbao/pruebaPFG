/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Tarjeta visual reutilizable para mostrar una prenda con su
 *   imagen, categoría y acciones rápidas como marcarla como
 *   favorita o acceder a su detalle.
 * -----------------------------------------------------------
 */

import { getImageUrl } from '@/api/cliente';
import { toast } from '@/componentes/base/avisos';
import { useAuth } from '@/contexto/useAuth';
import { useFavoritos } from '@/contexto/useFavoritos';
import { cn } from '@/utilidades/clases';
import { obtenerEtiquetaColorVisible } from '@/utilidades/traduccionesCatalogo';
import type { Prenda } from '@/tipos/api';
import { Heart, Loader2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface NavegacionDetallePrenda {
  rutaVolver: string;
  etiquetaVolver: string;
  estadoVolver?: unknown;
}

interface TarjetaPrendaProps {
  prenda: Prenda;
  similitud?: number;
  className?: string;
  navegacionDetalle?: NavegacionDetallePrenda;
}

function construirNavegacionDetalle(
  pathname: string,
  search: string,
): NavegacionDetallePrenda {
  if (pathname === '/catalogo') {
    return {
      rutaVolver: `/catalogo${search}`,
      etiquetaVolver: 'Volver al catálogo',
    };
  }

  if (pathname === '/buscar-por-imagen') {
    return {
      rutaVolver: '/buscar-por-imagen',
      etiquetaVolver: 'Volver a la búsqueda',
    };
  }

  if (pathname === '/crear-outfit') {
    return {
      rutaVolver: '/crear-outfit',
      etiquetaVolver: 'Volver al outfit',
    };
  }

  if (pathname === '/armario') {
    return {
      rutaVolver: `/armario${search}`,
      etiquetaVolver: 'Volver al armario',
    };
  }

  if (pathname === '/mis-looks') {
    return {
      rutaVolver: '/armario?vista=looks',
      etiquetaVolver: 'Volver al armario',
    };
  }

  if (pathname.startsWith('/mis-looks/')) {
    return {
      rutaVolver: pathname,
      etiquetaVolver: 'Volver al look',
    };
  }

  if (pathname.startsWith('/prenda/')) {
    return {
      rutaVolver: pathname,
      etiquetaVolver: 'Volver a la prenda',
    };
  }

  return {
    rutaVolver: `${pathname}${search}`,
    etiquetaVolver: 'Volver',
  };
}

export function TarjetaPrenda({
  prenda,
  similitud,
  className,
  navegacionDetalle,
}: TarjetaPrendaProps) {
  const location = useLocation();
  const { usuario } = useAuth();
  const {
    alternarFavorito,
    esFavorita,
    estaProcesandoFavorito,
  } = useFavoritos();
  const imageUrl = getImageUrl(prenda.url_imagen);
  const marcadaComoFavorita = esFavorita(prenda.id);
  const procesandoFavorito = estaProcesandoFavorito(prenda.id);
  const etiquetaColor = obtenerEtiquetaColorVisible(prenda.color);
  const etiquetaGenero =
    prenda.genero === 'Men' ? 'Hombre' : prenda.genero === 'Women' ? 'Mujer' : prenda.genero;
  const estadoNavegacionDetalle =
    navegacionDetalle ?? construirNavegacionDetalle(location.pathname, location.search);

  const manejarFavorito = async (evento: React.MouseEvent<HTMLButtonElement>) => {
    // El botón del corazón vive dentro de un enlace, así que evitamos navegar al pulsarlo.
    evento.preventDefault();
    evento.stopPropagation();

    if (!usuario) {
      toast.info('Inicia sesión para guardar prendas en tu armario');
      return;
    }

    try {
      await alternarFavorito(prenda.id);
    } catch {
      // El contexto ya informa del error y mantiene el estado consistente.
    }
  };

  return (
    <Link
      to={`/prenda/${prenda.id}`}
      state={estadoNavegacionDetalle}
      className={cn('group block', className)}
    >
      <article className="fashion-card">
        {/* Imagen principal con efecto hover y badge opcional de similitud. */}
        <div className="relative aspect-[3/4] bg-secondary image-hover-zoom">
          <button
            type="button"
            onClick={manejarFavorito}
            disabled={procesandoFavorito}
            aria-label={
              marcadaComoFavorita
                ? 'Quitar prenda del armario'
                : 'Guardar prenda en el armario'
            }
            className={cn(
              'absolute top-3 left-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/90 text-foreground shadow-sm backdrop-blur-sm transition-colors',
              marcadaComoFavorita
                ? 'text-rose-500 hover:text-rose-600'
                : 'hover:bg-background hover:text-accent',
            )}
          >
            {procesandoFavorito ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart className={cn('h-4 w-4', marcadaComoFavorita && 'fill-current')} />
            )}
          </button>

          <img
            src={imageUrl}
            alt={prenda.nombre}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/imagen-no-disponible.svg';
            }}
          />

          {similitud !== undefined && (
            <div className="absolute top-3 right-3 bg-accent text-accent-foreground px-2 py-1 rounded text-xs font-medium">
              {Math.round(similitud * 100)}% similar
            </div>
          )}

          {/* Capa ligera que invita a abrir el detalle de la prenda. */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100">
            <span className="bg-background text-foreground px-4 py-2 text-xs font-medium uppercase tracking-wider rounded shadow-elegant">
              Ver detalle
            </span>
          </div>
        </div>

        {/* Datos rápidos para identificar la prenda de un vistazo. */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">
              {prenda.categoria}
            </span>
            <span className="text-xs px-2 py-0.5 bg-secondary rounded">{etiquetaGenero}</span>
          </div>

          <h3 className="font-medium text-foreground line-clamp-2 mb-2 group-hover:text-accent transition-colors">
            {prenda.nombre}
          </h3>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{prenda.categoria}</span>
            {etiquetaColor && (
              <span className="text-xs text-muted-foreground capitalize">{etiquetaColor}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
