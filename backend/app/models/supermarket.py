from sqlalchemy import Column, Integer, String, Boolean
from app.db.connection import Base

class Supermarket(Base):
    __tablename__ = "supermarkets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(50), unique=True)
    base_url = Column(String)
    logo_url = Column(String)
    active = Column(Boolean, default=True)