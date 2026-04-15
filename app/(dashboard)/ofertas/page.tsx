"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Flame, Tag, List,
  Apple, Beef, Fish, Milk, Sandwich, Wheat, Snowflake, Archive,
  Droplets, FlaskConical, Sunrise, Cookie, Candy, CupSoda, GlassWater,
  Wine, Coffee, Sprout, Sparkles, PawPrint, Baby, Package, Leaf, LucideIcon,
} from "lucide-react";
import { ProductPanel } from "@/components/product-panel";
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

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "frutas-verduras": Apple,
  "carnes-aves": Beef,
  "pescados-mariscos": Fish,
  "lacteos-huevos": Milk,
  "charcuteria": Sandwich,
  "panaderia-bolleria": Wheat,
  "congelados": Snowflake,
  "conservas-enlatados": Archive,
  "pasta-arroz-legumbres": Wheat,
  "aceites-vinagres": Droplets,
  "salsas-condimentos": FlaskConical,
  "cereales-desayunos": Sunrise,
  "snacks-aperitivos": Cookie,
  "dulces-chocolates": Candy,
  "bebidas-gas": CupSoda,
  "agua-zumos": GlassWater,
  "bebidas-alcoholicas": Wine,
  "cafe-te-infusiones": Coffee,
  "bio-eco": Sprout,
  "cuidado-personal": Sparkles,
  "limpieza-hogar": FlaskConical,
  "mascotas": PawPrint,
  "bebe": Baby,
  "farmacia-salud": Leaf,
  "papeleria-bazar": Package,
  "otros": Package,
};

function getCategoryIcon(category: string | null): React.ReactNode {
  if (!category) return <Tag size={22} color="#6B7A3A" strokeWidth={1.75} />;
  const slug = category
    .toLowerCase()
    .replace(/ /g, "-")
    .replace(/[óo]/g, "o").replace(/[áa]/g, "a").replace(/[ée]/g, "e")
    .replace(/[íi]/g, "i").replace(/[úu]/g, "u");
  const Icon = CATEGORY_ICONS[slug] ?? Tag;
  return <Icon size={22} color="#6B7A3A" strokeWidth={1.75} />;
}

export default function OfertasPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"general" | "listas">("general");
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [ofertasListas, setOfertasListas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [superFilter, setSuperFilter] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  useEffect(() => { fetchOfertas(); }, []);
  useEffect(() => { if (tab === "listas") fetchOfertasListas(); }, [tab]);

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
  const descuento = (price: number, original: number) => Math.round((1 - price / original) * 100);

  const handleAddToCart = (productId: number, quantity: number) => {
    const oferta = currentOfertas.find(o => o.product_id === productId);
    localStorage.setItem("caleo_add_from_oferta", JSON.stringify({
      product_id: productId,
      product_name: oferta?.product_name ?? "",
      image_url: oferta?.image_url ?? null,
      quantity,
    }));
    router.push("/compra");
  };

  if (loading) return <Loading />;

  return (
    <div style={{ padding: "24px", position: "relative" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Flame size={20} color="#C17F3A" />
            <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>Ofertas</h1>
          </div>
          <p style={{ fontSize: "0.85rem", color: "#8C7B6B", margin: 0, fontFamily: "system-ui" }}>
            Las mejores ofertas de Mercadona y DIA
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "white", border: "1.5px solid #E8DFD0", borderRadius: 12, padding: 4, gap: 2 }}>
          {[
            { key: "general", label: "Todas", icon: <Tag size={13} /> },
            { key: "listas", label: "En mis listas", icon: <List size={13} /> },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
              style={{ padding: "8px 16px", borderRadius: 9, border: "none", background: tab === t.key ? "#6B7A3A" : "transparent", color: tab === t.key ? "white" : "#8C7B6B", fontSize: "0.82rem", fontFamily: "system-ui", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.2s" }}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro supermercado */}
      {supermarkets.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
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
          {filtered.length > 0 && (
            <span style={{ marginLeft: "auto", fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui", alignSelf: "center" }}>
              {filtered.length} ofertas
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 24px", background: "white", borderRadius: 16, border: "1.5px solid #E8DFD0" }}>
          <Tag size={40} color="#E8DFD0" style={{ margin: "0 auto 14px", display: "block" }} />
          <p style={{ fontSize: "1rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: "0 0 6px" }}>
            {tab === "listas" ? "No hay ofertas en tus listas" : "No hay ofertas disponibles"}
          </p>
          <p style={{ fontSize: "0.85rem", color: "#8C7B6B", fontFamily: "system-ui", margin: 0 }}>
            {tab === "listas" ? "Añade productos a tus listas para ver sus ofertas aquí" : "Vuelve más tarde para ver las últimas ofertas"}
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 16 }}>
          {filtered.map((oferta, i) => (
            <motion.div
              key={oferta.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              style={{
                background: "white",
                border: "1.5px solid #C17F3A",
                borderRadius: 16,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                boxShadow: "0 2px 12px rgba(193,127,58,0.10)",
                position: "relative",
              }}
            >
              {/* Badge descuento */}
              {oferta.original_price && (
                <div style={{ position: "absolute", top: 10, left: 10, background: "#C17F3A", borderRadius: 6, padding: "3px 7px", display: "flex", alignItems: "center", gap: 3, zIndex: 1 }}>
                  <Flame size={9} color="white" />
                  <span style={{ fontSize: "0.62rem", color: "white", fontFamily: "system-ui", fontWeight: 700 }}>
                    -{descuento(oferta.price, oferta.original_price)}%
                  </span>
                </div>
              )}

              {/* Badge supermercado */}
              <div style={{ position: "absolute", top: 10, right: 10, background: "#6B7A3A", borderRadius: 6, padding: "3px 7px", zIndex: 1 }}>
                <span style={{ fontSize: "0.62rem", fontFamily: "system-ui", fontWeight: 700, color: "white" }}>{oferta.supermarket}</span>
              </div>

              {/* Imagen clickable */}
              <div
                onClick={() => setSelectedProductId(oferta.product_id)}
                style={{ width: "100%", height: 150, borderRadius: 10, background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", cursor: "pointer", flexShrink: 0 }}
              >
                {oferta.image_url ? (
                  <img src={oferta.image_url} alt={oferta.product_name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  getCategoryIcon(oferta.category)
                )}
              </div>

              {/* Nombre clickable */}
              <p
                onClick={() => setSelectedProductId(oferta.product_id)}
                style={{ fontSize: "0.84rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui", margin: 0, lineHeight: 1.35, minHeight: "2.7em", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", cursor: "pointer", flex: 1 }}
              >
                {oferta.product_name}
              </p>

              {/* Precio */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#C17F3A", fontFamily: "Georgia, serif" }}>{oferta.price.toFixed(2)}€</span>
                {oferta.original_price && (
                  <span style={{ fontSize: "0.78rem", color: "#8C7B6B", textDecoration: "line-through", fontFamily: "system-ui" }}>{oferta.original_price.toFixed(2)}€</span>
                )}
              </div>

              {/* Botón añadir */}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => handleAddToCart(oferta.product_id, 1)}
                style={{ width: "100%", padding: "8px", background: "#6B7A3A", color: "white", border: "none", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "system-ui", fontWeight: 600, fontSize: "0.82rem" }}
              >
                Añadir a La Compra
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}

      {/* ProductPanel */}
      <ProductPanel
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onAddToCart={handleAddToCart}
        cartQuantity={0}
        zIndexBase={210}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
