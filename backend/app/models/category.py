from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.connection import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    slug = Column(String(100), unique=True)