import pandas as pd
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))))

from dotenv import load_dotenv
load_dotenv()

from app.db.connection import SessionLocal
from app.models.supermarket import Supermarket
from app.models.category import Category
from app.models.product import Product
from app.models.supermarket_product import SupermarketProduct

def load_mercadona():
    print("🚀 Iniciando carga de Mercadona...")
    db = SessionLocal()

    try:
        # 1 — Crear o buscar Mercadona
        mercadona = db.query(Supermarket).filter(Supermarket.slug == "mercadona").first()
        if not mercadona:
            mercadona = Supermarket(
                name="Mercadona",
                slug="mercadona",
                base_url="https://tienda.mercadona.es",
                logo_url="https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Mercadona_logo.svg/1200px-Mercadona_logo.svg.png",
                active=True
            )
            db.add(mercadona)
            db.commit()
            db.refresh(mercadona)
            print(f"✅ Supermercado creado: {mercadona.name}")
        else:
            print(f"ℹ️ Supermercado ya existe: {mercadona.name}")

        # 2 — Leer el Excel
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
        df = pd.read_excel(os.path.join(BASE_DIR, "mercadona_2026-02-04.xlsx"))
        print(f"📦 Total productos en Excel: {len(df)}")

        # 3 — Crear categorías únicas
        categorias_unicas = df["categoria"].dropna().unique()
        categorias_dict = {}

        for cat_name in categorias_unicas:
            cat = db.query(Category).filter(Category.name == cat_name).first()
            if not cat:
                cat = Category(
                    name=cat_name,
                    slug=cat_name.lower().replace(" ", "-").replace("/", "-")
                )
                db.add(cat)
                db.commit()
                db.refresh(cat)
            categorias_dict[cat_name] = cat.id

        print(f"✅ Categorías procesadas: {len(categorias_dict)}")

        # 4 — Insertar productos
        insertados = 0
        omitidos = 0

        for _, row in df.iterrows():
            titulo = row["titulo"]
            imagen = row["imagen"]
            precio = row["precio"]
            categoria = row["categoria"]

            if pd.isna(titulo) or pd.isna(precio):
                omitidos += 1
                continue

            try:
                precio = float(precio)
            except (ValueError, TypeError):
                omitidos += 1
                continue

            # Buscar si el producto genérico ya existe
            product = db.query(Product).filter(Product.name == titulo).first()
            if not product:
                product = Product(
                    name=titulo,
                    category_id=categorias_dict.get(categoria),
                    image_url=imagen if not pd.isna(imagen) else None
                )
                db.add(product)
                db.commit()
                db.refresh(product)

            # Buscar si ya existe la variante en Mercadona
            sp = db.query(SupermarketProduct).filter(
                SupermarketProduct.product_id == product.id,
                SupermarketProduct.supermarket_id == mercadona.id
            ).first()

            if not sp:
                sp = SupermarketProduct(
                    product_id=product.id,
                    supermarket_id=mercadona.id,
                    name_original=titulo,
                    price=precio,
                    raw_data={"imagen": imagen, "categoria": categoria}
                )
                db.add(sp)
                insertados += 1

        db.commit()
        print(f"✅ Productos insertados: {insertados}")
        print(f"⚠️ Productos omitidos: {omitidos}")
        print("🎉 Carga completada")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    load_mercadona()