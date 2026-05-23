/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Archivo central del frontend. Aquí se registran los
 *   proveedores globales y las rutas principales para que toda
 *   la aplicación comparta sesión, favoritos y notificaciones.
 * -----------------------------------------------------------
 */

import { Toaster } from '@/componentes/base/notificaciones';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './contexto/ContextoAutenticacion';
import { FavoritosProvider } from './contexto/ContextoFavoritos';
import Armario from './paginas/Armario';
import DetalleConjunto from './paginas/DetalleConjunto';
import Inicio from './paginas/Inicio';
import InicioSesion from './paginas/InicioSesion';
import MisConjuntos from './paginas/MisConjuntos';
import Registro from './paginas/Registro';
import Catalogo from './paginas/Catalogo';
import DetallePrenda from './paginas/DetallePrenda';
import BuscarPorImagen from './paginas/BuscarPorImagen';
import CrearConjunto from './paginas/CrearConjunto';
import NoEncontrado from './paginas/NoEncontrado';

const App = () => (
  <AuthProvider>
    <FavoritosProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Inicio />} />
          <Route path="/login" element={<InicioSesion />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/armario" element={<Armario />} />
          <Route path="/mis-looks" element={<MisConjuntos />} />
          <Route path="/mis-looks/:id" element={<DetalleConjunto />} />
          <Route path="/prenda/:id" element={<DetallePrenda />} />
          <Route path="/buscar-por-imagen" element={<BuscarPorImagen />} />
          <Route path="/crear-outfit" element={<CrearConjunto />} />
          <Route path="*" element={<NoEncontrado />} />
        </Routes>
      </BrowserRouter>
    </FavoritosProvider>
  </AuthProvider>
);

export default App;
