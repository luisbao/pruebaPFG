/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Utilidad pequeña para componer clases CSS de forma segura.
 *   Combina condiciones dinámicas y resuelve conflictos entre
 *   clases de Tailwind antes de devolver el resultado final.
 * -----------------------------------------------------------
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Une clases condicionales y resuelve conflictos de Tailwind en una sola llamada.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
