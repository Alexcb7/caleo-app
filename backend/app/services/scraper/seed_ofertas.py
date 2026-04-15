"""
Script para generar 100 ofertas aleatorias en supermarket_products
y poblar price_history con el precio original.

Ejecutar desde /backend:
    python -m app.services.scraper.seed_ofertas
"""

import random
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.db.connection import SessionLocal
from app.models.all_models import SupermarketProduct, PriceHistory

def seed_ofertas():
    db: Session = SessionLocal()
    try:
        # Coger todos los supermarket_products con precio > 0
        all_sps = db.query(SupermarketProduct).filter(
            SupermarketProduct.price > 0,
            SupermarketProduct.in_stock == True,
        ).all()

        if not all_sps:
            print("❌ No hay productos en supermarket_products")
            return

        # Resetear ofertas existentes
        db.query(SupermarketProduct).update({
            "is_offer": False,
            "original_price": None,
        })
        db.commit()
        print("🔄 Ofertas anteriores reseteadas")

        # Seleccionar 100 aleatorios
        sample_size = min(100, len(all_sps))
        selected = random.sample(all_sps, sample_size)

        ofertas_creadas = 0
        historicos_creados = 0

        for sp in selected:
            precio_original = float(sp.price)
            descuento = round(random.uniform(0.10, 0.45), 2)
            precio_oferta = round(precio_original * (1 - descuento), 2)

            if precio_oferta < 0.10:
                precio_oferta = 0.10

            # Actualizar supermarket_product
            sp.original_price = precio_original
            sp.price = precio_oferta
            sp.is_offer = True
            ofertas_creadas += 1

            # Insertar historial — 5 puntos por producto
            for days_ago in [30, 21, 14, 7, 0]:
                variacion = round(precio_original * random.uniform(0.95, 1.05), 2)
                fecha = datetime.now(timezone.utc) - timedelta(days=days_ago)

                history_entry = PriceHistory(
                    supermarket_product_id=sp.id,
                    price=variacion if days_ago > 0 else precio_oferta,
                    is_offer=days_ago == 0,
                    scraped_at=fecha,
                )
                db.add(history_entry)
                historicos_creados += 1

        db.commit()
        print(f"✅ {ofertas_creadas} ofertas creadas")
        print(f"📈 {historicos_creados} entradas de historial creadas")
        print(f"💰 Descuentos entre 10% y 45%")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_ofertas()