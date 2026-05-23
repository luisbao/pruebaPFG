/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Catálogo reducido de categorías que pueden elegirse como
 *   preferencias al generar un outfit. Se separan por rol para
 *   evitar combinaciones incoherentes en la interfaz.
 * -----------------------------------------------------------
 */

export interface CategoriaOutfitOption {
  value: string;
  label: string;
  generos: Array<'Men' | 'Women'>;
}

export const CATEGORIAS_PARTE_ARRIBA: CategoriaOutfitOption[] = [
  { value: 'T-shirt', label: 'Camiseta', generos: ['Men', 'Women'] },
  { value: 'Top', label: 'Top', generos: ['Men', 'Women'] },
  { value: 'Blouse', label: 'Blusa', generos: ['Women'] },
  { value: 'Shirt', label: 'Camisa', generos: ['Men', 'Women'] },
  { value: 'Polo shirt', label: 'Polo', generos: ['Men', 'Women'] },
  { value: 'Hoodie', label: 'Sudadera con capucha', generos: ['Men', 'Women'] },
  { value: 'Sweater', label: 'Jersey', generos: ['Men', 'Women'] },
  { value: 'Cardigan', label: 'Cárdigan', generos: ['Men', 'Women'] },
  { value: 'Jacket', label: 'Chaqueta', generos: ['Men', 'Women'] },
  { value: 'Coat', label: 'Abrigo', generos: ['Men', 'Women'] },
  { value: 'Blazer', label: 'Blazer', generos: ['Men', 'Women'] },
  { value: 'Vest top', label: 'Top de tirantes', generos: ['Men', 'Women'] },
  { value: 'Bodysuit', label: 'Body', generos: ['Women'] },
  { value: 'Outdoor Waistcoat', label: 'Chaleco exterior', generos: ['Men', 'Women'] },
  { value: 'Tailored Waistcoat', label: 'Chaleco sastre', generos: ['Men', 'Women'] },
];

export const CATEGORIAS_PARTE_ABAJO: CategoriaOutfitOption[] = [
  { value: 'Trousers', label: 'Pantalón', generos: ['Men', 'Women'] },
  { value: 'Skirt', label: 'Falda', generos: ['Women'] },
  { value: 'Shorts', label: 'Shorts', generos: ['Men', 'Women'] },
  { value: 'Leggings/Tights', label: 'Leggings / mallas', generos: ['Women'] },
  { value: 'Dungarees', label: 'Mono', generos: ['Men', 'Women'] },
  { value: 'Outdoor trousers', label: 'Pantalón técnico', generos: ['Women'] },
];

export const CATEGORIAS_CALZADO: CategoriaOutfitOption[] = [
  { value: 'Sneakers', label: 'Zapatillas', generos: ['Men', 'Women'] },
  { value: 'Boots', label: 'Botas', generos: ['Men', 'Women'] },
  { value: 'Bootie', label: 'Botines', generos: ['Men', 'Women'] },
  { value: 'Ballerinas', label: 'Bailarinas', generos: ['Women'] },
  { value: 'Heels', label: 'Tacones', generos: ['Women'] },
  { value: 'Heeled sandals', label: 'Sandalias de tacón', generos: ['Women'] },
  { value: 'Sandals', label: 'Sandalias', generos: ['Men', 'Women'] },
  { value: 'Wedge', label: 'Cuñas', generos: ['Women'] },
  { value: 'Slippers', label: 'Zapatillas de casa', generos: ['Men', 'Women'] },
  { value: 'Pumps', label: 'Zapatos de salón', generos: ['Women'] },
  { value: 'Flat shoe', label: 'Zapato plano', generos: ['Men', 'Women'] },
  { value: 'Flat shoes', label: 'Zapatos planos', generos: ['Men', 'Women'] },
  { value: 'Flip flop', label: 'Chanclas', generos: ['Men', 'Women'] },
  { value: 'Other shoe', label: 'Otro calzado', generos: ['Men', 'Women'] },
];

export const CATEGORIAS_PRENDA_COMPLETA: CategoriaOutfitOption[] = [
  { value: 'Dress', label: 'Vestido', generos: ['Women'] },
  { value: 'Jumpsuit/Playsuit', label: 'Mono', generos: ['Men', 'Women'] },
];

export function filtrarCategoriasPorGenero(
  categorias: CategoriaOutfitOption[],
  genero?: string,
): CategoriaOutfitOption[] {
  if (genero !== 'Men' && genero !== 'Women') {
    return categorias;
  }

  return categorias.filter((categoria) => categoria.generos.includes(genero));
}

export function existeCategoriaParaGenero(
  categorias: CategoriaOutfitOption[],
  value: string | undefined,
  genero?: string,
): boolean {
  if (!value) {
    return true;
  }

  return filtrarCategoriasPorGenero(categorias, genero).some(
    (categoria) => categoria.value === value,
  );
}
