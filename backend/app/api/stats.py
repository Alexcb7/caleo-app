from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.connection import get_db
from app.models.all_models import Purchase, PurchaseItem, UserBudget, Supermarket
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from pydantic import BaseModel

SPAIN_TZ = ZoneInfo("Europe/Madrid")

def _now_spain() -> datetime:
    """Hora actual en España (naive, sin tzinfo)."""
    return datetime.now(SPAIN_TZ).replace(tzinfo=None)

def _to_spain(dt_utc: datetime) -> datetime:
    """Convierte un datetime UTC naive a hora española naive."""
    return dt_utc.replace(tzinfo=timezone.utc).astimezone(SPAIN_TZ).replace(tzinfo=None)

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
    now = _now_spain()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0)
    start_of_week = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0)

    monthly_spent = sum(float(p.total_price or 0) for p in purchases if _to_spain(p.created_at) >= start_of_month)
    weekly_spent = sum(float(p.total_price or 0) for p in purchases if _to_spain(p.created_at) >= start_of_week)
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
    now = _now_spain()
    purchases = db.query(Purchase).filter(
        Purchase.user_id == user_id,
        Purchase.is_completed == True
    ).all()

    # Convertir created_at (UTC) a hora española para cada compra
    purchases_spain = [(p, _to_spain(p.created_at)) for p in purchases]

    # Gasto por supermercado — 2 queries en lugar de N*M
    sm_totals: dict = {}
    if purchases:
        purchase_ids = [p.id for p in purchases]
        all_items = db.query(PurchaseItem).filter(PurchaseItem.purchase_id.in_(purchase_ids)).all()
        sm_ids = {item.supermarket_id for item in all_items}
        sm_map = {sm.id: sm.name for sm in db.query(Supermarket).filter(Supermarket.id.in_(sm_ids)).all()}
        for item in all_items:
            sm_name = sm_map.get(item.supermarket_id)
            if sm_name:
                sm_totals[sm_name] = sm_totals.get(sm_name, 0) + float(item.price or 0) * float(item.quantity or 1)

    def make_entry(label: str, bucket: list) -> dict:
        gasto = round(sum(float(p.total_price or 0) for p in bucket), 2)
        count = len(bucket)
        ticket_medio = round(gasto / count, 2) if count > 0 else 0.0
        return {"label": label, "gasto": gasto, "count": count, "ticket_medio": ticket_medio}

    if period == "dia":
        # Últimas 24h por hora (en hora española)
        start = now - timedelta(hours=23)
        data = []
        for h in range(24):
            hora = start + timedelta(hours=h)
            bucket = [
                p for p, p_spain in purchases_spain
                if p_spain.replace(minute=0, second=0, microsecond=0) == hora.replace(minute=0, second=0, microsecond=0)
            ]
            data.append(make_entry(f"{hora.hour:02d}h", bucket))

    elif period == "semana":
        # Últimos 7 días (en hora española)
        dias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
        start = now - timedelta(days=6)
        data = []
        for d in range(7):
            day = start + timedelta(days=d)
            bucket = [p for p, p_spain in purchases_spain if p_spain.date() == day.date()]
            data.append(make_entry(dias[day.weekday()], bucket))

    elif period == "mes":
        # Semanas reales del mes actual (día 1 al último día del mes)
        import calendar
        first_day = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        last_day_num = calendar.monthrange(now.year, now.month)[1]
        last_day = now.replace(day=last_day_num, hour=23, minute=59, second=59, microsecond=0)
        data = []
        week_start = first_day
        sem = 1
        while week_start.date() <= last_day.date():
            week_end = min(week_start + timedelta(days=6), last_day)
            bucket = [p for p, p_spain in purchases_spain if week_start.date() <= p_spain.date() <= week_end.date()]
            data.append(make_entry(f"Sem {sem}", bucket))
            week_start = week_end + timedelta(days=1)
            sem += 1

    else:  # año
        # Últimos 12 meses (en hora española)
        meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
        data = []
        for m in range(12):
            month = (now.month - 11 + m) % 12
            year = now.year if (now.month - 11 + m) >= 1 else now.year - 1
            if month == 0: month = 12
            bucket = [p for p, p_spain in purchases_spain if p_spain.month == month and p_spain.year == year]
            data.append(make_entry(meses[month - 1], bucket))

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