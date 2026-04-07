"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Lock, Bell, ShoppingCart, Wallet, LogOut, ChevronRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type UserData = { id: number; name: string; email: string; created_at: string };

export default function AjustesPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Formulario perfil
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Presupuestos
  const [budgets, setBudgets] = useState({ daily: "", weekly: "", monthly: "", yearly: "" });
  const [savingBudget, setSavingBudget] = useState(false);
  const [savedBudget, setSavedBudget] = useState(false);

  // Notificaciones (solo UI de momento)
  const [notifs, setNotifs] = useState({ ofertas: true, presupuesto: true, comparaciones: false });

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
        body: JSON.stringify({ name, email }),
      });
      localStorage.setItem("user", JSON.stringify({ ...user, name, email }));
      setSaved(true);
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

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: "0.78rem", fontWeight: 700, color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{title}</h2>
      <div style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 16, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );

  const Field = ({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div style={{ padding: "16px 20px", borderBottom: "1px solid #F5F0E8", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 36, height: 36, background: "#F5F0E8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: "0.75rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 4px" }}>{label}</p>
        {children}
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
      <span style={{ width: 32, height: 32, border: "3px solid #E8DFD0", borderTopColor: "#6B7A3A", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "block" }} />
    </div>
  );

  return (
    <div style={{ padding: "24px 48px", maxWidth: 1100, margin: "0 auto", width: "100%" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>Ajustes</h1>
        <p style={{ fontSize: "0.85rem", color: "#8C7B6B", margin: "4px 0 0", fontFamily: "system-ui" }}>
          Gestiona tu cuenta y preferencias
        </p>
      </motion.div>

      {/* Perfil */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Section title="Perfil">
          <Field label="Nombre" icon={<User size={16} color="#6B7A3A" />}>
            <input value={name} onChange={e => setName(e.target.value)}
              style={{ width: "100%", border: "none", outline: "none", fontSize: "0.92rem", color: "#3D2B1F", fontFamily: "system-ui", background: "transparent" }} />
          </Field>
          <Field label="Email" icon={<Mail size={16} color="#6B7A3A" />}>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email"
              style={{ width: "100%", border: "none", outline: "none", fontSize: "0.92rem", color: "#3D2B1F", fontFamily: "system-ui", background: "transparent" }} />
          </Field>
          <Field label="Miembro desde" icon={<User size={16} color="#8C7B6B" />}>
            <p style={{ fontSize: "0.92rem", color: "#3D2B1F", fontFamily: "system-ui", margin: 0 }}>{user ? formatDate(user.created_at) : "—"}</p>
          </Field>
          <div style={{ padding: "14px 20px" }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSaveProfile} disabled={saving}
              style={{ padding: "10px 20px", background: saved ? "#6B7A3A" : "#6B7A3A", color: "white", border: "none", borderRadius: 10, fontFamily: "system-ui", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {saved ? <><Check size={14} />Guardado</> : saving ? "Guardando..." : "Guardar cambios"}
            </motion.button>
          </div>
        </Section>
      </motion.div>

      {/* Presupuestos */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Section title="Presupuestos">
          {[
            { key: "daily", label: "Diario", icon: "📅" },
            { key: "weekly", label: "Semanal", icon: "📆" },
            { key: "monthly", label: "Mensual", icon: "🗓️" },
            { key: "yearly", label: "Anual", icon: "📊" },
          ].map(b => (
            <Field key={b.key} label={`Presupuesto ${b.label.toLowerCase()}`} icon={<Wallet size={16} color="#B8A06A" />}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input
                  type="number" placeholder="Sin límite"
                  value={budgets[b.key as keyof typeof budgets]}
                  onChange={e => setBudgets(prev => ({ ...prev, [b.key]: e.target.value }))}
                  style={{ flex: 1, border: "none", outline: "none", fontSize: "0.92rem", color: "#3D2B1F", fontFamily: "system-ui", background: "transparent" }}
                />
                <span style={{ fontSize: "0.85rem", color: "#8C7B6B", fontFamily: "system-ui" }}>€</span>
              </div>
            </Field>
          ))}
          <div style={{ padding: "14px 20px" }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSaveBudgets} disabled={savingBudget}
              style={{ padding: "10px 20px", background: "#6B7A3A", color: "white", border: "none", borderRadius: 10, fontFamily: "system-ui", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              {savedBudget ? <><Check size={14} />Guardado</> : savingBudget ? "Guardando..." : "Guardar presupuestos"}
            </motion.button>
          </div>
        </Section>
      </motion.div>

      {/* Notificaciones */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Section title="Notificaciones">
          {[
            { key: "ofertas", label: "Alertas de ofertas", desc: "Recibe avisos cuando haya nuevas ofertas" },
            { key: "presupuesto", label: "Aviso de presupuesto", desc: "Notificación al acercarte al límite" },
            { key: "comparaciones", label: "Comparaciones guardadas", desc: "Recordatorio de listas sin comparar" },
          ].map(n => (
            <div key={n.key} style={{ padding: "16px 20px", borderBottom: "1px solid #F5F0E8", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, background: "#F5F0E8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bell size={16} color="#C17F3A" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: "0 0 2px" }}>{n.label}</p>
                <p style={{ fontSize: "0.75rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>{n.desc}</p>
              </div>
              {/* Toggle */}
              <div
                onClick={() => setNotifs(prev => ({ ...prev, [n.key]: !prev[n.key as keyof typeof prev] }))}
                style={{ width: 44, height: 24, borderRadius: 99, background: notifs[n.key as keyof typeof notifs] ? "#6B7A3A" : "#E8DFD0", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}
              >
                <motion.div
                  animate={{ x: notifs[n.key as keyof typeof notifs] ? 22 : 2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  style={{ position: "absolute", top: 2, width: 20, height: 20, borderRadius: "50%", background: "white", boxShadow: "0 1px 4px rgba(61,43,31,0.2)" }}
                />
              </div>
            </div>
          ))}
        </Section>
      </motion.div>

      {/* Supermercados */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Section title="Supermercados">
          {[
            { name: "Mercadona", slug: "mercadona", active: true },
            { name: "DIA", slug: "dia", active: true },
          ].map(sm => (
            <div key={sm.slug} style={{ padding: "16px 20px", borderBottom: "1px solid #F5F0E8", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 36, height: 36, background: "#F5F0E8", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShoppingCart size={16} color="#6B7A3A" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: 0 }}>{sm.name}</p>
                <p style={{ fontSize: "0.75rem", color: sm.active ? "#6B7A3A" : "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>{sm.active ? "Activo" : "Inactivo"}</p>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: sm.active ? "#6B7A3A" : "#E8DFD0" }} />
            </div>
          ))}
        </Section>
      </motion.div>

      {/* Cuenta */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Section title="Cuenta">
          <div onClick={handleLogout}
            style={{ padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#FFF5F5")}
            onMouseLeave={e => (e.currentTarget.style.background = "white")}>
            <div style={{ width: 36, height: 36, background: "rgba(166,61,47,0.08)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <LogOut size={16} color="#A63D2F" />
            </div>
            <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "#A63D2F", fontFamily: "system-ui", margin: 0, flex: 1 }}>Cerrar sesión</p>
            <ChevronRight size={16} color="#A63D2F" />
          </div>
        </Section>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}