from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.db.connection import Base

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200))
    total_price = Column(Numeric(10,2))
    budget_limit = Column(Numeric(10,2))
    ignore_budget = Column(Boolean, default=False)
    is_completed = Column(Boolean, default=False)
    supermarkets_selected = Column(JSONB)
    created_at = Column(DateTime, server_default=func.now())