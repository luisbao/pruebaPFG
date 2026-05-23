/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Pantalla de detalle de una prenda concreta del catálogo.
 *   Muestra su información principal, la imagen ampliada y una
 *   selección de recomendaciones visualmente similares.
 * -----------------------------------------------------------
 */

import { MensajeError } from '@/componentes/MensajeError';
import { PageLoader } from '@/componentes/IndicadorCarga';
import { RejillaPrendas } from '@/componentes/RejillaPrendas';
import { EstructuraPagina } from '@/componentes/estructura/EstructuraPagina';
import { Button } from '@/componentes/base/boton';
import { getImageUrl } from '@/api/cliente';
import { getPrenda } from '@/api/prendas';
import { recomendarPorPrenda } from '@/api/recomendacion';
import { obtenerEtiquetaColorVisible } from '@/utilidades/traduccionesCatalogo';
import type { Prenda, PrendaConSimilitud } from '@/tipos/api';
import { ArrowLeft, ShoppingBag, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';

interface NavegacionDetallePrenda {
  rutaVolver?: string;
  etiquetaVolver?: string;
  estadoVolver?: unknown;
}

export default function DetallePrenda() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [prenda, setPrenda] = useState<Prenda | null>(null);
  const [similares, setSimilares] = useState<PrendaConSimilitud[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoSimilares, setCargandoSimilares] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [mostrarBloqueSimilares, setMostrarBloqueSimilares] = useState(false);
  const datosNavegacion = (location.state as NavegacionDetallePrenda | null) || null;
  const rutaVolver = datosNavegacion?.rutaVolver || '/catalogo';
  const etiquetaVolver = datosNavegacion?.etiquetaVolver || 'Volver al catálogo';
  const estadoVolver = datosNavegacion?.estadoVolver;
  const etiquetaColor = obtenerEtiquetaColorVisible(prenda?.color);

  useEffect(() => {
    // Cada cambio de ruta obliga a recargar la prenda y limpiar recomendaciones anteriores.
    const cargarPrenda = async () => {
      if (!id) return;

      setCargando(true);
      setMensajeError(null);
      setSimilares([]);
      setMostrarBloqueSimilares(false);

      try {
        const data = await getPrenda(Number(id));
        setPrenda(data);
      } catch {
        setMensajeError('No se pudo cargar el producto. Verifica que el backend esté funcionando.');
      } finally {
        setCargando(false);
      }
    };

    cargarPrenda();
  }, [id]);

  const mostrarSimilares = async () => {
    // Las recomendaciones similares solo se piden cuando el usuario las solicita.
    if (!prenda || cargandoSimilares) return;

    setCargandoSimilares(true);
    setMostrarBloqueSimilares(true);

    try {
      const data = await recomendarPorPrenda(prenda.id, 12);
      setSimilares(data);
    } catch {
      setSimilares([]);
    } finally {
      setCargandoSimilares(false);
    }
  };

  if (cargando) {
    return (
      <EstructuraPagina>
        <PageLoader texto="Cargando producto..." />
      </EstructuraPagina>
    );
  }

  if (mensajeError || !prenda) {
    return (
      <EstructuraPagina>
        <div className="fashion-container py-20">
          <MensajeError mensaje={mensajeError || 'Producto no encontrado'} />
          <div className="text-center mt-8">
            <Link to={rutaVolver} state={estadoVolver}>
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                {etiquetaVolver}
              </Button>
            </Link>
          </div>
        </div>
      </EstructuraPagina>
    );
  }

  return (
    <EstructuraPagina>
      {/* Migas simples para volver al catálogo sin perder el contexto. */}
      <div className="bg-secondary/30 border-b border-border">
        <div className="fashion-container py-4">
          <Link
            to={rutaVolver}
            state={estadoVolver}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {etiquetaVolver}
          </Link>
        </div>
      </div>

      {/* Ficha principal de la prenda seleccionada. */}
      <section className="py-12">
        <div className="fashion-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Imagen principal con un pequeño chip de género. */}
            <div className="relative aspect-[3/4] bg-secondary rounded-lg overflow-hidden animate-fade-in">
              <img
                src={getImageUrl(prenda.url_imagen)}
                alt={prenda.nombre}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/imagen-no-disponible.svg';
                }}
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <span className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
                  {prenda.genero === 'Men' ? 'Hombre' : 'Mujer'}
                </span>
              </div>
            </div>

            {/* Resumen textual con atributos y acciones. */}
            <div className="animate-slide-up">
              <div className="mb-2">
                <span className="text-accent text-sm font-medium uppercase tracking-wide">
                  {prenda.categoria}
                </span>
              </div>

              <h1 className="font-display text-3xl md:text-4xl font-medium mb-4">
                {prenda.nombre}
              </h1>

              <p className="text-muted-foreground leading-relaxed mb-8">
                {prenda.descripcion}
              </p>

              {/* Datos rápidos para que la ficha sea fácil de escanear. */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
                    Color
                  </span>
                  <span className="font-medium capitalize">
                    {etiquetaColor ?? 'No definido'}
                  </span>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
                    Categoría
                  </span>
                  <span className="font-medium">{prenda.categoria}</span>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
                    Género
                  </span>
                  <span className="font-medium">
                    {prenda.genero === 'Men' ? 'Hombre' : 'Mujer'}
                  </span>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide block mb-1">
                    Código
                  </span>
                  <span className="font-medium font-mono text-sm">{prenda.codigo_articulo}</span>
                </div>
              </div>

              {/* Acciones principales de la ficha. */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={mostrarSimilares}
                  disabled={cargandoSimilares}
                  className="gap-2 flex-1"
                >
                  <Sparkles className="w-5 h-5" />
                  {cargandoSimilares ? 'Buscando...' : 'Ver prendas similares'}
                </Button>
                <Link to={rutaVolver} state={estadoVolver} className="flex-1">
                  <Button size="lg" variant="outline" className="gap-2 w-full">
                    <ShoppingBag className="w-5 h-5" />
                    {etiquetaVolver}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rejilla secundaria con recomendaciones basadas en la prenda actual. */}
      {mostrarBloqueSimilares && (
        <section className="py-12 bg-secondary/30 border-t border-border animate-fade-in">
          <div className="fashion-container">
            <h2 className="fashion-section-title mb-8">Prendas Similares</h2>

            {cargandoSimilares ? (
              <PageLoader texto="Buscando prendas similares..." />
            ) : similares.length > 0 ? (
              <RejillaPrendas productos={similares} columnas={4} />
            ) : (
              <p className="text-center text-muted-foreground py-12">
                No se encontraron prendas similares
              </p>
            )}
          </div>
        </section>
      )}
    </EstructuraPagina>
  );
}
