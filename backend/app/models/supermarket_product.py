from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from app.db.connection import Base

class SupermarketProduct(Base):
    __tablename__ = "supermarket_products"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    supermarket_id = Column(Integer, ForeignKey("supermarkets.id"))
    external_id = Column(String(100))
    name_original = Column(String(200))
    price = Column(Numeric(8,2), nullable=False)
    original_price = Column(Numeric(8,2))
    is_offer = Column(Boolean, default=False)
    price_per_unit = Column(Numeric(8,4))
    in_stock = Column(Boolean, default=True)
    raw_data = Column(JSONB)
    last_scraped_at = Column(DateTime)