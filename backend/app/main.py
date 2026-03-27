from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.db.connection import engine
from app.api import auth, products, comparador, purchases, stats, lists, ofertas, ajustes

from app.models import *

app = FastAPI(title="Caleo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(comparador.router)
app.include_router(purchases.router)
app.include_router(stats.router)
app.include_router(lists.router)
app.include_router(ofertas.router)
app.include_router(ajustes.router)

@app.get("/")
def root():
    return {"message": "Caleo API funcionando ✅"}

@app.get("/db-check")
def db_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "✅ Conectado a Supabase correctamente"}
    except Exception as e:
        return {"status": "❌ Error de conexión", "error": str(e)}