from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.connection import engine
from app.api import auth
from sqlalchemy import text

app = FastAPI(title="Caleo API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "Caleo API funcionando"}

@app.get("/db-check")
def db_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "✅ Conectado a PostgreSQL correctamente"}
    except Exception as e:
        return {"status": "❌ Error de conexión", "error": str(e)}