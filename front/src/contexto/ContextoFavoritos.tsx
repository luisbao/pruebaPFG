/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Contexto global del armario digital. Su objetivo es
 *   sincronizar el estado de favoritos del usuario entre
 *   tarjetas, páginas y vistas del catálogo.
 * -----------------------------------------------------------
 */

import { type ReactNode, useCallback, useEffect, useState } from 'react';

import { addFavorito, getFavoritosIds, removeFavorito } from '@/api/favoritos';
import { toast } from '@/componentes/base/avisos';
import { FavoritosContext, type FavoritosContextType } from './favoritos-contexto';
import { useAuth } from './useAuth';

interface FavoritosProviderProps {
  children: ReactNode;
}

export function FavoritosProvider({ children }: FavoritosProviderProps) {
  const { usuario } = useAuth();
  const [idsFavoritas, setIdsFavoritas] = useState<number[]>([]);
  const [idsProcesando, setIdsProcesando] = useState<number[]>([]);
  const [cargandoFavoritos, setCargandoFavoritos] = useState(false);
  const [versionFavoritos, setVersionFavoritos] = useState(0);

  const recargarFavoritos = useCallback(async () => {
    if (!usuario) {
      setIdsFavoritas([]);
      setCargandoFavoritos(false);
      return;
    }

    try {
      setCargandoFavoritos(true);
      const ids = await getFavoritosIds();
      setIdsFavoritas(ids);
    } catch {
      toast.error('No se pudo cargar tu armario digital');
    } finally {
      setCargandoFavoritos(false);
    }
  }, [usuario]);

  useEffect(() => {
    setIdsProcesando([]);
    void recargarFavoritos();
  }, [recargarFavoritos]);

  const esFavorita = (prendaId: number) => idsFavoritas.includes(prendaId);

  const estaProcesandoFavorito = (prendaId: number) => idsProcesando.includes(prendaId);

  const alternarFavorito = async (prendaId: number) => {
    if (!usuario) {
      throw new Error('Necesitas iniciar sesión para guardar prendas');
    }

    if (estaProcesandoFavorito(prendaId)) {
      return;
    }

    const favorita = esFavorita(prendaId);
    setIdsProcesando((actuales) => [...actuales, prendaId]);

    try {
      if (favorita) {
        await removeFavorito(prendaId);
        setIdsFavoritas((actuales) => actuales.filter((id) => id !== prendaId));
        toast.success('Prenda eliminada de tu armario');
      } else {
        await addFavorito(prendaId);
        setIdsFavoritas((actuales) =>
          actuales.includes(prendaId) ? actuales : [prendaId, ...actuales],
        );
        toast.success('Prenda guardada en tu armario');
      }

      setVersionFavoritos((versionActual) => versionActual + 1);
    } catch (error) {
      toast.error('No se pudo actualizar el armario digital');
      throw error;
    } finally {
      setIdsProcesando((actuales) => actuales.filter((id) => id !== prendaId));
    }
  };

  const value: FavoritosContextType = {
    idsFavoritas,
    cargandoFavoritos,
    versionFavoritos,
    estaProcesandoFavorito,
    esFavorita,
    alternarFavorito,
    recargarFavoritos,
  };

  return <FavoritosContext.Provider value={value}>{children}</FavoritosContext.Provider>;
}
