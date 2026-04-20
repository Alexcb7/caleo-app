"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Check, Trash2, ChevronRight, X, Home, ListPlus, Leaf, Wheat, Droplets, PawPrint, Wine, Coffee, Beef, Snowflake, Pencil, LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Loading from "../loading";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const LIST_EMOJIS = ["🛒", "🥦", "🍝", "🧴", "🐾", "🍷", "☕", "🥩", "🧊"];
const LIST_ICON_MAP: Record<string, LucideIcon> = {
  "🛒": ShoppingCart, "🥦": Leaf, "🍝": Wheat, "🧴": Droplets,
  "🐾": PawPrint, "🍷": Wine, "☕": Coffee, "🥩": Beef, "🧊": Snowflake,
};

type Purchase = {
  id: number;
  title: string;
  total_price: number;
  is_completed: boolean;
  created_at: string;
  items_count: number;
};

type PurchaseDetail = {
  id: number;
  title: string;
  total_price: number;
  budget_limit: number | null;
  is_completed: boolean;
  created_at: string;
  items: {
    product_id: number;
    product_name: string;
    image_url: string;
    supermarket: string;
    price: number;
    quantity: number;
    is_offer: boolean;
    subtotal: number;
  }[];
};

export default function MisComprasPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [completing, setCompleting] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [timePeriod, setTimePeriod] = useState<"all" | "today" | "week" | "month" | "year">("all");
  const [saveAsListOpen, setSaveAsListOpen] = useState(false);
  const [saveAsListPurchase, setSaveAsListPurchase] = useState<Purchase | null>(null);
  const [listFormName, setListFormName] = useState("");
  const [listFormEmoji, setListFormEmoji] = useState("🛒");
  const [listSaving, setListSaving] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renamePurchase, setRenamePurchase] = useState<Purchase | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      fetchPurchases(user.id);
    }
  }, []);

  const fetchPurchases = async (userId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/purchases/user/${userId}`);
      const data = await res.json();
      setPurchases(data);
    } catch {}
    setLoading(false);
  };

  const fetchDetail = async (purchaseId: number) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`${API_URL}/purchases/${purchaseId}/detail`);
      const data = await res.json();
      setSelectedPurchase(data);
    } catch {}
    setDetailLoading(false);
  };

  const handleComplete = async (purchaseId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompleting(purchaseId);
    try {
      await fetch(`${API_URL}/purchases/${purchaseId}/complete`, { method: "PATCH" });
      setPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, is_completed: true } : p));
      if (selectedPurchase?.id === purchaseId) setSelectedPurchase(prev => prev ? { ...prev, is_completed: true } : null);
    } catch {}
    setCompleting(null);
  };

  const handleDelete = async (purchaseId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(purchaseId);
    try {
      await fetch(`${API_URL}/purchases/${purchaseId}`, { method: "DELETE" });
      setPurchases(prev => prev.filter(p => p.id !== purchaseId));
      if (selectedPurchase?.id === purchaseId) setDetailOpen(false);
    } catch {}
    setDeleting(null);
  };

  const openRename = (purchase: Purchase, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamePurchase(purchase);
    setRenameName(purchase.title);
    setRenameOpen(true);
  };

  const handleRename = async () => {
    if (!renamePurchase || !renameName.trim()) return;
    setRenaming(true);
    try {
      await fetch(`${API_URL}/purchases/${renamePurchase.id}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameName.trim() }),
      });
      setPurchases(prev => prev.map(p => p.id === renamePurchase.id ? { ...p, title: renameName.trim() } : p));
      if (selectedPurchase?.id === renamePurchase.id)
        setSelectedPurchase(prev => prev ? { ...prev, title: renameName.trim() } : null);
      setRenameOpen(false);
      setRenamePurchase(null);
    } catch {}
    setRenaming(false);
  };

  const openSaveAsList = (purchase: Purchase, e: React.MouseEvent) => {
    e.stopPropagation();
    setSaveAsListPurchase(purchase);
    setListFormName(purchase.title);
    setListFormEmoji("🛒");
    setSaveAsListOpen(true);
  };

  const handleSaveAsList = async () => {
    if (!saveAsListPurchase || !listFormName.trim()) return;
    setListSaving(true);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      if (!user) return;
      const res = await fetch(`${API_URL}/purchases/${saveAsListPurchase.id}/detail`);
      const detail: PurchaseDetail = await res.json();
      const items = detail.items.map(item => ({ product_id: item.product_id, price: item.price, quantity: item.quantity }));
      await fetch(`${API_URL}/lists/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, name: `${listFormEmoji} ${listFormName.trim()}`, description: null, items }),
      });
      setSaveAsListOpen(false);
      setSaveAsListPurchase(null);
    } catch {}
    setListSaving(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  };

  const inTimePeriod = (iso: string): boolean => {
    if (timePeriod === "all") return true;
    const SPAIN = "Europe/Madrid";
    const fmt = (d: Date) => d.toLocaleDateString("es-ES", { timeZone: SPAIN });
    const now = new Date();
    const date = new Date(iso);
    if (timePeriod === "today") return fmt(date) === fmt(now);
    if (timePeriod === "week") {
      // lunes de esta semana en hora española
      const todaySpain = new Date(now.toLocaleString("en-US", { timeZone: SPAIN }));
      const mon = new Date(todaySpain);
      mon.setDate(todaySpain.getDate() - ((todaySpain.getDay() + 6) % 7));
      mon.setHours(0, 0, 0, 0);
      const dateSpain = new Date(date.toLocaleString("en-US", { timeZone: SPAIN }));
      return dateSpain >= mon;
    }
    if (timePeriod === "month") {
      const d = new Date(date.toLocaleString("en-US", { timeZone: SPAIN }));
      const n = new Date(now.toLocaleString("en-US", { timeZone: SPAIN }));
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
    }
    if (timePeriod === "year") {
      const d = new Date(date.toLocaleString("en-US", { timeZone: SPAIN }));
      return d.getFullYear() === new Date(now.toLocaleString("en-US", { timeZone: SPAIN })).getFullYear();
    }
    return true;
  };

  const filteredPurchases = purchases.filter(p => {
    const statusOk = filter === "all" || (filter === "pending" ? !p.is_completed : p.is_completed);
    return statusOk && inTimePeriod(p.created_at);
  });

  const totalGastado = filteredPurchases.filter(p => p.is_completed).reduce((acc, p) => acc + p.total_price, 0);
  const pendientes = filteredPurchases.filter(p => !p.is_completed).length;

  if (loading) return <Loading />;

  return (
    <div style={{ padding: "24px" }}>

      {/* Header */}
      <div className="page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>Mis Compras</h1>
          <p style={{ fontSize: "0.85rem", color: "#8C7B6B", margin: "4px 0 0", fontFamily: "system-ui" }}>Historial y seguimiento de tus compras</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/compra")}
          style={{ background: "#6B7A3A", border: "none", borderRadius: 12, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "white", fontFamily: "system-ui", fontWeight: 600, fontSize: "0.9rem" }}
        >
          <ShoppingCart size={16} />
          Nueva compra
        </motion.button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total compras", value: purchases.length, color: "#3D2B1F" },
          { label: "Pendientes", value: pendientes, color: "#C17F3A" },
          { label: "Total gastado", value: `${totalGastado.toFixed(2)}€`, color: "#6B7A3A" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 14, padding: "16px 20px" }}>
            <p style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
            <p style={{ fontSize: "1.5rem", fontWeight: 700, color: s.color, fontFamily: "Georgia, serif", margin: 0 }}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filtros */}
      <div className="filters-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        {/* Estado — izquierda */}
        <div style={{ display: "flex", gap: 8 }}>
          {([
            { key: "all",       label: "Todas" },
            { key: "pending",   label: "Pendientes" },
            { key: "completed", label: "Completadas" },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{ padding: "7px 16px", borderRadius: 20, border: `1.5px solid ${filter === f.key ? "#6B7A3A" : "#E8DFD0"}`, background: filter === f.key ? "#6B7A3A" : "white", color: filter === f.key ? "white" : "#8C7B6B", fontSize: "0.82rem", fontFamily: "system-ui", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
              {f.label}
            </button>
          ))}
        </div>
        {/* Periodo — derecha, badge estilo home */}
        <div style={{ display: "flex", background: "white", border: "1.5px solid #E8DFD0", borderRadius: 12, padding: 4, gap: 2 }}>
          {([
            { key: "all",   label: "Todo" },
            { key: "today", label: "Hoy" },
            { key: "week",  label: "Semana" },
            { key: "month", label: "Mes" },
            { key: "year",  label: "Año" },
          ] as const).map(f => (
            <button key={f.key} onClick={() => setTimePeriod(f.key)}
              style={{ padding: "8px 14px", borderRadius: 9, border: "none", background: timePeriod === f.key ? "#3D2B1F" : "transparent", color: timePeriod === f.key ? "white" : "#8C7B6B", fontSize: "0.82rem", fontFamily: "system-ui", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de compras */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <span style={{ width: 32, height: 32, border: "3px solid #E8DFD0", borderTopColor: "#6B7A3A", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "block" }} />
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", background: "white", borderRadius: 16, border: "1.5px solid #E8DFD0" }}>
          <ShoppingCart size={48} color="#E8DFD0" style={{ margin: "0 auto 16px", display: "block" }} />
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: "0 0 8px" }}>
            {filter === "pending" ? "Sin compras pendientes" : filter === "completed" ? "Sin compras completadas" : "Sin compras"}
            {timePeriod !== "all" && ` ${timePeriod === "today" ? "hoy" : timePeriod === "week" ? "esta semana" : timePeriod === "month" ? "este mes" : "este año"}`}
          </p>
          <p style={{ fontSize: "0.85rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 20px" }}>
            {timePeriod !== "all" ? "Prueba con otro período de tiempo" : "Empieza una nueva compra y guárdala aquí"}
          </p>
          {timePeriod === "all" && filter === "all" && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => router.push("/compra")}
              style={{ background: "#6B7A3A", color: "white", border: "none", borderRadius: 12, padding: "12px 24px", fontFamily: "system-ui", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
              Ir a La Compra
            </motion.button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredPurchases.map((purchase, i) => (
            <motion.div
              key={purchase.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => fetchDetail(purchase.id)}
              whileHover={{ scale: 1.005 }}
              className="purchase-card" style={{ background: "white", border: `1.5px solid ${purchase.is_completed ? "#E8DFD0" : "#6B7A3A20"}`, borderRadius: 16, padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, boxShadow: "0 2px 8px rgba(61,43,31,0.04)" }}
            >
              {/* Checkbox */}
              <div
                onClick={(e) => !purchase.is_completed && handleComplete(purchase.id, e)}
                style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${purchase.is_completed ? "#6B7A3A" : "#E8DFD0"}`, background: purchase.is_completed ? "#6B7A3A" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: purchase.is_completed ? "default" : "pointer", transition: "all 0.2s" }}
              >
                {completing === purchase.id ? (
                  <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: purchase.is_completed ? "white" : "#6B7A3A", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                ) : purchase.is_completed ? (
                  <Check size={14} color="white" strokeWidth={3} />
                ) : null}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <p style={{ fontSize: "0.95rem", fontWeight: 700, color: purchase.is_completed ? "#8C7B6B" : "#3D2B1F", fontFamily: "system-ui", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: purchase.is_completed ? "line-through" : "none" }}>
                    {purchase.title}
                  </p>
                  {purchase.is_completed && (
                    <span style={{ fontSize: "0.65rem", background: "#6B7A3A18", color: "#6B7A3A", borderRadius: 4, padding: "2px 6px", fontFamily: "system-ui", fontWeight: 700, flexShrink: 0 }}>COMPLETADA</span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui" }}>{formatDate(purchase.created_at)}</span>
                  <span style={{ fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui" }}>·</span>
                  <span style={{ fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui" }}>{purchase.items_count} productos</span>
                </div>
              </div>

              {/* Precio */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: "1.1rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>{purchase.total_price.toFixed(2)}€</p>
              </div>

              {/* Acciones */}
              <div className="purchase-card-actions" style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={(e) => openRename(purchase, e)}
                  style={{ width: 32, height: 32, background: "#B8A06A10", border: "1px solid #B8A06A40", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Pencil size={14} color="#B8A06A" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={(e) => openSaveAsList(purchase, e)}
                  style={{ width: 32, height: 32, background: "#6B7A3A10", border: "1px solid #6B7A3A30", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ListPlus size={14} color="#6B7A3A" />
                </motion.button>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={(e) => handleDelete(purchase.id, e)}
                  style={{ width: 32, height: 32, background: "#A63D2F10", border: "1px solid #A63D2F30", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {deleting === purchase.id ? (
                    <span style={{ width: 10, height: 10, border: "2px solid rgba(166,61,47,0.3)", borderTopColor: "#A63D2F", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  ) : (
                    <Trash2 size={14} color="#A63D2F" />
                  )}
                </motion.button>
              </div>

              <ChevronRight size={16} color="#8C7B6B" style={{ flexShrink: 0 }} />
            </motion.div>
          ))}
        </div>
      )}

      {/* Panel detalle */}
      <AnimatePresence>
        {detailOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetailOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(61,43,31,0.4)", zIndex: 200 }} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="side-panel" style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 480, background: "white", zIndex: 201, display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(61,43,31,0.15)" }}
            >
              {detailLoading ? (
                <div style={{ flex: 1 }}>
                  <Loading background="white" />
                </div>
              ) : selectedPurchase && (
                <>
                  {/* Header detalle */}
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid #E8DFD0" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                      <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", color: "#3D2B1F", margin: "0 0 4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedPurchase.title}</h2>
                        <p style={{ fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>
                          {formatDate(selectedPurchase.created_at)} · {selectedPurchase.items.length} productos
                        </p>
                      </div>
                      <button onClick={() => setDetailOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8C7B6B", flexShrink: 0 }}>
                        <X size={20} />
                      </button>
                    </div>

                    {/* Estado + precio */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: selectedPurchase.is_completed ? "#6B7A3A" : "#E8DFD0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {selectedPurchase.is_completed && <Check size={12} color="white" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: "0.8rem", color: selectedPurchase.is_completed ? "#6B7A3A" : "#8C7B6B", fontFamily: "system-ui", fontWeight: 600 }}>
                          {selectedPurchase.is_completed ? "Completada" : "Pendiente"}
                        </span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: "1.4rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>{selectedPurchase.total_price.toFixed(2)}€</p>
                        {selectedPurchase.budget_limit && (
                          <p style={{ fontSize: "0.72rem", color: selectedPurchase.total_price > selectedPurchase.budget_limit ? "#A63D2F" : "#6B7A3A", fontFamily: "system-ui", margin: 0 }}>
                            Presupuesto: {selectedPurchase.budget_limit.toFixed(0)}€
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedPurchase.items.map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#F5F0E8", borderRadius: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                          {item.image_url ? <img src={item.image_url} alt={item.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.3rem" }}>📦</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.product_name}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui" }}>{item.supermarket}</span>
                            <span style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui" }}>x{item.quantity}</span>
                            {item.is_offer && <span style={{ fontSize: "0.62rem", background: "#C17F3A", color: "white", borderRadius: 4, padding: "1px 5px", fontFamily: "system-ui", fontWeight: 700 }}>OFERTA</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>{item.subtotal.toFixed(2)}€</p>
                          <p style={{ fontSize: "0.7rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>{item.price.toFixed(2)}€/ud</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Footer detalle */}
                  <div style={{ padding: "16px 24px", borderTop: "1px solid #E8DFD0", display: "flex", flexDirection: "column", gap: 10 }}>
                    {!selectedPurchase.is_completed && (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={(e) => handleComplete(selectedPurchase.id, e)}
                        style={{ width: "100%", padding: 14, background: "#6B7A3A", color: "white", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Check size={16} />
                        Marcar como completada
                      </motion.button>
                    )}
                    {selectedPurchase.is_completed && (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => { setDetailOpen(false); router.push("/home"); }}
                        style={{ width: "100%", padding: 14, background: "#3D2B1F", color: "white", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <Home size={16} />
                        Ir al Dashboard
                      </motion.button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal guardar como lista */}
      <AnimatePresence>
        {saveAsListOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSaveAsListOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(61,43,31,0.5)", zIndex: 300, backdropFilter: "blur(4px)" }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }} transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="center-modal" style={{ position: "fixed", top: "20%", left: "50%", transform: "translate(-50%, -50%)", width: 440, background: "white", borderRadius: 24, padding: "36px", zIndex: 301, boxShadow: "0 24px 80px rgba(61,43,31,0.2)" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.3rem", color: "#3D2B1F", margin: 0 }}>Guardar como lista</h2>
                <button onClick={() => setSaveAsListOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8C7B6B" }}>
                  <X size={20} />
                </button>
              </div>

              {/* Selector icono */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Icono</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 40px)", gap: 8 }}>
                  {LIST_EMOJIS.map(e => {
                    const Icon = LIST_ICON_MAP[e] || ShoppingCart;
                    return (
                      <button key={e} onClick={() => setListFormEmoji(e)}
                        style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${listFormEmoji === e ? "#6B7A3A" : "#E8DFD0"}`, background: listFormEmoji === e ? "#6B7A3A10" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={18} color={listFormEmoji === e ? "#6B7A3A" : "#8C7B6B"} strokeWidth={1.75} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nombre */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre</label>
                <input
                  type="text" value={listFormName} onChange={e => setListFormName(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #E8DFD0", borderRadius: 12, fontSize: "0.95rem", color: "#3D2B1F", background: "#F5F0E8", outline: "none", fontFamily: "system-ui", boxSizing: "border-box" }}
                  onFocus={e => { e.target.style.borderColor = "#6B7A3A"; e.target.style.background = "white"; }}
                  onBlur={e => { e.target.style.borderColor = "#E8DFD0"; e.target.style.background = "#F5F0E8"; }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setSaveAsListOpen(false)}
                  style={{ flex: 1, padding: 14, background: "#F5F0E8", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", color: "#8C7B6B" }}>
                  Cancelar
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSaveAsList} disabled={!listFormName.trim() || listSaving}
                  style={{ flex: 2, padding: 14, background: listFormName.trim() ? "#6B7A3A" : "#E8DFD0", color: listFormName.trim() ? "white" : "#8C7B6B", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 700, fontSize: "0.9rem", cursor: listFormName.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {listSaving ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Guardando...</> : "Guardar en Mis Listas"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal renombrar */}
      <AnimatePresence>
        {renameOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setRenameOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(61,43,31,0.5)", zIndex: 300, backdropFilter: "blur(4px)" }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }} transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="center-modal" style={{ position: "fixed", top: "30%", left: "50%", transform: "translate(-50%, -50%)", width: 420, background: "white", borderRadius: 24, padding: "32px", zIndex: 301, boxShadow: "0 24px 80px rgba(61,43,31,0.2)" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", color: "#3D2B1F", margin: 0 }}>Editar nombre</h2>
                <button onClick={() => setRenameOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8C7B6B" }}>
                  <X size={20} />
                </button>
              </div>
              <input
                type="text" value={renameName} onChange={e => setRenameName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleRename()}
                autoFocus
                style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #E8DFD0", borderRadius: 12, fontSize: "0.95rem", color: "#3D2B1F", background: "#F5F0E8", outline: "none", fontFamily: "system-ui", boxSizing: "border-box", marginBottom: 20 }}
                onFocus={e => { e.target.style.borderColor = "#6B7A3A"; e.target.style.background = "white"; }}
                onBlur={e => { e.target.style.borderColor = "#E8DFD0"; e.target.style.background = "#F5F0E8"; }}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setRenameOpen(false)}
                  style={{ flex: 1, padding: 14, background: "#F5F0E8", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", color: "#8C7B6B" }}>
                  Cancelar
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleRename} disabled={!renameName.trim() || renaming}
                  style={{ flex: 2, padding: 14, background: renameName.trim() ? "#6B7A3A" : "#E8DFD0", color: renameName.trim() ? "white" : "#8C7B6B", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 700, fontSize: "0.9rem", cursor: renameName.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {renaming ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Guardando...</> : "Guardar"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .page-header { flex-wrap: wrap !important; gap: 12px !important; }
          .stats-grid { grid-template-columns: repeat(3, 1fr) !important; }
          .filters-row { flex-direction: column !important; align-items: flex-start !important; gap: 8px !important; }
          .side-panel { width: 100vw !important; }
          .center-modal { width: calc(100vw - 32px) !important; padding: 24px 20px !important; }
          .purchase-card { padding: 12px 16px !important; gap: 10px !important; }
        }
        @media (max-width: 480px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .purchase-card-actions { display: none !important; }
        }
      `}</style>
    </div>
  );
}