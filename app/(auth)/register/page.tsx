"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { register } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    try {
      await register(form.name, form.email, form.password);
      router.push("/login");
    } catch (error: any) {
      alert(error.message);
    }
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
          Crear cuenta
        </h1>

        {/* FORMULARIO */}
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {/* NOMBRE */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={labelStyle}>Nombre</label>
            <input
              name="name"
              type="text"
              placeholder="Tu nombre"
              value={form.name}
              onChange={handleChange}
              required
              style={inputStyle}
            />
          </div>

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

          {/* REPETIR CONTRASEÑA */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={labelStyle}>Repetir contraseña</label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
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
              Crear cuenta
            </button>
          </div>
        </form>

        {/* SWITCH A LOGIN */}
        <p style={{ textAlign: "center", fontSize: "0.9rem", color: "#8C7B6B" }}>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" style={{ color: "#6B7A3A", fontWeight: "600" }}>
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}