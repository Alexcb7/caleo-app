from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.connection import get_db
from datetime import datetime, timedelta, timezone

router = APIRouter(prefix="/notificaciones", tags=["notificaciones"])

@router.get("/{user_id}")
def get_notificaciones(user_id: int, db: Session = Depends(get_db)):
    notificaciones = []
    now = datetime.now(timezone.utc)

    # ─────────────────────────────────────────────
    # 1. Productos en oferta en mis listas
    # ─────────────────────────────────────────────
    sql_ofertas = text("""
        SELECT DISTINCT
            p.id AS product_id,
            p.name AS product_name,
            s.name AS supermarket,
            sp.price,
            sp.original_price,
            sl.name AS list_name
        FROM shopping_list_items sli
        JOIN shopping_lists sl ON sl.id = sli.list_id
        JOIN products p ON p.id = sli.product_id
        JOIN supermarket_products sp ON sp.product_id = p.id
        JOIN supermarkets s ON s.id = sp.supermarket_id
        WHERE sl.user_id = :user_id
          AND sp.is_offer = true
          AND sp.in_stock = true
          AND sli.product_id IS NOT NULL
        LIMIT 10
    """)
    ofertas = db.execute(sql_ofertas, {"user_id": user_id}).fetchall()
    for o in ofertas:
        descuento = round((1 - float(o.price) / float(o.original_price)) * 100) if o.original_price else 0
        notificaciones.append({
            "id": f"oferta_{o.product_id}_{o.supermarket}",
            "type": "oferta",
            "title": "Producto en oferta",
            "message": f"{o.product_name} está al {descuento}% de descuento en {o.supermarket} (lo tienes en '{o.list_name}')",
            "icon": "tag",
            "color": "#C17F3A",
            "created_at": now.isoformat(),
        })

    # ─────────────────────────────────────────────
    # 2. Presupuesto superado
    # ─────────────────────────────────────────────
    sql_budgets = text("""
        SELECT period, amount FROM user_budgets WHERE user_id = :user_id
    """)
    budgets = db.execute(sql_budgets, {"user_id": user_id}).fetchall()

    sql_purchases = text("""
        SELECT total_price, created_at FROM purchases
        WHERE user_id = :user_id AND is_completed = true
    """)
    purchases = db.execute(sql_purchases, {"user_id": user_id}).fetchall()

    start_of_day   = now.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_week  = now - timedelta(days=now.weekday())
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0)
    start_of_year  = now.replace(month=1, day=1, hour=0, minute=0, second=0)

    def gasto_desde(desde):
        return sum(
            float(p.total_price or 0) for p in purchases
            if p.created_at and p.created_at.replace(tzinfo=timezone.utc) >= desde
        )

    gastos = {
        "daily":   gasto_desde(start_of_day),
        "weekly":  gasto_desde(start_of_week),
        "monthly": gasto_desde(start_of_month),
        "yearly":  gasto_desde(start_of_year),
    }

    periodo_labels = {
        "daily": "diario", "weekly": "semanal",
        "monthly": "mensual", "yearly": "anual"
    }

    for b in budgets:
        limite = float(b.amount)
        gasto  = gastos.get(b.period, 0)
        pct    = (gasto / limite * 100) if limite > 0 else 0

        if pct >= 100:
            notificaciones.append({
                "id": f"presupuesto_{b.period}_superado",
                "type": "presupuesto_superado",
                "title": f"Presupuesto {periodo_labels.get(b.period, b.period)} superado",
                "message": f"Has gastado {gasto:.2f}€ de tu límite {periodo_labels.get(b.period, b.period)} de {limite:.2f}€",
                "icon": "alert-triangle",
                "color": "#A63D2F",
                "created_at": now.isoformat(),
            })
        elif pct >= 80:
            notificaciones.append({
                "id": f"presupuesto_{b.period}_aviso",
                "type": "presupuesto_aviso",
                "title": f"Cerca del límite {periodo_labels.get(b.period, b.period)}",
                "message": f"Llevas {gasto:.2f}€ de tu presupuesto {periodo_labels.get(b.period, b.period)} de {limite:.2f}€ ({pct:.0f}%)",
                "icon": "trending-up",
                "color": "#C17F3A",
                "created_at": now.isoformat(),
            })

    # ─────────────────────────────────────────────
    # 3. Compras sin completar con más de 24h
    # ─────────────────────────────────────────────
    sql_pendientes = text("""
        SELECT id, title, created_at FROM purchases
        WHERE user_id = :user_id
          AND is_completed = false
          AND created_at < :hace_24h
        ORDER BY created_at DESC
        LIMIT 5
    """)
    hace_24h = now - timedelta(hours=24)
    pendientes = db.execute(sql_pendientes, {
        "user_id": user_id,
        "hace_24h": hace_24h,
    }).fetchall()

    for p in pendientes:
        horas = int((now - p.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 3600)
        notificaciones.append({
            "id": f"pendiente_{p.id}",
            "type": "compra_pendiente",
            "title": "Compra sin completar",
            "message": f"'{p.title}' lleva {horas}h sin completarse. ¿La marcamos?",
            "icon": "shopping-cart",
            "color": "#8C7B6B",
            "created_at": now.isoformat(),
        })

    # ─────────────────────────────────────────────
    # 4. Bajada de precio en productos de mis listas
    # ─────────────────────────────────────────────
    sql_bajadas = text("""
        SELECT DISTINCT
            p.id AS product_id,
            p.name AS product_name,
            s.name AS supermarket,
            sp.price AS precio_actual,
            ph_old.price AS precio_anterior
        FROM shopping_list_items sli
        JOIN shopping_lists sl ON sl.id = sli.list_id
        JOIN products p ON p.id = sli.product_id
        JOIN supermarket_products sp ON sp.product_id = p.id
        JOIN supermarkets s ON s.id = sp.supermarket_id
        JOIN price_history ph_old ON ph_old.supermarket_product_id = sp.id
        WHERE sl.user_id = :user_id
          AND sli.product_id IS NOT NULL
          AND sp.is_offer = false
          AND ph_old.scraped_at = (
              SELECT MAX(scraped_at) FROM price_history
              WHERE supermarket_product_id = sp.id
                AND scraped_at < NOW() - INTERVAL '1 day'
          )
          AND sp.price < ph_old.price
        LIMIT 5
    """)
    bajadas = db.execute(sql_bajadas, {"user_id": user_id}).fetchall()
    for b in bajadas:
        diff = round(float(b.precio_anterior) - float(b.precio_actual), 2)
        notificaciones.append({
            "id": f"bajada_{b.product_id}_{b.supermarket}",
            "type": "precio_bajado",
            "title": "Precio bajado",
            "message": f"{b.product_name} ha bajado {diff:.2f}€ en {b.supermarket}",
            "icon": "trending-down",
            "color": "#6B7A3A",
            "created_at": now.isoformat(),
        })

    return {
        "total": len(notificaciones),
        "notificaciones": notificaciones,
    }