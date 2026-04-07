"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Tag, Flame, List, ShoppingCart, X } from "lucide-react";
import Loading from "../loading";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Oferta = {
  id: number;
  product_id: number;
  product_name: string;
  image_url: string | null;
  supermarket: string;
  supermarket_slug: string;
  price: number;
  original_price: number | null;
  category: string | null;
};

const CATEGORY_ICONS: Record<string, string> = {
  "frutas-verduras": "🥦", "carnes-aves": "🥩", "pescados-mariscos": "🐟",
  "lacteos-huevos": "🥛", "charcuteria": "🥓", "panaderia-bolleria": "🍞",
  "congelados": "🧊", "conservas-enlatados": "🥫", "pasta-arroz-legumbres": "🍝",
  "aceites-vinagres": "🫙", "salsas-condimentos": "🧴", "cereales-desayunos": "🥣",
  "snacks-aperitivos": "🍿", "dulces-chocolates": "🍫", "bebidas-gas": "🥤",
  "agua-zumos": "💧", "bebidas-alcoholicas": "🍷", "cafe-te-infusiones": "☕",
  "bio-eco": "🌿", "cuidado-personal": "🧴", "limpieza-hogar": "🧹",
  "mascotas": "🐾", "bebe": "👶", "farmacia-salud": "💊",
  "papeleria-bazar": "📎", "otros": "📦",
};

export default function OfertasPage() {
  const [tab, setTab] = useState<"general" | "listas">("general");
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [ofertasListas, setOfertasListas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [superFilter, setSuperFilter] = useState<string | null>(null);
  const [selectedOferta, setSelectedOferta] = useState<Oferta | null>(null);

  useEffect(() => {
    fetchOfertas();
  }, []);

  useEffect(() => {
    if (tab === "listas") fetchOfertasListas();
  }, [tab]);

  const fetchOfertas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/ofertas/general`);
      setOfertas(await res.json());
    } catch {}
    setLoading(false);
  };

  const fetchOfertasListas = async () => {
    setLoading(true);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      if (!user) return;
      const res = await fetch(`${API_URL}/ofertas/mis-listas/${user.id}`);
      setOfertasListas(await res.json());
    } catch {}
    setLoading(false);
  };

  const currentOfertas = tab === "general" ? ofertas : ofertasListas;
  const filtered = superFilter ? currentOfertas.filter(o => o.supermarket === superFilter) : currentOfertas;
  const supermarkets = [...new Set(currentOfertas.map(o => o.supermarket))];

  const descuento = (price: number, original: number) =>
    Math.round((1 - price / original) * 100);

  const getCategoryIcon = (category: string | null) => {
    if (!category) return "🏷️";
    const slug = category.toLowerCase().replace(/ /g, "-").replace(/ó/g, "o").replace(/á/g, "a").replace(/é/g, "e").replace(/í/g, "i").replace(/ú/g, "u");
    return CATEGORY_ICONS[slug] || "🏷️";
  };

  if (loading) return <Loading />;

  return (
    <div style={{ padding: "24px" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Flame size={22} color="#C17F3A" />
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>Ofertas</h1>
        </div>
        <p style={{ fontSize: "0.85rem", color: "#8C7B6B", margin: 0, fontFamily: "system-ui" }}>
          Las mejores ofertas de Mercadona y DIA
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, background: "#F5F0E8", borderRadius: 12, padding: 4, marginBottom: 20, width: "fit-content" }}>
        {[
          { key: "general", label: "Todas las ofertas", icon: <Tag size={14} /> },
          { key: "listas", label: "En mis listas", icon: <List size={14} /> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            style={{ padding: "9px 18px", borderRadius: 9, border: "none", background: tab === t.key ? "white" : "transparent", color: tab === t.key ? "#3D2B1F" : "#8C7B6B", fontSize: "0.85rem", fontFamily: "system-ui", fontWeight: tab === t.key ? 700 : 400, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: tab === t.key ? "0 1px 4px rgba(61,43,31,0.08)" : "none", transition: "all 0.2s" }}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Filtro supermercado */}
      {supermarkets.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button onClick={() => setSuperFilter(null)}
            style={{ padding: "6px 16px", borderRadius: 20, border: `1.5px solid ${!superFilter ? "#6B7A3A" : "#E8DFD0"}`, background: !superFilter ? "#6B7A3A" : "white", color: !superFilter ? "white" : "#8C7B6B", fontSize: "0.8rem", fontFamily: "system-ui", fontWeight: 600, cursor: "pointer" }}>
            Todos
          </button>
          {supermarkets.map(sm => (
            <button key={sm} onClick={() => setSuperFilter(superFilter === sm ? null : sm)}
              style={{ padding: "6px 16px", borderRadius: 20, border: `1.5px solid ${superFilter === sm ? "#6B7A3A" : "#E8DFD0"}`, background: superFilter === sm ? "#6B7A3A" : "white", color: superFilter === sm ? "white" : "#8C7B6B", fontSize: "0.8rem", fontFamily: "system-ui", fontWeight: 600, cursor: "pointer" }}>
              {sm}
            </button>
          ))}
        </div>
      )}

      {/* Contador */}
      {!loading && filtered.length > 0 && (
        <p style={{ fontSize: "0.8rem", color: "#8C7B6B", fontFamily: "system-ui", marginBottom: 16 }}>
          {filtered.length} ofertas disponibles
        </p>
      )}

      {/* Grid ofertas */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <span style={{ width: 32, height: 32, border: "3px solid #E8DFD0", borderTopColor: "#6B7A3A", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "block" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", background: "white", borderRadius: 16, border: "1.5px solid #E8DFD0" }}>
          <Tag size={48} color="#E8DFD0" style={{ margin: "0 auto 16px", display: "block" }} />
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: "0 0 8px" }}>
            {tab === "listas" ? "No hay ofertas en tus listas" : "No hay ofertas disponibles"}
          </p>
          <p style={{ fontSize: "0.85rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>
            {tab === "listas" ? "Añade productos a tus listas para ver sus ofertas aquí" : "Vuelve más tarde para ver las últimas ofertas"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
          {filtered.map((oferta, i) => (
            <motion.div
              key={oferta.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => setSelectedOferta(oferta)}
              style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 16, overflow: "hidden", cursor: "pointer", boxShadow: "0 2px 8px rgba(61,43,31,0.05)" }}
            >
              {/* Imagen */}
              <div style={{ position: "relative", width: "100%", aspectRatio: "1", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {oferta.image_url ? (
                  <img src={oferta.image_url} alt={oferta.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <span style={{ fontSize: "2.5rem" }}>{getCategoryIcon(oferta.category)}</span>
                )}
                {/* Badge descuento */}
                {oferta.original_price && (
                  <div style={{ position: "absolute", top: 8, left: 8, background: "#C17F3A", borderRadius: 8, padding: "4px 8px" }}>
                    <span style={{ fontSize: "0.72rem", color: "white", fontFamily: "system-ui", fontWeight: 700 }}>
                      -{descuento(oferta.price, oferta.original_price)}%
                    </span>
                  </div>
                )}
                {/* Badge supermercado */}
                <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.92)", borderRadius: 6, padding: "3px 7px" }}>
                  <span style={{ fontSize: "0.65rem", fontFamily: "system-ui", fontWeight: 700, color: "#3D2B1F" }}>{oferta.supermarket}</span>
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: "12px 14px" }}>
                <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: "0 0 8px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", height: "2.6em" }}>
                  {oferta.product_name}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#C17F3A", fontFamily: "Georgia, serif" }}>{oferta.price.toFixed(2)}€</span>
                  {oferta.original_price && (
                    <span style={{ fontSize: "0.78rem", color: "#8C7B6B", textDecoration: "line-through", fontFamily: "system-ui" }}>{oferta.original_price.toFixed(2)}€</span>
                  )}
                </div>
                {oferta.category && (
                  <p style={{ fontSize: "0.7rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "6px 0 0" }}>{oferta.category}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Panel detalle oferta */}
      <AnimatePresence>
        {selectedOferta && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedOferta(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(61,43,31,0.4)", zIndex: 200 }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: "spring", damping: 22, stiffness: 200 }}
              style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 400, background: "white", borderRadius: 24, overflow: "hidden", zIndex: 201, boxShadow: "0 24px 80px rgba(61,43,31,0.2)" }}
            >
              {/* Imagen grande */}
              <div style={{ position: "relative", width: "100%", height: 200, background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {selectedOferta.image_url ? (
                  <img src={selectedOferta.image_url} alt={selectedOferta.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "4rem" }}>{getCategoryIcon(selectedOferta.category)}</span>
                )}
                <button onClick={() => setSelectedOferta(null)}
                  style={{ position: "absolute", top: 12, right: 12, background: "white", border: "none", borderRadius: "50%", width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(61,43,31,0.15)" }}>
                  <X size={16} color="#3D2B1F" />
                </button>
                {selectedOferta.original_price && (
                  <div style={{ position: "absolute", bottom: 12, left: 12, background: "#C17F3A", borderRadius: 10, padding: "6px 12px" }}>
                    <span style={{ fontSize: "0.85rem", color: "white", fontFamily: "system-ui", fontWeight: 700 }}>
                      -{descuento(selectedOferta.price, selectedOferta.original_price)}% DESCUENTO
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "20px 24px" }}>
                {selectedOferta.category && (
                  <p style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{selectedOferta.category}</p>
                )}
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", color: "#3D2B1F", margin: "0 0 16px", lineHeight: 1.3 }}>{selectedOferta.product_name}</h2>

                {/* Precio */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "14px 16px", background: "#F5F0E8", borderRadius: 12 }}>
                  <div>
                    <p style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 2px" }}>{selectedOferta.supermarket}</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span style={{ fontSize: "1.8rem", fontWeight: 700, color: "#C17F3A", fontFamily: "Georgia, serif" }}>{selectedOferta.price.toFixed(2)}€</span>
                      {selectedOferta.original_price && (
                        <span style={{ fontSize: "1rem", color: "#8C7B6B", textDecoration: "line-through", fontFamily: "system-ui" }}>{selectedOferta.original_price.toFixed(2)}€</span>
                      )}
                    </div>
                  </div>
                  {selectedOferta.original_price && (
                    <div style={{ marginLeft: "auto", textAlign: "center", background: "#C17F3A18", borderRadius: 10, padding: "8px 14px" }}>
                      <p style={{ fontSize: "1rem", fontWeight: 700, color: "#C17F3A", fontFamily: "Georgia, serif", margin: 0 }}>
                        -{(selectedOferta.original_price - selectedOferta.price).toFixed(2)}€
                      </p>
                      <p style={{ fontSize: "0.7rem", color: "#C17F3A", fontFamily: "system-ui", margin: 0 }}>ahorro</p>
                    </div>
                  )}
                </div>

                {/* Botón */}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedOferta(null)}
                  style={{ width: "100%", padding: 14, background: "#6B7A3A", color: "white", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <ShoppingCart size={16} />
                  Añadir a La Compra
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}