from sqlalchemy import Column, Integer, String, Text, Boolean, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from datetime import datetime
from app.db.connection import Base


class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    email         = Column(String(200), unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name          = Column(String(100))
    created_at    = Column(DateTime, default=datetime.utcnow)


class UserBudget(Base):
    __tablename__ = "user_budgets"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    period     = Column(String(20), nullable=False)
    amount     = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Supermarket(Base):
    __tablename__ = "supermarkets"
    id       = Column(Integer, primary_key=True, index=True)
    name     = Column(String(100), nullable=False)
    slug     = Column(String(50), unique=True)
    base_url = Column(String)
    logo_url = Column(String)
    active   = Column(Boolean, default=True)


class Category(Base):
    __tablename__ = "categories"
    id        = Column(Integer, primary_key=True, index=True)
    name      = Column(String(100), nullable=False)
    parent_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    slug      = Column(String(100), unique=True)


class Product(Base):
    __tablename__ = "products"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(200), nullable=False)
    description = Column(Text)
    category_id = Column(Integer, ForeignKey("categories.id"))
    brand       = Column(String(100))
    unit_type   = Column(String(20))
    image_url   = Column(Text)
    created_at  = Column(DateTime, default=datetime.utcnow)


class SupermarketProduct(Base):
    __tablename__ = "supermarket_products"
    id              = Column(Integer, primary_key=True, index=True)
    product_id      = Column(Integer, ForeignKey("products.id"))
    supermarket_id  = Column(Integer, ForeignKey("supermarkets.id"))
    external_id     = Column(String(100))
    name_original   = Column(String(200))
    price           = Column(Numeric(8, 2), nullable=False)
    original_price  = Column(Numeric(8, 2))
    is_offer        = Column(Boolean, default=False)
    price_per_unit  = Column(Numeric(8, 4))
    in_stock        = Column(Boolean, default=True)
    raw_data        = Column(JSONB)
    last_scraped_at = Column(DateTime)


class PriceHistory(Base):
    __tablename__ = "price_history"
    id                     = Column(Integer, primary_key=True, index=True)
    supermarket_product_id = Column(Integer, ForeignKey("supermarket_products.id", ondelete="CASCADE"))
    price                  = Column(Numeric(8, 2))
    is_offer               = Column(Boolean, default=False)
    scraped_at             = Column(DateTime, default=datetime.utcnow)


class ShoppingList(Base):
    __tablename__ = "shopping_lists"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name        = Column(String(200), nullable=False)
    description = Column(Text)
    image_url   = Column(Text)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"
    id             = Column(Integer, primary_key=True, index=True)
    list_id        = Column(Integer, ForeignKey("shopping_lists.id", ondelete="CASCADE"))
    product_id     = Column(Integer, ForeignKey("products.id"))
    supermarket_id = Column(Integer, ForeignKey("supermarkets.id"))
    price          = Column(Numeric(8, 2))
    quantity       = Column(Numeric(6, 2), default=1)
    unit           = Column(String(20))


class Purchase(Base):
    __tablename__ = "purchases"
    id                    = Column(Integer, primary_key=True, index=True)
    user_id               = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    title                 = Column(String(200))
    total_price           = Column(Numeric(10, 2))
    budget_limit          = Column(Numeric(10, 2))
    ignore_budget         = Column(Boolean, default=False)
    is_completed          = Column(Boolean, default=False)
    supermarkets_selected = Column(JSONB)
    created_at            = Column(DateTime, default=datetime.utcnow)


class PurchaseItem(Base):
    __tablename__ = "purchase_items"
    id             = Column(Integer, primary_key=True, index=True)
    purchase_id    = Column(Integer, ForeignKey("purchases.id", ondelete="CASCADE"))
    product_id     = Column(Integer, ForeignKey("products.id"))
    supermarket_id = Column(Integer, ForeignKey("supermarkets.id"))
    price          = Column(Numeric(8, 2))
    is_offer       = Column(Boolean, default=False)
    quantity       = Column(Numeric(6, 2), default=1)


class ProductMapping(Base):
    __tablename__ = "product_mappings"
    id             = Column(Integer, primary_key=True, index=True)
    raw_name       = Column(Text, nullable=False)
    product_id     = Column(Integer, ForeignKey("products.id"))
    supermarket_id = Column(Integer, ForeignKey("supermarkets.id"))
    confidence     = Column(Numeric(3, 2))
    mapped_by      = Column(String(20))
    llm_metadata   = Column(JSONB)
    created_at     = Column(DateTime, default=datetime.utcnow)


class LlmConversation(Base):
    __tablename__ = "llm_conversations"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    list_id     = Column(Integer, ForeignKey("shopping_lists.id"), nullable=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=True)
    messages    = Column(JSONB, default=list)
    model_used  = Column(String(50))
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)