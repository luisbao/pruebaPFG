/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Pantalla de registro del frontend. Recoge los datos básicos
 *   del usuario, lanza la creación de cuenta contra el backend y
 *   encadena el inicio de sesión si todo sale bien.
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

export default function Registro() {
  const [email, setEmail] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacionContrasena, setConfirmacionContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [cargandoFormulario, setCargandoFormulario] = useState(false);
  const {
    registrarCuenta,
    cargando: cargandoAuth,
    mensajeError,
  } = useAuth();
  const navigate = useNavigate();

  const validarFormulario = () => {
    // Esta validación evita viajes innecesarios al backend para errores evidentes.
    if (!email || !nombreUsuario || !contrasena || !confirmacionContrasena) {
      return 'Por favor completa todos los campos';
    }
    if (contrasena.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (contrasena !== confirmacionContrasena) {
      return 'Las contraseñas no coinciden';
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)) {
      return 'Por favor ingresa un email válido';
    }

    return null;
  };

  const manejarEnvio = async (e: React.FormEvent) => {
    // Si el formulario pasa la validación, delegamos el alta real al contexto de auth.
    e.preventDefault();

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      toast.error(errorValidacion);
      return;
    }

    try {
      setCargandoFormulario(true);
      await registrarCuenta({
        email,
        nombre_usuario: nombreUsuario,
        password: contrasena,
      });
      toast.success('¡Registro exitoso! Ya has iniciado sesión.');
      navigate('/');
    } catch (err: unknown) {
      toast.error(err instanceof Error && err.message ? err.message : 'Error al registrarse');
    } finally {
      setCargandoFormulario(false);
    }
  };

  return (
    // El registro comparte estructura con el login para que ambos flujos se sientan coherentes.
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
          <CardTitle className="text-2xl font-bold text-center">CREAR CUENTA</CardTitle>
          <CardDescription className="text-center">
            Crea una nueva cuenta para acceder al sistema de recomendación de moda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={manejarEnvio} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={cargandoAuth || cargandoFormulario}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nombreUsuario">Nombre de Usuario</Label>
              <Input
                id="nombreUsuario"
                type="text"
                placeholder="nombredeusuario"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
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
                  placeholder="Mínimo 8 caracteres"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                  disabled={cargandoAuth || cargandoFormulario}
                  minLength={8}
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
            <div className="space-y-2">
              <Label htmlFor="confirmacionContrasena">Confirmar Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmacionContrasena"
                  type={mostrarConfirmacion ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={confirmacionContrasena}
                  onChange={(e) => setConfirmacionContrasena(e.target.value)}
                  required
                  disabled={cargandoAuth || cargandoFormulario}
                  minLength={8}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmacion((valorActual) => !valorActual)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={mostrarConfirmacion ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  disabled={cargandoAuth || cargandoFormulario}
                >
                  {mostrarConfirmacion ? (
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
              {cargandoAuth || cargandoFormulario ? 'Creando cuenta...' : 'CREAR CUENTA'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Inicia sesión aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
      </div>
    </div>
  );
}
