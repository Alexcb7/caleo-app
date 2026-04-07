"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, List, Trash2, ChevronRight, X, Edit2, ShoppingCart, Package, Leaf, Wheat, Droplets, PawPrint, Wine, Coffee, Beef, Snowflake, LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Loading from "../loading";
import { ProductPanel } from "@/components/product-panel";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ShoppingList = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  items_count: number;
};

type ListDetail = {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  items: {
    id: number;
    product_id: number;
    product_name: string;
    image_url: string | null;
    supermarket: string | null;
    price: number | null;
    quantity: number;
    unit: string | null;
  }[];
};

const LIST_COLORS = ["#6B7A3A", "#B8A06A", "#C17F3A", "#3D2B1F", "#8C7B6B"];
const LIST_EMOJIS = ["🛒", "🥦", "🍝", "🧴", "🐾", "🍷", "☕", "🥩", "🧊"];
const LIST_ICON_MAP: Record<string, LucideIcon> = {
  "🛒": ShoppingCart, "🥦": Leaf, "🍝": Wheat, "🧴": Droplets,
  "🐾": PawPrint, "🍷": Wine, "☕": Coffee, "🥩": Beef, "🧊": Snowflake,
};
const getListIcon = (name: string): { Icon: LucideIcon; cleanName: string } => {
  const parts = name.split(" ");
  const hasEmoji = LIST_EMOJIS.includes(parts[0]);
  return {
    Icon: hasEmoji ? (LIST_ICON_MAP[parts[0]] || ShoppingCart) : ShoppingCart,
    cleanName: hasEmoji ? parts.slice(1).join(" ") : name,
  };
};

export default function MisListasPage() {
  const router = useRouter();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedList, setSelectedList] = useState<ListDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Crear/Editar
  const [createOpen, setCreateOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formEmoji, setFormEmoji] = useState("🛒");
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<number | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      fetchLists(user.id);
    }
  }, []);

  const fetchLists = async (userId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/lists/user/${userId}`);
      setLists(await res.json());
    } catch {}
    setLoading(false);
  };

  const fetchDetail = async (listId: number) => {
    setDetailLoading(true);
    setDetailOpen(true);
    try {
      const res = await fetch(`${API_URL}/lists/${listId}/detail`);
      setSelectedList(await res.json());
    } catch {}
    setDetailLoading(false);
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      if (!user) return;

      const endpoint = editMode && selectedList
        ? `${API_URL}/lists/${selectedList.id}`
        : `${API_URL}/lists/create`;
      const method = editMode ? "PUT" : "POST";

      await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          name: `${formEmoji} ${formName.trim()}`,
          description: formDesc.trim() || null,
          items: [],
        }),
      });

      await fetchLists(user.id);
      setCreateOpen(false);
      setEditMode(false);
      setFormName("");
      setFormDesc("");
      setFormEmoji("🛒");
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (listId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleting(listId);
    try {
      await fetch(`${API_URL}/lists/${listId}`, { method: "DELETE" });
      setLists(prev => prev.filter(l => l.id !== listId));
      if (selectedList?.id === listId) setDetailOpen(false);
    } catch {}
    setDeleting(null);
  };

  const openEdit = (list: ShoppingList, e: React.MouseEvent) => {
    e.stopPropagation();
    const parts = list.name.split(" ");
    const emoji = LIST_EMOJIS.includes(parts[0]) ? parts[0] : "🛒";
    const name = LIST_EMOJIS.includes(parts[0]) ? parts.slice(1).join(" ") : list.name;
    setFormEmoji(emoji);
    setFormName(name);
    setFormDesc(list.description || "");
    setEditMode(true);
    setSelectedList({ id: list.id, name: list.name, description: list.description, image_url: null, created_at: list.created_at, items: [] });
    setCreateOpen(true);
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  if (loading) return <Loading />;

  return (
    <div style={{ padding: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>Mis Listas</h1>
          <p style={{ fontSize: "0.85rem", color: "#8C7B6B", margin: "4px 0 0", fontFamily: "system-ui" }}>Organiza tus productos en listas personalizadas</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setEditMode(false); setFormName(""); setFormDesc(""); setFormEmoji("🛒"); setCreateOpen(true); }}
          style={{ background: "#6B7A3A", border: "none", borderRadius: 12, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "white", fontFamily: "system-ui", fontWeight: 600, fontSize: "0.9rem" }}
        >
          <Plus size={16} />
          Nueva lista
        </motion.button>
      </div>

      {/* Listas */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <span style={{ width: 32, height: 32, border: "3px solid #E8DFD0", borderTopColor: "#6B7A3A", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "block" }} />
        </div>
      ) : lists.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", background: "white", borderRadius: 16, border: "1.5px solid #E8DFD0" }}>
          <List size={48} color="#E8DFD0" style={{ margin: "0 auto 16px", display: "block" }} />
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: "0 0 8px" }}>No tienes listas aún</p>
          <p style={{ fontSize: "0.85rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 20px" }}>Crea tu primera lista para organizar tus compras</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => setCreateOpen(true)}
            style={{ background: "#6B7A3A", color: "white", border: "none", borderRadius: 12, padding: "12px 24px", fontFamily: "system-ui", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
            Crear primera lista
          </motion.button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {lists.map((list, i) => {
            const color = LIST_COLORS[i % LIST_COLORS.length];
            return (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => fetchDetail(list.id)}
                whileHover={{ scale: 1.02, y: -2 }}
                style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 18, overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 12px rgba(61,43,31,0.05)" }}
              >
                {/* Color bar */}
                <div style={{ height: 6, background: color }} />

                <div style={{ padding: "18px 20px" }}>
                  {/* Nombre */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, marginRight: 8 }}>
                      {(() => { const { Icon, cleanName } = getListIcon(list.name); return <><Icon size={16} color="#6B7A3A" strokeWidth={1.75} /><span style={{ fontSize: "1rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui" }}>{cleanName}</span></>; })()}
                    </div>
                    <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button onClick={(e) => openEdit(list, e)}
                        style={{ width: 28, height: 28, background: "#F5F0E8", border: "none", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Edit2 size={12} color="#8C7B6B" />
                      </button>
                      <button onClick={(e) => handleDelete(list.id, e)}
                        style={{ width: 28, height: 28, background: "#A63D2F10", border: "none", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {deleting === list.id
                          ? <span style={{ width: 10, height: 10, border: "2px solid rgba(166,61,47,0.3)", borderTopColor: "#A63D2F", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                          : <Trash2 size={12} color="#A63D2F" />}
                      </button>
                    </div>
                  </div>

                  {/* Descripción */}
                  {list.description && (
                    <p style={{ fontSize: "0.8rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 12px", lineHeight: 1.4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {list.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: list.description ? 0 : 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Package size={13} color="#8C7B6B" />
                        <span style={{ fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui" }}>{list.items_count} productos</span>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#8C7B6B", fontFamily: "system-ui" }}>{formatDate(list.updated_at)}</span>
                    </div>
                    <ChevronRight size={16} color="#8C7B6B" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal crear/editar */}
      <AnimatePresence>
        {createOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCreateOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(61,43,31,0.5)", zIndex: 300, backdropFilter: "blur(4px)" }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              style={{ position: "fixed", top: "5%", left: "50%", transform: "translate(-50%, -50%)", width: 440, background: "white", borderRadius: 24, padding: "36px", zIndex: 301, boxShadow: "0 24px 80px rgba(61,43,31,0.2)" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.3rem", color: "#3D2B1F", margin: 0 }}>
                  {editMode ? "Editar lista" : "Nueva lista"}
                </h2>
                <button onClick={() => setCreateOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8C7B6B" }}>
                  <X size={20} />
                </button>
              </div>

              {/* Selector emoji */}
              <div style={{ marginBottom: 20 }}>
                <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Icono</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 40px)", gap: 8 }}>
                  {LIST_EMOJIS.map(e => {
                    const Icon = LIST_ICON_MAP[e] || ShoppingCart;
                    return (
                      <button key={e} onClick={() => setFormEmoji(e)}
                        style={{ width: 40, height: 40, borderRadius: 10, border: `2px solid ${formEmoji === e ? "#6B7A3A" : "#E8DFD0"}`, background: formEmoji === e ? "#6B7A3A10" : "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon size={18} color={formEmoji === e ? "#6B7A3A" : "#8C7B6B"} strokeWidth={1.75} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Nombre */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Nombre</label>
                <input
                  type="text" placeholder="Ej: Compra semanal" value={formName} onChange={e => setFormName(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #E8DFD0", borderRadius: 12, fontSize: "0.95rem", color: "#3D2B1F", background: "#F5F0E8", outline: "none", fontFamily: "system-ui", boxSizing: "border-box" }}
                  onFocus={e => { e.target.style.borderColor = "#6B7A3A"; e.target.style.background = "white"; }}
                  onBlur={e => { e.target.style.borderColor = "#E8DFD0"; e.target.style.background = "#F5F0E8"; }}
                />
              </div>

              {/* Descripción */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Descripción <span style={{ color: "#8C7B6B", textTransform: "none", letterSpacing: 0 }}>(opcional)</span></label>
                <textarea
                  placeholder="Añade una descripción..." value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={3}
                  style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #E8DFD0", borderRadius: 12, fontSize: "0.9rem", color: "#3D2B1F", background: "#F5F0E8", outline: "none", fontFamily: "system-ui", boxSizing: "border-box", resize: "none" }}
                  onFocus={e => { e.target.style.borderColor = "#6B7A3A"; e.target.style.background = "white"; }}
                  onBlur={e => { e.target.style.borderColor = "#E8DFD0"; e.target.style.background = "#F5F0E8"; }}
                />
              </div>

              {/* Preview nombre */}
              {formName && (
                <div style={{ marginBottom: 20, padding: "10px 16px", background: "#F5F0E8", borderRadius: 10, display: "flex", alignItems: "center", gap: 10 }}>
                  {(() => { const Icon = LIST_ICON_MAP[formEmoji] || ShoppingCart; return <Icon size={20} color="#6B7A3A" strokeWidth={1.75} />; })()}
                  <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui" }}>{formName}</span>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setCreateOpen(false)}
                  style={{ flex: 1, padding: 14, background: "#F5F0E8", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", color: "#8C7B6B" }}>
                  Cancelar
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleCreate} disabled={!formName.trim() || saving}
                  style={{ flex: 2, padding: 14, background: formName.trim() ? "#6B7A3A" : "#E8DFD0", color: formName.trim() ? "white" : "#8C7B6B", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 700, fontSize: "0.9rem", cursor: formName.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  {saving ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Guardando...</> : editMode ? "Guardar cambios" : "Crear lista"}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Panel detalle lista */}
      <AnimatePresence>
        {detailOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDetailOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(61,43,31,0.4)", zIndex: 200 }} />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 440, background: "white", zIndex: 201, display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(61,43,31,0.15)" }}
            >
              {detailLoading ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
                    <img src="/images/claropng.png" alt="Caleo" style={{ height: 48, opacity: 0.4 }} />
                  </motion.div>
                  <p style={{ color: "#8C7B6B", fontFamily: "system-ui", fontSize: "0.85rem" }}>Cargando lista...</p>
                </div>
              ) : selectedList && (
                <>
                  {/* Header */}
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid #E8DFD0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div style={{ flex: 1, minWidth: 0, marginRight: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        {(() => { const { Icon, cleanName } = getListIcon(selectedList.name); return <><Icon size={18} color="#6B7A3A" strokeWidth={1.75} /><h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", color: "#3D2B1F", margin: 0 }}>{cleanName}</h2></>; })()}
                      </div>
                      {selectedList.description && (
                        <p style={{ fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>{selectedList.description}</p>
                      )}
                      <p style={{ fontSize: "0.75rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "4px 0 0" }}>
                        {selectedList.items.length} productos
                      </p>
                    </div>
                    <button onClick={() => setDetailOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8C7B6B", flexShrink: 0 }}>
                      <X size={20} />
                    </button>
                  </div>

                  {/* Items */}
                  <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedList.items.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 40, color: "#8C7B6B", fontFamily: "system-ui" }}>
                        <Package size={40} style={{ opacity: 0.3, margin: "0 auto 12px", display: "block" }} />
                        <p style={{ margin: 0, fontSize: "0.9rem" }}>Esta lista está vacía</p>
                        <p style={{ margin: "6px 0 0", fontSize: "0.8rem", opacity: 0.7 }}>Añade productos desde La Compra</p>
                      </div>
                    ) : selectedList.items.map((item, i) => (
                      <motion.div key={item.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        onClick={() => setSelectedProductId(item.product_id)}
                        whileHover={{ scale: 1.01 }}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "#F5F0E8", borderRadius: 12, cursor: "pointer" }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                          {item.image_url ? <img src={item.image_url} alt={item.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <Package size={20} color="#6B7A3A" strokeWidth={1.75} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.product_name}</p>
                          <div style={{ display: "flex", gap: 8 }}>
                            {item.supermarket && <span style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui" }}>{item.supermarket}</span>}
                            <span style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui" }}>x{item.quantity}{item.unit ? ` ${item.unit}` : ""}</span>
                          </div>
                        </div>
                        {item.price && (
                          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0, flexShrink: 0 }}>{item.price.toFixed(2)}€</p>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div style={{ padding: "16px 24px", borderTop: "1px solid #E8DFD0", display: "flex", flexDirection: "column", gap: 10 }}>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => { setDetailOpen(false); router.push("/compra"); }}
                      style={{ width: "100%", padding: 14, background: "#6B7A3A", color: "white", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <ShoppingCart size={16} />
                      Añadir productos
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ProductPanel
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onAddToCart={() => setSelectedProductId(null)}
        cartQuantity={0}
        zIndexBase={300}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}