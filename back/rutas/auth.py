"""
-----------------------------------------------------------
Proyecto: Proyecto de Fin de Grado
Autor: Luis Bao Bello

Descripción:
  Router de autenticación del backend. Gestiona el registro,
  inicio de sesión y consulta del usuario actual mediante JWT.
-----------------------------------------------------------
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..base_datos import get_db
from ..esquemas import Token, UsuarioCreate, UsuarioLogin, UsuarioPublic
from ..modelos import Outfit, OutfitItem, PrendaFavorita, Usuario
from ..seguridad import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/registro", response_model=UsuarioPublic, status_code=status.HTTP_201_CREATED)
def registro(datos_usuario: UsuarioCreate, db: Session = Depends(get_db)):
    """Registra un usuario nuevo y devuelve su ficha pública."""
    if len(datos_usuario.password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña debe tener al menos 8 caracteres",
        )

    usuario_con_email = db.query(Usuario).filter(Usuario.email == datos_usuario.email).first()
    if usuario_con_email:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El email ya está registrado",
        )

    usuario_con_nombre = (
        db.query(Usuario)
        .filter(Usuario.nombre_usuario == datos_usuario.nombre_usuario)
        .first()
    )
    if usuario_con_nombre:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El nombre de usuario ya está en uso",
        )

    nuevo_usuario = Usuario(
        email=datos_usuario.email,
        nombre_usuario=datos_usuario.nombre_usuario,
        contrasena_hash=get_password_hash(datos_usuario.password),
        activo=True,
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario


@router.post("/login", response_model=Token)
def login(datos_usuario: UsuarioLogin, db: Session = Depends(get_db)):
    """Autentica al usuario y devuelve un JWT de acceso."""
    if "@" in datos_usuario.email_or_username:
        usuario = db.query(Usuario).filter(Usuario.email == datos_usuario.email_or_username).first()
    else:
        usuario = (
            db.query(Usuario)
            .filter(Usuario.nombre_usuario == datos_usuario.email_or_username)
            .first()
        )

    if not usuario or not verify_password(datos_usuario.password, usuario.contrasena_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_acceso = create_access_token(data={"sub": str(usuario.id)})
    return {"access_token": token_acceso, "token_type": "bearer"}


@router.get("/me", response_model=UsuarioPublic)
def obtener_usuario_actual(usuario_actual: Usuario = Depends(get_current_user)):
    """Devuelve la información del usuario autenticado."""
    return usuario_actual


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_usuario_actual(
    usuario_actual: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Elimina la cuenta del usuario autenticado junto con sus datos personales."""
    try:
        outfits_usuario = (
            db.query(Outfit.id)
            .filter(Outfit.usuario_id == usuario_actual.id)
            .all()
        )
        ids_outfits = [outfit_id for (outfit_id,) in outfits_usuario]

        db.query(PrendaFavorita).filter(
            PrendaFavorita.usuario_id == usuario_actual.id
        ).delete(synchronize_session=False)

        if ids_outfits:
            db.query(OutfitItem).filter(
                OutfitItem.outfit_id.in_(ids_outfits)
            ).delete(synchronize_session=False)

        db.query(Outfit).filter(Outfit.usuario_id == usuario_actual.id).delete(
            synchronize_session=False
        )
        db.delete(usuario_actual)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return None
