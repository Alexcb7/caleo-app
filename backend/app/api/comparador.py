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
    
    # Totales por supermercado (precio más barato de cada producto)
    supermarket_totals: dict = {}

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

        all_sps = query.order_by(SupermarketProduct.price).all()

        if not all_sps:
            result_items.append({
                "product_id": item.product_id,
                "product_name": product.name,
                "image_url": product.image_url,
                "quantity": item.quantity,
                "prices": [],
                "not_found": True,
            })
            continue

        # Precios de todos los supermercados para este producto
        prices = []
        seen_supermarkets = set()
        for sp in all_sps:
            sm = db.query(Supermarket).filter(Supermarket.id == sp.supermarket_id).first()
            if not sm or sm.id in seen_supermarkets:
                continue
            seen_supermarkets.add(sm.id)
            prices.append({
                "supermarket_id": sm.id,
                "supermarket": sm.name,
                "supermarket_slug": sm.slug,
                "price": float(sp.price),
                "original_price": float(sp.original_price) if sp.original_price else None,
                "subtotal": round(float(sp.price) * item.quantity, 2),
                "is_offer": sp.is_offer,
            })

        # Precio más barato para los totales
        cheapest = prices[0]
        sm_name = cheapest["supermarket"]
        supermarket_totals[sm_name] = round(
            supermarket_totals.get(sm_name, 0) + cheapest["subtotal"], 2
        )

        result_items.append({
            "product_id": item.product_id,
            "product_name": product.name,
            "image_url": product.image_url,
            "quantity": item.quantity,
            "prices": prices,
            "cheapest": cheapest,
            "not_found": False,
        })

    total = sum(supermarket_totals.values()) if supermarket_totals else 0.0

    return {
        "items": result_items,
        "total": round(total, 2),
        "supermarket_totals": supermarket_totals,
        "over_budget": (not data.ignore_budget and data.budget_limit is not None and total > data.budget_limit),
        "budget_limit": data.budget_limit,
    }