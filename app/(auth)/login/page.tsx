"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login:", form);
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: "#F5F0E8",
    border: "1.5px solid #E8DFD0",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "#3D2B1F",
    fontSize: "0.95rem",
    fontFamily: "Georgia, serif",
    fontWeight: "600",
    outline: "none",
    width: "100%",
  };

  const labelStyle: React.CSSProperties = {
    color: "#3D2B1F",
    fontWeight: "600",
    fontSize: "0.9rem",
  };

  return (
    <main
      style={{
        backgroundColor: "#F5F0E8",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          backgroundColor: "#EDE8DF",
          borderRadius: "20px",
          padding: "clamp(1.5rem, 5vw, 2.5rem)",
          width: "100%",
          maxWidth: "420px",
          border: "1px solid #E8DFD0",
          display: "flex",
          flexDirection: "column",
          gap: "1.2rem",
          boxShadow: "0 4px 24px rgba(61,43,31,0.08)",
        }}
      >
        {/* LOGO */}
        <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <Image
            src="/images/logo_oscuro.png"
            alt="Caleo"
            width={120}
            height={120}
            priority
            style={{ width: "clamp(80px, 20vw, 120px)", height: "auto" }}
          />
        </div>

        {/* TÍTULO */}
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(1.4rem, 4vw, 1.8rem)",
            color: "#3D2B1F",
            textAlign: "center",
          }}
        >
          Iniciar sesión
        </h1>

        {/* FORMULARIO */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {/* EMAIL */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={labelStyle}>Email</label>
            <input
              name="email"
              type="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          {/* CONTRASEÑA */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={labelStyle}>Contraseña</label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

          {/* BOTÓN */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "0.5rem" }}>
            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%" }}
            >
              Entrar
            </button>
          </div>
        </form>

        {/* SWITCH A REGISTRO */}
        <p style={{ textAlign: "center", fontSize: "0.9rem", color: "#8C7B6B" }}>
          ¿No tienes cuenta?{" "}
          <Link href="/register" style={{ color: "#6B7A3A", fontWeight: "600" }}>
            Regístrate
          </Link>
        </p>

      </div>
    </main>
  );
}