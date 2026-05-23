/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Contexto global de autenticación del frontend. Mantiene el
 *   usuario logueado, el token activo, los estados de carga y
 *   las acciones de inicio, registro y cierre de sesión.
 * -----------------------------------------------------------
 */

import { useEffect, useState, type ReactNode } from 'react';

import {
  eliminarCuentaActual,
  type UsuarioPublic,
  loginUsuario,
  logoutUsuario,
  obtenerUsuarioActual,
  registrarUsuario,
} from '../api/autenticacion';
import { AuthContext, type AuthContextType } from './auth-contexto';

interface AuthProviderProps {
  children: ReactNode;
}

function obtenerMensajeError(error: unknown, mensajePorDefecto: string): string {
  return error instanceof Error && error.message ? error.message : mensajePorDefecto;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuario, setUsuario] = useState<UsuarioPublic | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  useEffect(() => {
    const inicializarSesion = async () => {
      try {
        const tokenGuardado = localStorage.getItem('style_matcher_token');
        if (tokenGuardado) {
          setToken(tokenGuardado);
          const datosUsuario = await obtenerUsuarioActual();
          setUsuario(datosUsuario);
        }
      } catch {
        localStorage.removeItem('style_matcher_token');
        setToken(null);
        setUsuario(null);
      } finally {
        setCargando(false);
      }
    };

    inicializarSesion();
  }, []);

  const iniciarSesion = async (
    identificador: string,
    contrasena: string,
  ): Promise<void> => {
    try {
      setCargando(true);
      setMensajeError(null);

      const resultado = await loginUsuario(identificador, contrasena);
      setUsuario(resultado.usuario);
      setToken(resultado.token);
    } catch (err: unknown) {
      setMensajeError(obtenerMensajeError(err, 'Error al iniciar sesión'));
      throw err;
    } finally {
      setCargando(false);
    }
  };

  const registrarCuenta = async (
    data: { email: string; nombre_usuario: string; password: string },
  ): Promise<void> => {
    try {
      setCargando(true);
      setMensajeError(null);

      await registrarUsuario(data);
      await iniciarSesion(data.email, data.password);
    } catch (err: unknown) {
      setMensajeError(obtenerMensajeError(err, 'Error al registrarse'));
      throw err;
    } finally {
      setCargando(false);
    }
  };

  const cerrarSesion = (): void => {
    logoutUsuario();
    setUsuario(null);
    setToken(null);
    setMensajeError(null);
  };

  const eliminarCuenta = async (): Promise<void> => {
    try {
      setCargando(true);
      setMensajeError(null);
      await eliminarCuentaActual();
      logoutUsuario();
      setUsuario(null);
      setToken(null);
    } catch (err: unknown) {
      setMensajeError(obtenerMensajeError(err, 'Error al eliminar la cuenta'));
      throw err;
    } finally {
      setCargando(false);
    }
  };

  const value: AuthContextType = {
    usuario,
    token,
    cargando,
    mensajeError,
    iniciarSesion,
    registrarCuenta,
    eliminarCuenta,
    cerrarSesion,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
