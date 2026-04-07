"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div style={{
      width: "100%", minHeight: "80vh",
      background: "#F5F0E8",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
    }}>
      {/* Logo pulsante */}
      <motion.div
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        style={{ marginBottom: 28 }}
      >
        <img src="/images/claropng.png" alt="Caleo" style={{ height: 72, width: "auto" }} />
      </motion.div>

      {/* Barra de carga */}
      <div style={{ width: 120, height: 3, background: "#E8DFD0", borderRadius: 99, overflow: "hidden" }}>
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: "60%", height: "100%", background: "#6B7A3A", borderRadius: 99 }}
        />
      </div>

    </div>
  );
}