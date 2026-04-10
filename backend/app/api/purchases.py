from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.db.connection import get_db
from app.models.all_models import Purchase, PurchaseItem, Product, Supermarket

router = APIRouter(prefix="/purchases", tags=["purchases"])

class PurchaseItemSchema(BaseModel):
    product_id: int
    supermarket_id: int
    price: float
    quantity: float = 1
    is_offer: bool = False

class SavePurchaseSchema(BaseModel):
    user_id: int
    title: str
    total_price: float
    budget_limit: Optional[float] = None
    ignore_budget: bool = False
    supermarkets_selected: Optional[list] = None
    items: List[PurchaseItemSchema]

@router.post("/save")
def save_purchase(data: SavePurchaseSchema, db: Session = Depends(get_db)):
    purchase = Purchase(
        user_id=data.user_id, title=data.title, total_price=data.total_price,
        budget_limit=data.budget_limit, ignore_budget=data.ignore_budget,
        supermarkets_selected=data.supermarkets_selected, is_completed=False,
    )
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    for item in data.items:
        db.add(PurchaseItem(
            purchase_id=purchase.id, product_id=item.product_id,
            supermarket_id=item.supermarket_id, price=item.price,
            quantity=item.quantity, is_offer=item.is_offer,
        ))
    db.commit()
    return {"id": purchase.id, "message": "Compra guardada correctamente"}

@router.get("/user/{user_id}")
def get_user_purchases(user_id: int, db: Session = Depends(get_db)):
    purchases = db.query(Purchase).filter(Purchase.user_id == user_id).order_by(Purchase.created_at.desc()).all()
    result = []
    for p in purchases:
        count = db.query(PurchaseItem).filter(PurchaseItem.purchase_id == p.id).count()
        result.append({
            "id": p.id, "title": p.title,
            "total_price": float(p.total_price) if p.total_price else 0,
            "is_completed": p.is_completed,
            "created_at": p.created_at.isoformat(),
            "items_count": count,
        })
    return result

@router.get("/{purchase_id}/detail")
def get_purchase_detail(purchase_id: int, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    items = db.query(PurchaseItem).filter(PurchaseItem.purchase_id == purchase_id).all()
    result_items = []
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        sm = db.query(Supermarket).filter(Supermarket.id == item.supermarket_id).first()
        result_items.append({
            "product_id": item.product_id,
            "product_name": product.name if product else None,
            "image_url": product.image_url if product else None,
            "supermarket": sm.name if sm else None,
            "price": float(item.price) if item.price else 0,
            "quantity": float(item.quantity), "is_offer": item.is_offer,
            "subtotal": round(float(item.price) * float(item.quantity), 2) if item.price else 0,
        })
    return {
        "id": purchase.id, "title": purchase.title,
        "total_price": float(purchase.total_price) if purchase.total_price else 0,
        "budget_limit": float(purchase.budget_limit) if purchase.budget_limit else None,
        "is_completed": purchase.is_completed,
        "created_at": purchase.created_at.isoformat(), "items": result_items,
    }

@router.patch("/{purchase_id}/complete")
def complete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    purchase.is_completed = True
    db.commit()
    return {"message": "Compra marcada como completada"}

@router.patch("/{purchase_id}/rename")
def rename_purchase(purchase_id: int, data: dict, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    purchase.title = data.get("title", purchase.title)
    db.commit()
    return {"message": "Nombre actualizado"}

@router.delete("/{purchase_id}")
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Compra no encontrada")
    db.delete(purchase)
    db.commit()
    return {"message": "Compra eliminada"}