from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from app.db.connection import get_db
from app.models.all_models import ShoppingList, ShoppingListItem, Product, Supermarket
 
router = APIRouter(prefix="/lists", tags=["lists"])
 
class ListItemSchema(BaseModel):
    product_id: int
    supermarket_id: Optional[int] = None
    price: Optional[float] = None
    quantity: float = 1
    unit: Optional[str] = None
 
class CreateListSchema(BaseModel):
    user_id: int
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    items: Optional[List[ListItemSchema]] = []
 
class UpdateListSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    items: Optional[List[ListItemSchema]] = None
 
@router.post("/create")
def create_list(data: CreateListSchema, db: Session = Depends(get_db)):
    sl = ShoppingList(user_id=data.user_id, name=data.name, description=data.description, image_url=data.image_url)
    db.add(sl)
    db.commit()
    db.refresh(sl)
    for item in data.items:
        db.add(ShoppingListItem(list_id=sl.id, product_id=item.product_id, supermarket_id=item.supermarket_id, price=item.price, quantity=item.quantity, unit=item.unit))
    db.commit()
    return {"id": sl.id, "message": "Lista creada correctamente"}
 
@router.get("/user/{user_id}")
def get_user_lists(user_id: int, db: Session = Depends(get_db)):
    lists = db.query(ShoppingList).filter(ShoppingList.user_id == user_id).order_by(ShoppingList.updated_at.desc()).all()
    result = []
    for l in lists:
        count = db.query(ShoppingListItem).filter(ShoppingListItem.list_id == l.id).count()
        result.append({
            "id": l.id, "name": l.name, "description": l.description, "image_url": l.image_url,
            "created_at": l.created_at.isoformat(), "updated_at": l.updated_at.isoformat(), "items_count": count,
        })
    return result
 
@router.get("/{list_id}/detail")
def get_list_detail(list_id: int, db: Session = Depends(get_db)):
    sl = db.query(ShoppingList).filter(ShoppingList.id == list_id).first()
    if not sl:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    items = db.query(ShoppingListItem).filter(ShoppingListItem.list_id == list_id).all()
    result_items = []
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        sm = db.query(Supermarket).filter(Supermarket.id == item.supermarket_id).first() if item.supermarket_id else None
        result_items.append({
            "id": item.id, "product_id": item.product_id,
            "product_name": product.name if product else None,
            "image_url": product.image_url if product else None,
            "supermarket": sm.name if sm else None,
            "price": float(item.price) if item.price else None,
            "quantity": float(item.quantity), "unit": item.unit,
        })
    return {"id": sl.id, "name": sl.name, "description": sl.description, "image_url": sl.image_url, "created_at": sl.created_at.isoformat(), "items": result_items}
 
@router.put("/{list_id}")
def update_list(list_id: int, data: UpdateListSchema, db: Session = Depends(get_db)):
    sl = db.query(ShoppingList).filter(ShoppingList.id == list_id).first()
    if not sl:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    if data.name: sl.name = data.name
    if data.description: sl.description = data.description
    if data.image_url: sl.image_url = data.image_url
    if data.items is not None:
        db.query(ShoppingListItem).filter(ShoppingListItem.list_id == list_id).delete()
        for item in data.items:
            db.add(ShoppingListItem(list_id=list_id, product_id=item.product_id, supermarket_id=item.supermarket_id, price=item.price, quantity=item.quantity, unit=item.unit))
    db.commit()
    return {"message": "Lista actualizada correctamente"}
 
@router.delete("/{list_id}")
def delete_list(list_id: int, db: Session = Depends(get_db)):
    sl = db.query(ShoppingList).filter(ShoppingList.id == list_id).first()
    if not sl:
        raise HTTPException(status_code=404, detail="Lista no encontrada")
    db.delete(sl)
    db.commit()
    return {"message": "Lista eliminada"}