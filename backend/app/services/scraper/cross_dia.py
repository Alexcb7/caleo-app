import os
import sys
from difflib import SequenceMatcher
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, '.env'))

from app.db.connection import SessionLocal
from app.models.all_models import SupermarketProduct, Product, ProductMapping

MARCAS_BLANCAS = [
    # Mercadona
    "hacendado", "deliplus", "bosque verde", "compy",
    # DIA
    "dia", "nuestra alacena", "as ", " as ", "bonté", "bonte",
    "vivess", "vive+", "basic", "júlia", "julia",
    # Otras
    "condis", "eroski", "carrefour", "alcampo", "auchan",
    "producto blanco", "marca blanca", "seleqtia",
]

PALABRAS_PACKAGING = [
    "pack", "sobre", "bolsa", "bote", "lata", "botella",
    "bandeja", "envase", "caja", "brick", "tarro", "frasco",
    "estuche", "formato", "unidad", "unidades", "ud", "uds",
    "extra", "especial", "selección", "seleccion", "premium",
    "clásico", "clasico", "original", "natural",
]

def limpiar_nombre(nombre):
    if not nombre:
        return ""
    nombre = nombre.lower().strip()
    # Quitar marcas blancas
    for marca in MARCAS_BLANCAS:
        nombre = nombre.replace(marca.lower(), " ")
    # Quitar palabras de packaging
    for word in PALABRAS_PACKAGING:
        nombre = re.sub(rf'\b{word}\b', ' ', nombre)
    # Quitar números con unidades tipo "1l", "500g", "2x200g"
    nombre = re.sub(r'\d+\s*x\s*\d+\s*(g|ml|l|kg|cl)?', ' ', nombre)
    nombre = re.sub(r'\d+\s*(g|ml|l|kg|cl|ud|uds)\b', ' ', nombre)
    # Quitar caracteres especiales
    nombre = re.sub(r'[^\w\s]', ' ', nombre)
    # Limpiar espacios múltiples
    return ' '.join(nombre.split())

def similitud(a, b):
    a_clean = limpiar_nombre(a)
    b_clean = limpiar_nombre(b)
    if not a_clean or not b_clean:
        return 0
    return SequenceMatcher(None, a_clean, b_clean).ratio()

def cross_dia():
    print("🔄 Cruzando productos DIA con genéricos (sin LLM)...")
    db = SessionLocal()

    try:
        productos_dia = db.query(SupermarketProduct).filter(
            SupermarketProduct.supermarket_id == 2,
            SupermarketProduct.product_id == None
        ).all()
        print(f"📦 Productos DIA a cruzar: {len(productos_dia)}")

        genericos = db.query(Product).all()
        print(f"📋 Genéricos disponibles: {len(genericos)}")

        cruzados = 0
        no_cruzados = 0
        UMBRAL = 0.50

        for i, sp in enumerate(productos_dia):
            mejor_match = None
            mejor_score = 0

            for gen in genericos:
                score = similitud(sp.name_original, gen.name)
                if score > mejor_score:
                    mejor_score = score
                    mejor_match = gen

            if mejor_match and mejor_score >= UMBRAL:
                sp.product_id = mejor_match.id
                db.add(ProductMapping(
                    raw_name=sp.name_original,
                    product_id=mejor_match.id,
                    supermarket_id=2,
                    confidence=round(mejor_score, 2),
                    mapped_by="text_match"
                ))
                cruzados += 1
            else:
                no_cruzados += 1

            if (i + 1) % 500 == 0:
                db.commit()
                print(f"  💾 {i+1}/{len(productos_dia)} procesados... ({cruzados} cruzados)")

        db.commit()

        print(f"\n📊 RESULTADO:")
        print(f"  ✅ Cruzados: {cruzados}")
        print(f"  ⚠️  Sin cruzar: {no_cruzados}")
        print(f"  📈 % cruzado: {round(cruzados/len(productos_dia)*100, 1)}%")
        print("🎉 Completado")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    cross_dia()