/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Página unificada del área personal. Reúne en un mismo
 *   espacio las prendas guardadas individualmente y los looks
 *   completos que el usuario ha decidido conservar.
 * -----------------------------------------------------------
 */

import { getImageUrl } from '@/api/cliente';
import { getOutfits } from '@/api/conjuntos';
import { getFavoritos } from '@/api/favoritos';
import { MensajeError } from '@/componentes/MensajeError';
import { PageLoader } from '@/componentes/IndicadorCarga';
import { RejillaPrendas } from '@/componentes/RejillaPrendas';
import { EstructuraPagina } from '@/componentes/estructura/EstructuraPagina';
import { Button } from '@/componentes/base/boton';
import { useAuth } from '@/contexto/useAuth';
import { useFavoritos } from '@/contexto/useFavoritos';
import { cn } from '@/utilidades/clases';
import {
  formatearFechaOutfit,
  obtenerEtiquetaRol,
  ordenarItemsOutfit,
} from '@/utilidades/conjuntos';
import type { FavoritoConPrenda, OutfitDetallado, Prenda } from '@/tipos/api';
import { Heart, LogIn, ShoppingBag, Sparkles } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

type VistaArmario = 'prendas' | 'looks';

function obtenerVistaActiva(searchParams: URLSearchParams): VistaArmario {
  return searchParams.get('vista') === 'looks' ? 'looks' : 'prendas';
}

function TarjetaLook({ look }: { look: OutfitDetallado }) {
  // Reordenamos los items para que la vista previa siga siempre la misma lectura visual.
  const items = ordenarItemsOutfit(look.items);
  const titulo = look.outfit.titulo || 'Look guardado';

  return (
    <Link
      to={`/mis-looks/${look.outfit.id}`}
      className="group block rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-accent/40 hover:shadow-elegant"
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-medium transition-colors group-hover:text-accent">
            {titulo}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Guardado el {formatearFechaOutfit(look.outfit.creado_en)}
          </p>
        </div>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
          {items.length} prendas
        </span>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-3">
        {items.slice(0, 3).map((item) => (
          <div
            key={item.item.id}
            className="aspect-[3/4] overflow-hidden rounded-lg bg-secondary"
          >
            <img
              src={getImageUrl(item.prenda.url_imagen)}
              alt={item.prenda.nombre}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
              onError={(evento) => {
                const imagen = evento.target as HTMLImageElement;
                imagen.src = '/imagen-no-disponible.svg';
              }}
            />
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={`${look.outfit.id}-${item.item.rol}`}
            className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
          >
            {obtenerEtiquetaRol(item.item.rol)}
          </span>
        ))}
      </div>
    </Link>
  );
}

export default function Armario() {
  const [searchParams, setSearchParams] = useSearchParams();
  const vistaActiva = obtenerVistaActiva(searchParams);
  const { usuario, cargando: cargandoSesion } = useAuth();
  const { versionFavoritos } = useFavoritos();
  const [favoritos, setFavoritos] = useState<FavoritoConPrenda[]>([]);
  const [looks, setLooks] = useState<OutfitDetallado[]>([]);
  const [cargandoFavoritos, setCargandoFavoritos] = useState(true);
  const [cargandoLooks, setCargandoLooks] = useState(true);
  const [mensajeErrorFavoritos, setMensajeErrorFavoritos] = useState<string | null>(null);
  const [mensajeErrorLooks, setMensajeErrorLooks] = useState<string | null>(null);

  const cargarFavoritos = useCallback(async () => {
    // Esta vista se vuelve a hidratar desde la API cada vez que cambia el usuario o el armario.
    if (!usuario) {
      setFavoritos([]);
      setMensajeErrorFavoritos(null);
      setCargandoFavoritos(false);
      return;
    }

    try {
      setCargandoFavoritos(true);
      setMensajeErrorFavoritos(null);
      const datos = await getFavoritos();
      setFavoritos(datos);
    } catch {
      setMensajeErrorFavoritos('No se pudo cargar tu armario digital. Inténtalo de nuevo.');
    } finally {
      setCargandoFavoritos(false);
    }
  }, [usuario]);

  const cargarLooks = useCallback(async () => {
    // Los looks se piden aparte para mantener separadas las dos vistas del área personal.
    if (!usuario) {
      setLooks([]);
      setMensajeErrorLooks(null);
      setCargandoLooks(false);
      return;
    }

    try {
      setCargandoLooks(true);
      setMensajeErrorLooks(null);
      const datos = await getOutfits();
      setLooks(datos);
    } catch {
      setMensajeErrorLooks('No se pudieron cargar tus looks guardados. Inténtalo otra vez.');
    } finally {
      setCargandoLooks(false);
    }
  }, [usuario]);

  useEffect(() => {
    if (vistaActiva === 'prendas') {
      void cargarFavoritos();
    }
  }, [vistaActiva, cargarFavoritos, versionFavoritos]);

  useEffect(() => {
    if (vistaActiva === 'looks') {
      void cargarLooks();
    }
  }, [vistaActiva, cargarLooks]);

  const cambiarVista = (vista: VistaArmario) => {
    const nuevosSearchParams = new URLSearchParams(searchParams);

    if (vista === 'looks') {
      nuevosSearchParams.set('vista', 'looks');
    } else {
      nuevosSearchParams.delete('vista');
    }

    setSearchParams(nuevosSearchParams);
  };

  if (cargandoSesion || (vistaActiva === 'prendas' ? cargandoFavoritos : cargandoLooks)) {
    return (
      <EstructuraPagina>
        <PageLoader
          texto={
            vistaActiva === 'prendas'
              ? 'Cargando tu armario...'
              : 'Cargando tus looks guardados...'
          }
        />
      </EstructuraPagina>
    );
  }

  if (!usuario) {
    return (
      <EstructuraPagina>
        <section className="py-16 bg-secondary/30 border-b border-border">
          <div className="fashion-container">
            <h1 className="fashion-section-title mb-4">Mi armario</h1>
            <p className="text-muted-foreground text-lg">
              Reúne en un mismo espacio tus prendas favoritas y los looks que decidas guardar.
            </p>
          </div>
        </section>

        <div className="fashion-container py-20">
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Heart className="h-7 w-7" />
            </div>
            <h2 className="mb-4 font-display text-3xl font-medium">Activa tu área personal</h2>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
              Inicia sesión para guardar prendas sueltas en tu armario y conservar los
              looks completos que más te gusten.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link to="/login">
                  <LogIn className="h-5 w-5" />
                  Iniciar sesión
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link to="/catalogo">
                  <ShoppingBag className="h-5 w-5" />
                  Explorar catálogo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </EstructuraPagina>
    );
  }

  const prendasFavoritas: Prenda[] = favoritos.map((favorito) => favorito.prenda);

  return (
    <EstructuraPagina>
      {/* Cabecera unificada del área personal del usuario. */}
      <section className="py-16 bg-secondary/30 border-b border-border">
        <div className="fashion-container">
          <h1 className="fashion-section-title mb-4">Mi armario</h1>
          <p className="text-muted-foreground text-lg">
            Gestiona tanto tus prendas guardadas como los looks completos que has decidido conservar.
          </p>

          <div className="mt-8 inline-flex rounded-full border border-border bg-background p-1">
            <button
              type="button"
              onClick={() => cambiarVista('prendas')}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                vistaActiva === 'prendas'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Prendas guardadas
            </button>
            <button
              type="button"
              onClick={() => cambiarVista('looks')}
              className={cn(
                'rounded-full px-5 py-2 text-sm font-medium transition-colors',
                vistaActiva === 'looks'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Looks guardados
            </button>
          </div>
        </div>
      </section>

      <div className="fashion-container py-10">
        {vistaActiva === 'prendas' ? (
          mensajeErrorFavoritos ? (
            <MensajeError
              mensaje={mensajeErrorFavoritos}
              onReintentar={() => {
                void cargarFavoritos();
              }}
            />
          ) : prendasFavoritas.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Heart className="h-7 w-7" />
              </div>
              <h2 className="mb-3 font-display text-2xl font-medium">Todavía no has guardado prendas</h2>
              <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
                Empieza a guardar prendas desde el catálogo o desde los resultados de recomendación
                para construir tu colección personal.
              </p>
              <Button asChild className="gap-2">
                <Link to="/catalogo">
                  <ShoppingBag className="h-4 w-4" />
                  Ir al catálogo
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8 flex items-center justify-between gap-4">
                <p className="text-muted-foreground">
                  Tienes {prendasFavoritas.length} prendas guardadas
                </p>
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/catalogo">
                    <ShoppingBag className="h-4 w-4" />
                    Seguir explorando
                  </Link>
                </Button>
              </div>

              <RejillaPrendas productos={prendasFavoritas} columnas={3} />
            </>
          )
        ) : mensajeErrorLooks ? (
          <MensajeError
            mensaje={mensajeErrorLooks}
            onReintentar={() => {
              void cargarLooks();
            }}
          />
        ) : looks.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="mb-3 font-display text-2xl font-medium">Todavía no has guardado looks</h2>
            <p className="mx-auto mb-8 max-w-2xl text-muted-foreground">
              Genera un outfit y guarda la propuesta que más te convenza para tenerla siempre a mano.
            </p>
            <Button asChild className="gap-2">
              <Link to="/crear-outfit">
                <Sparkles className="h-4 w-4" />
                Crear mi primer look
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between gap-4">
              <p className="text-muted-foreground">Tienes {looks.length} looks guardados</p>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/crear-outfit">
                  <Sparkles className="h-4 w-4" />
                  Crear otro outfit
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {looks.map((look) => (
                <TarjetaLook key={look.outfit.id} look={look} />
              ))}
            </div>
          </>
        )}
      </div>
    </EstructuraPagina>
  );
}
