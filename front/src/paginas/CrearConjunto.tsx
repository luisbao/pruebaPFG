/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Pantalla del generador de conjuntos. Recoge una imagen del
 *   usuario, envía la petición al backend, presenta el resultado
 *   por columnas y permite guardar el look si hay sesión activa.
 * -----------------------------------------------------------
 */

import { guardarOutfit } from '@/api/conjuntos';
import { MensajeError } from '@/componentes/MensajeError';
import { SubidaImagen } from '@/componentes/SubidaImagen';
import { IndicadorCarga } from '@/componentes/IndicadorCarga';
import { ColumnasResultadoConjunto } from '@/componentes/ColumnasResultadoConjunto';
import { EstructuraPagina } from '@/componentes/estructura/EstructuraPagina';
import { Button } from '@/componentes/base/boton';
import { Label } from '@/componentes/base/etiqueta';
import { toast } from '@/componentes/base/avisos';
import { useAuth } from '@/contexto/useAuth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/componentes/base/selector';
import { crearOutfit } from '@/api/recomendacion';
import type { CrearOutfitParams, ConjuntoCrear, ResultadoConjunto } from '@/tipos/api';
import {
  CATEGORIAS_CALZADO,
  CATEGORIAS_PARTE_ABAJO,
  CATEGORIAS_PARTE_ARRIBA,
  CATEGORIAS_PRENDA_COMPLETA,
  existeCategoriaParaGenero,
  filtrarCategoriasPorGenero,
  type CategoriaOutfitOption,
} from '@/utilidades/categoriasOutfit';
import { ArrowLeft, BookmarkPlus, Shirt, Sparkles } from 'lucide-react';
import { cn } from '@/utilidades/clases';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

type TipoOutfit = 'por_partes' | 'prenda_completa';

interface RestauracionCrearOutfit {
  restaurarCrearOutfit?: {
    resultado: ResultadoConjunto;
    params: CrearOutfitParams;
  };
}

function construirLookGuardado(
  resultado: ResultadoConjunto,
  indiceLook: number,
): ConjuntoCrear | null {
  const items = [];
  const prendaCompleta = resultado.prenda_completa?.[indiceLook];
  const parteArriba = resultado.parte_arriba?.[indiceLook];
  const parteAbajo = resultado.parte_abajo?.[indiceLook];
  const calzado = resultado.calzado?.[indiceLook];

  if (prendaCompleta) {
    items.push({
      prenda_id: prendaCompleta.prenda.id,
      rol: 'vestido' as const,
    });
  } else {
    if (parteArriba) {
      items.push({
        prenda_id: parteArriba.prenda.id,
        rol: 'parte_arriba' as const,
      });
    }

    if (parteAbajo) {
      items.push({
        prenda_id: parteAbajo.prenda.id,
        rol: 'parte_abajo' as const,
      });
    }
  }

  if (calzado) {
    items.push({
      prenda_id: calzado.prenda.id,
      rol: 'calzado' as const,
    });
  }

  if (items.length === 0) {
    return null;
  }

  const fecha = new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  return {
    titulo: `Look ${indiceLook + 1} guardado ${fecha}`,
    items,
  };
}

interface SelectorCategoriaOutfitProps {
  id: string;
  label: string;
  placeholder: string;
  value?: string;
  opciones: CategoriaOutfitOption[];
  disabled: boolean;
  onChange: (value: string | undefined) => void;
}

function SelectorCategoriaOutfit({
  id,
  label,
  placeholder,
  value,
  opciones,
  disabled,
  onChange,
}: SelectorCategoriaOutfitProps) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium mb-2 block">
        {label}
      </Label>
      <Select
        value={value || 'none'}
        onValueChange={(nuevoValor) =>
          onChange(nuevoValor === 'none' ? undefined : nuevoValor)
        }
        disabled={disabled}
      >
        <SelectTrigger id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin preferencia</SelectItem>
          {opciones.map((opcion) => (
            <SelectItem key={opcion.value} value={opcion.value}>
              {opcion.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface TarjetaTipoOutfitProps {
  tipo: TipoOutfit;
  titulo: string;
  descripcion: string;
  icono: React.ReactNode;
  activo: boolean;
  disabled: boolean;
  onSeleccionar: (tipo: TipoOutfit) => void;
}

function TarjetaTipoOutfit({
  tipo,
  titulo,
  descripcion,
  icono,
  activo,
  disabled,
  onSeleccionar,
}: TarjetaTipoOutfitProps) {
  return (
    <button
      type="button"
      onClick={() => onSeleccionar(tipo)}
      disabled={disabled}
      className={cn(
        'w-full rounded-2xl border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60',
        'hover:-translate-y-0.5 hover:border-accent/60 hover:shadow-sm',
        activo
          ? 'border-accent bg-accent/10 shadow-sm'
          : 'border-border bg-background',
      )}
    >
      <span className="mb-3 flex items-center gap-3">
        <span
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            activo ? 'bg-accent text-accent-foreground' : 'bg-secondary text-muted-foreground',
          )}
        >
          {icono}
        </span>
        <span className="font-display text-base font-medium text-foreground">
          {titulo}
        </span>
      </span>
      <span className="block text-sm leading-relaxed text-muted-foreground">
        {descripcion}
      </span>
    </button>
  );
}

export default function CrearConjunto() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [imagenSeleccionada, setImagenSeleccionada] = useState<File | null>(null);
  const [params, setParams] = useState<CrearOutfitParams>({});
  const [resultado, setResultado] = useState<ResultadoConjunto | null>(null);
  const [cargando, setCargando] = useState(false);
  const [guardandoLookIndice, setGuardandoLookIndice] = useState<number | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const tipoOutfit = params.tipo_outfit ?? 'por_partes';
  const categoriasParteArriba = filtrarCategoriasPorGenero(
    CATEGORIAS_PARTE_ARRIBA,
    params.genero,
  );
  const categoriasParteAbajo = filtrarCategoriasPorGenero(
    CATEGORIAS_PARTE_ABAJO,
    params.genero,
  );
  const categoriasCalzado = filtrarCategoriasPorGenero(
    CATEGORIAS_CALZADO,
    params.genero,
  );
  const categoriasPrendaCompleta = filtrarCategoriasPorGenero(
    CATEGORIAS_PRENDA_COMPLETA,
    params.genero,
  );

  useEffect(() => {
    // Si volvemos desde el detalle, reconstruimos el resultado previo para no perder el contexto.
    const estadoRestauracion = location.state as RestauracionCrearOutfit | null;
    const restauracion = estadoRestauracion?.restaurarCrearOutfit;

    if (!restauracion) {
      return;
    }

    setResultado(restauracion.resultado);
    setParams(restauracion.params || {});
    setMensajeError(null);
    setCargando(false);

    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const manejarSeleccionImagen = (file: File) => {
    // Una nueva imagen invalida el resultado anterior para evitar mezclar propuestas.
    setImagenSeleccionada(file);
    setMensajeError(null);
    setResultado(null);
  };

  const generarOutfit = async () => {
    if (!imagenSeleccionada) {
      setMensajeError('Por favor, selecciona una imagen primero');
      return;
    }

    setCargando(true);
    setMensajeError(null);
    setResultado(null);

    try {
      const resultadoOutfit = await crearOutfit(imagenSeleccionada, params);
      setResultado(resultadoOutfit);
    } catch {
      setMensajeError('No se pudo generar el outfit. Verifica que el backend esté funcionando.');
    } finally {
      setCargando(false);
    }
  };

  const reiniciarFormulario = () => {
    // Este reinicio devuelve la pantalla a su estado inicial sin recargar la página.
    setImagenSeleccionada(null);
    setResultado(null);
    setMensajeError(null);
    setParams({});
  };

  const actualizarGenero = (genero: string | undefined) => {
    // Al cambiar de género retiramos preferencias que ya no tengan candidatos reales.
    setParams((paramsActuales) => ({
      ...paramsActuales,
      genero,
      categoria_parte_arriba: existeCategoriaParaGenero(
        CATEGORIAS_PARTE_ARRIBA,
        paramsActuales.categoria_parte_arriba,
        genero,
      )
        ? paramsActuales.categoria_parte_arriba
        : undefined,
      categoria_parte_abajo: existeCategoriaParaGenero(
        CATEGORIAS_PARTE_ABAJO,
        paramsActuales.categoria_parte_abajo,
        genero,
      )
        ? paramsActuales.categoria_parte_abajo
        : undefined,
      categoria_calzado: existeCategoriaParaGenero(
        CATEGORIAS_CALZADO,
        paramsActuales.categoria_calzado,
        genero,
      )
        ? paramsActuales.categoria_calzado
        : undefined,
      categoria_prenda_completa: existeCategoriaParaGenero(
        CATEGORIAS_PRENDA_COMPLETA,
        paramsActuales.categoria_prenda_completa,
        genero,
      )
        ? paramsActuales.categoria_prenda_completa
        : undefined,
    }));
  };

  const actualizarTipoOutfit = (tipo: TipoOutfit) => {
    // Cambiar de enfoque limpia preferencias que no pertenecen al nuevo modo.
    setResultado(null);
    setMensajeError(null);
    setParams((paramsActuales) => {
      if (tipo === 'prenda_completa') {
        return {
          ...paramsActuales,
          tipo_outfit: tipo,
          categoria_parte_arriba: undefined,
          categoria_parte_abajo: undefined,
        };
      }

      return {
        ...paramsActuales,
        tipo_outfit: tipo,
        categoria_prenda_completa: undefined,
      };
    });
  };

  const guardarLook = async (indiceLook: number) => {
    // Cada bloque de resultados se guarda como una propuesta de look independiente.
    if (!resultado) {
      return;
    }

    if (!usuario) {
      toast.info('Inicia sesión para guardar looks');
      return;
    }

    const datosLook = construirLookGuardado(resultado, indiceLook);
    if (!datosLook) {
      toast.error('Este look no tiene prendas suficientes para guardarse');
      return;
    }

    try {
      setGuardandoLookIndice(indiceLook);
      await guardarOutfit(datosLook);
      toast.success('Look guardado correctamente');
    } catch {
      toast.error('No se pudo guardar el look');
    } finally {
      setGuardandoLookIndice(null);
    }
  };

  const navegacionDetalleOutfit = resultado
    ? {
        rutaVolver: '/crear-outfit',
        etiquetaVolver: 'Volver al outfit',
        estadoVolver: {
          restaurarCrearOutfit: {
            resultado,
            params,
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
          <h1 className="fashion-section-title mb-4">Crea tu Outfit</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Sube una foto de un look o prenda que te guste y te sugeriremos un outfit
            completo. Puedes generar un look por partes o una prenda completa, como
            un vestido o mono, acompañada de calzado.
          </p>
        </div>
      </section>

      <div className="fashion-container py-12">
        <div className="max-w-6xl mx-auto mb-12">
          <div className="bg-card rounded-xl border border-border p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="font-display text-xl font-medium">Configura tu outfit</h2>
                <p className="text-sm text-muted-foreground">
                  Sube una imagen y ajusta preferencias solo si quieres orientar el resultado
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:items-stretch">
              <div className="rounded-2xl border border-border bg-secondary/30 p-5">
                <div className="mb-5">
                  <h3 className="font-display text-lg font-medium">
                    Imagen de referencia
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Sube un look o prenda que sirva como inspiración visual.
                  </p>
                </div>
                <SubidaImagen
                  onSeleccionarImagen={manejarSeleccionImagen}
                  onLimpiarImagen={() => {
                    setImagenSeleccionada(null);
                    setResultado(null);
                    setMensajeError(null);
                  }}
                  deshabilitado={cargando}
                />
              </div>

              <div className="rounded-2xl border border-border bg-secondary/30 p-5">
                <div className="mb-5">
                  <h3 className="font-display text-lg font-medium">
                    Tipo de recomendación
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Decide si quieres construir un look por piezas o una prenda completa.
                  </p>
                </div>

                <div className="space-y-3">
                  <TarjetaTipoOutfit
                    tipo="por_partes"
                    titulo="Look por partes"
                    descripcion="Parte de arriba, parte de abajo y calzado."
                    icono={<Shirt className="h-5 w-5" />}
                    activo={tipoOutfit === 'por_partes'}
                    disabled={cargando}
                    onSeleccionar={actualizarTipoOutfit}
                  />
                  <TarjetaTipoOutfit
                    tipo="prenda_completa"
                    titulo="Prenda completa"
                    descripcion="Vestido o mono acompañado de calzado."
                    icono={<Sparkles className="h-5 w-5" />}
                    activo={tipoOutfit === 'prenda_completa'}
                    disabled={cargando}
                    onSeleccionar={actualizarTipoOutfit}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-secondary/30 p-5">
                <div className="mb-5">
                  <h3 className="font-display text-lg font-medium">
                    {tipoOutfit === 'prenda_completa'
                      ? 'Preferencias de prenda completa'
                      : 'Preferencias por parte'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {tipoOutfit === 'prenda_completa'
                      ? 'Elige vestido o mono si quieres acotar la búsqueda.'
                      : 'Ajusta las categorías de cada pieza si quieres orientar el resultado.'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="genero" className="text-sm font-medium mb-2 block">
                      Género (opcional)
                    </Label>
                    <Select
                      value={params.genero || 'none'}
                      onValueChange={(value) =>
                        actualizarGenero(value === 'none' ? undefined : value)
                      }
                      disabled={cargando}
                    >
                      <SelectTrigger id="genero">
                        <SelectValue placeholder="Sin preferencia" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin preferencia</SelectItem>
                        <SelectItem value="Men">Hombre</SelectItem>
                        <SelectItem value="Women">Mujer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {tipoOutfit === 'por_partes' ? (
                    <>
                      <SelectorCategoriaOutfit
                        id="categoria-parte-arriba"
                        label="Parte de arriba"
                        placeholder="Camiseta, camisa, chaqueta..."
                        value={params.categoria_parte_arriba}
                        opciones={categoriasParteArriba}
                        disabled={cargando}
                        onChange={(categoria) =>
                          setParams({ ...params, categoria_parte_arriba: categoria })
                        }
                      />

                      <SelectorCategoriaOutfit
                        id="categoria-parte-abajo"
                        label="Parte de abajo"
                        placeholder="Pantalón, falda, shorts..."
                        value={params.categoria_parte_abajo}
                        opciones={categoriasParteAbajo}
                        disabled={cargando}
                        onChange={(categoria) =>
                          setParams({ ...params, categoria_parte_abajo: categoria })
                        }
                      />
                    </>
                  ) : (
                    <SelectorCategoriaOutfit
                      id="categoria-prenda-completa"
                      label="Prenda completa"
                      placeholder="Vestido, mono..."
                      value={params.categoria_prenda_completa}
                      opciones={categoriasPrendaCompleta}
                      disabled={cargando}
                      onChange={(categoria) =>
                        setParams({ ...params, categoria_prenda_completa: categoria })
                      }
                    />
                  )}

                  <SelectorCategoriaOutfit
                    id="categoria-calzado"
                    label="Calzado"
                    placeholder="Zapatillas, botas, sandalias..."
                    value={params.categoria_calzado}
                    opciones={categoriasCalzado}
                    disabled={cargando}
                    onChange={(categoria) =>
                      setParams({ ...params, categoria_calzado: categoria })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                onClick={generarOutfit}
                disabled={!imagenSeleccionada || cargando}
                className="gap-2 sm:min-w-56"
                size="lg"
              >
                <Sparkles className="w-5 h-5" />
                {cargando ? 'Generando...' : 'Generar Outfit'}
              </Button>
              <Button
                variant="outline"
                onClick={reiniciarFormulario}
                disabled={cargando}
                size="lg"
                className="sm:min-w-32"
              >
                Limpiar
              </Button>
            </div>
          </div>
        </div>

        {cargando && (
          <div className="py-12">
            <IndicadorCarga
              tamano="lg"
              texto="Analizando imagen y generando outfit personalizado..."
            />
          </div>
        )}

        {mensajeError && (
          <MensajeError
            mensaje={mensajeError}
            onReintentar={generarOutfit}
            className="mb-12"
          />
        )}

        {resultado && !cargando && (
          <div className="animate-fade-in">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-medium mb-4">¡Tu outfit está listo!</h2>
              <p className="text-muted-foreground">
                {resultado.modo === 'prenda_completa'
                  ? 'Cada bloque representa una propuesta completa con su propio botón para guardar el look'
                  : 'Cada bloque representa un look distinto. Puedes guardar cualquiera directamente desde su cabecera'}
              </p>
            </div>

            <ColumnasResultadoConjunto
              resultado={resultado}
              navegacionDetalle={navegacionDetalleOutfit}
              onGuardarLook={guardarLook}
              guardandoLookIndice={guardandoLookIndice}
            />

            <div className="text-center mt-12">
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                {usuario && (
                  <Button asChild variant="outline" size="lg" className="gap-2">
                    <Link to="/armario?vista=looks">
                      <BookmarkPlus className="w-5 h-5" />
                      Ver mi armario
                    </Link>
                  </Button>
                )}

                <Button
                  variant="outline"
                  onClick={reiniciarFormulario}
                  size="lg"
                  className="gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  Crear otro outfit
                </Button>
              </div>
            </div>
          </div>
        )}

        {!resultado && !cargando && (
          <div className="max-w-2xl mx-auto mt-8">
            <h3 className="font-display text-lg font-medium mb-4">¿Cómo funciona?</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-accent font-semibold">1.</span>
                Sube una foto de un look completo o una prenda que te inspire
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent font-semibold">2.</span>
                Elige si quieres un look por partes o una prenda completa
              </li>
              <li className="flex items-start gap-3">
                <span className="text-accent font-semibold">3.</span>
                Nuestro sistema analizará la imagen y te sugerirá prendas
              </li>
            </ul>
          </div>
        )}
      </div>
    </EstructuraPagina>
  );
}
