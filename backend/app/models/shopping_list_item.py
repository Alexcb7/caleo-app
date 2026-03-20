from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from app.db.connection import Base

class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"

    id = Column(Integer, primary_key=True, index=True)
    list_id = Column(Integer, ForeignKey("shopping_lists.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    supermarket_id = Column(Integer, ForeignKey("supermarkets.id"))
    price = Column(Numeric(8,2))
    quantity = Column(Numeric(6,2), default=1)
    unit = Column(String(20))