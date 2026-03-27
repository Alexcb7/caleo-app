from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.db.connection import get_db
from app.models.all_models import User, Supermarket

router = APIRouter(prefix="/ajustes", tags=["ajustes"])

class UpdateUserSchema(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

@router.get("/user/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return {"id": user.id, "name": user.name, "email": user.email, "created_at": user.created_at.isoformat()}

@router.put("/user/{user_id}")
def update_user(user_id: int, data: UpdateUserSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if data.name: user.name = data.name
    if data.email: user.email = data.email
    db.commit()
    return {"message": "Usuario actualizado correctamente"}

@router.get("/supermarkets")
def get_supermarkets(db: Session = Depends(get_db)):
    supermarkets = db.query(Supermarket).filter(Supermarket.active == True).all()
    return [{"id": s.id, "name": s.name, "slug": s.slug, "logo_url": s.logo_url} for s in supermarkets]