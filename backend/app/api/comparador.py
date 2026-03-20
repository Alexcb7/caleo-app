from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.connection import get_db
from app.models.product import Product
from app.models.supermarket_product import SupermarketProduct
from app.models.supermarket import Supermarket
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/comparador", tags=["comparador"])

class CartItem(BaseModel):
    product_id: int
    quantity: float
    name: str

class CompareRequest(BaseModel):
    items: List[CartItem]
    supermarket_ids: List[int] = []

@router.post("/compare")
def compare(data: CompareRequest, db: Session = Depends(get_db)):

    # Resultado por producto
    productos_resultado = []
    
    # Resultado por supermercado (total)
    totales_por_super = {}

    for item in data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            continue

        # Buscar todas las variantes del producto
        query = db.query(SupermarketProduct).filter(
            SupermarketProduct.product_id == item.product_id
        )

        # Filtrar por supermercados seleccionados si hay
        if data.supermarket_ids:
            query = query.filter(
                SupermarketProduct.supermarket_id.in_(data.supermarket_ids)
            )

        variantes = query.all()

        precios = []
        for v in variantes:
            supermarket = db.query(Supermarket).filter(
                Supermarket.id == v.supermarket_id
            ).first()
            if v.price:
                precios.append({
                    "supermarket_id": v.supermarket_id,
                    "supermarket": supermarket.name if supermarket else None,
                    "price": float(v.price),
                    "total": float(v.price) * item.quantity,
                })

        # Ordenar por precio
        precios.sort(key=lambda x: x["price"])

        # El más barato
        mejor = precios[0] if precios else None

        productos_resultado.append({
            "product_id": item.product_id,
            "name": item.name,
            "quantity": item.quantity,
            "precios": precios,
            "mejor_precio": mejor,
        })

        # Acumular totales por supermercado
        for p in precios:
            sid = p["supermarket_id"]
            if sid not in totales_por_super:
                totales_por_super[sid] = {
                    "supermarket_id": sid,
                    "supermarket": p["supermarket"],
                    "total": 0,
                    "productos_disponibles": 0,
                }
            totales_por_super[sid]["total"] += p["total"]
            totales_por_super[sid]["productos_disponibles"] += 1

    # Ordenar supermercados por total
    ranking_supers = sorted(totales_por_super.values(), key=lambda x: x["total"])

    return {
        "productos": productos_resultado,
        "ranking_supermercados": ranking_supers,
        "ahorro_maximo": round(
            ranking_supers[-1]["total"] - ranking_supers[0]["total"], 2
        ) if len(ranking_supers) > 1 else 0,
    }