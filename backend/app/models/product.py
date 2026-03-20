from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.connection import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    brand = Column(String(100))
    unit_type = Column(String(20))
    image_url = Column(String)
    created_at = Column(DateTime, server_default=func.now())