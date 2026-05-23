/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Pantalla de búsqueda visual por imagen. Permite subir una
 *   foto de referencia, enviarla al backend y mostrar las
 *   recomendaciones de prendas similares.
 * -----------------------------------------------------------
 */

import { MensajeError } from '@/componentes/MensajeError';
import { SubidaImagen } from '@/componentes/SubidaImagen';
import { IndicadorCarga } from '@/componentes/IndicadorCarga';
import { RejillaPrendas } from '@/componentes/RejillaPrendas';
import { EstructuraPagina } from '@/componentes/estructura/EstructuraPagina';
import { Button } from '@/componentes/base/boton';
import { recomendarPorImagen } from '@/api/recomendacion';
import type { PrendaConSimilitud } from '@/tipos/api';
import { ArrowLeft, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface RestauracionBusquedaImagen {
  restaurarBusquedaImagen?: {
    resultados: PrendaConSimilitud[];
  };
}

export default function BuscarPorImagen() {
  const location = useLocation();
  const navigate = useNavigate();
  const [imagenSeleccionada, setImagenSeleccionada] = useState<File | null>(null);
  const [resultados, setResultados] = useState<PrendaConSimilitud[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [haBuscado, setHaBuscado] = useState(false);

  useEffect(() => {
    const estadoRestauracion = location.state as RestauracionBusquedaImagen | null;
    const restauracion = estadoRestauracion?.restaurarBusquedaImagen;

    if (!restauracion) {
      return;
    }

    setResultados(restauracion.resultados);
    setHaBuscado(true);
    setMensajeError(null);
    setCargando(false);

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const manejarSeleccionImagen = async (file: File) => {
    setImagenSeleccionada(file);
    setMensajeError(null);
    setCargando(true);
    setResultados([]);
    setHaBuscado(true);

    try {
      const recomendaciones = await recomendarPorImagen(file);
      setResultados(recomendaciones);
    } catch {
      setMensajeError(
        'No se pudieron obtener recomendaciones. Verifica que el backend esté funcionando.',
      );
    } finally {
      setCargando(false);
    }
  };

  const reintentarBusqueda = () => {
    if (imagenSeleccionada) {
      manejarSeleccionImagen(imagenSeleccionada);
    }
  };

  const navegacionDetalleBusqueda = resultados.length
    ? {
        rutaVolver: '/buscar-por-imagen',
        etiquetaVolver: 'Volver a la búsqueda',
        estadoVolver: {
          restaurarBusquedaImagen: {
            resultados,
          },
        },
      }
    : undefined;

  return (
    <EstructuraPagina>
      <section className="py-12 bg-secondary/30 border-b border-border">
        <div className="fashion-container">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
          <h1 className="fashion-section-title mb-4">Buscar por Imagen</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Sube una foto de cualquier prenda y el sistema buscará productos
            visualmente similares en el catálogo de H&amp;M
          </p>
        </div>
      </section>

      <div className="fashion-container py-12">
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-card rounded-xl border border-border p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Search className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="font-display text-xl font-medium">Sube tu imagen</h2>
                <p className="text-sm text-muted-foreground">JPG, PNG o WebP hasta 10MB</p>
              </div>
            </div>

            <SubidaImagen
              onSeleccionarImagen={manejarSeleccionImagen}
              onLimpiarImagen={() => {
                setImagenSeleccionada(null);
                setResultados([]);
                setMensajeError(null);
                setHaBuscado(false);
              }}
              deshabilitado={cargando}
            />

            {cargando && (
              <div className="mt-8 text-center">
                <IndicadorCarga texto="Analizando imagen con CLIP y buscando similares..." />
              </div>
            )}
          </div>
        </div>

        {mensajeError && (
          <MensajeError
            mensaje={mensajeError}
            onReintentar={reintentarBusqueda}
            className="mb-12"
          />
        )}

        {!cargando && haBuscado && !mensajeError && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-medium">
                {resultados.length > 0
                  ? `Encontramos ${resultados.length} prendas similares`
                  : 'No se encontraron resultados'}
              </h2>
            </div>

            {resultados.length > 0 ? (
              <RejillaPrendas
                productos={resultados}
                columnas={4}
                navegacionDetalle={navegacionDetalleBusqueda}
              />
            ) : (
              <div className="text-center py-12 bg-secondary/30 rounded-xl">
                <p className="text-muted-foreground mb-4">
                  No encontramos prendas similares a tu imagen. Prueba con otra foto.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setHaBuscado(false);
                    setImagenSeleccionada(null);
                  }}
                >
                  Subir otra imagen
                </Button>
              </div>
            )}
          </div>
        )}

        {!haBuscado && (
          <div className="max-w-2xl mx-auto">
            <h3 className="font-display text-lg font-medium mb-4">
              Consejos para mejores resultados
            </h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-accent font-semibold">•</span>
                Usa imágenes con buena iluminación y fondo neutro
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent font-semibold">•</span>
                Enfoca en una sola prenda para obtener resultados más precisos
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent font-semibold">•</span>
                Las imágenes frontales funcionan mejor que las de ángulo
              </li>
            </ul>
          </div>
        )}
      </div>
    </EstructuraPagina>
  );
}
