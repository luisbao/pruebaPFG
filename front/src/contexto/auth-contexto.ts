/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Contrato compartido del contexto de autenticación del
 *   frontend. Define los datos y acciones que el proveedor expone
 *   al resto de la aplicación.
 * -----------------------------------------------------------
 */

import { createContext } from 'react';

import type { UsuarioPublic } from '@/api/autenticacion';

export interface AuthContextType {
  usuario: UsuarioPublic | null;
  token: string | null;
  cargando: boolean;
  mensajeError: string | null;
  iniciarSesion: (identificador: string, contrasena: string) => Promise<void>;
  registrarCuenta: (data: {
    email: string;
    nombre_usuario: string;
    password: string;
  }) => Promise<void>;
  eliminarCuenta: () => Promise<void>;
  cerrarSesion: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
