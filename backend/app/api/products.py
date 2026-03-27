from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
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
        sp = db.query(SupermarketProduct).filter(SupermarketProduct.product_id == p.id).order_by(SupermarketProduct.price).first()
        sm = db.query(Supermarket).filter(Supermarket.id == sp.supermarket_id).first() if sp else None
        result.append({
            "id": p.id, "name": p.name, "brand": p.brand,
            "unit_type": p.unit_type, "image_url": p.image_url,
            "category_id": p.category_id,
            "min_price": float(sp.price) if sp else None,
            "supermarket": sm.name if sm else None,
            "is_offer": sp.is_offer if sp else False,
        })
    return result

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).order_by(Category.name).all()
    return [{"id": c.id, "name": c.name, "slug": c.slug} for c in categories]

@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {"error": "Producto no encontrado"}
    sps = db.query(SupermarketProduct).filter(SupermarketProduct.product_id == product_id).all()
    cat = db.query(Category).filter(Category.id == product.category_id).first()
    prices = []
    for sp in sps:
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