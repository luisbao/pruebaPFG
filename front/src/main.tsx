/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Punto de entrada del frontend. Se encarga de montar la
 *   aplicación React en el nodo raíz del HTML y de cargar los
 *   estilos globales antes de renderizar la interfaz.
 * -----------------------------------------------------------
 */

import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import './index.css';

// Vite monta aquí toda la aplicación React dentro del nodo raíz del HTML.
createRoot(document.getElementById('root')!).render(<App />);
