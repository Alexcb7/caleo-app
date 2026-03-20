from sqlalchemy import Column, Integer, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.connection import Base

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(Integer, primary_key=True, index=True)
    supermarket_product_id = Column(Integer, ForeignKey("supermarket_products.id"))
    price = Column(Numeric(8,2))
    is_offer = Column(Boolean, default=False)
    scraped_at = Column(DateTime, server_default=func.now())