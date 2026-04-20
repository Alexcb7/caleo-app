"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, TrendingDown, Tag, List, ArrowRight, Flame, TrendingUp, Wallet, Calendar, CalendarDays, CalendarRange, Settings, Bell, AlertTriangle, ShoppingBag } from "lucide-react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type User = { id: number; name: string; email: string };
type Stats = { total_spent: number; total_purchases: number; monthly_spent: number; weekly_spent: number; budgets: Record<string, number> };
type History = { chart_data: { label: string; gasto: number; count: number; ticket_medio: number }[]; supermarket_totals: Record<string, number>; period_spent: number; ahorro_estimado: number };
type Oferta = { id: number; product_name: string; image_url: string; supermarket: string; price: number; original_price: number; category: string };
type Period = "dia" | "semana" | "mes" | "año";
type Notificacion = { id: string; type: string; title: string; message: string; icon: string; color: string; created_at: string };

const NOTIF_READ_KEY = "caleo_notif_read";

function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(NOTIF_READ_KEY) || "[]")); } catch { return new Set(); }
}
function saveReadIds(ids: Set<string>) {
  localStorage.setItem(NOTIF_READ_KEY, JSON.stringify([...ids]));
}

function NotifIcon({ type }: { type: string }) {
  const s = { width: 16, height: 16 };
  if (type === "oferta") return <Tag style={s} />;
  if (type === "presupuesto_superado") return <AlertTriangle style={s} />;
  if (type === "presupuesto_aviso") return <TrendingUp style={s} />;
  if (type === "compra_pendiente") return <ShoppingBag style={s} />;
  if (type === "precio_bajado") return <TrendingDown style={s} />;
  return <Bell style={s} />;
}

const SM_COLORS = ["#6B7A3A", "#B8A06A", "#C17F3A", "#3D2B1F"];

const DAY_ORDER = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_ORDER = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function sortChartData(data: { label: string; gasto: number; count: number; ticket_medio: number }[], period: Period) {
  const copy = [...data];
  if (period === "semana") return copy.sort((a, b) => DAY_ORDER.indexOf(a.label) - DAY_ORDER.indexOf(b.label));
  if (period === "año") return copy.sort((a, b) => MONTH_ORDER.indexOf(a.label) - MONTH_ORDER.indexOf(b.label));
  // "mes" (Sem 1, Sem 2…) y "dia" (08:00, 14h…): ordenar por el número que contiene la etiqueta
  return copy.sort((a, b) => (parseInt(a.label.replace(/\D/g, "")) || 0) - (parseInt(b.label.replace(/\D/g, "")) || 0));
}

function isCurrentLabel(label: string, period: Period): boolean {
  const now = new Date();
  if (period === "semana") return label === DAY_ORDER[(now.getDay() + 6) % 7];
  if (period === "año") return label === MONTH_ORDER[now.getMonth()];
  if (period === "mes") {
    // Calcular en qué semana del mes estamos (misma lógica que el backend)
    const day = now.getDate();
    const currentWeek = Math.ceil(day / 7);
    return label === `Sem ${currentWeek}`;
  }
  if (period === "dia") return (parseInt(label.replace(/\D/g, "")) || 0) === now.getHours();
  return false;
}

const CustomTooltip = ({ active, payload, label, unit = "€" }: any) => {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    const formatted = unit === "€" ? `${val.toFixed(2)}€` : `${val} compra${val !== 1 ? "s" : ""}`;
    return (
      <div style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 10, padding: "8px 14px", boxShadow: "0 4px 16px rgba(61,43,31,0.1)" }}>
        <p style={{ fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 4px" }}>{label}</p>
        <p style={{ fontSize: "1rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>{formatted}</p>
      </div>
    );
  }
  return null;
};

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<History | null>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [ofertasLoading, setOfertasLoading] = useState(true);
  const [hora, setHora] = useState("");
  const [period, setPeriod] = useState<Period>("semana");
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyCache = useRef<Partial<Record<Period, History>>>({});
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const notifsRef = useRef<Notificacion[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const notifRef = useRef<HTMLDivElement>(null);
  const notifOpenRef = useRef(false);

  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setHora("Buenos días");
    else if (h < 20) setHora("Buenas tardes");
    else setHora("Buenas noches");

    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      // Stats y periodo inicial en paralelo — lo visible primero
      Promise.all([fetchStats(u.id), fetchHistory(u.id, "semana")]).then(() => {
        // Prefetch del resto de periodos en segundo plano, sin bloquear la UI
        prefetchRemainingPeriods(u.id);
      });
      fetchNotificaciones(u.id);
    }
    setReadIds(getReadIds());
    fetchOfertas();
  }, []);

  // Cambio de periodo: usa cache si está listo, si no fetchea
  useEffect(() => {
    if (user) fetchHistory(user.id, period);
  }, [period, user]);

  // Mantener ref sincronizado con el estado
  useEffect(() => { notifOpenRef.current = notifOpen; }, [notifOpen]);

  // Cerrar dropdown de notificaciones al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        if (notifOpenRef.current) markAllRead();
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchStats = async (userId: number) => {
    try {
      const res = await fetch(`${API_URL}/stats/user/${userId}`);
      setStats(await res.json());
    } catch {}
  };

  const normalizeChartData = (raw: any[], p: Period) =>
    sortChartData(raw.map(d => ({
      label: d.label,
      gasto: d.gasto ?? 0,
      count: d.count ?? 0,
      ticket_medio: d.ticket_medio ?? (d.count > 0 ? +(d.gasto / d.count).toFixed(2) : 0),
    })), p);

  const fetchHistory = async (userId: number, p: Period) => {
    const cached = historyCache.current[p];
    // Invalida el cache si no tiene ticket_medio (respuesta vieja sin ese campo)
    if (cached && cached.chart_data[0]?.ticket_medio !== undefined) {
      setHistory(cached);
      return;
    }
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/stats/user/${userId}/history?period=${p}`);
      const raw = await res.json();
      const data = { ...raw, chart_data: normalizeChartData(raw.chart_data || [], p) };
      historyCache.current[p] = data;
      setHistory(data);
    } catch {}
    setHistoryLoading(false);
  };

  // Precarga los periodos restantes en segundo plano tras cargar el inicial
  const prefetchRemainingPeriods = (userId: number) => {
    const periods: Period[] = ["dia", "mes", "año"];
    periods.forEach(async (p) => {
      if (historyCache.current[p]) return;
      try {
        const res = await fetch(`${API_URL}/stats/user/${userId}/history?period=${p}`);
        const raw = await res.json();
        historyCache.current[p] = { ...raw, chart_data: normalizeChartData(raw.chart_data || [], p) };
      } catch {}
    });
  };

  const fetchNotificaciones = async (userId: number) => {
    try {
      const res = await fetch(`${API_URL}/notificaciones/${userId}`);
      const data = await res.json();
      const list = data.notificaciones || [];
      notifsRef.current = list;
      setNotifs(list);
    } catch {}
  };

  const markAllRead = () => {
    const ids = new Set(notifsRef.current.map(n => n.id));
    saveReadIds(ids);
    setReadIds(ids);
  };

  const fetchOfertas = async () => {
    try {
      const res = await fetch(`${API_URL}/ofertas/general`);
      const data = await res.json();
      setOfertas(data.slice(0, 6));
    } catch {}
    setOfertasLoading(false);
  };

  const descuento = (price: number, original: number) =>
    original ? Math.round((1 - price / original) * 100) : 0;

  const smPieData = history
    ? Object.entries(history.supermarket_totals).map(([name, value], i) => ({ name, value: Math.round(value), color: SM_COLORS[i % SM_COLORS.length] }))
    : [];

  const ACCESOS = [
    { label: "Nueva Compra", href: "/compra", icon: ShoppingCart, color: "#6B7A3A", desc: "Busca y compara" },
    { label: "Mis Listas", href: "/mis-listas", icon: List, color: "#B8A06A", desc: "Gestiona tus listas" },
    { label: "Ofertas", href: "/ofertas", icon: Tag, color: "#C17F3A", desc: "Mejores ofertas" },
    { label: "Mis Compras", href: "/mis-compras", icon: TrendingDown, color: "#3D2B1F", desc: "Historial" },
  ];


  return (
    <div className="home-page" style={{ padding: "28px 32px" }}>

      {/* Header + filtro */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <img src="/images/claropng.png" alt="Caleo" style={{ width: 54, height: 54, objectFit: "contain", flexShrink: 0 }} />
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>
              {hora}, {user?.name?.split(" ")[0] || "bienvenido"}
            </h1>
            <p style={{ fontSize: "0.9rem", color: "#8C7B6B", margin: "6px 0 0", fontFamily: "system-ui" }}>Resumen de tu actividad</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Campana de notificaciones */}
          <div ref={notifRef} style={{ position: "relative" }}>
            <button
              onClick={() => { if (notifOpen) { markAllRead(); setNotifOpen(false); } else { setNotifOpen(true); } }}
              style={{ position: "relative", width: 40, height: 40, borderRadius: 10, border: "1.5px solid #E8DFD0", background: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6B7A3A", flexShrink: 0 }}
            >
              <Bell size={18} />
              {notifs.filter(n => !readIds.has(n.id)).length > 0 && (
                <span style={{ position: "absolute", top: -5, right: -5, background: "#6B7A3A", color: "white", borderRadius: "50%", width: 18, height: 18, fontSize: "0.65rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui", border: "2px solid white" }}>
                  {notifs.filter(n => !readIds.has(n.id)).length > 9 ? "9+" : notifs.filter(n => !readIds.has(n.id)).length}
                </span>
              )}
            </button>

            {/* Dropdown de notificaciones */}
            {notifOpen && (
              <div className="notif-dropdown" style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 360, background: "white", border: "1.5px solid #E8DFD0", borderRadius: 18, boxShadow: "0 12px 40px rgba(61,43,31,0.15)", zIndex: 100, overflow: "hidden" }}>

                {/* Cabecera */}
                <div style={{ background: "linear-gradient(135deg, #6B7A3A 0%, #8A9A50 100%)", padding: "16px 18px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Bell size={15} color="rgba(255,255,255,0.9)" />
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "white", fontFamily: "system-ui", letterSpacing: "0.01em" }}>Notificaciones</span>
                  </div>
                  {notifs.length > 0 && (
                    <span style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.22)", color: "white", fontFamily: "system-ui", fontWeight: 700, borderRadius: 20, padding: "3px 9px" }}>
                      {notifs.length} avisos
                    </span>
                  )}
                </div>

                {/* Lista */}
                <div style={{ maxHeight: 400, overflowY: "auto" }}>
                  {notifs.length === 0 ? (
                    <div style={{ padding: "40px 20px", textAlign: "center" }}>
                      <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                        <Bell size={22} color="#C4B49A" />
                      </div>
                      <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: "0 0 4px" }}>Todo al día</p>
                      <p style={{ fontSize: "0.75rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>No tienes avisos pendientes</p>
                    </div>
                  ) : (
                    notifs.map((n, i) => {
                      const unread = !readIds.has(n.id);
                      return (
                        <div key={n.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 16px", borderBottom: i < notifs.length - 1 ? "1px solid #F5F0E8" : "none", background: unread ? `${n.color}07` : "white", borderLeft: `3px solid ${unread ? n.color : "transparent"}`, transition: "background 0.2s" }}>
                          {/* Icono */}
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${n.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: n.color, border: `1px solid ${n.color}28` }}>
                            <NotifIcon type={n.type} />
                          </div>
                          {/* Texto */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                              <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: 0 }}>{n.title}</p>
                              {unread && <span style={{ width: 6, height: 6, borderRadius: "50%", background: n.color, flexShrink: 0 }} />}
                            </div>
                            <p style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Filtro de periodo */}
          <div className="period-filter" style={{ display: "flex", background: "white", border: "1.5px solid #E8DFD0", borderRadius: 12, padding: 4, gap: 2 }}>
            {(["dia", "semana", "mes", "año"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className="period-btn"
                style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: period === p ? "#6B7A3A" : "transparent", color: period === p ? "white" : "#8C7B6B", fontSize: "0.82rem", fontFamily: "system-ui", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                {p === "dia" ? "Día" : p === "semana" ? "Semana" : p === "mes" ? "Mes" : "Año"}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="home-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Gasto del periodo", value: `${(history?.period_spent || 0).toFixed(2)}€`, sub: `esta ${period === "dia" ? "jornada" : period === "semana" ? "semana" : period === "mes" ? "mes" : "año"}`, color: "#6B7A3A" },
          { label: "Ahorro estimado", value: `${(history?.ahorro_estimado || 0).toFixed(2)}€`, sub: `vs. precio sin oferta`, color: "#B8A06A" },
          { label: "Ticket medio", value: `${stats && stats.total_purchases > 0 ? (stats.total_spent / stats.total_purchases).toFixed(2) : "0.00"}€`, sub: "por compra", color: "#C17F3A" },
          { label: "Compras realizadas", value: `${stats?.total_purchases || 0}`, sub: `${(stats?.total_spent || 0).toFixed(2)}€ en total`, color: "#3D2B1F" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 16, padding: "18px 20px", boxShadow: "0 2px 12px rgba(61,43,31,0.04)" }}>
            <p style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
            <p style={{ fontSize: "1.7rem", fontWeight: 700, color: s.color, fontFamily: "Georgia, serif", margin: "0 0 4px" }}>{s.value}</p>
            <p style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Presupuestos */}
      {stats && stats.budgets && Object.values(stats.budgets).some(v => v > 0) && (() => {
        const budgetItems: { key: string; label: string; icon: React.ElementType; spent: number; limit: number }[] = [
          { key: "daily",   label: "Diario",   icon: Calendar,      spent: 0,                      limit: stats.budgets.daily   || 0 },
          { key: "weekly",  label: "Semanal",  icon: CalendarDays,  spent: stats.weekly_spent || 0, limit: stats.budgets.weekly  || 0 },
          { key: "monthly", label: "Mensual",  icon: CalendarRange, spent: stats.monthly_spent || 0, limit: stats.budgets.monthly || 0 },
          { key: "yearly",  label: "Anual",    icon: Wallet,        spent: stats.total_spent || 0,  limit: stats.budgets.yearly  || 0 },
        ].filter(b => b.limit > 0);

        const cols = budgetItems.length === 1 ? "1fr" : budgetItems.length === 2 ? "repeat(2, 1fr)" : budgetItems.length === 3 ? "repeat(3, 1fr)" : "repeat(4, 1fr)";

        return (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h2 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8C7B6B", fontFamily: "system-ui", margin: 0, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Control de presupuesto
              </h2>
              <Link href="/ajustes" style={{ fontSize: "0.75rem", color: "#6B7A3A", fontFamily: "system-ui", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                <Settings size={12} /> Ajustar
              </Link>
            </div>
            <div className="home-budget" style={{ display: "grid", gridTemplateColumns: cols, gap: 14 }}>
              {budgetItems.map((b, i) => {
                const pct = Math.min((b.spent / b.limit) * 100, 100);
                const over = b.spent > b.limit;
                const barColor = over ? "#A63D2F" : "#6B7A3A";
                const bgColor = over ? "rgba(166,61,47,0.06)" : "rgba(107,122,58,0.06)";
                const Icon = b.icon;
                return (
                  <motion.div key={b.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 + i * 0.06 }}
                    style={{ background: "white", border: `1.5px solid ${over ? "rgba(166,61,47,0.25)" : "#E8DFD0"}`, borderRadius: 16, padding: "16px 18px", boxShadow: "0 2px 12px rgba(61,43,31,0.04)" }}>
                    {/* Header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 9, background: bgColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Icon size={15} color={barColor} />
                        </div>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui" }}>{b.label}</span>
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: barColor, fontFamily: "system-ui", background: bgColor, borderRadius: 6, padding: "3px 7px" }}>
                        {over ? `+${(b.spent - b.limit).toFixed(2)}€` : `${Math.round(pct)}%`}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height: 7, background: "#F5F0E8", borderRadius: 4, marginBottom: 10, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 4, transition: "width 0.6s ease" }} />
                    </div>
                    {/* Amounts */}
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "1.3rem", fontWeight: 700, color: barColor, fontFamily: "Georgia, serif" }}>{b.spent.toFixed(2)}€</span>
                      <span style={{ fontSize: "0.75rem", color: "#8C7B6B", fontFamily: "system-ui" }}>de {b.limit.toFixed(2)}€</span>
                    </div>
                    <p style={{ fontSize: "0.7rem", color: over ? "#A63D2F" : "#8C7B6B", fontFamily: "system-ui", margin: "4px 0 0", fontWeight: over ? 600 : 400 }}>
                      {over ? "Presupuesto superado" : `Quedan ${(b.limit - b.spent).toFixed(2)}€`}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })()}

      {/* Charts fila 1 */}
      <div className="home-charts" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* BarChart gasto */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(61,43,31,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: 0 }}>
              Gasto por {period === "dia" ? "horas" : period === "semana" ? "días" : period === "mes" ? "semanas" : "meses"}
            </h3>
            {historyLoading && <span style={{ width: 14, height: 14, border: "2px solid #E8DFD0", borderTopColor: "#6B7A3A", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />}
          </div>
          {history?.chart_data.every(d => d.gasto === 0) ? (
            <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center", color: "#8C7B6B", fontFamily: "system-ui", fontSize: "0.85rem" }}>
              Sin compras en este periodo
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={history?.chart_data || []} barSize={period === "año" ? 22 : 32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F0E8" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fontFamily: "system-ui", fill: "#8C7B6B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontFamily: "system-ui", fill: "#8C7B6B" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#F5F0E8" }} isAnimationActive={false} />
                <Bar dataKey="gasto" radius={[6, 6, 0, 0]}>
                  {(history?.chart_data || []).map((entry, i) => (
                    <Cell key={i} fill={isCurrentLabel(entry.label, period) ? "#C17F3A" : "#6B7A3A"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Pie supermercados */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(61,43,31,0.04)" }}>
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: "0 0 4px" }}>Por supermercado</h3>
          <p style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 8px" }}>gasto acumulado</p>
          {smPieData.length === 0 ? (
            <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "#8C7B6B", fontFamily: "system-ui", fontSize: "0.82rem" }}>
              Sin datos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={smPieData} cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} dataKey="value">
                  {smPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v}€`, ""]} contentStyle={{ borderRadius: 10, border: "1.5px solid #E8DFD0", fontFamily: "system-ui", fontSize: 12 }} isAnimationActive={false} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {smPieData.map((sm, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: sm.color }} />
                  <span style={{ fontSize: "0.78rem", color: "#3D2B1F", fontFamily: "system-ui" }}>{sm.name}</span>
                </div>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui" }}>{sm.value}€</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* LineChart ticket medio — fila completa */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(61,43,31,0.04)", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: "0 0 2px" }}>Ticket medio por compra</h3>
            <p style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>gasto medio en cada visita</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#B8A06A", fontFamily: "Georgia, serif", margin: 0 }}>
              {(() => {
                const totalCompras = history?.chart_data.reduce((s, d) => s + (d.count || 0), 0) || 0;
                const totalGasto = history?.chart_data.reduce((s, d) => s + d.gasto, 0) || 0;
                return totalCompras > 0 ? `${(totalGasto / totalCompras).toFixed(2)}€` : "—";
              })()}
            </p>
            <p style={{ fontSize: "0.7rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>media del periodo</p>
          </div>
        </div>
        {history?.chart_data.every(d => d.gasto === 0) ? (
          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#8C7B6B", fontFamily: "system-ui", fontSize: "0.85rem" }}>
            Sin compras en este periodo
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={history?.chart_data || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F5F0E8" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fontFamily: "system-ui", fill: "#8C7B6B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: "system-ui", fill: "#8C7B6B" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} />
              <Tooltip content={<CustomTooltip unit="€" />} isAnimationActive={false} />
              <Line type="monotone" dataKey="ticket_medio" stroke="#B8A06A" strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const current = isCurrentLabel(payload.label, period);
                  return <circle key={payload.label} cx={cx} cy={cy} r={current ? 6 : 3} fill={current ? "#C17F3A" : "#B8A06A"} stroke="white" strokeWidth={current ? 2 : 0} />;
                }}
                activeDot={{ r: 6, fill: "#B8A06A" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Accesos rápidos — fila completa */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Accesos rápidos</h2>
        <div className="home-accesos" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {ACCESOS.map((a, i) => (
            <motion.div key={i} whileHover={{ y: -3, boxShadow: "0 8px 24px rgba(61,43,31,0.10)" }} whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              style={{ borderRadius: 16, overflow: "hidden", boxShadow: "0 2px 8px rgba(61,43,31,0.05)" }}>
              <Link href={a.href} style={{ textDecoration: "none" }}>
                <div style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 16, overflow: "hidden", height: "100%" }}>
                  {/* Acento de color superior */}
                  <div style={{ height: 4, background: a.color, opacity: 0.85 }} />
                  <div style={{ padding: "18px 20px 16px" }}>
                    {/* Icono */}
                    <div style={{ width: 46, height: 46, borderRadius: 13, background: `${a.color}16`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                      <a.icon size={22} color={a.color} />
                    </div>
                    {/* Texto */}
                    <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: "0 0 4px" }}>{a.label}</p>
                    <p style={{ fontSize: "0.75rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 16px", lineHeight: 1.4 }}>{a.desc}</p>
                    {/* Footer con flecha */}
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 600, color: a.color, fontFamily: "system-ui" }}>Ir ahora</span>
                      <ArrowRight size={12} color={a.color} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Ofertas */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(61,43,31,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: 0, display: "flex", alignItems: "center", gap: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <Flame size={15} color="#C17F3A" /> Ofertas destacadas
          </h2>
          <Link href="/ofertas" style={{ fontSize: "0.8rem", color: "#6B7A3A", fontFamily: "system-ui", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            Ver todas <ArrowRight size={13} />
          </Link>
        </div>
        {ofertasLoading ? (
          <div className="home-ofertas" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: "#F5F0E8", borderRadius: 14, aspectRatio: "1", animation: "pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        ) : ofertas.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "#8C7B6B", fontFamily: "system-ui" }}>
            No hay ofertas disponibles
          </div>
        ) : (
          <div className="home-ofertas" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            {ofertas.map((oferta, i) => (
              <motion.div key={oferta.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.05 }}
                whileHover={{ scale: 1.03, y: -2 }}
                style={{ background: "#FDFAF6", border: "1.5px solid #6B7A3A", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(107,122,58,0.10)", cursor: "pointer" }}>
                <div style={{ width: "100%", aspectRatio: "1", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
                  {oferta.image_url ? <img src={oferta.image_url} alt={oferta.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "2rem" }}>🏷️</span>}
                  {oferta.original_price && (
                    <span style={{ position: "absolute", top: 6, right: 6, background: "#C17F3A", color: "white", borderRadius: 6, padding: "2px 5px", fontSize: "0.65rem", fontWeight: 700, fontFamily: "system-ui" }}>
                      -{descuento(oferta.price, oferta.original_price)}%
                    </span>
                  )}
                </div>
                <div style={{ padding: "8px 10px" }}>
                  <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{oferta.product_name}</p>
                  <p style={{ fontSize: "0.65rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 4px" }}>{oferta.supermarket}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#C17F3A", fontFamily: "Georgia, serif" }}>{oferta.price}€</span>
                    {oferta.original_price && <span style={{ fontSize: "0.7rem", color: "#8C7B6B", textDecoration: "line-through", fontFamily: "system-ui" }}>{oferta.original_price}€</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 768px) {
          .home-page { padding: 16px !important; }
          .home-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .home-budget { grid-template-columns: repeat(2, 1fr) !important; }
          .home-charts { grid-template-columns: 1fr !important; }
          .home-accesos { grid-template-columns: repeat(2, 1fr) !important; }
          .home-ofertas { grid-template-columns: repeat(3, 1fr) !important; }
          .notif-dropdown {
            position: fixed !important;
            top: 62px !important;
            left: 8px !important;
            right: 8px !important;
            width: auto !important;
            max-height: 75vh !important;
            overflow-y: auto !important;
          }
          .period-btn { padding: 7px 10px !important; font-size: 0.75rem !important; }
        }
        @media (max-width: 480px) {
          .home-page { padding: 12px !important; }
          .home-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .home-budget { grid-template-columns: repeat(2, 1fr) !important; }
          .home-ofertas { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}