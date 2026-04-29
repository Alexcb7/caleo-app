import pandas as pd
import sys
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, '.env'))

print(f" Conectando a: {os.getenv('DATABASE_URL', 'NO ENCONTRADO')[:60]}...")

from app.db.connection import SessionLocal
from app.models.all_models import Supermarket, SupermarketProduct

def load_dia():
    print(" Iniciando carga de DIA...")
    db = SessionLocal()

    try:
        dia = db.query(Supermarket).filter(Supermarket.slug == "dia").first()
        if not dia:
            print(" No se encontró DIA en la BD")
            return
        print(f" Supermercado: {dia.name}")

        excel_path = os.path.join(BASE_DIR, "products_dia.xlsx")
        print(f" Leyendo: {excel_path}")
        df = pd.read_excel(excel_path)
        print(f" Total productos en Excel: {len(df)}")

        insertados = 0
        omitidos = 0

        for _, row in df.iterrows():
            nombre = row.get("Nombre")
            precio = row.get("Precio")
            imagen = row.get("Url_imagen")
            url = row.get("Url")
            formato = row.get("Formato")

            if pd.isna(nombre) or pd.isna(precio):
                omitidos += 1
                continue

            try:
                precio = float(precio)
            except (ValueError, TypeError):
                omitidos += 1
                continue

            sp = SupermarketProduct(
                supermarket_id=dia.id,
                name_original=str(nombre),
                price=precio,
                in_stock=True,
                raw_data={
                    "imagen": imagen if not pd.isna(imagen) else None,
                    "url": url if not pd.isna(url) else None,
                    "formato": formato if not pd.isna(formato) else None,
                }
            )
            db.add(sp)
            insertados += 1

            if insertados % 300 == 0:
                db.commit()
                print(f" {insertados} insertados...")

        db.commit()
        print(f" Productos insertados: {insertados}")
        print(f"  Productos omitidos: {omitidos}")
        print(" Carga DIA completada")

    except Exception as e:
        db.rollback()
        print(f" Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    load_dia()