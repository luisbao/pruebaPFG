/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Pantalla de inicio de sesión del frontend. Recoge las
 *   credenciales del usuario, valida lo básico en cliente y
 *   delega la autenticación real en el backend.
 * -----------------------------------------------------------
 */

import { Button } from '@/componentes/base/boton';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/componentes/base/tarjeta';
import { Input } from '@/componentes/base/campo-entrada';
import { Label } from '@/componentes/base/etiqueta';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import { toast } from '@/componentes/base/avisos';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '@/contexto/useAuth';

export default function InicioSesion() {
  const [identificadorUsuario, setIdentificadorUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargandoFormulario, setCargandoFormulario] = useState(false);
  const {
    iniciarSesion,
    cargando: cargandoAuth,
    mensajeError,
  } = useAuth();
  const navigate = useNavigate();

  const manejarEnvio = async (e: React.FormEvent) => {
    // Validamos lo mínimo en cliente antes de delegar la autenticación al backend.
    e.preventDefault();

    if (!identificadorUsuario || !contrasena) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      setCargandoFormulario(true);
      await iniciarSesion(identificadorUsuario, contrasena);
      toast.success('¡Inicio de sesión exitoso!');
      navigate('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : 'Error al iniciar sesión');
    } finally {
      setCargandoFormulario(false);
    }
  };

  return (
    // La pantalla de acceso mantiene el formulario simple, pero recupera la marca del proyecto.
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 flex items-center justify-center gap-3 text-foreground transition-colors hover:text-accent"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-3xl font-medium tracking-tight">
            StyleMatch
          </span>
        </Link>

      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">INICIAR SESIÓN</CardTitle>
          <CardDescription className="text-center">
            Ingresa tu email o nombre de usuario y contraseña para acceder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarEnvio} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identificadorUsuario">Email o Nombre de Usuario</Label>
              <Input
                id="identificadorUsuario"
                type="text"
                placeholder="tu@email.com o nombredeusuario"
                value={identificadorUsuario}
                onChange={(e) => setIdentificadorUsuario(e.target.value)}
                required
                disabled={cargandoAuth || cargandoFormulario}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contrasena">Contraseña</Label>
              <div className="relative">
                <Input
                  id="contrasena"
                  type={mostrarContrasena ? 'text' : 'password'}
                  placeholder="•••••••••••"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                  disabled={cargandoAuth || cargandoFormulario}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setMostrarContrasena((valorActual) => !valorActual)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  disabled={cargandoAuth || cargandoFormulario}
                >
                  {mostrarContrasena ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            {mensajeError && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {mensajeError}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={cargandoAuth || cargandoFormulario}
            >
              {cargandoAuth || cargandoFormulario
                ? 'Iniciando sesión...'
                : 'INICIAR SESIÓN'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="text-primary hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
      </div>
    </div>
  );
}
