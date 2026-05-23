/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Página de error 404 del frontend. Se muestra cuando el
 *   usuario accede a una ruta inexistente y le ofrece accesos
 *   rápidos para volver a navegar por la aplicación.
 * -----------------------------------------------------------
 */

import { EstructuraPagina } from '@/componentes/estructura/EstructuraPagina';
import { Button } from '@/componentes/base/boton';
import { Home, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const NoEncontrado = () => {
  return (
    <EstructuraPagina>
      {/* Esta página ofrece dos salidas rápidas para recuperar la navegación. */}
      <div className="fashion-container py-20">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-8xl font-display font-bold text-accent/20 mb-4">404</h1>
          <h2 className="font-display text-2xl font-medium mb-4">Página no encontrada</h2>
          <p className="text-muted-foreground mb-8">
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/">
              <Button className="gap-2">
                <Home className="w-4 h-4" />
                Ir al inicio
              </Button>
            </Link>
            <Link to="/catalogo">
              <Button variant="outline" className="gap-2">
                <Search className="w-4 h-4" />
                Explorar catálogo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </EstructuraPagina>
  );
};

export default NoEncontrado;
