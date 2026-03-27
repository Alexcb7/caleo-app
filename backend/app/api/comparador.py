from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.db.connection import get_db
from app.models.all_models import Product, SupermarketProduct, Supermarket

router = APIRouter(prefix="/comparador", tags=["comparador"])

class CartItem(BaseModel):
    product_id: int
    quantity: float = 1

class CompareRequest(BaseModel):
    items: List[CartItem]
    supermarket_ids: Optional[List[int]] = None
    budget_limit: Optional[float] = None
    ignore_budget: bool = False

@router.post("/compare")
def compare(data: CompareRequest, db: Session = Depends(get_db)):
    result_items = []
    total = 0.0
    for item in data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            continue
        query = db.query(SupermarketProduct).filter(
            SupermarketProduct.product_id == item.product_id,
            SupermarketProduct.in_stock == True
        )
        if data.supermarket_ids:
            query = query.filter(SupermarketProduct.supermarket_id.in_(data.supermarket_ids))
        sp = query.order_by(SupermarketProduct.price).first()
        if not sp:
            result_items.append({"product_id": item.product_id, "product_name": product.name, "not_found": True})
            continue
        sm = db.query(Supermarket).filter(Supermarket.id == sp.supermarket_id).first()
        subtotal = float(sp.price) * item.quantity
        total += subtotal
        result_items.append({
            "product_id": item.product_id, "product_name": product.name,
            "quantity": item.quantity, "supermarket_id": sp.supermarket_id,
            "supermarket": sm.name if sm else None,
            "price": float(sp.price), "subtotal": round(subtotal, 2),
            "is_offer": sp.is_offer, "image_url": product.image_url, "not_found": False,
        })
    supermarket_totals = {}
    for item in result_items:
        if item.get("supermarket"):
            sm = item["supermarket"]
            supermarket_totals[sm] = supermarket_totals.get(sm, 0) + (item.get("subtotal") or 0)
    return {
        "items": result_items, "total": round(total, 2),
        "supermarket_totals": supermarket_totals,
        "over_budget": (not data.ignore_budget and data.budget_limit is not None and total > data.budget_limit),
        "budget_limit": data.budget_limit,
    }