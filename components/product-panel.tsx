"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, TrendingUp, ShoppingCart, Tag } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type PriceInfo = {
  supermarket_id: number;
  supermarket: string;
  supermarket_slug: string;
  price: number;
  original_price: number | null;
  is_offer: boolean;
  in_stock: boolean;
};

type ProductDetail = {
  id: number;
  name: string;
  description: string | null;
  brand: string | null;
  unit_type: string | null;
  image_url: string | null;
  category: string | null;
  prices: PriceInfo[];
};

type HistoryEntry = { supermarket: string; slug: string; data: { date: string; price: number; is_offer: boolean }[] };

type Props = {
  productId: number | null;
  onClose: () => void;
  onAddToCart: (productId: number, quantity: number) => void;
  cartQuantity: number;
  zIndexBase?: number;
};

const SM_COLORS = ["#6B7A3A", "#C17F3A", "#B8A06A", "#3D2B1F"];

export function ProductPanel({ productId, onClose, onAddToCart, cartQuantity, zIndexBase = 200 }: Props) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [hiddenSupers, setHiddenSupers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setProduct(null);
    setHistory([]);
    setHiddenSupers(new Set());
    setQuantity(cartQuantity || 1);
    fetch(`${API_URL}/products/${productId}`)
      .then(r => r.json())
      .then(data => { setProduct(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetch(`${API_URL}/products/${productId}/price-history`)
      .then(r => r.json())
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]));
  }, [productId]);

  const cheapest = product?.prices?.length
    ? [...product.prices].sort((a, b) => a.price - b.price)[0]
    : null;

  const mostExpensive = product?.prices?.length
    ? [...product.prices].sort((a, b) => b.price - a.price)[0]
    : null;

  const savings = cheapest && mostExpensive && cheapest.price !== mostExpensive.price
    ? (mostExpensive.price - cheapest.price).toFixed(2)
    : null;

  const savingsPct = savings && mostExpensive
    ? Math.round((parseFloat(savings) / mostExpensive.price) * 100)
    : null;

  const supermarketColor = (slug: string) =>
    slug === "mercadona" ? "#00A650" : slug === "dia" ? "#E31837" : "#6B7A3A";

  return (
    <AnimatePresence>
      {productId && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(61,43,31,0.4)", zIndex: zIndexBase }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 440, background: "white", zIndex: zIndexBase + 1, display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(61,43,31,0.15)" }}
          >
            {loading ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
                  <img src="/images/claropng.png" alt="Caleo" style={{ height: 48, opacity: 0.4 }} />
                </motion.div>
                <p style={{ color: "#8C7B6B", fontFamily: "system-ui", fontSize: "0.85rem" }}>Cargando producto...</p>
              </div>
            ) : product && (
              <>
                {/* Header con imagen */}
                <div style={{ position: "relative" }}>
                  <div style={{ width: "100%", height: 260, background: "white", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: "16px" }} />
                    ) : (
                      <span style={{ fontSize: "5rem", opacity: 0.3 }}>🛒</span>
                    )}
                  </div>
                  <button onClick={onClose}
                    style={{ position: "absolute", top: 12, right: 12, background: "white", border: "none", borderRadius: "50%", width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(61,43,31,0.15)" }}>
                    <X size={18} color="#3D2B1F" />
                  </button>
                  {/* Ofertas badges */}
                  {product.prices.some(p => p.is_offer) && (
                    <div style={{ position: "absolute", top: 12, left: 12, background: "#C17F3A", borderRadius: 8, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                      <Tag size={12} color="white" />
                      <span style={{ fontSize: "0.72rem", color: "white", fontFamily: "system-ui", fontWeight: 700 }}>EN OFERTA</span>
                    </div>
                  )}
                </div>

                {/* Contenido */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {/* Info básica */}
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid #E8DFD0" }}>
                    {product.category && (
                      <p style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{product.category}</p>
                    )}
                    <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.3rem", color: "#3D2B1F", margin: "0 0 8px", lineHeight: 1.3 }}>{product.name}</h2>
                    {product.brand && <p style={{ fontSize: "0.82rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>Marca: {product.brand}</p>}

                    {/* Ahorro */}
                    {savings && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{ marginTop: 12, background: "rgba(107,122,58,0.08)", border: "1px solid rgba(107,122,58,0.2)", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
                        <TrendingUp size={16} color="#6B7A3A" />
                        <p style={{ fontSize: "0.82rem", color: "#6B7A3A", fontFamily: "system-ui", margin: 0, fontWeight: 600 }}>
                          Ahorra hasta {savings}€ ({savingsPct}%) eligiendo bien el supermercado
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Precios por supermercado */}
                  <div style={{ padding: "20px 24px", borderBottom: "1px solid #E8DFD0" }}>
                    <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: "0 0 14px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Precios</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {[...product.prices].sort((a, b) => a.price - b.price).map((p, idx) => {
                        const isCheapest = idx === 0 && product.prices.length > 1;
                        const allSame = product.prices.every(pr => pr.price === product.prices[0].price);
                        return (
                          <motion.div key={p.supermarket} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.08 }}
                            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, background: isCheapest && !allSame ? "#F5F0E8" : "white", border: `1.5px solid ${isCheapest && !allSame ? "#6B7A3A" : "#E8DFD0"}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {/* Dot color supermercado */}
                              <div style={{ width: 10, height: 10, borderRadius: "50%", background: supermarketColor(p.supermarket_slug), flexShrink: 0 }} />
                              <div>
                                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: 0 }}>{p.supermarket}</p>
                                <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
                                  {isCheapest && !allSame && <span style={{ fontSize: "0.62rem", background: "#6B7A3A", color: "white", borderRadius: 4, padding: "1px 5px", fontFamily: "system-ui", fontWeight: 700 }}>MÁS BARATO</span>}
                                  {p.is_offer && <span style={{ fontSize: "0.62rem", background: "#C17F3A", color: "white", borderRadius: 4, padding: "1px 5px", fontFamily: "system-ui", fontWeight: 700 }}>OFERTA</span>}
                                  {!p.in_stock && <span style={{ fontSize: "0.62rem", background: "#A63D2F", color: "white", borderRadius: 4, padding: "1px 5px", fontFamily: "system-ui", fontWeight: 700 }}>SIN STOCK</span>}
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <p style={{ fontSize: "1.2rem", fontWeight: 700, color: isCheapest && !allSame ? "#6B7A3A" : "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>{p.price.toFixed(2)}€</p>
                              {p.original_price && (
                                <p style={{ fontSize: "0.75rem", color: "#8C7B6B", textDecoration: "line-through", fontFamily: "system-ui", margin: 0 }}>{p.original_price.toFixed(2)}€</p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Historial de precios — solo si hay variación real de precio */}
                  {(product.prices.some(p => p.is_offer) || history.some(sm => sm.data.length > 1)) && (
                  <div style={{ padding: "20px 24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                      <TrendingUp size={14} color="#B8A06A" />
                      <h3 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Historial de precios</h3>
                    </div>
                    {history.length === 0 ? (
                      <div style={{ background: "#F5F0E8", borderRadius: 14, padding: "28px 24px", textAlign: "center", color: "#8C7B6B", fontFamily: "system-ui", fontSize: "0.82rem" }}>
                        Sin historial disponible aún
                      </div>
                    ) : (() => {
                      const allDates = [...new Set(history.flatMap(s => s.data.map(d => d.date)))];
                      const buildPoint = (date: string) => {
                        const point: Record<string, any> = { date };
                        history.forEach(sm => {
                          const entry = sm.data.find(d => d.date === date);
                          if (entry) {
                            point[sm.supermarket] = entry.price;
                          } else if (sm.data[0]) {
                            // Sin entrada para esta fecha: extender con el precio más cercano
                            point[sm.supermarket] = sm.data[0].price;
                          }
                        });
                        return point;
                      };
                      const chartData = allDates.map(buildPoint);
                      // Si solo hay un punto no se puede trazar línea — añadir punto anterior igual
                      if (chartData.length === 1) {
                        chartData.unshift({ ...chartData[0], date: "Anterior" });
                      }
                      const toggleSuper = (name: string) =>
                        setHiddenSupers(prev => {
                          const next = new Set(prev);
                          next.has(name) ? next.delete(name) : next.add(name);
                          return next;
                        });
                      return (
                        <div>
                          {/* Toggles */}
                          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                            {history.map((sm, i) => {
                              const hidden = hiddenSupers.has(sm.supermarket);
                              const color = SM_COLORS[i % SM_COLORS.length];
                              return (
                                <button key={sm.supermarket} onClick={() => toggleSuper(sm.supermarket)}
                                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, border: `1.5px solid ${hidden ? "#E8DFD0" : color}`, background: hidden ? "white" : `${color}18`, cursor: "pointer", fontFamily: "system-ui", fontSize: "0.72rem", fontWeight: 600, color: hidden ? "#8C7B6B" : color, transition: "all 0.15s" }}>
                                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: hidden ? "#E8DFD0" : color, flexShrink: 0 }} />
                                  {sm.supermarket}
                                </button>
                              );
                            })}
                          </div>
                          <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F5F0E8" vertical={false} />
                              <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: "system-ui", fill: "#8C7B6B" }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 10, fontFamily: "system-ui", fill: "#8C7B6B" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}€`} width={40} />
                              <Tooltip formatter={(v: any, name: any) => [`${(v as number).toFixed(2)}€`, name]} contentStyle={{ borderRadius: 10, border: "1.5px solid #E8DFD0", fontFamily: "system-ui", fontSize: 12 }} isAnimationActive={false} />
                              {history.map((sm, i) =>
                                hiddenSupers.has(sm.supermarket) ? null : (
                                  <Line key={sm.supermarket} type="monotone" dataKey={sm.supermarket}
                                    stroke={SM_COLORS[i % SM_COLORS.length]}
                                    strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
                                )
                              )}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      );
                    })()}
                  </div>
                  )}
                </div>

                {/* Footer añadir */}
                <div style={{ padding: "16px 24px", borderTop: "1px solid #E8DFD0" }}>
                  {cheapest && (
                    <p style={{ fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "0 0 12px", textAlign: "center" }}>
                      Mejor precio: <strong style={{ color: "#6B7A3A" }}>{cheapest.price.toFixed(2)}€</strong> en {cheapest.supermarket}
                    </p>
                  )}
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {/* Cantidad */}
                    <div style={{ display: "flex", alignItems: "center", gap: 0, background: "#F5F0E8", borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "10px 12px", color: "#6B7A3A", display: "flex", alignItems: "center" }}>
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", fontSize: "0.95rem", minWidth: 24, textAlign: "center" }}>{quantity}</span>
                      <button onClick={() => setQuantity(q => q + 1)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "10px 12px", color: "#6B7A3A", display: "flex", alignItems: "center" }}>
                        <Plus size={14} />
                      </button>
                    </div>

                    {/* Añadir */}
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => { onAddToCart(product.id, quantity); onClose(); }}
                      style={{ flex: 1, padding: "12px", background: "#6B7A3A", color: "white", border: "none", borderRadius: 10, fontFamily: "system-ui", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <ShoppingCart size={16} />
                      Añadir al carrito
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}