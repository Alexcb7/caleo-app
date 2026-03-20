from sqlalchemy import Column, Integer, Boolean, Numeric, ForeignKey
from app.db.connection import Base

class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    supermarket_id = Column(Integer, ForeignKey("supermarkets.id"))
    price = Column(Numeric(8,2))
    is_offer = Column(Boolean, default=False)
    quantity = Column(Numeric(6,2), default=1)