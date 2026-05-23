/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Módulo que agrupa las llamadas del frontend relacionadas con
 *   autenticación: inicio de sesión, registro, lectura del
 *   usuario actual y cierre de sesión con JWT.
 * -----------------------------------------------------------
 */

import { apiDelete, apiGet, apiPost, clearAuthToken, setAuthToken } from './cliente';

export interface UsuarioPublic {
  id: number;
  email: string;
  nombre_usuario: string;
  activo: boolean;
}

export interface RespuestaLogin {
  access_token: string;
  token_type: string;
}

// Estas funciones aíslan los detalles de autenticación para que las páginas
// trabajen con operaciones simples como iniciar sesión o registrarse.
export async function registrarUsuario(data: {
  email: string;
  nombre_usuario: string;
  password: string;
}): Promise<UsuarioPublic> {
  return apiPost<UsuarioPublic>('/auth/registro', data);
}

export async function loginUsuario(
  identificador: string,
  contrasena: string,
): Promise<{ usuario: UsuarioPublic; token: string }> {
  // Primero pedimos el JWT y después cargamos la ficha pública del usuario.
  const respuestaLogin = await apiPost<RespuestaLogin>('/auth/login', {
    email_or_username: identificador,
    password: contrasena,
  });

  setAuthToken(respuestaLogin.access_token);
  const usuario = await apiGet<UsuarioPublic>('/auth/me');

  return { usuario, token: respuestaLogin.access_token };
}

export async function obtenerUsuarioActual(): Promise<UsuarioPublic> {
  return apiGet<UsuarioPublic>('/auth/me');
}

export async function eliminarCuentaActual(): Promise<void> {
  await apiDelete<void>('/auth/me');
}

export function logoutUsuario() {
  // El logout real lo hace el frontend borrando el token local.
  clearAuthToken();
}
