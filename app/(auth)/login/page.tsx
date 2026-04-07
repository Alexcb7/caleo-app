"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || "Error al iniciar sesión"); return; }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/home");
    } catch {
      setError("Error de conexión con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#F5F0E8", display: "flex", overflow: "hidden", position: "relative" }}>

      {/* Círculos decorativos */}
      <div style={{ position: "fixed", width: 600, height: 600, borderRadius: "50%", background: "#6B7A3A", filter: "blur(120px)", opacity: 0.15, top: -200, right: -100, pointerEvents: "none" }} />
      <div style={{ position: "fixed", width: 400, height: 400, borderRadius: "50%", background: "#B8A06A", filter: "blur(100px)", opacity: 0.15, bottom: -150, left: -100, pointerEvents: "none" }} />

      {/* Panel izquierdo */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="lg:flex"
        style={{ display: "none", flex: 1, background: "#3D2B1F", padding: "60px 56px", flexDirection: "column", justifyContent: "center", position: "relative", overflow: "hidden" }}
      >
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(107,122,58,0.25) 0%, transparent 60%)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
            <img src="/images/oscuropng.png" alt="Caleo" style={{ height: 150, width: "auto" }} />
          </div>
          <h1 style={{ fontSize: "2.2rem", fontWeight: 700, color: "#F5F0E8", lineHeight: 1.2, margin: "0 0 16px", fontFamily: "Georgia, serif" }}>
            No se trata de gastar menos,<br />Se trata de gastar bien.
          </h1>
          <p style={{ fontSize: "0.95rem", color: "#8C7B6B", lineHeight: 1.7, margin: "0 0 48px", fontFamily: "system-ui, sans-serif" }}>
            Compara precios entre supermercados en tiempo real y encuentra siempre las mejores ofertas.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {[{ num: "+8.000", label: "Productos" }, { num: "30%", label: "ahorro" }, { num: "26", label: "Categorias" }].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 28 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "#B8A06A", fontFamily: "Georgia, serif" }}>{s.num}</span>
                  <span style={{ fontSize: "0.7rem", color: "#8C7B6B", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "system-ui" }}>{s.label}</span>
                </div>
                {i < 2 && <div style={{ width: 1, height: 36, background: "rgba(232,223,208,0.15)" }} />}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Panel derecho */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          style={{ width: "100%", maxWidth: 420, background: "white", borderRadius: 24, padding: "40px 36px", boxShadow: "0 4px 40px rgba(61,43,31,0.1), 0 1px 4px rgba(61,43,31,0.06)", border: "1px solid #E8DFD0" }}
        >
          {/* Logo mobile */}
          <div className="lg:hidden" style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <img src="/images/claropng.png" alt="Caleo" style={{ height: 70, width: "auto" }} />
          </div>

          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            style={{ fontSize: "1.7rem", fontWeight: 700, color: "#3D2B1F", margin: "0 0 6px", fontFamily: "Georgia, serif" }}
          >
            Bienvenido de nuevo
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            style={{ fontSize: "0.9rem", color: "#8C7B6B", margin: "0 0 32px", fontFamily: "system-ui" }}
          >
            Inicia sesión en tu cuenta
          </motion.p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 8 }}>
              {[
                { label: "Email", type: "email", placeholder: "tu@email.com", value: email, onChange: setEmail, delay: 0.4 },
                { label: "Contraseña", type: "password", placeholder: "••••••••", value: password, onChange: setPassword, delay: 0.5 },
              ].map(({ label, type, placeholder, value, onChange, delay }) => (
                <motion.div key={label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay, duration: 0.4 }}
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "#3D2B1F", fontFamily: "system-ui" }}>{label}</label>
                  <input
                    type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} required
                    style={{ padding: "12px 16px", border: "1.5px solid #E8DFD0", borderRadius: 12, fontSize: "0.95rem", color: "#3D2B1F", background: "#F5F0E8", outline: "none", fontFamily: "system-ui" }}
                    onFocus={(e) => { e.target.style.borderColor = "#6B7A3A"; e.target.style.boxShadow = "0 0 0 3px rgba(107,122,58,0.1)"; e.target.style.background = "white"; }}
                    onBlur={(e) => { e.target.style.borderColor = "#E8DFD0"; e.target.style.boxShadow = "none"; e.target.style.background = "#F5F0E8"; }}
                  />
                </motion.div>
              ))}
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: "0.83rem", color: "#A63D2F", margin: "8px 0", padding: "10px 14px", background: "rgba(166,61,47,0.08)", borderRadius: 8, fontFamily: "system-ui" }}>
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              style={{ marginTop: 20, padding: "14px", background: loading ? "#8A9B4A" : "#6B7A3A", color: "white", border: "none", borderRadius: 12, fontSize: "1rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "system-ui", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {loading ? (<><span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />Cargando...</>) : "Entrar a Caleo"}
            </motion.button>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              style={{ textAlign: "center", fontSize: "0.85rem", color: "#8C7B6B", marginTop: 20, fontFamily: "system-ui" }}>
              ¿No tienes cuenta?{" "}
              <Link href="/register" style={{ color: "#6B7A3A", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 2 }}>Regístrate gratis</Link>
            </motion.p>
          </form>
        </motion.div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .lg\\:flex { display: flex !important; } .lg\\:hidden { display: none !important; } @media (max-width: 1024px) { .lg\\:flex { display: none !important; } .lg\\:hidden { display: flex !important; } }`}</style>
    </div>
  );
}