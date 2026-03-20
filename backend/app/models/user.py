from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())