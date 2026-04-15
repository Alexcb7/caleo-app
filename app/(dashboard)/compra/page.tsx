"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, Plus, Minus, X, GitCompare, Zap, ShoppingBag, AlertTriangle, SlidersHorizontal, Leaf, Beef, Fish, Milk, Sandwich, Wheat, Snowflake, Archive, Droplets, FlaskConical, Sunrise, Cookie, Candy, CupSoda, GlassWater, Wine, Coffee, Sprout, Smile, Sparkles, PawPrint, Baby, Package, Apple, Utensils, LucideIcon, ChevronLeft, SplitSquareHorizontal } from "lucide-react";
import { ProductPanel } from "@/components/product-panel";
import Loading from "../loading";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "aceite-especias-y-salsas": Droplets,
  "agua-y-refrescos": GlassWater,
  "aperitivos": Cookie,
  "arroz-legumbres-y-pasta": Wheat,
  "azúcar-caramelos-y-chocolate": Candy,
  "bebé": Baby,
  "bodega": Wine,
  "cacao-café-e-infusiones": Coffee,
  "carne": Beef,
  "cereales-y-galletas": Sunrise,
  "charcutería-y-quesos": Sandwich,
  "congelados": Snowflake,
  "conservas-caldos-y-cremas": Archive,
  "cuidado-del-cabello": Sparkles,
  "cuidado-facial-y-corporal": Smile,
  "fitoterapia-y-parafarmacia": Leaf,
  "fruta-y-verdura": Apple,
  "huevos-leche-y-mantequilla": Milk,
  "limpieza-y-hogar": FlaskConical,
  "maquillaje": Sprout,
  "marisco-y-pescado": Fish,
  "mascotas": PawPrint,
  "panadería-y-pastelería": Wheat,
  "pizzas-y-platos-preparados": Utensils,
  "postres-y-yogures": Candy,
  "zumos": CupSoda,
};

type Category = { id: number; name: string; slug: string };
type Product = { id: number; name: string; image_url: string; category_id: number; supermarkets_count: number; is_offer?: boolean };
type CartItem = { product: Product; quantity: number };
type PriceItem = { supermarket_id: number; supermarket: string; supermarket_slug: string; price: number; original_price: number | null; subtotal: number; is_offer: boolean };
type CompareItem = { product_id: number; product_name: string; image_url: string; quantity: number; prices: PriceItem[]; cheapest: PriceItem; not_found: boolean };
type CompareResult = { items: CompareItem[]; total: number; supermarket_totals: Record<string, number> };
type Mode = null | "ahorro" | "normal";

export default function CompraPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const [chooseWhereOpen, setChooseWhereOpen] = useState(false);
  const [purchaseStrategy, setPurchaseStrategy] = useState<"cheapest" | "mercadona" | "dia">("cheapest");
  const [fromList, setFromList] = useState<{ listId: number; listName: string } | null>(null);

  const [modePopup, setModePopup] = useState(true);
  const [mode, setMode] = useState<Mode>(null);
  const [budgetPopup, setBudgetPopup] = useState(false);
  const [budget, setBudget] = useState("");

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`${API_URL}/products/categories`).then(r => r.json()).then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("caleo_prefill_list");
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      localStorage.removeItem("caleo_prefill_list");
      setFromList({ listId: data.listId, listName: data.listName });
      if (data.items?.length > 0) {
        setCart(data.items.map((item: { product_id: number; product_name: string; image_url: string | null; quantity: number }) => ({
          product: { id: item.product_id, name: item.product_name, image_url: item.image_url || "", category_id: 0, supermarkets_count: 2 },
          quantity: item.quantity,
        })));
      }
      setMode("normal");
      setModePopup(false);
    } catch {}
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setCategoryOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchProducts(), 300);
  }, [query, selectedCategory]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (selectedCategory) params.append("category_id", String(selectedCategory.id));
      const res = await fetch(`${API_URL}/products/search?${params}`);
      setProducts(await res.json());
    } catch {}
    setLoading(false);
  };

  const getCategoryIcon = (categoryId: number) => {
    const cat = categories.find(c => c.id === categoryId);
    const Icon = (cat && CATEGORY_ICONS[cat.slug]) ? CATEGORY_ICONS[cat.slug] : Package;
    return <Icon size={20} color="#6B7A3A" strokeWidth={1.75} />;
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i).filter(i => i.quantity > 0));
  };

  const getQuantity = (productId: number) => cart.find(i => i.product.id === productId)?.quantity || 0;
  const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);

  const selectMode = (m: "ahorro" | "normal") => {
    setMode(m);
    setModePopup(false);
    if (m === "ahorro") setBudgetPopup(true);
  };

  const confirmBudget = () => setBudgetPopup(false);

  const handleCompare = async () => {
    setComparing(true);
    try {
      const items = mode === "ahorro"
        ? cart.filter(i => i.product.supermarkets_count >= 2)
        : cart;
      const res = await fetch(`${API_URL}/comparador/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
          budget_limit: budget ? parseFloat(budget) : null,
        }),
      });
      const data = await res.json();
      setCompareResult(data);
      setCartOpen(false);
      setCompareOpen(true);
    } catch {}
    setComparing(false);
  };

  const handleSavePurchase = async () => {
    if (!compareResult || saving) return;
    setSaving(true);
    try {
      const stored = localStorage.getItem("user");
      const user = stored ? JSON.parse(stored) : null;
      if (!user) return;
      const items = compareResult.items
        .filter(i => !i.not_found)
        .map(i => {
          const priceItem = purchaseStrategy === "mercadona"
            ? (i.prices.find(p => p.supermarket_slug === "mercadona") ?? i.cheapest)
            : purchaseStrategy === "dia"
              ? (i.prices.find(p => p.supermarket_slug === "dia") ?? i.cheapest)
              : i.cheapest;
          return {
            product_id: i.product_id,
            supermarket_id: priceItem.supermarket_id,
            price: priceItem.price,
            quantity: i.quantity,
            is_offer: priceItem.is_offer,
          };
        });
      const strategyTotal = items.reduce((acc, i) => acc + i.price * i.quantity, 0);

      if (fromList) {
        await fetch(`${API_URL}/lists/${fromList.listId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items.map(i => ({
              product_id: i.product_id,
              supermarket_id: i.supermarket_id,
              price: i.price,
              quantity: i.quantity,
              unit: null,
            })),
          }),
        });
      }

      const res = await fetch(`${API_URL}/purchases/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          title: `Compra ${new Date().toLocaleDateString("es-ES")}`,
          total_price: strategyTotal,
          budget_limit: budget ? parseFloat(budget) : null,
          items,
        }),
      });
      if (res.ok) router.push(fromList ? "/mis-listas" : "/mis-compras");
    } catch {}
    setSaving(false);
  };

  const overBudget = compareResult && budget && compareResult.total > parseFloat(budget);
  const comparableCount = cart.filter(i => i.product.supermarkets_count >= 2).length;
  const visibleProducts = mode === "ahorro" ? products.filter(p => p.supermarkets_count >= 2) : products;

  return (
    <div style={{ padding: "24px", position: "relative" }}>

      {/* Popup modo */}
      <AnimatePresence>
        {modePopup && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(61,43,31,0.5)", zIndex: 300, backdropFilter: "blur(4px)" }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }} transition={{ type: "spring", damping: 20, stiffness: 200 }}
              style={{ position: "fixed", top: "20%", left: "50%", transform: "translate(-50%, -50%)", width: 480, background: "white", borderRadius: 24, padding: "40px 36px", zIndex: 301, boxShadow: "0 24px 80px rgba(61,43,31,0.2)" }}
            >
              <button
                onClick={() => { setModePopup(false); router.push("/home"); }}
                style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#A63D2F" }}
              >
                <X size={22} />
              </button>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", color: "#3D2B1F", margin: "0 0 8px" }}>¿Cómo quieres comprar?</h2>
                <p style={{ fontSize: "0.88rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>Elige el modo que mejor se adapte a ti</p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => selectMode("ahorro")}
                  style={{ background: "linear-gradient(135deg, #6B7A3A, #8A9B4A)", border: "none", borderRadius: 16, padding: "20px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, textAlign: "left", width: "100%" }}>
                  <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Zap size={24} color="white" />
                  </div>
                  <div>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "white", fontFamily: "system-ui", margin: "0 0 4px" }}>Modo Super Ahorro</p>
                    <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.8)", fontFamily: "system-ui", margin: 0 }}>Solo productos comparables en 2 supers. Encuentra el precio más barato automáticamente.</p>
                  </div>
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => selectMode("normal")}
                  style={{ background: "white", border: "2px solid #E8DFD0", borderRadius: 16, padding: "20px 24px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, textAlign: "left", width: "100%" }}>
                  <div style={{ width: 48, height: 48, background: "#F5F0E8", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ShoppingBag size={24} color="#6B7A3A" />
                  </div>
                  <div>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: "0 0 4px" }}>Compra Normal</p>
                    <p style={{ fontSize: "0.8rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>Todos los productos. Compara los que tienen 2 supers y ve el resto por supermercado.</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Popup presupuesto */}
      <AnimatePresence>
        {budgetPopup && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(61,43,31,0.5)", zIndex: 300, backdropFilter: "blur(4px)" }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92 }} transition={{ type: "spring", damping: 20, stiffness: 200 }}
              style={{ position: "fixed", top: "10%", left: "50%", transform: "translate(-50%, -50%)", width: 400, background: "white", borderRadius: 24, padding: "40px 36px", zIndex: 301, boxShadow: "0 24px 80px rgba(61,43,31,0.2)" }}
            >
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ width: 56, height: 56, background: "#F5F0E8", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: "2px solid #E8DFD0" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8A06A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", color: "#3D2B1F", margin: "0 0 8px" }}>¿Cuál es tu presupuesto?</h2>
                <p style={{ fontSize: "0.85rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>Te avisaremos si te pasas al comparar</p>
              </div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <span style={{ fontSize: "2.8rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif" }}>{budget ? parseFloat(budget).toFixed(0) : "0"}</span>
                  <span style={{ fontSize: "1.6rem", fontWeight: 700, color: "#B8A06A", fontFamily: "Georgia, serif" }}>€</span>
                </div>
                <div style={{ position: "relative", padding: "0 4px" }}>
                  <input type="range" min={0} max={700} step={5} value={budget || "0"} onChange={e => setBudget(e.target.value)}
                    style={{ width: "100%", cursor: "pointer", accentColor: "#6B7A3A", height: 6 }} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <span style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui" }}>0€</span>
                    <span style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui" }}>350€</span>
                    <span style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui" }}>700€</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}>
                  {[50, 100, 150, 200, 300].map(v => (
                    <button key={v} onClick={() => setBudget(String(v))}
                      style={{ padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${budget === String(v) ? "#6B7A3A" : "#E8DFD0"}`, background: budget === String(v) ? "#6B7A3A" : "white", color: budget === String(v) ? "white" : "#8C7B6B", fontSize: "0.78rem", fontFamily: "system-ui", fontWeight: 600, cursor: "pointer" }}>
                      {v}€
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setBudget(""); setBudgetPopup(false); }}
                  style={{ flex: 1, padding: 14, background: "#F5F0E8", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 600, fontSize: "0.9rem", cursor: "pointer", color: "#8C7B6B" }}>
                  Sin límite
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={confirmBudget} disabled={!budget || budget === "0"}
                  style={{ flex: 2, padding: 14, background: budget && budget !== "0" ? "#6B7A3A" : "#E8DFD0", color: budget && budget !== "0" ? "white" : "#8C7B6B", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 700, fontSize: "0.9rem", cursor: budget && budget !== "0" ? "pointer" : "not-allowed" }}>
                  Confirmar {budget && budget !== "0" ? `${parseFloat(budget).toFixed(0)}€` : ""}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Banner vuelta a mis-listas */}
      {fromList && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "10px 16px", background: "#F5F0E8", borderRadius: 12, border: "1.5px solid #E8DFD0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShoppingBag size={14} color="#6B7A3A" />
            <span style={{ fontSize: "0.82rem", color: "#8C7B6B", fontFamily: "system-ui" }}>
              Añadiendo a <strong style={{ color: "#3D2B1F" }}>{fromList.listName}</strong>
            </span>
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => router.push("/mis-listas")}
            style={{ background: "#3D2B1F", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "white", fontFamily: "system-ui", fontWeight: 600, fontSize: "0.8rem" }}>
            <X size={12} />
            Cerrar compra
          </motion.button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>La Compra</h1>
            {mode && (
              <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, fontFamily: "system-ui", background: mode === "ahorro" ? "#6B7A3A" : "#E8DFD0", color: mode === "ahorro" ? "white" : "#8C7B6B" }}>
                {mode === "ahorro" ? "Super Ahorro" : "Normal"}
              </span>
            )}
            {budget && budget !== "0" && (
              <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: "0.72rem", fontWeight: 700, fontFamily: "system-ui", background: "#F5F0E8", color: "#C17F3A" }}>
                {parseFloat(budget).toFixed(0)}€
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.85rem", color: "#8C7B6B", margin: 0, fontFamily: "system-ui" }}>
            {mode === "ahorro" ? "Mostrando solo productos comparables en 2 supers" : "Busca productos y añádelos a tu lista"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setModePopup(true)}
            style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontSize: "0.8rem", color: "#8C7B6B", fontFamily: "system-ui" }}>
            Cambiar modo
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setCartOpen(true)}
            style={{ position: "relative", background: "#6B7A3A", border: "none", borderRadius: 12, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "white" }}>
            <ShoppingCart size={18} />
            <span style={{ fontFamily: "system-ui", fontWeight: 600, fontSize: "0.9rem" }}>Mi lista</span>
            {totalItems > 0 && (
              <span style={{ position: "absolute", top: -8, right: -8, background: "#C17F3A", color: "white", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700 }}>
                {totalItems}
              </span>
            )}
          </motion.button>
        </div>
      </div>

      {/* Leyenda modo normal */}
      {mode === "normal" && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#6B7A3A" }} />
            <span style={{ fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui" }}>Comparable en 2 supers</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#E8DFD0" }} />
            <span style={{ fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui" }}>Solo en 1 super</span>
          </div>
        </div>
      )}

      {/* Buscador con desplegable de categorías integrado */}
      <div ref={searchRef} style={{ position: "relative", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", background: "white", border: `1.5px solid ${categoryOpen ? "#6B7A3A" : "#E8DFD0"}`, borderRadius: categoryOpen ? "14px 14px 0 0" : 14, overflow: "hidden", boxShadow: categoryOpen ? "0 0 0 3px rgba(107,122,58,0.1)" : "none", transition: "border-color 0.2s, border-radius 0.2s" }}>
          <div style={{ padding: "0 14px", display: "flex", alignItems: "center", flexShrink: 0 }}>
            <Search size={16} color="#8C7B6B" />
          </div>
          <input type="text"
            placeholder={selectedCategory ? `Buscar en ${selectedCategory.name}...` : "Buscar productos..."}
            value={query} onChange={e => setQuery(e.target.value)} onFocus={() => setCategoryOpen(true)}
            style={{ flex: 1, padding: "13px 8px", border: "none", outline: "none", fontSize: "0.95rem", color: "#3D2B1F", background: "transparent", fontFamily: "system-ui" }} />
          {selectedCategory && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#6B7A3A", borderRadius: 8, padding: "4px 10px", margin: "0 8px", flexShrink: 0 }}>
              {(() => { const Icon = CATEGORY_ICONS[selectedCategory.slug] || Package; return <Icon size={14} color="white" strokeWidth={1.75} />; })()}
              <span style={{ fontSize: "0.75rem", color: "white", fontFamily: "system-ui", fontWeight: 600, whiteSpace: "nowrap" }}>{selectedCategory.name}</span>
              <button onClick={(e) => { e.stopPropagation(); setSelectedCategory(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", padding: 0 }}>
                <X size={12} />
              </button>
            </div>
          )}
          <button onClick={() => setCategoryOpen(!categoryOpen)}
            style={{ padding: "13px 16px", background: "none", border: "none", borderLeft: "1.5px solid #E8DFD0", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: categoryOpen ? "#6B7A3A" : "#8C7B6B", flexShrink: 0 }}>
            <SlidersHorizontal size={16} />
          </button>
        </div>
        <AnimatePresence>
          {categoryOpen && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
              style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1.5px solid #6B7A3A", borderTop: "none", borderRadius: "0 0 14px 14px", boxShadow: "0 12px 40px rgba(61,43,31,0.12)", zIndex: 100, maxHeight: 340, overflowY: "auto" }}>
              <div onClick={() => { setSelectedCategory(null); setCategoryOpen(false); }}
                style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid #E8DFD0", background: !selectedCategory ? "#F5F0E8" : "white" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#F5F0E8")}
                onMouseLeave={e => (e.currentTarget.style.background = !selectedCategory ? "#F5F0E8" : "white")}>
                <div style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center" }}><Search size={18} color="#6B7A3A" strokeWidth={1.75} /></div>
                <span style={{ fontSize: "0.88rem", color: !selectedCategory ? "#3D2B1F" : "#8C7B6B", fontFamily: "system-ui", fontWeight: !selectedCategory ? 700 : 400 }}>Todas las categorías</span>
                {!selectedCategory && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#6B7A3A", flexShrink: 0 }} />}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 0 }}>
                {categories.map(cat => (
                  <div key={cat.id} onClick={() => { setSelectedCategory(cat); setCategoryOpen(false); }}
                    style={{ padding: "11px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: selectedCategory?.id === cat.id ? "#F5F0E8" : "white", borderBottom: "1px solid #F5F0E8" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F5F0E8")}
                    onMouseLeave={e => (e.currentTarget.style.background = selectedCategory?.id === cat.id ? "#F5F0E8" : "white")}>
                    <div style={{ width: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{(() => { const Icon = CATEGORY_ICONS[cat.slug] || Package; return <Icon size={18} color="#6B7A3A" strokeWidth={1.75} />; })()}</div>
                    <span style={{ fontSize: "0.82rem", color: selectedCategory?.id === cat.id ? "#3D2B1F" : "#8C7B6B", fontFamily: "system-ui", fontWeight: selectedCategory?.id === cat.id ? 700 : 400, lineHeight: 1.2 }}>{cat.name}</span>
                    {selectedCategory?.id === cat.id && <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#6B7A3A", flexShrink: 0 }} />}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid productos */}
      {loading ? (
        <Loading />
      ) : visibleProducts.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#8C7B6B", fontFamily: "system-ui" }}>
          {query || selectedCategory ? "No se encontraron productos" : "Escribe algo para buscar productos"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
          {visibleProducts.map((product, i) => {
            const qty = getQuantity(product.id);
            const hasTwo = product.supermarkets_count >= 2;
            return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                style={{ background: "white", border: `1.5px solid ${hasTwo ? "#6B7A3A" : "#E8DFD0"}`, borderRadius: 16, padding: 14, display: "flex", flexDirection: "column", gap: 12, boxShadow: hasTwo ? "0 2px 12px rgba(107,122,58,0.12)" : "0 2px 8px rgba(61,43,31,0.05)", position: "relative" }}>
                {product.is_offer && (
                  <div style={{ position: "absolute", top: 10, left: 10, background: "#C17F3A", borderRadius: 6, padding: "3px 7px", zIndex: 1 }}>
                    <span style={{ fontSize: "0.62rem", color: "white", fontFamily: "system-ui", fontWeight: 700 }}>OFERTA</span>
                  </div>
                )}
                {hasTwo && mode === "normal" && (
                  <div style={{ position: "absolute", top: 10, right: 10, background: "#6B7A3A", borderRadius: 6, padding: "3px 6px", display: "flex", alignItems: "center", gap: 3, zIndex: 1 }}>
                    <GitCompare size={10} color="white" />
                    <span style={{ fontSize: "0.62rem", color: "white", fontFamily: "system-ui", fontWeight: 700 }}>2 supers</span>
                  </div>
                )}
                {/* Imagen clickable */}
                <div onClick={() => setSelectedProductId(product.id)} style={{ width: "100%", height: 150, borderRadius: 10, background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", flexShrink: 0 }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    getCategoryIcon(product.category_id)
                  )}
                </div>
                {/* Nombre clickable */}
                <p onClick={() => setSelectedProductId(product.id)} style={{ fontSize: "0.84rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: 0, lineHeight: 1.35, minHeight: "2.7em", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", cursor: "pointer", flex: 1 }}>
                  {product.name}
                </p>
                {qty === 0 ? (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => addToCart(product)}
                    style={{ width: "100%", padding: "8px", background: "#6B7A3A", color: "white", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "system-ui", fontWeight: 600, fontSize: "0.82rem" }}>
                    <Plus size={14} /> Añadir
                  </motion.button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F5F0E8", borderRadius: 10, padding: "4px 8px" }}>
                    <button onClick={() => updateQuantity(product.id, -1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7A3A", display: "flex", alignItems: "center", padding: 4 }}><Minus size={14} /></button>
                    <span style={{ fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", fontSize: "0.9rem" }}>{qty}</span>
                    <button onClick={() => updateQuantity(product.id, 1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7A3A", display: "flex", alignItems: "center", padding: 4 }}><Plus size={14} /></button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Panel carrito */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCartOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(61,43,31,0.4)", zIndex: 200 }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 360, background: "white", zIndex: 201, display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(61,43,31,0.15)" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #E8DFD0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", color: "#3D2B1F", margin: 0 }}>Mi Lista ({totalItems})</h2>
                  {mode === "ahorro" && comparableCount > 0 && (
                    <p style={{ fontSize: "0.72rem", color: "#6B7A3A", fontFamily: "system-ui", margin: "2px 0 0", fontWeight: 600 }}>Se compararán {comparableCount} productos</p>
                  )}
                </div>
                <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8C7B6B" }}><X size={20} /></button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#8C7B6B", fontFamily: "system-ui" }}>
                    <ShoppingCart size={40} style={{ opacity: 0.3, margin: "0 auto 12px", display: "block" }} />
                    Tu lista está vacía
                  </div>
                ) : cart.map(item => (
                  <div key={item.product.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#F5F0E8", borderRadius: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                      {item.product.image_url ? <img src={item.product.image_url} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : getCategoryIcon(item.product.category_id)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.product.name}</p>
                      <span style={{ fontSize: "0.68rem", color: item.product.supermarkets_count >= 2 ? "#6B7A3A" : "#8C7B6B", fontFamily: "system-ui", fontWeight: 600 }}>
                        {item.product.supermarkets_count >= 2 ? "✓ Comparable" : "Solo 1 super"}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => updateQuantity(item.product.id, -1)} style={{ background: "white", border: "1px solid #E8DFD0", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={12} /></button>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem", minWidth: 16, textAlign: "center", fontFamily: "system-ui" }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} style={{ background: "white", border: "1px solid #E8DFD0", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <div style={{ padding: "16px 24px", borderTop: "1px solid #E8DFD0", display: "flex", flexDirection: "column", gap: 10 }}>
                  {budget && budget !== "0" && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontFamily: "system-ui", color: "#8C7B6B" }}>
                      <span>Presupuesto:</span>
                      <span style={{ fontWeight: 700, color: "#C17F3A" }}>{parseFloat(budget).toFixed(0)}€</span>
                    </div>
                  )}
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleCompare} disabled={comparing}
                    style={{ width: "100%", padding: 14, background: "#6B7A3A", color: "white", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 700, fontSize: "1rem", cursor: comparing ? "not-allowed" : "pointer", opacity: comparing ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {comparing ? <><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Comparando...</> : "Comparar precios →"}
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Panel resultado comparación */}
      {(() => {
        // Calcular total real por supermercado (suma de TODOS los productos disponibles en ese super)
        const smFullTotals: Record<string, number> = {};
        if (compareResult) {
          for (const item of compareResult.items) {
            for (const p of item.prices) {
              smFullTotals[p.supermarket] = (smFullTotals[p.supermarket] ?? 0) + p.price * item.quantity;
            }
          }
        }
        const sortedSm = Object.entries(smFullTotals).sort(([, a], [, b]) => a - b);
        const cheapestSmName = sortedSm[0]?.[0];

        return (
          <AnimatePresence>
            {compareOpen && compareResult && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCompareOpen(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(61,43,31,0.4)", zIndex: 200 }} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 500, background: "white", zIndex: 201, display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(61,43,31,0.15)" }}>
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #E8DFD0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", color: "#3D2B1F", margin: 0 }}>Resultado comparación</h2>
                  <p style={{ fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "4px 0 0" }}>
                    {mode === "ahorro" ? "Modo Super Ahorro — mejor precio por producto" : "Compra Normal"}
                  </p>
                </div>
                <button onClick={() => setCompareOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8C7B6B" }}><X size={20} /></button>
              </div>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #E8DFD0", display: "flex", gap: 12 }}>
                {sortedSm.map(([sm, total]) => {
                  const isCheapest = sm === cheapestSmName;
                  return (
                    <div key={sm} style={{ flex: 1, background: isCheapest ? "#6B7A3A" : "#F5F0E8", borderRadius: 12, padding: "12px 16px", textAlign: "center", position: "relative" }}>
                      {isCheapest && (
                        <span style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", background: "#C17F3A", color: "white", fontSize: "0.6rem", fontWeight: 700, fontFamily: "system-ui", padding: "2px 8px", borderRadius: 99, whiteSpace: "nowrap" }}>
                          MÁS BARATO
                        </span>
                      )}
                      <p style={{ fontSize: "0.72rem", color: isCheapest ? "rgba(255,255,255,0.8)" : "#8C7B6B", fontFamily: "system-ui", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{sm}</p>
                      <p style={{ fontSize: "1.3rem", fontWeight: 700, color: isCheapest ? "white" : "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>{total.toFixed(2)}€</p>
                    </div>
                  );
                })}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                {compareResult.items.map(item => {
                  const allSamePrice = item.prices.length > 1 && item.prices.every(p => p.price === item.prices[0].price);
                  return (
                    <div key={item.product_id} style={{ background: "#F5F0E8", borderRadius: 14, padding: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                          {item.image_url ? <img src={item.image_url} alt={item.product_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "1.3rem" }}>📦</span>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.product_name}</p>
                          <p style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>x{item.quantity}</p>
                        </div>
                        {allSamePrice && <span style={{ fontSize: "0.62rem", background: "#E8DFD0", color: "#8C7B6B", borderRadius: 4, padding: "2px 6px", fontFamily: "system-ui", fontWeight: 700, flexShrink: 0 }}>MISMO PRECIO</span>}
                      </div>
                      {item.not_found ? (
                        <p style={{ fontSize: "0.78rem", color: "#A63D2F", fontFamily: "system-ui", margin: 0 }}>No disponible en ningún supermercado</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {item.prices.map((p, idx) => {
                            const isCheapest = !allSamePrice && idx === 0;
                            return (
                              <div key={p.supermarket} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: isCheapest ? "white" : "rgba(255,255,255,0.5)", borderRadius: 8, padding: "8px 12px", border: isCheapest ? "1.5px solid #6B7A3A" : "1px solid transparent" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  {isCheapest && <span style={{ fontSize: "0.62rem", background: "#6B7A3A", color: "white", borderRadius: 4, padding: "2px 5px", fontFamily: "system-ui", fontWeight: 700 }}>MÁS BARATO</span>}
                                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui" }}>{p.supermarket}</span>
                                  {p.is_offer && <span style={{ fontSize: "0.62rem", background: "#C17F3A", color: "white", borderRadius: 4, padding: "2px 5px", fontFamily: "system-ui", fontWeight: 700 }}>OFERTA</span>}
                                </div>
                                <div style={{ textAlign: "right" }}>
                                  <span style={{ fontSize: "0.95rem", fontWeight: 700, color: isCheapest ? "#6B7A3A" : "#3D2B1F", fontFamily: "Georgia, serif" }}>{p.price.toFixed(2)}€</span>
                                  {p.original_price && <span style={{ fontSize: "0.72rem", color: "#8C7B6B", textDecoration: "line-through", marginLeft: 4, fontFamily: "system-ui" }}>{p.original_price.toFixed(2)}€</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: "16px 24px", borderTop: "1px solid #E8DFD0" }}>
                {overBudget && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(166,61,47,0.08)", border: "1px solid rgba(166,61,47,0.2)", borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                    <AlertTriangle size={16} color="#A63D2F" />
                    <p style={{ fontSize: "0.82rem", color: "#A63D2F", fontFamily: "system-ui", margin: 0, fontWeight: 600 }}>
                      Te has pasado del presupuesto en {(compareResult.total - parseFloat(budget)).toFixed(2)}€
                    </p>
                  </motion.div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#8C7B6B", fontFamily: "system-ui" }}>Total más barato:</span>
                  <span style={{ fontSize: "1.4rem", fontWeight: 700, color: overBudget ? "#A63D2F" : "#6B7A3A", fontFamily: "Georgia, serif" }}>{compareResult.total.toFixed(2)}€</span>
                </div>
                {budget && budget !== "0" && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.75rem", color: "#8C7B6B", fontFamily: "system-ui" }}>Presupuesto: {parseFloat(budget).toFixed(0)}€</span>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: overBudget ? "#A63D2F" : "#6B7A3A", fontFamily: "system-ui" }}>{Math.min(100, Math.round((compareResult.total / parseFloat(budget)) * 100))}%</span>
                    </div>
                    <div style={{ height: 6, background: "#E8DFD0", borderRadius: 99, overflow: "hidden" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (compareResult.total / parseFloat(budget)) * 100)}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                        style={{ height: "100%", background: overBudget ? "#A63D2F" : "#6B7A3A", borderRadius: 99 }} />
                    </div>
                  </div>
                )}
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setPurchaseStrategy("cheapest"); setChooseWhereOpen(true); }}
                  style={{ width: "100%", padding: 14, background: "#3D2B1F", color: "white", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 700, fontSize: "1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <SplitSquareHorizontal size={16} />
                  Elegir dónde comprar →
                </motion.button>
              </div>
            </motion.div>
            </>
          )}
          </AnimatePresence>
        );
      })()}

      {/* Panel ¿Dónde quieres comprar? */}
      <AnimatePresence>
        {chooseWhereOpen && compareResult && (() => {
          const mercadonaTotal = compareResult.items.reduce((acc, item) => {
            const p = item.prices.find(p => p.supermarket_slug === "mercadona");
            return p ? acc + p.price * item.quantity : acc;
          }, 0);
          const diaTotal = compareResult.items.reduce((acc, item) => {
            const p = item.prices.find(p => p.supermarket_slug === "dia");
            return p ? acc + p.price * item.quantity : acc;
          }, 0);
          const mercadonaMissing = compareResult.items.filter(i => !i.prices.find(p => p.supermarket_slug === "mercadona")).length;
          const diaMissing = compareResult.items.filter(i => !i.prices.find(p => p.supermarket_slug === "dia")).length;
          const cheapestAtMercadona = compareResult.items.filter(i => !i.not_found && i.cheapest.supermarket_slug === "mercadona").length;
          const cheapestAtDia = compareResult.items.filter(i => !i.not_found && i.cheapest.supermarket_slug === "dia").length;

          const strategies: { id: "cheapest" | "mercadona" | "dia"; label: string; sublabel: string; breakdown: string; total: number; accentColor: string; dotColor: string | null; missing: number; badge: string | null }[] = [
            {
              id: "cheapest",
              label: "Lo más barato",
              sublabel: "Cada producto al precio más bajo",
              breakdown: [cheapestAtMercadona > 0 ? `${cheapestAtMercadona} en Mercadona` : "", cheapestAtDia > 0 ? `${cheapestAtDia} en Día` : ""].filter(Boolean).join(" · "),
              total: compareResult.total,
              accentColor: "#6B7A3A",
              dotColor: null,
              missing: 0,
              badge: "MEJOR PRECIO",
            },
            {
              id: "mercadona",
              label: "Todo en Mercadona",
              sublabel: `${compareResult.items.length - mercadonaMissing} productos disponibles`,
              breakdown: "",
              total: mercadonaTotal,
              accentColor: "#00A650",
              dotColor: "#00A650",
              missing: mercadonaMissing,
              badge: null,
            },
            {
              id: "dia",
              label: "Todo en Día",
              sublabel: `${compareResult.items.length - diaMissing} productos disponibles`,
              breakdown: "",
              total: diaTotal,
              accentColor: "#E31837",
              dotColor: "#E31837",
              missing: diaMissing,
              badge: null,
            },
          ];

          const selected = strategies.find(s => s.id === purchaseStrategy)!;

          return (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setChooseWhereOpen(false)}
                style={{ position: "fixed", inset: 0, zIndex: 202 }} />
              <motion.div
                initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 500, background: "white", zIndex: 203, display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(61,43,31,0.15)" }}
              >
                {/* Header */}
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #E8DFD0", display: "flex", alignItems: "center", gap: 12 }}>
                  <button onClick={() => setChooseWhereOpen(false)}
                    style={{ background: "#F5F0E8", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <ChevronLeft size={18} color="#3D2B1F" />
                  </button>
                  <div>
                    <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", color: "#3D2B1F", margin: 0 }}>¿Dónde quieres comprar?</h2>
                    <p style={{ fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "4px 0 0" }}>Elige la opción que mejor se adapte a ti</p>
                  </div>
                </div>

                {/* Strategy cards */}
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                  {strategies.map((s, i) => {
                    const isSelected = purchaseStrategy === s.id;
                    const saving_vs_cheapest = s.id !== "cheapest" && s.total > compareResult.total ? s.total - compareResult.total : 0;
                    return (
                      <motion.div key={s.id}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                        onClick={() => setPurchaseStrategy(s.id)}
                        whileHover={{ scale: 1.01 }}
                        style={{ borderRadius: 16, border: `2px solid ${isSelected ? "#6B7A3A" : "#E8DFD0"}`, background: isSelected ? "#6B7A3A0D" : "white", padding: "18px 20px", cursor: "pointer", position: "relative" }}
                      >
                        {s.badge && (
                          <span style={{ position: "absolute", top: -9, left: 18, background: s.accentColor, color: "white", fontSize: "0.6rem", fontWeight: 700, fontFamily: "system-ui", padding: "2px 8px", borderRadius: 99 }}>
                            {s.badge}
                          </span>
                        )}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: (s.breakdown || s.missing > 0) ? 10 : 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            {s.dotColor
                              ? <span style={{ width: 13, height: 13, borderRadius: "50%", background: s.dotColor, display: "inline-block", flexShrink: 0, border: "2px solid rgba(0,0,0,0.08)" }} />
                              : <Zap size={16} color={s.accentColor} strokeWidth={2} />
                            }
                            <div>
                              <p style={{ fontSize: "0.92rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", margin: 0 }}>{s.label}</p>
                              <p style={{ fontSize: "0.75rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "2px 0 0" }}>{s.sublabel}</p>
                            </div>
                          </div>
                          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                            <p style={{ fontSize: "1.3rem", fontWeight: 700, color: isSelected ? s.accentColor : "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>
                              {s.total.toFixed(2)}€
                            </p>
                            {saving_vs_cheapest > 0 && (
                              <p style={{ fontSize: "0.7rem", color: "#A63D2F", fontFamily: "system-ui", margin: "2px 0 0", fontWeight: 600 }}>
                                +{saving_vs_cheapest.toFixed(2)}€ más caro
                              </p>
                            )}
                          </div>
                        </div>
                        {s.breakdown && (
                          <div style={{ fontSize: "0.75rem", color: "#6B7A3A", fontFamily: "system-ui", background: "#F5F0E8", borderRadius: 8, padding: "6px 10px" }}>
                            {s.breakdown}
                          </div>
                        )}
                        {s.missing > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(166,61,47,0.06)", borderRadius: 8, padding: "6px 10px", marginTop: s.breakdown ? 6 : 0 }}>
                            <AlertTriangle size={12} color="#A63D2F" />
                            <span style={{ fontSize: "0.72rem", color: "#A63D2F", fontFamily: "system-ui" }}>
                              {s.missing} {s.missing === 1 ? "producto no disponible" : "productos no disponibles"} — se usará el más barato
                            </span>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div style={{ padding: "16px 24px", borderTop: "1px solid #E8DFD0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "10px 14px", background: "#F5F0E8", borderRadius: 10 }}>
                    <span style={{ fontSize: "0.85rem", color: "#8C7B6B", fontFamily: "system-ui" }}>Total estimado:</span>
                    <span style={{ fontSize: "1.4rem", fontWeight: 700, color: selected.accentColor, fontFamily: "Georgia, serif" }}>
                      {selected.total.toFixed(2)}€
                    </span>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSavePurchase} disabled={saving}
                    style={{ width: "100%", padding: 14, background: "#3D2B1F", color: "white", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 700, fontSize: "1rem", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Guardando..." : "Confirmar y guardar compra"}
                  </motion.button>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* Panel detalle producto */}
      <ProductPanel
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onAddToCart={(id, qty) => {
          const product = visibleProducts.find(p => p.id === id);
          if (product) {
            setCart(prev => {
              const existing = prev.find(i => i.product.id === id);
              if (existing) return prev.map(i => i.product.id === id ? { ...i, quantity: i.quantity + qty } : i);
              return [...prev, { product, quantity: qty }];
            });
          }
        }}
        cartQuantity={getQuantity(selectedProductId || 0)}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}