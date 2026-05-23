/**
 * -----------------------------------------------------------
 * Proyecto: Proyecto de Fin de Grado
 * Autor: Luis Bao Bello
 *
 * Descripción:
 *   Reúne las etiquetas visibles en español para categorías y
 *   colores del catálogo. Mantiene intactos los valores reales
 *   del backend y solo adapta la presentación del frontend.
 * -----------------------------------------------------------
 */

const TRADUCCIONES_CATEGORIA: Record<string, string> = {
  Ballerinas: 'Bailarinas',
  'Bikini top': 'Top de bikini',
  Blazer: 'Blazer',
  Blouse: 'Blusa',
  Bodysuit: 'Body',
  Bootie: 'Botín',
  Boots: 'Botas',
  Bra: 'Sujetador',
  'Bra extender': 'Extensor de sujetador',
  Cardigan: 'Cárdigan',
  Coat: 'Abrigo',
  Costumes: 'Disfraces',
  Dress: 'Vestido',
  Dungarees: 'Mono',
  'Flat shoe': 'Zapato plano',
  'Flat shoes': 'Zapatos planos',
  'Flip flop': 'Chanclas',
  'Garment Set': 'Conjunto',
  'Heeled sandals': 'Sandalias de tacón',
  Heels: 'Tacones',
  Hoodie: 'Sudadera con capucha',
  Jacket: 'Chaqueta',
  'Jumpsuit/Playsuit': 'Mono corto',
  'Leggings/Tights': 'Leggings y medias',
  'Long John': 'Ropa térmica inferior',
  'Night gown': 'Camisón',
  'Nipple covers': 'Pezoneras',
  'Other shoe': 'Otro calzado',
  'Outdoor Waistcoat': 'Chaleco técnico',
  'Outdoor trousers': 'Pantalón técnico',
  'Polo shirt': 'Polo',
  Pumps: 'Zapatos de salón',
  'Pyjama bottom': 'Pantalón de pijama',
  'Pyjama jumpsuit/playsuit': 'Mono de pijama',
  'Pyjama set': 'Conjunto de pijama',
  Robe: 'Bata',
  Sandals: 'Sandalias',
  Sarong: 'Pareo',
  Scarf: 'Bufanda',
  Shirt: 'Camisa',
  Shorts: 'Shorts',
  Skirt: 'Falda',
  Slippers: 'Zapatillas de casa',
  Sneakers: 'Zapatillas deportivas',
  Socks: 'Calcetines',
  Sweater: 'Jersey',
  Swimsuit: 'Bañador',
  'Swimwear bottom': 'Parte inferior de baño',
  'Swimwear set': 'Conjunto de baño',
  'T-shirt': 'Camiseta',
  'Tailored Waistcoat': 'Chaleco de vestir',
  Tie: 'Corbata',
  Top: 'Top',
  Trousers: 'Pantalón',
  Underdress: 'Combinación',
  'Underwear Tights': 'Medias interiores',
  'Underwear body': 'Body interior',
  'Underwear bottom': 'Parte inferior interior',
  'Underwear corset': 'Corsé interior',
  'Underwear set': 'Conjunto interior',
  'Vest top': 'Camiseta de tirantes',
  Wedge: 'Cuña',
};

const TRADUCCIONES_COLOR: Record<string, string> = {
  Beige: 'Beige',
  Black: 'Negro',
  Blue: 'Azul',
  'Bluish Green': 'Verde azulado',
  Brown: 'Marrón',
  Green: 'Verde',
  Grey: 'Gris',
  'Khaki green': 'Verde caqui',
  'Lilac Purple': 'Lila',
  Metal: 'Metalizado',
  Mole: 'Topo',
  Orange: 'Naranja',
  Pink: 'Rosa',
  Red: 'Rojo',
  Turquoise: 'Turquesa',
  Unknown: 'Desconocido',
  White: 'Blanco',
  Yellow: 'Amarillo',
  'Yellowish Green': 'Verde amarillento',
  undefined: 'Sin definir',
};

export function traducirCategoriaCatalogo(categoria: string): string {
  return TRADUCCIONES_CATEGORIA[categoria] ?? categoria;
}

export function traducirColorCatalogo(color: string): string {
  return TRADUCCIONES_COLOR[color] ?? color;
}

export function obtenerEtiquetaColorVisible(color?: string | null): string | null {
  if (!color || color === 'Unknown' || color === 'undefined') {
    return null;
  }

  return traducirColorCatalogo(color);
}
