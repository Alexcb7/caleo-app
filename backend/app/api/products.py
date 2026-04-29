from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from datetime import date
from app.db.connection import get_db
from app.models.all_models import Product, Category, SupermarketProduct, Supermarket

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/search")
def search_products(q: str = Query(""), category_id: Optional[int] = None, db: Session = Depends(get_db)):
    filters = []
    params: dict = {}
    if q:
        filters.append("p.name ILIKE :q")
        params["q"] = f"%{q}%"
    if category_id:
        filters.append("p.category_id = :category_id")
        params["category_id"] = category_id
    where = ("WHERE " + " AND ".join(filters)) if filters else ""

    sql = text(f"""
        SELECT
            p.id, p.name, p.brand, p.unit_type, p.image_url, p.category_id,
            MIN(sp.price)                        AS min_price,
            COUNT(DISTINCT sp.supermarket_id)    AS supermarkets_count,
            BOOL_OR(sp.is_offer)                 AS is_offer
        FROM products p
        LEFT JOIN supermarket_products sp ON sp.product_id = p.id
        {where}
        GROUP BY p.id, p.name, p.brand, p.unit_type, p.image_url, p.category_id
        ORDER BY p.name
        LIMIT 50
    """)

    rows = db.execute(sql, params).fetchall()
    return [
        {
            "id": r.id, "name": r.name, "brand": r.brand,
            "unit_type": r.unit_type, "image_url": r.image_url,
            "category_id": r.category_id,
            "min_price": float(r.min_price) if r.min_price is not None else None,
            "supermarkets_count": r.supermarkets_count or 0,
            "is_offer": bool(r.is_offer),
        }
        for r in rows
    ]

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).order_by(Category.name).all()
    return [{"id": c.id, "name": c.name, "slug": c.slug} for c in categories]

@router.get("/{product_id}/price-history")
def get_price_history(product_id: int, db: Session = Depends(get_db)):
    # 1. Precios actuales — fuente de verdad para hoy, nunca se cortan por LIMIT
    sql_current = text("""
        SELECT sp.price, sp.is_offer,
               CURRENT_DATE AS day,
               s.name AS supermarket, s.slug AS supermarket_slug
        FROM supermarket_products sp
        JOIN supermarkets s ON s.id = sp.supermarket_id
        WHERE sp.product_id = :product_id
          AND sp.in_stock = true
    """)

    # 2. Historial — solo días donde el precio era distinto al actual
    #    (producto sin variación de precio → no se muestra historial)
    sql_history = text("""
        SELECT DISTINCT ON (s.id, ph.scraped_at::date)
            ph.price, ph.is_offer,
            ph.scraped_at::date AS day,
            s.name AS supermarket, s.slug AS supermarket_slug
        FROM price_history ph
        JOIN supermarket_products sp ON sp.id = ph.supermarket_product_id
        JOIN supermarkets s ON s.id = sp.supermarket_id
        WHERE sp.product_id = :product_id
          AND ph.scraped_at IS NOT NULL
          AND ph.scraped_at::date < CURRENT_DATE
          AND ph.price <> sp.price
        ORDER BY s.id, ph.scraped_at::date ASC, ph.scraped_at DESC
        LIMIT 300
    """)

    current_rows = db.execute(sql_current, {"product_id": product_id}).fetchall()
    history_rows = db.execute(sql_history, {"product_id": product_id}).fetchall()

    # Estructura de salida: {supermarket -> {slug, dates_in_order, seen}}
    sm_data: dict = {}

    def add_row(sm, slug, day_str, price, is_offer):
        if sm not in sm_data:
            sm_data[sm] = {"slug": slug, "dates": [], "seen": {}}
        entry = sm_data[sm]
        if day_str not in entry["seen"]:
            entry["dates"].append(day_str)
        entry["seen"][day_str] = {"price": price, "is_offer": is_offer}

    # Primero el historial (orden ASC por fecha) …
    for r in history_rows:
        add_row(r.supermarket, r.supermarket_slug,
                r.day.strftime("%d/%m"), float(r.price), r.is_offer)

    # … luego el precio actual sobreescribe / añade hoy
    today_str = date.today().strftime("%d/%m")
    for r in current_rows:
        add_row(r.supermarket, r.supermarket_slug,
                today_str, float(r.price), r.is_offer)

    result = []
    for sm, info in sm_data.items():
        data = [
            {"date": d, "price": info["seen"][d]["price"], "is_offer": info["seen"][d]["is_offer"]}
            for d in info["dates"]
        ]
        result.append({"supermarket": sm, "slug": info["slug"], "data": data})
    return result


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {"error": "Producto no encontrado"}
    sps = db.query(SupermarketProduct).filter(
        SupermarketProduct.product_id == product_id
    ).order_by(SupermarketProduct.price).all()
    cat = db.query(Category).filter(Category.id == product.category_id).first()

    prices = []
    seen = set()
    for sp in sps:
        if sp.supermarket_id in seen:
            continue
        seen.add(sp.supermarket_id)
        sm = db.query(Supermarket).filter(Supermarket.id == sp.supermarket_id).first()
        prices.append({
            "supermarket_id": sp.supermarket_id,
            "supermarket": sm.name if sm else None,
            "supermarket_slug": sm.slug if sm else None,
            "price": float(sp.price),
            "original_price": float(sp.original_price) if sp.original_price else None,
            "is_offer": sp.is_offer,
            "in_stock": sp.in_stock,
        })

    return {
        "id": product.id, "name": product.name, "description": product.description,
        "brand": product.brand, "unit_type": product.unit_type, "image_url": product.image_url,
        "category": cat.name if cat else None, "prices": prices,
    }