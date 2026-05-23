"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Este archivo reúne los esquemas Pydantic del backend. Sirve
  para validar entradas, estructurar salidas y mantener un
  contrato claro entre la API y el frontend.
-----------------------------------------------------------
"""

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator

# Esquemas base del catálogo.


class PrendaBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    categoria: str
    color: str
    genero: Optional[str] = None
    url_imagen: str
    codigo_articulo: Optional[str] = None


class Prenda(PrendaBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# Respuestas de recomendación.


class PrendaConSimilitud(BaseModel):
    prenda: Prenda
    similitud: float


class OutfitRespuesta(BaseModel):
    modo: Literal["por_partes", "prenda_completa"] = "por_partes"
    parte_arriba: list[PrendaConSimilitud] = Field(default_factory=list)
    parte_abajo: list[PrendaConSimilitud] = Field(default_factory=list)
    calzado: list[PrendaConSimilitud] = Field(default_factory=list)
    prenda_completa: list[PrendaConSimilitud] = Field(default_factory=list)


# Valores únicos para poblar los filtros del frontend.


class OpcionesFiltros(BaseModel):
    generos: list[str]
    categorias: list[str]
    colores: list[str]


# Esquemas de autenticación.


class UsuarioBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: EmailStr
    nombre_usuario: str


class UsuarioCreate(UsuarioBase):
    password: str  # Se valida en el endpoint para controlar mejor el mensaje de error.


class UsuarioPublic(UsuarioBase):
    id: int
    activo: bool


class UsuarioLogin(BaseModel):
    email_or_username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# Esquemas del armario digital.


class FavoritoCreate(BaseModel):
    prenda_id: int


class FavoritoPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prenda_id: int
    creado_en: datetime


class FavoritoConPrenda(BaseModel):
    favorito: FavoritoPublic
    prenda: Prenda


# Esquemas de looks guardados.


RolOutfit = Literal["parte_arriba", "parte_abajo", "calzado", "vestido"]


class OutfitItemCreate(BaseModel):
    prenda_id: int
    rol: RolOutfit


class ConjuntoCrear(BaseModel):
    titulo: Optional[str] = None
    imagen_referencia: Optional[str] = None
    items: list[OutfitItemCreate]

    @model_validator(mode="after")
    def validar_items(self):
        if not self.items:
            raise ValueError("El look debe incluir al menos una prenda")

        roles = [item.rol for item in self.items]
        if len(set(roles)) != len(roles):
            raise ValueError("No se pueden repetir roles dentro del mismo look")

        return self


class OutfitPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    titulo: Optional[str]
    imagen_referencia: Optional[str]
    creado_en: datetime


class OutfitItemPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    prenda_id: int
    rol: RolOutfit


class OutfitItemConPrenda(BaseModel):
    item: OutfitItemPublic
    prenda: Prenda


class OutfitDetallado(BaseModel):
    outfit: OutfitPublic
    items: list[OutfitItemConPrenda]
