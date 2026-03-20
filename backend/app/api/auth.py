from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.connection import get_db
from app.models.user import User
from pydantic import BaseModel
from jose import jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import bcrypt
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El email ya está registrado")

    hashed = bcrypt.hashpw(data.password.encode("utf-8"), bcrypt.gensalt())

    user = User(
        name=data.name,
        email=data.email,
        password_hash=hashed.decode("utf-8")
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email})

    return {
        "message": "Usuario creado correctamente",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    if not bcrypt.checkpw(data.password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")

    token = create_access_token({"sub": str(user.id), "email": user.email})

    return {
        "message": "Login correcto",
        "token": token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }