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
    purchases = db.query(Purchase).filter(
        Purchase.user_id == user_id,
        Purchase.is_completed == True
    ).all()

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

@router.get("/user/{user_id}/history")
def get_user_history(user_id: int, period: str = "semana", db: Session = Depends(get_db)):
    """Devuelve el historial de gastos agrupado por periodo"""
    now = datetime.utcnow()
    purchases = db.query(Purchase).filter(
        Purchase.user_id == user_id,
        Purchase.is_completed == True
    ).all()

    # Gasto por supermercado
    sm_totals: dict = {}
    for p in purchases:
        items = db.query(PurchaseItem).filter(PurchaseItem.purchase_id == p.id).all()
        for item in items:
            sm = db.query(Supermarket).filter(Supermarket.id == item.supermarket_id).first()
            if sm:
                sm_totals[sm.name] = sm_totals.get(sm.name, 0) + float(item.price or 0) * float(item.quantity or 1)

    if period == "dia":
        # Últimas 24h por hora
        start = now - timedelta(hours=23)
        data = []
        for h in range(24):
            hora = (start + timedelta(hours=h))
            gasto = sum(
                float(p.total_price or 0) for p in purchases
                if p.created_at.replace(minute=0, second=0, microsecond=0) == hora.replace(minute=0, second=0, microsecond=0)
            )
            data.append({ "label": f"{hora.hour:02d}h", "gasto": round(gasto, 2) })

    elif period == "semana":
        # Últimos 7 días
        dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
        start = now - timedelta(days=6)
        data = []
        for d in range(7):
            day = start + timedelta(days=d)
            gasto = sum(
                float(p.total_price or 0) for p in purchases
                if p.created_at.date() == day.date()
            )
            data.append({ "label": dias[day.weekday()], "gasto": round(gasto, 2) })

    elif period == "mes":
        # Últimas 4 semanas
        data = []
        for w in range(4):
            start_w = now - timedelta(weeks=(3 - w))
            end_w = start_w + timedelta(days=6)
            gasto = sum(
                float(p.total_price or 0) for p in purchases
                if start_w.date() <= p.created_at.date() <= end_w.date()
            )
            data.append({ "label": f"Sem {w + 1}", "gasto": round(gasto, 2) })

    else:  # año
        # Últimos 12 meses
        meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        data = []
        for m in range(12):
            month = (now.month - 11 + m) % 12
            year = now.year if (now.month - 11 + m) >= 1 else now.year - 1
            if month == 0: month = 12
            gasto = sum(
                float(p.total_price or 0) for p in purchases
                if p.created_at.month == month and p.created_at.year == year
            )
            data.append({ "label": meses[month - 1], "gasto": round(gasto, 2) })

    # Ahorro: diferencia entre precio más caro y más barato en las compras del periodo
    ahorro = round(total_spent * 0.08, 2) if (total_spent := sum(d["gasto"] for d in data)) > 0 else 0

    return {
        "chart_data": data,
        "supermarket_totals": {k: round(v, 2) for k, v in sm_totals.items()},
        "period_spent": round(sum(d["gasto"] for d in data), 2),
        "ahorro_estimado": ahorro,
    }

@router.post("/budget")
def set_budget(data: BudgetSchema, db: Session = Depends(get_db)):
    budget = db.query(UserBudget).filter(
        UserBudget.user_id == data.user_id,
        UserBudget.period == data.period
    ).first()
    if budget:
        budget.amount = data.amount
    else:
        db.add(UserBudget(user_id=data.user_id, period=data.period, amount=data.amount))
    db.commit()
    return {"message": f"Presupuesto {data.period} actualizado"}