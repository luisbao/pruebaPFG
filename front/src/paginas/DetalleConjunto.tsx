/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Página de detalle de un conjunto guardado. Recupera el look
 *   seleccionado del backend, muestra sus prendas asociadas y
 *   permite eliminarlo si el usuario lo desea.
 * -----------------------------------------------------------
 */

import { eliminarOutfit, getOutfit } from '@/api/conjuntos';
import { MensajeError } from '@/componentes/MensajeError';
import { PageLoader } from '@/componentes/IndicadorCarga';
import { TarjetaPrenda } from '@/componentes/TarjetaPrenda';
import { EstructuraPagina } from '@/componentes/estructura/EstructuraPagina';
import { Button } from '@/componentes/base/boton';
import { toast } from '@/componentes/base/avisos';
import { useAuth } from '@/contexto/useAuth';
import { formatearFechaOutfit, obtenerEtiquetaRol, ordenarItemsOutfit } from '@/utilidades/conjuntos';
import type { OutfitDetallado } from '@/tipos/api';
import { ArrowLeft, Sparkles, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

export default function DetalleConjunto() {
  const { usuario, cargando: cargandoSesion } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [look, setLook] = useState<OutfitDetallado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [eliminando, setEliminando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  useEffect(() => {
    // Cargamos el look al entrar en la ruta y lo invalidamos si cambia la sesión.
    const cargarLook = async () => {
      if (!id) {
        setMensajeError('No se ha indicado ningún look');
        setCargando(false);
        return;
      }

      if (!usuario) {
        setLook(null);
        setMensajeError(null);
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        setMensajeError(null);
        const datos = await getOutfit(Number(id));
        setLook(datos);
      } catch {
        setMensajeError('No se pudo cargar el look guardado.');
      } finally {
        setCargando(false);
      }
    };

    void cargarLook();
  }, [id, usuario]);

  const manejarEliminacion = async () => {
    if (!look || eliminando) {
      return;
    }

    // Pedimos confirmación porque la eliminación es irreversible para el usuario.
    const confirmar = window.confirm('¿Quieres eliminar este look guardado?');
    if (!confirmar) {
      return;
    }

    try {
      setEliminando(true);
      await eliminarOutfit(look.outfit.id);
      toast.success('Look eliminado correctamente');
      navigate('/armario?vista=looks');
    } catch {
      toast.error('No se pudo eliminar el look guardado');
    } finally {
      setEliminando(false);
    }
  };

  if (cargandoSesion || cargando) {
    return (
      <EstructuraPagina>
        <PageLoader texto="Cargando look guardado..." />
      </EstructuraPagina>
    );
  }

  if (!usuario) {
    return (
      <EstructuraPagina>
        <div className="fashion-container py-20">
          <MensajeError mensaje="Necesitas iniciar sesión para ver este look." />
          <div className="mt-8 text-center">
            <Button asChild>
              <Link to="/login">Ir al inicio de sesión</Link>
            </Button>
          </div>
        </div>
      </EstructuraPagina>
    );
  }

  if (mensajeError || !look) {
    return (
      <EstructuraPagina>
        <div className="fashion-container py-20">
          <MensajeError mensaje={mensajeError || 'Look no encontrado'} />
          <div className="mt-8 text-center">
            <Button asChild variant="outline" className="gap-2">
              <Link to="/armario?vista=looks">
                <ArrowLeft className="h-4 w-4" />
                Volver al armario
              </Link>
            </Button>
          </div>
        </div>
      </EstructuraPagina>
    );
  }

  const itemsOrdenados = ordenarItemsOutfit(look.items);
  const titulo = look.outfit.titulo || 'Look guardado';

  return (
    <EstructuraPagina>
      {/* Cabecera con acciones para reutilizar o eliminar el look guardado. */}
      <section className="py-12 bg-secondary/30 border-b border-border">
        <div className="fashion-container">
          <Link
            to="/armario?vista=looks"
            className="mb-4 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al armario
          </Link>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="fashion-section-title mb-4">{titulo}</h1>
              <p className="text-muted-foreground text-lg">
                Guardado el {formatearFechaOutfit(look.outfit.creado_en)}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/crear-outfit">
                  <Sparkles className="h-4 w-4" />
                  Crear otro outfit
                </Link>
              </Button>
              <Button
                variant="destructive"
                className="gap-2"
                onClick={manejarEliminacion}
                disabled={eliminando}
              >
                <Trash2 className="h-4 w-4" />
                {eliminando ? 'Eliminando...' : 'Eliminar look'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="fashion-container py-10">
        <div className="mb-8 flex flex-wrap gap-2">
          {itemsOrdenados.map((item) => (
            <span
              key={`${look.outfit.id}-${item.item.rol}`}
              className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent"
            >
              {obtenerEtiquetaRol(item.item.rol)}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {itemsOrdenados.map((item) => (
            <div key={item.item.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4">
                <h2 className="font-display text-xl font-medium">
                  {obtenerEtiquetaRol(item.item.rol)}
                </h2>
              </div>
              <TarjetaPrenda prenda={item.prenda} />
            </div>
          ))}
        </div>
      </div>
    </EstructuraPagina>
  );
}
