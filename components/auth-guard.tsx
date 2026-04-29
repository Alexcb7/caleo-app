"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const COOKIE_NAME = "caleo_auth";
const COOKIE_MAX_AGE = 7 * 24 * 3600; // 7 días

export function setAuthCookie() {
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearAuthCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      expel();
      return;
    }

    fetch(`${API_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (!res.ok) throw new Error("unauthorized");
        return res.json();
      })
      .then(data => {
        // Sincronizar datos del usuario con lo que dice el backend
        localStorage.setItem("user", JSON.stringify(data.user));
        setAuthCookie();
        setVerified(true);
      })
      .catch(expel);

    function expel() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      clearAuthCookie();
      router.replace("/login");
    }
  }, []);

  if (!verified) {
    return (
      <div style={{
        minHeight: "100dvh", background: "#F5F0E8",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: 20,
      }}>
        <img src="/images/claropng.png" alt="Caleo" style={{ height: 54, opacity: 0.45 }} />
        <div style={{
          width: 28, height: 28,
          border: "3px solid #E8DFD0", borderTopColor: "#6B7A3A",
          borderRadius: "50%", animation: "spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <>{children}</>;
}
