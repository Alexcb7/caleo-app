"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShoppingCart, Plus, Minus, ChevronDown, X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CATEGORY_ICONS: Record<string, string> = {
  "frutas-verduras": "🥦",
  "carnes-aves": "🥩",
  "pescados-mariscos": "🐟",
  "lacteos-huevos": "🥛",
  "charcuteria": "🥓",
  "panaderia-bolleria": "🍞",
  "congelados": "🧊",
  "conservas-enlatados": "🥫",
  "pasta-arroz-legumbres": "🍝",
  "aceites-vinagres": "🫙",
  "salsas-condimentos": "🧴",
  "cereales-desayunos": "🥣",
  "snacks-aperitivos": "🍿",
  "dulces-chocolates": "🍫",
  "bebidas-gas": "🥤",
  "agua-zumos": "💧",
  "bebidas-alcoholicas": "🍷",
  "cafe-te-infusiones": "☕",
  "bio-eco": "🌿",
  "cuidado-personal": "🧴",
  "limpieza-hogar": "🧹",
  "mascotas": "🐾",
  "bebe": "👶",
  "farmacia-salud": "💊",
  "papeleria-bazar": "📎",
  "otros": "📦",
};

type Category = { id: number; name: string; slug: string };
type Product = { id: number; name: string; image_url: string; category_id: number };
type CartItem = { product: Product; quantity: number };

export default function CompraPage() {
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar categorías
  useEffect(() => {
    fetch(`${API_URL}/products/categories`)
      .then(r => r.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  // Cerrar dropdown al click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Buscar productos
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchProducts();
    }, 300);
  }, [query, selectedCategory]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append("q", query);
      if (selectedCategory) params.append("category_id", String(selectedCategory.id));
      const res = await fetch(`${API_URL}/products/search?${params}`);
      const data = await res.json();
      setProducts(data);
    } catch {}
    setLoading(false);
  };

  const getCategoryIcon = (categoryId: number) => {
    const cat = categories.find(c => c.id === categoryId);
    if (!cat) return "📦";
    return CATEGORY_ICONS[cat.slug] || "📦";
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev
      .map(i => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0)
    );
  };

  const getQuantity = (productId: number) => {
    return cart.find(i => i.product.id === productId)?.quantity || 0;
  };

  const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto", position: "relative" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>La Compra</h1>
          <p style={{ fontSize: "0.85rem", color: "#8C7B6B", margin: "4px 0 0", fontFamily: "system-ui" }}>Busca productos y añádelos a tu lista</p>
        </div>
        {/* Carrito */}
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => setCartOpen(true)}
          style={{ position: "relative", background: "#6B7A3A", border: "none", borderRadius: 12, padding: "10px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, color: "white" }}
        >
          <ShoppingCart size={18} />
          <span style={{ fontFamily: "system-ui", fontWeight: 600, fontSize: "0.9rem" }}>Mi lista</span>
          {totalItems > 0 && (
            <span style={{ position: "absolute", top: -8, right: -8, background: "#C17F3A", color: "white", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700 }}>
              {totalItems}
            </span>
          )}
        </motion.button>
      </div>

      {/* Buscador + Categoría */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        {/* Search input */}
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#8C7B6B" }} />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{ width: "100%", padding: "12px 16px 12px 40px", border: "1.5px solid #E8DFD0", borderRadius: 12, fontSize: "0.95rem", color: "#3D2B1F", background: "white", outline: "none", fontFamily: "system-ui", boxSizing: "border-box" }}
            onFocus={e => { e.target.style.borderColor = "#6B7A3A"; e.target.style.boxShadow = "0 0 0 3px rgba(107,122,58,0.1)"; }}
            onBlur={e => { e.target.style.borderColor = "#E8DFD0"; e.target.style.boxShadow = "none"; }}
          />
        </div>

        {/* Categorías desplegable */}
        <div ref={dropdownRef} style={{ position: "relative", minWidth: 200 }}>
          <button
            onClick={() => setCategoryOpen(!categoryOpen)}
            style={{ width: "100%", padding: "12px 16px", border: "1.5px solid #E8DFD0", borderRadius: 12, fontSize: "0.9rem", color: selectedCategory ? "#3D2B1F" : "#8C7B6B", background: "white", outline: "none", fontFamily: "system-ui", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}
          >
            <span>
              {selectedCategory
                ? `${CATEGORY_ICONS[selectedCategory.slug] || "📦"} ${selectedCategory.name}`
                : "Todas las categorías"}
            </span>
            <ChevronDown size={16} style={{ transform: categoryOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          <AnimatePresence>
            {categoryOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "white", border: "1.5px solid #E8DFD0", borderRadius: 12, boxShadow: "0 8px 32px rgba(61,43,31,0.12)", zIndex: 100, maxHeight: 300, overflowY: "auto" }}
              >
                <div
                  onClick={() => { setSelectedCategory(null); setCategoryOpen(false); }}
                  style={{ padding: "10px 16px", cursor: "pointer", fontSize: "0.88rem", color: "#8C7B6B", fontFamily: "system-ui", borderBottom: "1px solid #E8DFD0" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#F5F0E8")}
                  onMouseLeave={e => (e.currentTarget.style.background = "white")}
                >
                  Todas las categorías
                </div>
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat); setCategoryOpen(false); }}
                    style={{ padding: "10px 16px", cursor: "pointer", fontSize: "0.88rem", color: "#3D2B1F", fontFamily: "system-ui", display: "flex", alignItems: "center", gap: 10, background: selectedCategory?.id === cat.id ? "#F5F0E8" : "white" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#F5F0E8")}
                    onMouseLeave={e => (e.currentTarget.style.background = selectedCategory?.id === cat.id ? "#F5F0E8" : "white")}
                  >
                    <span style={{ fontSize: "1.1rem" }}>{CATEGORY_ICONS[cat.slug] || "📦"}</span>
                    <span>{cat.name}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <span style={{ width: 32, height: 32, border: "3px solid #E8DFD0", borderTopColor: "#6B7A3A", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "block" }} />
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#8C7B6B", fontFamily: "system-ui" }}>
          {query || selectedCategory ? "No se encontraron productos" : "Escribe algo para buscar productos"}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {products.map((product, i) => {
            const qty = getQuantity(product.id);
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{ background: "white", border: "1.5px solid #E8DFD0", borderRadius: 16, padding: 16, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 2px 8px rgba(61,43,31,0.05)" }}
              >
                {/* Imagen o icono */}
                <div style={{ width: "100%", aspectRatio: "1", borderRadius: 10, background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  ) : (
                    <span style={{ fontSize: "2.5rem" }}>{getCategoryIcon(product.category_id)}</span>
                  )}
                </div>

                {/* Nombre */}
                <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: 0, lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {product.name}
                </p>

                {/* Controles cantidad */}
                {qty === 0 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => addToCart(product)}
                    style={{ width: "100%", padding: "8px", background: "#6B7A3A", color: "white", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "system-ui", fontWeight: 600, fontSize: "0.82rem" }}
                  >
                    <Plus size={14} />
                    Añadir
                  </motion.button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#F5F0E8", borderRadius: 10, padding: "4px 8px" }}>
                    <button onClick={() => updateQuantity(product.id, -1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7A3A", display: "flex", alignItems: "center", padding: 4 }}>
                      <Minus size={14} />
                    </button>
                    <span style={{ fontWeight: 700, color: "#3D2B1F", fontFamily: "system-ui", fontSize: "0.9rem" }}>{qty}</span>
                    <button onClick={() => updateQuantity(product.id, 1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7A3A", display: "flex", alignItems: "center", padding: 4 }}>
                      <Plus size={14} />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Panel carrito lateral */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(61,43,31,0.4)", zIndex: 200 }}
            />
            <motion.div
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 360, background: "white", zIndex: 201, display: "flex", flexDirection: "column", boxShadow: "-8px 0 40px rgba(61,43,31,0.15)" }}
            >
              {/* Header carrito */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #E8DFD0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", color: "#3D2B1F", margin: 0 }}>Mi Lista ({totalItems})</h2>
                <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#8C7B6B" }}>
                  <X size={20} />
                </button>
              </div>

              {/* Items */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 40, color: "#8C7B6B", fontFamily: "system-ui" }}>
                    <ShoppingCart size={40} style={{ opacity: 0.3, margin: "0 auto 12px", display: "block" }} />
                    Tu lista está vacía
                  </div>
                ) : cart.map(item => (
                  <div key={item.product.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "#F5F0E8", borderRadius: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                      {item.product.image_url ? (
                        <img src={item.product.image_url} alt={item.product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ fontSize: "1.4rem" }}>{getCategoryIcon(item.product.category_id)}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.82rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.product.name}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <button onClick={() => updateQuantity(item.product.id, -1)} style={{ background: "white", border: "1px solid #E8DFD0", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem", minWidth: 16, textAlign: "center", fontFamily: "system-ui" }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, 1)} style={{ background: "white", border: "1px solid #E8DFD0", borderRadius: 6, width: 24, height: 24, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer carrito */}
              {cart.length > 0 && (
                <div style={{ padding: "16px 24px", borderTop: "1px solid #E8DFD0" }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    style={{ width: "100%", padding: 14, background: "#6B7A3A", color: "white", border: "none", borderRadius: 12, fontFamily: "system-ui", fontWeight: 700, fontSize: "1rem", cursor: "pointer" }}
                  >
                    Comparar precios →
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}