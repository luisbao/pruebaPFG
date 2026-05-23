/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Cabecera principal del frontend. Contiene la marca del
 *   proyecto, la navegación principal y las acciones ligadas a
 *   la sesión del usuario en escritorio y móvil.
 * -----------------------------------------------------------
 */

import { Button } from '@/componentes/base/boton';
import { toast } from '@/componentes/base/avisos';
import { useAuth } from '@/contexto/useAuth';
import { cn } from '@/utilidades/clases';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/componentes/base/menu-desplegable';
import { Heart, LogOut, Menu, Search, ShoppingBag, Sparkles, Trash2, User, X } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const enlacesNavegacion = [
  { href: '/catalogo', label: 'Catálogo', icon: ShoppingBag },
  { href: '/buscar-por-imagen', label: 'Buscar por Imagen', icon: Search },
  { href: '/crear-outfit', label: 'Crear Outfit', icon: Sparkles },
];

export function Cabecera() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    usuario,
    eliminarCuenta: eliminarCuentaAuth,
    cerrarSesion: cerrarSesionAuth,
    cargando: cargandoAuth,
  } = useAuth();
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
  const [eliminandoCuenta, setEliminandoCuenta] = useState(false);

  const cerrarSesion = () => {
    // Tras cerrar sesión, devolvemos al usuario al inicio para evitar rutas privadas huérfanas.
    cerrarSesionAuth();
    navigate('/');
  };

  const eliminarCuenta = async () => {
    if (eliminandoCuenta) {
      return;
    }

    const confirmar = window.confirm(
      '¿Quieres eliminar tu cuenta? También se borrarán tus prendas guardadas y tus looks, y esta acción no se puede deshacer.',
    );
    if (!confirmar) {
      return;
    }

    try {
      setEliminandoCuenta(true);
      await eliminarCuentaAuth();
      toast.success('Cuenta eliminada correctamente');
      setMenuMovilAbierto(false);
      navigate('/', { replace: true });
    } catch {
      toast.error('No se pudo eliminar la cuenta');
    } finally {
      setEliminandoCuenta(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="fashion-container">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Marca principal y acceso rápido al inicio. */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl md:text-2xl font-medium tracking-tight group-hover:text-accent transition-colors">
              StyleMatch
            </span>
          </Link>

          {/* Navegación visible en escritorio. */}
          <nav className="hidden md:flex items-center gap-8">
            {enlacesNavegacion.map((link) => {
              const estaActivo = location.pathname === link.href;

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    'flex items-center gap-2 text-sm font-medium tracking-wide uppercase transition-colors',
                    estaActivo
                      ? 'text-accent'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Estado de autenticación en escritorio. */}
          <div className="hidden md:flex items-center gap-4">
            {cargandoAuth ? (
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
            ) : usuario ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline-block">Hola, {usuario.nombre_usuario}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/armario" className="flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Mi armario
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={eliminarCuenta}
                    disabled={eliminandoCuenta}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    {eliminandoCuenta ? 'Eliminando cuenta...' : 'Eliminar cuenta'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={cerrarSesion}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/login" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline-block">Iniciar Sesión</span>
                  </Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link to="/registro" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline-block">Registrarse</span>
                  </Link>
                </Button>
              </>
            )}
          </div>

          {/* Botón que despliega la navegación móvil. */}
          <button
            onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            className="md:hidden p-2 text-foreground"
            aria-label="Abrir o cerrar menú"
          >
            {menuMovilAbierto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Navegación compacta para móvil. */}
        {menuMovilAbierto && (
          <nav className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {enlacesNavegacion.map((link) => {
                const estaActivo = location.pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setMenuMovilAbierto(false)}
                    className={cn(
                      'flex items-center gap-3 py-2 text-sm font-medium tracking-wide uppercase transition-colors',
                      estaActivo
                        ? 'text-accent'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </Link>
                );
              })}

              {/* Acciones de sesión dentro del menú móvil. */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                {usuario ? (
                  <>
                    <div className="text-sm text-muted-foreground px-2">
                      Hola, {usuario.nombre_usuario}
                    </div>
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link to="/armario" className="flex items-center gap-2">
                        <Heart className="w-4 h-4" />
                        Mi armario
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-destructive border-destructive/30 hover:text-destructive"
                      onClick={eliminarCuenta}
                      disabled={eliminandoCuenta}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {eliminandoCuenta ? 'Eliminando cuenta...' : 'Eliminar cuenta'}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={cerrarSesion}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link to="/login" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Iniciar Sesión
                      </Link>
                    </Button>
                    <Button variant="ghost" asChild className="w-full justify-start">
                      <Link to="/registro" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Registrarse
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
