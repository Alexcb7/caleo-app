"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, TrendingDown, Tag, List, ArrowRight, Flame, TrendingUp } from "lucide-react";
import Link from "next/link";
import Loading from "../loading";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type User = { id: number; name: string; email: string };
type Stats = { total_spent: number; total_purchases: number; monthly_spent: number; weekly_spent: number; budgets: Record<string, number> };
type History = { chart_data: { label: string; gasto: number }[]; supermarket_totals: Record<string, number>; period_spent: number; ahorro_estimado: number };
type Oferta = { id: number; product_name: string; image_url: string; supermarket: string; price: number; original_price: number; category: string };
type Period = "dia" | "semana" | "mes" | "año";

const SM_COLORS = ["#6B7A3A", "#B8A06A", "#C17F3A", "#3D2B1F"];

const DAY_ORDER = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_ORDER = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function sortChartData(data: { label: string; gasto: number }[], period: Period) {
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
  if (period === "mes") return label === "Sem 4"; // Sem 4 = esta semana (el backend siempre la pone última)
  if (period === "dia") return (parseInt(label.replace(/\D/g, "")) || 0) === now.getHours();
  return false;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 10, padding: "8px 14px", boxShadow: "0 4px 16px rgba(61,43,31,0.1)" }}>
        <p style={{ fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 4px" }}>{label}</p>
        <p style={{ fontSize: "1rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>{payload[0].value.toFixed(2)}€</p>
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
  const [hora, setHora] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("semana");
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyCache = useRef<Partial<Record<Period, History>>>({});

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      fetchStats(u.id);
    }
    fetchOfertas();
    const h = new Date().getHours();
    if (h < 12) setHora("Buenos días");
    else if (h < 20) setHora("Buenas tardes");
    else setHora("Buenas noches");
  }, []);

  useEffect(() => {
    if (user) fetchHistory(user.id, period);
  }, [period, user]);

  const fetchStats = async (userId: number) => {
    try {
      const res = await fetch(`${API_URL}/stats/user/${userId}`);
      setStats(await res.json());
    } catch {}
  };

  const fetchHistory = async (userId: number, p: Period) => {
    if (historyCache.current[p]) {
      setHistory(historyCache.current[p]!);
      return;
    }
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_URL}/stats/user/${userId}/history?period=${p}`);
      const raw = await res.json();
      const data = { ...raw, chart_data: sortChartData(raw.chart_data || [], p) };
      historyCache.current[p] = data;
      setHistory(data);
    } catch {}
    setHistoryLoading(false);
  };

  const fetchOfertas = async () => {
    try {
      const res = await fetch(`${API_URL}/ofertas/general`);
      const data = await res.json();
      setOfertas(data.slice(0, 6));
    } catch {}
    setIsLoading(false);
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

  if (isLoading) return <Loading />;

  return (
    <div style={{ padding: "28px 32px" }}>

      {/* Header + filtro */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>
            {hora}, {user?.name?.split(" ")[0] || "bienvenido"}
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#8C7B6B", margin: "6px 0 0", fontFamily: "system-ui" }}>Resumen de tu actividad</p>
        </div>
        <div style={{ display: "flex", background: "white", border: "1.5px solid #E8DFD0", borderRadius: 12, padding: 4, gap: 2 }}>
          {(["dia", "semana", "mes", "año"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: "8px 18px", borderRadius: 9, border: "none", background: period === p ? "#6B7A3A" : "transparent", color: period === p ? "white" : "#8C7B6B", fontSize: "0.82rem", fontFamily: "system-ui", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
              {p === "dia" ? "Día" : p === "semana" ? "Semana" : p === "mes" ? "Mes" : "Año"}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
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

      {/* Charts fila 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>

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

      {/* LineChart ahorro — fila completa */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(61,43,31,0.04)", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: "0 0 2px" }}>Evolución del gasto</h3>
            <p style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>tendencia acumulada</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "1.3rem", fontWeight: 700, color: "#6B7A3A", fontFamily: "Georgia, serif", margin: 0 }}>{(history?.ahorro_estimado || 0).toFixed(2)}€</p>
            <p style={{ fontSize: "0.7rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>ahorro est.</p>
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
              <Tooltip content={<CustomTooltip />} isAnimationActive={false} />
              <Line type="monotone" dataKey="gasto" stroke="#6B7A3A" strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const current = isCurrentLabel(payload.label, period);
                  return <circle key={payload.label} cx={cx} cy={cy} r={current ? 6 : 3} fill={current ? "#C17F3A" : "#6B7A3A"} stroke="white" strokeWidth={current ? 2 : 0} />;
                }}
                activeDot={{ r: 6, fill: "#6B7A3A" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Accesos rápidos — fila completa */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: "0.75rem", fontWeight: 700, color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>Accesos rápidos</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
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
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: 0, display: "flex", alignItems: "center", gap: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <Flame size={15} color="#C17F3A" /> Ofertas destacadas
          </h2>
          <Link href="/ofertas" style={{ fontSize: "0.8rem", color: "#6B7A3A", fontFamily: "system-ui", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            Ver todas <ArrowRight size={13} />
          </Link>
        </div>
        {ofertas.length === 0 ? (
          <div style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 16, padding: 32, textAlign: "center", color: "#8C7B6B", fontFamily: "system-ui" }}>
            No hay ofertas disponibles
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12 }}>
            {ofertas.map((oferta, i) => (
              <motion.div key={oferta.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.05 }}
                whileHover={{ scale: 1.03, y: -2 }}
                style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(61,43,31,0.04)", cursor: "pointer" }}>
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}