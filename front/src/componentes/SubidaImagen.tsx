/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Componente de subida de imágenes reutilizable para búsquedas
 *   visuales y generación de conjuntos. Gestiona la selección,
 *   la vista previa y la limpieza del fichero cargado.
 * -----------------------------------------------------------
 */

import { Button } from '@/componentes/base/boton';
import { cn } from '@/utilidades/clases';
import { Image as ImageIcon, Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';

interface SubidaImagenProps {
  onSeleccionarImagen: (file: File) => void;
  onLimpiarImagen?: () => void;
  className?: string;
  deshabilitado?: boolean;
}

export function SubidaImagen({
  onSeleccionarImagen,
  onLimpiarImagen,
  className,
  deshabilitado,
}: SubidaImagenProps) {
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [estaArrastrando, setEstaArrastrando] = useState(false);

  const procesarArchivo = useCallback(
    (archivo: File) => {
      // Generamos una vista previa local para que el usuario confirme la imagen antes de enviar.
      if (archivo && archivo.type.startsWith('image/')) {
        const lector = new FileReader();
        lector.onloadend = () => {
          setVistaPrevia(lector.result as string);
        };
        lector.readAsDataURL(archivo);
        onSeleccionarImagen(archivo);
      }
    },
    [onSeleccionarImagen],
  );

  const manejarSoltar = useCallback(
    (evento: React.DragEvent) => {
      evento.preventDefault();
      setEstaArrastrando(false);
      const archivo = evento.dataTransfer.files[0];
      if (archivo) procesarArchivo(archivo);
    },
    [procesarArchivo],
  );

  const manejarArrastreSobreZona = useCallback((evento: React.DragEvent) => {
    evento.preventDefault();
    setEstaArrastrando(true);
  }, []);

  const manejarSalidaArrastre = useCallback((evento: React.DragEvent) => {
    evento.preventDefault();
    setEstaArrastrando(false);
  }, []);

  const manejarCambioInput = useCallback(
    (evento: React.ChangeEvent<HTMLInputElement>) => {
      const archivo = evento.target.files?.[0];
      if (archivo) procesarArchivo(archivo);
    },
    [procesarArchivo],
  );

  const limpiarImagen = useCallback(() => {
    // Al limpiar, reseteamos tanto la miniatura interna como el estado del padre si existe.
    setVistaPrevia(null);
    onLimpiarImagen?.();
  }, [onLimpiarImagen]);

  return (
    <div className={cn('w-full', className)}>
      {vistaPrevia ? (
        <div className="relative rounded-lg overflow-hidden bg-secondary animate-scale-in">
          <img
            src={vistaPrevia}
            alt="Vista previa"
            className="w-full h-64 object-contain"
          />
          <button
            onClick={limpiarImagen}
            disabled={deshabilitado}
            className="absolute top-3 right-3 p-2 bg-background/90 hover:bg-background rounded-full shadow-elegant transition-colors"
            aria-label="Eliminar imagen"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label
          onDrop={manejarSoltar}
          onDragOver={manejarArrastreSobreZona}
          onDragLeave={manejarSalidaArrastre}
          className={cn(
            'flex flex-col items-center justify-center w-full h-64 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-300',
            estaArrastrando
              ? 'border-accent bg-accent/5'
              : 'border-border bg-secondary/50 hover:border-accent/50 hover:bg-secondary',
            deshabilitado && 'opacity-50 cursor-not-allowed',
          )}
        >
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              {estaArrastrando ? (
                <ImageIcon className="w-8 h-8 text-accent" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <p className="mb-2 text-sm text-foreground font-medium">
              {estaArrastrando ? 'Suelta la imagen aquí' : 'Arrastra una imagen aquí'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              o haz clic para seleccionar un archivo
            </p>
            <Button variant="outline" size="sm" disabled={deshabilitado} asChild>
              <span>Seleccionar archivo</span>
            </Button>
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={manejarCambioInput}
            disabled={deshabilitado}
          />
        </label>
      )}
    </div>
  );
}
