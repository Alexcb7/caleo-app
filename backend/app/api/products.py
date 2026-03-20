from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.connection import get_db
from app.models.product import Product
from app.models.supermarket_product import SupermarketProduct
from app.models.category import Category
from app.models.supermarket import Supermarket

router = APIRouter(prefix="/products", tags=["products"])

@router.get("/search")
def search_products(
    q: str = Query(..., min_length=1),
    category_id: int = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product).filter(
        Product.name.ilike(f"%{q}%")
    )

    if category_id:
        query = query.filter(Product.category_id == category_id)

    products = query.limit(20).all()

    result = []
    for product in products:
        supermarket_products = db.query(SupermarketProduct).filter(
            SupermarketProduct.product_id == product.id
        ).all()

        prices = []
        for sp in supermarket_products:
            supermarket = db.query(Supermarket).filter(
                Supermarket.id == sp.supermarket_id
            ).first()
            prices.append({
                "supermarket": supermarket.name if supermarket else None,
                "price": float(sp.price) if sp.price else None,
                "image_url": sp.raw_data.get("imagen") if sp.raw_data else None,
            })

        result.append({
            "id": product.id,
            "name": product.name,
            "image_url": product.image_url,
            "category_id": product.category_id,
            "prices": prices,
        })

    return result


@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(Category).all()
    return [{"id": c.id, "name": c.name, "slug": c.slug} for c in categories]


@router.get("/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {"error": "Producto no encontrado"}

    supermarket_products = db.query(SupermarketProduct).filter(
        SupermarketProduct.product_id == product_id
    ).all()

    prices = []
    for sp in supermarket_products:
        supermarket = db.query(Supermarket).filter(
            Supermarket.id == sp.supermarket_id
        ).first()
        prices.append({
            "supermarket": supermarket.name if supermarket else None,
            "price": float(sp.price) if sp.price else None,
            "image_url": sp.raw_data.get("imagen") if sp.raw_data else None,
        })

    return {
        "id": product.id,
        "name": product.name,
        "image_url": product.image_url,
        "category_id": product.category_id,
        "prices": prices,
    }