from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from app.db.connection import get_db

router = APIRouter(prefix="/ofertas", tags=["ofertas"])

@router.get("/general")
def get_ofertas_general(category_id: Optional[int] = None, db: Session = Depends(get_db)):
    sql = """
        SELECT 
            sp.id, sp.product_id, sp.supermarket_id,
            sp.price, sp.original_price,
            p.name AS product_name, p.image_url,
            s.name AS supermarket, s.slug AS supermarket_slug,
            c.name AS category
        FROM supermarket_products sp
        JOIN products p ON p.id = sp.product_id
        JOIN supermarkets s ON s.id = sp.supermarket_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE sp.is_offer = true AND sp.in_stock = true
        {category_filter}
        ORDER BY (sp.original_price - sp.price) DESC
        LIMIT 100
    """.format(
        category_filter=f"AND p.category_id = {category_id}" if category_id else ""
    )
    rows = db.execute(text(sql)).fetchall()
    return [
        {
            "id": r.id,
            "product_id": r.product_id,
            "product_name": r.product_name,
            "image_url": r.image_url,
            "supermarket": r.supermarket,
            "supermarket_slug": r.supermarket_slug,
            "price": float(r.price),
            "original_price": float(r.original_price) if r.original_price else None,
            "category": r.category,
        }
        for r in rows
    ]

@router.get("/mis-listas/{user_id}")
def get_ofertas_mis_listas(user_id: int, db: Session = Depends(get_db)):
    sql = """
        SELECT 
            sp.id, sp.product_id,
            sp.price, sp.original_price,
            p.name AS product_name, p.image_url,
            s.name AS supermarket, s.slug AS supermarket_slug,
            c.name AS category
        FROM supermarket_products sp
        JOIN products p ON p.id = sp.product_id
        JOIN supermarkets s ON s.id = sp.supermarket_id
        LEFT JOIN categories c ON c.id = p.category_id
        WHERE sp.is_offer = true
          AND sp.in_stock = true
          AND sp.product_id IN (
              SELECT DISTINCT sli.product_id
              FROM shopping_list_items sli
              JOIN shopping_lists sl ON sl.id = sli.list_id
              WHERE sl.user_id = :user_id
                AND sli.product_id IS NOT NULL
          )
        ORDER BY (sp.original_price - sp.price) DESC
        LIMIT 100
    """
    rows = db.execute(text(sql), {"user_id": user_id}).fetchall()
    return [
        {
            "id": r.id,
            "product_id": r.product_id,
            "product_name": r.product_name,
            "image_url": r.image_url,
            "supermarket": r.supermarket,
            "supermarket_slug": r.supermarket_slug,
            "price": float(r.price),
            "original_price": float(r.original_price) if r.original_price else None,
            "category": r.category,
        }
        for r in rows
    ]