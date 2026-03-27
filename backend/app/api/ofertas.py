from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.db.connection import get_db
from app.models.all_models import SupermarketProduct, Product, Supermarket, ShoppingList, ShoppingListItem, Category

router = APIRouter(prefix="/ofertas", tags=["ofertas"])

@router.get("/general")
def get_ofertas_general(category_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(SupermarketProduct).filter(SupermarketProduct.is_offer == True, SupermarketProduct.in_stock == True)
    ofertas = query.limit(100).all()
    result = []
    for sp in ofertas:
        product = db.query(Product).filter(Product.id == sp.product_id).first()
        if category_id and product and product.category_id != category_id:
            continue
        sm = db.query(Supermarket).filter(Supermarket.id == sp.supermarket_id).first()
        cat = db.query(Category).filter(Category.id == product.category_id).first() if product else None
        result.append({
            "id": sp.id, "product_id": sp.product_id,
            "product_name": product.name if product else sp.name_original,
            "image_url": product.image_url if product else None,
            "supermarket": sm.name if sm else None,
            "price": float(sp.price),
            "original_price": float(sp.original_price) if sp.original_price else None,
            "category": cat.name if cat else None,
        })
    return result

@router.get("/mis-listas/{user_id}")
def get_ofertas_mis_listas(user_id: int, db: Session = Depends(get_db)):
    lists = db.query(ShoppingList).filter(ShoppingList.user_id == user_id).all()
    product_ids = list(set(item.product_id for l in lists for item in db.query(ShoppingListItem).filter(ShoppingListItem.list_id == l.id).all() if item.product_id))
    if not product_ids:
        return []
    ofertas = db.query(SupermarketProduct).filter(SupermarketProduct.product_id.in_(product_ids), SupermarketProduct.is_offer == True, SupermarketProduct.in_stock == True).all()
    result = []
    for sp in ofertas:
        product = db.query(Product).filter(Product.id == sp.product_id).first()
        sm = db.query(Supermarket).filter(Supermarket.id == sp.supermarket_id).first()
        result.append({
            "id": sp.id, "product_id": sp.product_id,
            "product_name": product.name if product else sp.name_original,
            "image_url": product.image_url if product else None,
            "supermarket": sm.name if sm else None,
            "price": float(sp.price),
            "original_price": float(sp.original_price) if sp.original_price else None,
        })
    return result