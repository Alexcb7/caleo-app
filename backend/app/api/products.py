from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from app.db.connection import get_db
from app.models.all_models import Product, Category, SupermarketProduct, Supermarket

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/search")
def search_products(q: str = Query(""), category_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Product)
    if q:
        query = query.filter(Product.name.ilike(f"%{q}%"))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    products = query.limit(50).all()
    result = []
    for p in products:
        sp = db.query(SupermarketProduct).filter(
            SupermarketProduct.product_id == p.id
        ).order_by(SupermarketProduct.price).first()
        sm = db.query(Supermarket).filter(Supermarket.id == sp.supermarket_id).first() if sp else None
        result.append({
            "id": p.id, "name": p.name, "brand": p.brand,
            "unit_type": p.unit_type, "image_url": p.image_url,
            "category_id": p.category_id,
            "min_price": float(sp.price) if sp else None,
            "supermarket": sm.name if sm else None,
            "is_offer": db.query(SupermarketProduct).filter(
                SupermarketProduct.product_id == p.id,
                SupermarketProduct.is_offer == True
            ).first() is not None,
            "supermarkets_count": db.query(SupermarketProduct.supermarket_id).filter(
                SupermarketProduct.product_id == p.id
            ).distinct().count(),
        })
    return result

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).order_by(Category.name).all()
    return [{"id": c.id, "name": c.name, "slug": c.slug} for c in categories]

@router.get("/{product_id}/price-history")
def get_price_history(product_id: int, db: Session = Depends(get_db)):
    # Historical entries + current price for every supermarket that carries the product
    sql = """
        SELECT ph.price, ph.is_offer, ph.scraped_at,
               s.name AS supermarket, s.slug AS supermarket_slug
        FROM price_history ph
        JOIN supermarket_products sp ON sp.id = ph.supermarket_product_id
        JOIN supermarkets s ON s.id = sp.supermarket_id
        WHERE sp.product_id = :product_id
          AND ph.scraped_at IS NOT NULL
        UNION ALL
        SELECT sp.price, sp.is_offer, NOW() AS scraped_at,
               s.name AS supermarket, s.slug AS supermarket_slug
        FROM supermarket_products sp
        JOIN supermarkets s ON s.id = sp.supermarket_id
        WHERE sp.product_id = :product_id
          AND sp.in_stock = true
        ORDER BY scraped_at ASC
        LIMIT 500
    """
    rows = db.execute(text(sql), {"product_id": product_id}).fetchall()
    seen: dict = {}   # (supermarket, date) -> last price entry
    order: dict = {}  # supermarket -> slug
    date_order: dict = {}  # supermarket -> [dates in order]
    for r in rows:
        date_key = r.scraped_at.strftime("%d/%m")
        sm = r.supermarket
        if sm not in order:
            order[sm] = r.supermarket_slug
            date_order[sm] = []
        if date_key not in date_order[sm]:
            date_order[sm].append(date_key)
        seen[(sm, date_key)] = {"price": float(r.price), "is_offer": r.is_offer}
    result = []
    for sm, slug in order.items():
        data = [
            {"date": d, "price": seen[(sm, d)]["price"], "is_offer": seen[(sm, d)]["is_offer"]}
            for d in date_order[sm]
        ]
        result.append({"supermarket": sm, "slug": slug, "data": data})
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