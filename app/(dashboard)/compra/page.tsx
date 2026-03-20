"use client";

import { useState, useEffect } from "react";
import { searchProducts, getCategories, compareProducts } from "@/lib/api";

export default function CompraPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<any[]>([]);
  const [resultado, setResultado] = useState<any>(null);
  const [comparando, setComparando] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const results = await searchProducts(query, selectedCategory || undefined);
      setProducts(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

 const addToCart = (product: any) => {
  const existing = cart.find((p) => p.id === product.id);
  if (existing) {
    setCart(cart.map((p) => p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p));
  } else {
    setCart([...cart, { ...product, quantity: 1 }]);
  }
  setProducts([]);
};

  const removeFromCart = (id: number) => {
    setCart(cart.filter((p) => p.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map((p) => p.id === id ? { ...p, quantity: Math.max(1, p.quantity + delta) } : p));
  };

  const handleCompare = async () => {
    setComparando(true);
    try {
      const cartItems = cart.map((p) => ({
        product_id: p.id,
        quantity: p.quantity,
        name: p.name,
      }));
      const res = await compareProducts(cartItems);
      setResultado(res);
    } catch (e) {
      console.error(e);
    } finally {
      setComparando(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* TÍTULO */}
      <div>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", color: "#3D2B1F", fontWeight: "700" }}>
          🛒 La Compra
        </h1>
        <p style={{ color: "#8C7B6B", fontSize: "0.95rem", marginTop: "4px" }}>
          Busca productos y añádelos a tu lista
        </p>
      </div>

      {/* BUSCADOR */}
      <div style={{ display: "flex", gap: "10px" }}>
        <select
          value={selectedCategory || ""}
          onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
          style={{
            backgroundColor: "#FFFFFF",
            border: "1.5px solid #E8DFD0",
            borderRadius: "10px",
            padding: "10px 14px",
            color: "#3D2B1F",
            fontSize: "0.9rem",
            outline: "none",
            minWidth: "160px",
          }}
        >
          <option value="">Todas las categorías</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Buscar producto..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          style={{
            flex: 1,
            backgroundColor: "#FFFFFF",
            border: "1.5px solid #E8DFD0",
            borderRadius: "10px",
            padding: "10px 14px",
            color: "#3D2B1F",
            fontSize: "0.95rem",
            outline: "none",
          }}
        />

        <button
          onClick={handleSearch}
          className="btn-primary"
          style={{ padding: "10px 24px" }}
        >
          {loading ? "..." : "Buscar"}
        </button>
      </div>

      {/* RESULTADOS */}
      {products.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "14px",
                padding: "16px",
                border: "1px solid #E8DFD0",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              {product.image_url && (
                <img
                  src={product.image_url}
                  alt={product.name}
                  style={{ width: "80px", height: "80px", objectFit: "contain", borderRadius: "8px" }}
                />
              )}
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#3D2B1F" }}>
                {product.name}
              </div>
              {product.prices[0] && (
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#6B7A3A" }}>
                  {product.prices[0].price?.toFixed(2)}€
                </div>
              )}
              <button
                onClick={() => addToCart(product)}
                className="btn-primary"
                style={{ width: "100%", padding: "8px", fontSize: "0.85rem" }}
              >
                + Añadir
              </button>
            </div>
          ))}
        </div>
      )}

      {/* LISTA DE LA COMPRA */}
      {cart.length > 0 && (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", padding: "22px", border: "1px solid #E8DFD0" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", color: "#3D2B1F", marginBottom: "16px" }}>
            📋 Tu lista ({cart.length} productos)
          </h2>

          {cart.map((item) => (
            <div key={item.id} style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 0",
              borderBottom: "1px solid #E8DFD0",
            }}>
              {item.image_url && (
                <img src={item.image_url} alt={item.name} style={{ width: "40px", height: "40px", objectFit: "contain" }} />
              )}
              <div style={{ flex: 1, fontSize: "13.5px", fontWeight: "500", color: "#3D2B1F" }}>
                {item.name}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button onClick={() => updateQuantity(item.id, -1)}
                  style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid #E8DFD0", backgroundColor: "#F5F0E8", cursor: "pointer", fontWeight: "700" }}>
                  -
                </button>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#3D2B1F", minWidth: "20px", textAlign: "center" }}>
                  {item.quantity}
                </span>
                <button onClick={() => updateQuantity(item.id, 1)}
                  style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid #E8DFD0", backgroundColor: "#F5F0E8", cursor: "pointer", fontWeight: "700" }}>
                  +
                </button>
              </div>
              <button onClick={() => removeFromCart(item.id)}
                style={{ color: "#A63D2F", backgroundColor: "transparent", border: "none", cursor: "pointer", fontSize: "1.2rem" }}>
                ✕
              </button>
            </div>
          ))}

          <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn-primary"
              style={{ padding: "12px 32px" }}
              onClick={handleCompare}
            >
              {comparando ? "Comparando..." : "Finalizar y comparar →"}
            </button>
          </div>
        </div>
      )}

      {/* RESULTADO COMPARADOR */}
      {resultado && (
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", padding: "22px", border: "1px solid #E8DFD0" }}>
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: "1.4rem", color: "#3D2B1F", marginBottom: "16px" }}>
            🏆 Resultado del comparador
          </h2>

          {/* RANKING */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#3D2B1F", marginBottom: "12px" }}>
              Ranking por precio total
            </h3>
            {resultado.ranking_supermercados.map((s: any, i: number) => (
              <div key={s.supermarket_id} style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                backgroundColor: i === 0 ? "rgba(107,122,58,0.1)" : "#F5F0E8",
                borderRadius: "10px",
                marginBottom: "8px",
                border: i === 0 ? "1px solid #6B7A3A" : "1px solid #E8DFD0",
              }}>
                <span style={{ fontSize: "1.4rem" }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                </span>
                <span style={{ flex: 1, fontWeight: "600", color: "#3D2B1F" }}>
                  {s.supermarket}
                </span>
                <span style={{ fontFamily: "Georgia, serif", fontSize: "1.2rem", fontWeight: "700", color: i === 0 ? "#6B7A3A" : "#3D2B1F" }}>
                  {s.total.toFixed(2)}€
                </span>
              </div>
            ))}
            {resultado.ahorro_maximo > 0 && (
              <div style={{ marginTop: "8px", padding: "10px", backgroundColor: "rgba(107,122,58,0.1)", borderRadius: "10px", textAlign: "center" }}>
                <span style={{ color: "#6B7A3A", fontWeight: "600", fontSize: "0.95rem" }}>
                  💰 Ahorro máximo: {resultado.ahorro_maximo.toFixed(2)}€
                </span>
              </div>
            )}
          </div>

          {/* DESGLOSE */}
          <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#3D2B1F", marginBottom: "12px" }}>
            Desglose por producto
          </h3>
          {resultado.productos.map((p: any) => (
            <div key={p.product_id} style={{ padding: "12px 0", borderBottom: "1px solid #E8DFD0" }}>
              <div style={{ fontWeight: "600", color: "#3D2B1F", marginBottom: "8px" }}>
                {p.name} x{p.quantity}
              </div>
              {p.precios.map((precio: any, i: number) => (
                <div key={`${p.product_id}-${precio.supermarket_id}-${i}`} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "13px",
                  color: i === 0 ? "#6B7A3A" : "#8C7B6B",
                  fontWeight: i === 0 ? "600" : "400",
                  padding: "2px 0",
                }}>
                  <span>{i === 0 ? "✅" : "  "} {precio.supermarket}</span>
                  <span>{precio.price.toFixed(2)}€</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}