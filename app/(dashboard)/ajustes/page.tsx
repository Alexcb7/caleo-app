"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Bell, ShoppingCart, Wallet, LogOut, Check,
  Calendar, CalendarDays, CalendarRange, BarChart3,
  BellRing, BellOff, Clock, Pencil, X, Lock,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type UserData = { id: number; name: string; email: string; created_at: string };

/* ── Inputs estilizados ─────────────────────────────────── */
function StyledInput({
  label, icon, value, onChange, type = "text", placeholder, suffix,
}: {
  label: string; icon: React.ReactNode; value: string;
  onChange: (v: string) => void; type?: string;
  placeholder?: string; suffix?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#8C7B6B", fontFamily: "system-ui", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </label>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        border: `1.5px solid ${focused ? "#6B7A3A" : "#E8DFD0"}`,
        borderRadius: 12, padding: "10px 14px",
        background: focused ? "white" : "#F5F0E8",
        transition: "all 0.15s",
      }}>
        <span style={{ flexShrink: 0, opacity: focused ? 1 : 0.6, transition: "opacity 0.15s" }}>{icon}</span>
        <input
          type={type} value={value} placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, border: "none", outline: "none", fontSize: "0.92rem", color: "#3D2B1F", fontFamily: "system-ui", background: "transparent" }}
        />
        {suffix && <span style={{ fontSize: "0.88rem", color: "#8C7B6B", fontFamily: "system-ui", flexShrink: 0 }}>{suffix}</span>}
      </div>
    </div>
  );
}

/* ── Toggle ─────────────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <div onClick={onChange}
      style={{ width: 44, height: 24, borderRadius: 99, background: on ? "#6B7A3A" : "#E8DFD0", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <motion.div
        animate={{ x: on ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(61,43,31,0.2)" }}
      />
    </div>
  );
}

/* ── Card section ───────────────────────────────────────── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 18, overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

function BudgetCard({ label, icon, value, onChange }: {
  label: string; icon: React.ReactNode; value: string; onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      border: `1.5px solid ${focused ? "#B8A06A" : "#E8DFD0"}`,
      borderRadius: 12, padding: "12px 14px",
      background: focused ? "white" : "#F5F0E8",
      transition: "all 0.15s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#8C7B6B", fontFamily: "system-ui", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <input
          type="number" placeholder="—" value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ flex: 1, border: "none", outline: "none", fontSize: "1.1rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", background: "transparent", width: "100%" }}
        />
        <span style={{ fontSize: "0.9rem", color: "#B8A06A", fontFamily: "Georgia, serif", fontWeight: 700 }}>€</span>
      </div>
    </div>
  );
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "18px 20px 0" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <h2 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </h2>
    </div>
  );
}

/* ── Página ─────────────────────────────────────────────── */
export default function AjustesPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [budgets, setBudgets] = useState({ daily: "", weekly: "", monthly: "", yearly: "" });
  const [savingBudget, setSavingBudget] = useState(false);
  const [savedBudget, setSavedBudget] = useState(false);
  const [editingBudgets, setEditingBudgets] = useState(false);

  const [notifs, setNotifs] = useState<{ ofertas: boolean; presupuesto: boolean; comparaciones: boolean }>(() => {
    try {
      const stored = localStorage.getItem("notifs");
      if (stored) return JSON.parse(stored);
    } catch {}
    return { ofertas: true, presupuesto: true, comparaciones: false };
  });

  useEffect(() => {
    localStorage.setItem("notifs", JSON.stringify(notifs));
  }, [notifs]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const u = JSON.parse(stored);
      fetchUser(u.id);
      fetchBudgets(u.id);
    }
  }, []);

  const fetchUser = async (userId: number) => {
    try {
      const res = await fetch(`${API_URL}/ajustes/user/${userId}`);
      const data = await res.json();
      setUser(data);
      setName(data.name || "");
      setEmail(data.email || "");
    } catch {}
    setLoading(false);
  };

  const fetchBudgets = async (userId: number) => {
    try {
      const res = await fetch(`${API_URL}/stats/user/${userId}`);
      const data = await res.json();
      if (data.budgets) {
        setBudgets({
          daily: data.budgets.daily ? String(data.budgets.daily) : "",
          weekly: data.budgets.weekly ? String(data.budgets.weekly) : "",
          monthly: data.budgets.monthly ? String(data.budgets.monthly) : "",
          yearly: data.budgets.yearly ? String(data.budgets.yearly) : "",
        });
      }
    } catch {}
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await fetch(`${API_URL}/ajustes/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      localStorage.setItem("user", JSON.stringify({ ...user, name }));
      setSaved(true);
      setEditingProfile(false);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  };

  const handleSaveBudgets = async () => {
    if (!user) return;
    setSavingBudget(true);
    try {
      for (const [period, amount] of Object.entries(budgets)) {
        if (amount) {
          await fetch(`${API_URL}/stats/budget`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id, period, amount: parseFloat(amount) }),
          });
        }
      }
      setSavedBudget(true);
      setEditingBudgets(false);
      setTimeout(() => setSavedBudget(false), 2000);
    } catch {}
    setSavingBudget(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "CA";

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <span style={{ width: 32, height: 32, border: "3px solid #E8DFD0", borderTopColor: "#6B7A3A", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "block" }} />
    </div>
  );

  return (
    <div className="ajustes-page" style={{ padding: "24px" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>Ajustes</h1>
        <p style={{ fontSize: "0.85rem", color: "#8C7B6B", margin: "4px 0 0", fontFamily: "system-ui" }}>Gestiona tu cuenta y preferencias</p>
      </motion.div>

      {/* ── Fila 1: Perfil — ancho completo ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={{ marginBottom: 20 }}>
        <Card>
          <div className="perfil-grid" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 0 }}>
            {/* Lado izquierdo: identidad */}
            <div className="perfil-left" style={{ padding: "28px 24px", borderRight: "1px solid #F5F0E8", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #6B7A3A, #8A9B4A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(107,122,58,0.3)" }}>
                <span style={{ fontSize: "1.35rem", fontWeight: 700, color: "white", fontFamily: "system-ui" }}>{initials}</span>
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "0.95rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: 0 }}>{name || "—"}</p>
                <p style={{ fontSize: "0.75rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "3px 0 0" }}>{email || "—"}</p>
              </div>
              {user && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#F5F0E8", borderRadius: 8, padding: "4px 10px" }}>
                  <Clock size={11} color="#8C7B6B" />
                  <span style={{ fontSize: "0.7rem", color: "#8C7B6B", fontFamily: "system-ui", whiteSpace: "nowrap" }}>Desde {formatDate(user.created_at)}</span>
                </div>
              )}
            </div>

            {/* Lado derecho: formulario */}
            <div style={{ padding: "24px 28px" }}>
              {/* Cabecera sección con botón editar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <User size={13} color="#6B7A3A" />
                  </div>
                  <h2 style={{ fontSize: "0.8rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Datos personales</h2>
                </div>
                <button
                  onClick={() => setEditingProfile(e => !e)}
                  style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${editingProfile ? "#E8DFD0" : "#E8DFD0"}`, background: editingProfile ? "#F5F0E8" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {editingProfile ? <X size={14} color="#8C7B6B" /> : <Pencil size={13} color="#6B7A3A" />}
                </button>
              </div>

              {editingProfile ? (
                /* Modo edición */
                <>
                  <div className="profile-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                    <StyledInput label="Nombre" icon={<User size={16} color="#6B7A3A" />} value={name} onChange={setName} placeholder="Tu nombre" />
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#8C7B6B", fontFamily: "system-ui", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</label>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, border: "1.5px solid #E8DFD0", borderRadius: 12, padding: "10px 14px", background: "#F0EDE8" }}>
                        <span style={{ flexShrink: 0, opacity: 0.4 }}><Mail size={16} color="#6B7A3A" /></span>
                        <span style={{ flex: 1, fontSize: "0.92rem", color: "#8C7B6B", fontFamily: "system-ui" }}>{email}</span>
                        <Lock size={13} color="#B8A06A" style={{ flexShrink: 0 }} />
                      </div>
                    </div>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSaveProfile} disabled={saving}
                    style={{ padding: "10px 24px", background: saved ? "#4A6B2A" : "#6B7A3A", color: "white", border: "none", borderRadius: 11, fontFamily: "system-ui", fontWeight: 700, fontSize: "0.88rem", cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 7, transition: "background 0.2s" }}>
                    {saved ? <><Check size={14} />Guardado</> : saving ? "Guardando..." : "Guardar cambios"}
                  </motion.button>
                </>
              ) : (
                /* Modo lectura */
                <div className="profile-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {[
                    { label: "Nombre", icon: <User size={14} color="#6B7A3A" />, value: name || "—" },
                    { label: "Email",  icon: <Mail size={14} color="#6B7A3A" />, value: email || "—" },
                  ].map(f => (
                    <div key={f.label} style={{ padding: "10px 14px", background: "#F5F0E8", borderRadius: 12, border: "1.5px solid #E8DFD0", minHeight: 72 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        {f.icon}
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8C7B6B", fontFamily: "system-ui", textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</span>
                      </div>
                      <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Fila 2: Presupuestos | Notificaciones — misma altura ── */}
      <div className="ajustes-row2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "stretch" }}>

        {/* Presupuestos */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ height: "100%" }}>
          <Card style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Cabecera con botón editar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wallet size={14} color="#B8A06A" />
                </div>
                <h2 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Presupuestos</h2>
              </div>
              <button
                onClick={() => setEditingBudgets(e => !e)}
                style={{ width: 30, height: 30, borderRadius: 8, border: "1.5px solid #E8DFD0", background: editingBudgets ? "#F5F0E8" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {editingBudgets ? <X size={14} color="#8C7B6B" /> : <Pencil size={13} color="#6B7A3A" />}
              </button>
            </div>

            <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
              {editingBudgets ? (
                /* Modo edición */
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14, flex: 1 }}>
                    <BudgetCard label="Diario"   icon={<Calendar size={15} color="#B8A06A" />}     value={budgets.daily}   onChange={v => setBudgets(p => ({ ...p, daily: v }))} />
                    <BudgetCard label="Semanal"  icon={<CalendarDays size={15} color="#B8A06A" />}  value={budgets.weekly}  onChange={v => setBudgets(p => ({ ...p, weekly: v }))} />
                    <BudgetCard label="Mensual"  icon={<CalendarRange size={15} color="#B8A06A" />} value={budgets.monthly} onChange={v => setBudgets(p => ({ ...p, monthly: v }))} />
                    <BudgetCard label="Anual"    icon={<BarChart3 size={15} color="#B8A06A" />}     value={budgets.yearly}  onChange={v => setBudgets(p => ({ ...p, yearly: v }))} />
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSaveBudgets} disabled={savingBudget}
                    style={{ width: "100%", padding: "11px 0", background: savedBudget ? "#4A6B2A" : "#6B7A3A", color: "white", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 700, fontSize: "0.88rem", cursor: savingBudget ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, transition: "background 0.2s" }}>
                    {savedBudget ? <><Check size={14} />Guardado</> : savingBudget ? "Guardando..." : "Guardar presupuestos"}
                  </motion.button>
                </>
              ) : (
                /* Modo lectura */
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Diario",  icon: <Calendar size={14} color="#B8A06A" />,     value: budgets.daily },
                    { label: "Semanal", icon: <CalendarDays size={14} color="#B8A06A" />,  value: budgets.weekly },
                    { label: "Mensual", icon: <CalendarRange size={14} color="#B8A06A" />, value: budgets.monthly },
                    { label: "Anual",   icon: <BarChart3 size={14} color="#B8A06A" />,     value: budgets.yearly },
                  ].map(b => (
                    <div key={b.label} style={{ padding: "12px 14px", background: "#F5F0E8", borderRadius: 12, border: "1.5px solid #E8DFD0", minHeight: 80 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        {b.icon}
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#8C7B6B", fontFamily: "system-ui", textTransform: "uppercase", letterSpacing: "0.05em" }}>{b.label}</span>
                      </div>
                      <p style={{ fontSize: "1.05rem", fontWeight: 700, color: b.value ? "#3D2B1F" : "#C8BEB5", fontFamily: "Georgia, serif", margin: 0 }}>
                        {b.value ? `${b.value} €` : "Sin límite"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Notificaciones */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ height: "100%" }}>
          <Card style={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <SectionTitle icon={<Bell size={14} color="#C17F3A" />} label="Notificaciones" />
            <div style={{ padding: "10px 0", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                {[
                  { key: "ofertas",       label: "Alertas de ofertas",    desc: "Nuevas ofertas disponibles",          icon: <BellRing size={15} color="#C17F3A" /> },
                  { key: "presupuesto",   label: "Aviso de presupuesto",  desc: "Al acercarte al límite mensual",      icon: <Wallet size={15} color="#C17F3A" /> },
                  { key: "comparaciones", label: "Comparaciones",         desc: "Recordatorio de listas sin comparar", icon: <BellOff size={15} color="#C17F3A" /> },
                ].map((n, i, arr) => (
                  <div key={n.key} style={{ padding: "13px 20px", borderBottom: i < arr.length - 1 ? "1px solid #F5F0E8" : "none", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(193,127,58,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {n.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.87rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: 0 }}>{n.label}</p>
                      <p style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "2px 0 0" }}>{n.desc}</p>
                    </div>
                    <Toggle on={notifs[n.key as keyof typeof notifs]} onChange={() => setNotifs(prev => ({ ...prev, [n.key]: !prev[n.key as keyof typeof prev] }))} />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0", padding: "14px 20px 6px", borderTop: "1px solid #F5F0E8" }}>
                Las notificaciones estarán disponibles próximamente.
              </p>
            </div>
          </Card>
        </motion.div>

      </div>

      {/* ── Fila 3: Supermercados activos — horizontal ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginTop: 20 }}>
        <Card>
          <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginRight: 4 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShoppingCart size={13} color="#6B7A3A" />
              </div>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", textTransform: "uppercase", letterSpacing: "0.06em" }}>Supermercados</span>
            </div>
            <div className="sm-cards" style={{ flex: 1, display: "flex", gap: 12 }}>
              {[
                { name: "Mercadona", color: "#6B7A3A", active: true },
                { name: "Día",       color: "#6B7A3A", active: true },
              ].map(sm => (
                <div key={sm.name} style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: `${sm.color}0D`, border: `1.5px solid ${sm.color}28`, borderRadius: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${sm.color}18`, border: `1.5px solid ${sm.color}35`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ShoppingCart size={15} color={sm.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: 0 }}>{sm.name}</p>
                    <p style={{ fontSize: "0.72rem", fontWeight: 600, color: sm.color, fontFamily: "system-ui", margin: "2px 0 0" }}>{sm.active ? "Activo" : "Inactivo"}</p>
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: sm.color, boxShadow: `0 0 6px ${sm.color}80`, flexShrink: 0 }} />
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Fila 4: Cuenta ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ marginTop: 20 }}>
        <Card>
          <div style={{ padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LogOut size={13} color="#8C7B6B" />
              </div>
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cuenta</span>
            </div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleLogout}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 18px", background: "rgba(166,61,47,0.06)", border: "1.5px solid rgba(166,61,47,0.2)", borderRadius: 11, cursor: "pointer" }}>
              <LogOut size={14} color="#A63D2F" />
              <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "#A63D2F", fontFamily: "system-ui" }}>Cerrar sesión</span>
            </motion.button>
          </div>
        </Card>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }

        @media (max-width: 768px) {
          .ajustes-page { padding: 16px !important; }
          .perfil-grid { grid-template-columns: 1fr !important; }
          .perfil-left { border-right: none !important; border-bottom: 1px solid #F5F0E8 !important; padding: 24px 20px !important; }
          .profile-form-grid { grid-template-columns: 1fr !important; }
          .ajustes-row2 { grid-template-columns: 1fr !important; }
          .sm-cards { flex-direction: column !important; }
        }
        @media (max-width: 480px) {
          .ajustes-page { padding: 12px !important; }
        }
      `}</style>
    </div>
  );
}
