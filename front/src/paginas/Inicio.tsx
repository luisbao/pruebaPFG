/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Página de inicio del frontend. Presenta el proyecto, guía al
 *   usuario hacia los flujos principales y ofrece una entrada
 *   rápida a la búsqueda visual.
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
import { ArrowRight, Search, ShoppingBag, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

function TarjetaFuncion({
  icon: Icon,
  title,
  description,
  href,
  buttonText,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  buttonText: string;
}) {
  return (
    // Cada tarjeta resume uno de los flujos principales disponibles desde la home.
    <div className="bg-card rounded-xl border border-border p-8 flex flex-col items-center text-center group hover:border-accent/50 hover:shadow-elegant-lg transition-all duration-300">
      <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
        <Icon className="w-8 h-8 text-accent" />
      </div>
      <h3 className="font-display text-2xl font-medium mb-3">{title}</h3>
      <p className="text-muted-foreground mb-6 leading-relaxed">{description}</p>
      <Link to={href}>
        <Button className="gap-2 group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
          {buttonText}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </Link>
    </div>
  );
}

function SeccionBusquedaRapida() {
  const [imagenSeleccionada, setImagenSeleccionada] = useState<File | null>(null);
  const [resultados, setResultados] = useState<PrendaConSimilitud[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const manejarSeleccionImagen = async (file: File) => {
    // Esta versión rápida reutiliza el mismo endpoint de búsqueda visual de la vista dedicada.
    setImagenSeleccionada(file);
    setMensajeError(null);
    setCargando(true);
    setResultados([]);

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

  return (
    <section className="py-20 bg-secondary/30">
      <div className="fashion-container">
        <div className="text-center mb-12">
          <h2 className="fashion-section-title mb-4">Búsqueda Rápida por Imagen</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Sube una foto de cualquier prenda y te mostraremos productos visualmente
            similares de nuestro catálogo
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-12">
          <SubidaImagen
            onSeleccionarImagen={manejarSeleccionImagen}
            onLimpiarImagen={() => {
              setImagenSeleccionada(null);
              setResultados([]);
              setMensajeError(null);
            }}
            deshabilitado={cargando}
          />
        </div>

        {cargando && (
          <div className="py-12">
            <IndicadorCarga
              tamano="lg"
              texto="Analizando imagen y buscando similares..."
            />
          </div>
        )}

        {mensajeError && (
          <MensajeError
            mensaje={mensajeError}
            onReintentar={() =>
              imagenSeleccionada && manejarSeleccionImagen(imagenSeleccionada)
            }
          />
        )}

        {resultados.length > 0 && !cargando && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display text-2xl font-medium">
                Prendas Similares ({resultados.length})
              </h3>
              <Link to="/buscar-por-imagen">
                <Button variant="outline" size="sm" className="gap-2">
                  <Search className="w-4 h-4" />
                  Búsqueda avanzada
                </Button>
              </Link>
            </div>
            <RejillaPrendas productos={resultados.slice(0, 8)} columnas={4} />
          </div>
        )}
      </div>
    </section>
  );
}

export default function Inicio() {
  return (
    <EstructuraPagina>
      {/* Bloque principal de presentación con los accesos más importantes. */}
      <section className="relative py-20 md:py-32 overflow-hidden fashion-gradient">
        <div className="fashion-container relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              Búsqueda visual de moda
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-medium tracking-tight mb-6 animate-slide-up">
              Descubre tu estilo perfecto
            </h1>
            <p
              className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed animate-slide-up"
              style={{ animationDelay: '100ms' }}
            >
              Explora más de 46.000 productos de H&amp;M y encuentra prendas que
              combinan con tu estilo
            </p>
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up"
              style={{ animationDelay: '200ms' }}
            >
              <Link to="/catalogo">
                <Button size="lg" className="gap-2 px-8">
                  <ShoppingBag className="w-5 h-5" />
                  Explorar catálogo
                </Button>
              </Link>
              <Link to="/crear-outfit">
                <Button size="lg" variant="outline" className="gap-2 px-8">
                  <Sparkles className="w-5 h-5" />
                  Crear outfit
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Degradados decorativos para dar profundidad al hero. */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-accent/5 to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-fashion-sage/10 to-transparent" />
      </section>

      {/* Tarjetas con los tres flujos principales del proyecto. */}
      <section className="py-20">
        <div className="fashion-container">
          <div className="text-center mb-16">
            <h2 className="fashion-section-title mb-4">¿Qué puedes hacer?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tres formas de descubrir tu próxima prenda favorita
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TarjetaFuncion
              icon={ShoppingBag}
              title="Explorar Catálogo"
              description="Navega por más de 46.000 productos con filtros por género, categoría y color"
              href="/catalogo"
              buttonText="Ver productos"
            />
            <TarjetaFuncion
              icon={Search}
              title="Buscar por Imagen"
              description="Sube una foto de cualquier prenda y encuentra opciones similares en nuestro catálogo"
              href="/buscar-por-imagen"
              buttonText="Subir imagen"
            />
            <TarjetaFuncion
              icon={Sparkles}
              title="Crear Outfit"
              description="Sube una foto de un look y te sugerimos un outfit completo: arriba, abajo y calzado"
              href="/crear-outfit"
              buttonText="Crear outfit"
            />
          </div>
        </div>
      </section>

      {/* Acceso rápido a la recomendación por imagen desde la home. */}
      <SeccionBusquedaRapida />

      {/* Resumen visual del flujo interno del recomendador. */}
      <section className="py-20">
        <div className="fashion-container">
          <div className="text-center mb-16">
            <h2 className="fashion-section-title mb-4">¿Cómo funciona?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              El recomendador compara cada imagen con el catálogo mediante embeddings visuales
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Sube una imagen',
                description:
                  'Carga una foto de la prenda o look que te gusta desde tu dispositivo',
              },
              {
                step: '02',
                title: 'Análisis visual',
                description:
                  'CLIP genera un embedding visual que captura las características de la imagen',
              },
              {
                step: '03',
                title: 'Resultados similares',
                description:
                  'Comparamos con 46k productos usando similitud coseno y te mostramos los más parecidos',
              },
            ].map((item, index) => (
              <div
                key={item.step}
                className="relative p-8 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="text-8xl font-display font-bold text-accent/10 absolute -top-4 -left-2">
                  {item.step}
                </span>
                <div className="relative">
                  <h3 className="font-display text-xl font-medium mb-3 mt-8">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </EstructuraPagina>
  );
}
