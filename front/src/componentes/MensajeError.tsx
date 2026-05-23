/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Bloque reutilizable para mostrar errores de forma clara y
 *   coherente en distintas páginas del frontend. Puede incluir
 *   un mensaje y una acción de reintento.
 * -----------------------------------------------------------
 */

import { Button } from '@/componentes/base/boton';
import { cn } from '@/utilidades/clases';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface MensajeErrorProps {
  mensaje?: string;
  onReintentar?: () => void;
  className?: string;
}

export function MensajeError({
  mensaje = 'Ha ocurrido un error. Por favor, inténtalo de nuevo.',
  onReintentar,
  className,
}: MensajeErrorProps) {
  return (
    // Este bloque unifica la presentación de errores para no repetir estilos en cada página.
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className,
      )}
    >
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <p className="text-foreground font-medium mb-2">¡Ups! Algo salió mal</p>
      <p className="text-muted-foreground text-sm mb-6 max-w-md">{mensaje}</p>
      {onReintentar && (
        <Button onClick={onReintentar} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </Button>
      )}
    </div>
  );
}
