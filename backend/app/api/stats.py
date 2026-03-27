from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.connection import get_db
from app.models.all_models import Purchase, PurchaseItem, UserBudget, Supermarket
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter(prefix="/stats", tags=["stats"])

class BudgetSchema(BaseModel):
    user_id: int
    period: str
    amount: float

@router.get("/user/{user_id}")
def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    purchases = db.query(Purchase).filter(Purchase.user_id == user_id, Purchase.is_completed == True).all()
    total_spent = sum(float(p.total_price or 0) for p in purchases)
    now = datetime.utcnow()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0)
    start_of_week = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0)
    monthly_spent = sum(float(p.total_price or 0) for p in purchases if p.created_at >= start_of_month)
    weekly_spent = sum(float(p.total_price or 0) for p in purchases if p.created_at >= start_of_week)
    budgets = db.query(UserBudget).filter(UserBudget.user_id == user_id).all()
    return {
        "total_spent": round(total_spent, 2),
        "total_purchases": len(purchases),
        "monthly_spent": round(monthly_spent, 2),
        "weekly_spent": round(weekly_spent, 2),
        "budgets": {b.period: float(b.amount) for b in budgets},
    }

@router.post("/budget")
def set_budget(data: BudgetSchema, db: Session = Depends(get_db)):
    budget = db.query(UserBudget).filter(UserBudget.user_id == data.user_id, UserBudget.period == data.period).first()
    if budget:
        budget.amount = data.amount
    else:
        db.add(UserBudget(user_id=data.user_id, period=data.period, amount=data.amount))
    db.commit()
    return {"message": f"Presupuesto {data.period} actualizado"}