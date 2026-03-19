export default function HomePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* TOPBAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "1.8rem", color: "#3D2B1F", fontWeight: "700" }}>
            👋 Buenos días, Alex
          </h1>
          <p style={{ color: "#8C7B6B", fontSize: "0.95rem", marginTop: "4px" }}>
            Aquí tienes el resumen de tus compras
          </p>
        </div>
        <div style={{ display: "flex", backgroundColor: "#FFFFFF", borderRadius: "10px", padding: "4px", border: "1px solid #E8DFD0", gap: "2px" }}>
          {["Día", "Semana", "Mes", "Año"].map((p) => (
            <button key={p} style={{
              padding: "6px 14px",
              borderRadius: "7px",
              fontSize: "12.5px",
              fontWeight: "500",
              border: "none",
              cursor: "pointer",
              backgroundColor: p === "Semana" ? "#3D2B1F" : "transparent",
              color: p === "Semana" ? "#FFFFFF" : "#8C7B6B",
            }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {[
          { label: "Ahorro total", value: "23,40€", sub: "vs super más caro", highlight: true },
          { label: "Gasto total", value: "87,60€", sub: "esta semana", highlight: false },
          { label: "Compras realizadas", value: "3", sub: "esta semana", highlight: false },
          { label: "Productos comprados", value: "42", sub: "esta semana", highlight: false },
        ].map((stat) => (
          <div key={stat.label} style={{
            backgroundColor: stat.highlight ? "#6B7A3A" : "#FFFFFF",
            borderRadius: "14px",
            padding: "20px",
            border: "1px solid #E8DFD0",
          }}>
            <div style={{ fontSize: "12px", fontWeight: "500", color: stat.highlight ? "rgba(255,255,255,0.7)" : "#8C7B6B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              {stat.label}
            </div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "2rem", fontWeight: "700", color: stat.highlight ? "#FFFFFF" : "#3D2B1F", lineHeight: "1" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "12px", color: stat.highlight ? "rgba(255,255,255,0.6)" : "#8C7B6B", marginTop: "6px" }}>
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* SEGUNDA FILA */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px" }}>

        {/* GASTO + PRESUPUESTO */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", padding: "22px", border: "1px solid #E8DFD0" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: "600", color: "#3D2B1F", marginBottom: "16px" }}>
            📊 Gasto semanal
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "140px", backgroundColor: "#F5F0E8", borderRadius: "10px", padding: "16px 12px 0" }}>
            {[60, 90, 40, 120, 70, 50, 30].map((h, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "100%", height: `${h}px`, backgroundColor: "#6B7A3A", borderRadius: "6px 6px 0 0" }} />
                <span style={{ fontSize: "10px", color: "#8C7B6B" }}>{["L","M","X","J","V","S","D"][i]}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              { label: "Presupuesto semanal", current: "87,60€", total: "120€", pct: 73, color: "#6B7A3A" },
              { label: "Presupuesto mensual", current: "210€", total: "400€", pct: 52, color: "#C17F3A" },
              { label: "Presupuesto anual", current: "1.840€", total: "4.000€", pct: 46, color: "#6B7A3A" },
            ].map((b) => (
              <div key={b.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "13px", color: "#3D2B1F", fontWeight: "500" }}>{b.label}</span>
                  <span style={{ fontSize: "13px", color: "#8C7B6B" }}>{b.current} / {b.total}</span>
                </div>
                <div style={{ height: "8px", backgroundColor: "#F5F0E8", borderRadius: "20px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${b.pct}%`, backgroundColor: b.color, borderRadius: "20px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SUPERMERCADO FAVORITO */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", padding: "22px", border: "1px solid #E8DFD0" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: "600", color: "#3D2B1F", marginBottom: "16px" }}>
            🏪 ¿Dónde compras más?
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { name: "Mercadona", pct: 65, color: "#6B7A3A" },
              { name: "Lidl", pct: 25, color: "#B8A06A" },
              { name: "Carrefour", pct: 10, color: "#8C7B6B" },
            ].map((s) => (
              <div key={s.name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "12.5px", fontWeight: "500", color: "#3D2B1F", width: "90px" }}>{s.name}</span>
                <div style={{ flex: 1, height: "8px", backgroundColor: "#F5F0E8", borderRadius: "20px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${s.pct}%`, backgroundColor: s.color, borderRadius: "20px" }} />
                </div>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#8C7B6B", width: "32px", textAlign: "right" }}>{s.pct}%</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #E8DFD0" }}>
            <div style={{ fontFamily: "Georgia, serif", fontSize: "0.9rem", fontWeight: "600", color: "#3D2B1F", marginBottom: "10px" }}>
              ⭐ Tu super favorito
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "48px", height: "48px", backgroundColor: "#F5F0E8", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>🟢</div>
              <div>
                <div style={{ fontWeight: "600", fontSize: "15px", color: "#3D2B1F" }}>Mercadona</div>
                <div style={{ fontSize: "12px", color: "#8C7B6B" }}>6 de tus últimas 8 compras</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TERCERA FILA */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>

        {/* MIS LISTAS */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", padding: "22px", border: "1px solid #E8DFD0" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: "600", color: "#3D2B1F", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
            📁 Mis Listas
            <span style={{ fontSize: "12px", color: "#6B7A3A", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>Ver todas →</span>
          </div>
          {[
            { emoji: "🥛", name: "Lista del lunes", meta: "8 productos · hace 2 días", price: "34,50€" },
            { emoji: "🥩", name: "Lista de carne", meta: "5 productos · hace 1 semana", price: "22,80€" },
            { emoji: "🥗", name: "Lista saludable", meta: "12 productos · hace 3 semanas", price: "41,20€" },
          ].map((l) => (
            <div key={l.name} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0", borderBottom: "1px solid #E8DFD0" }}>
              <div style={{ width: "38px", height: "38px", backgroundColor: "#F5F0E8", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>{l.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13.5px", fontWeight: "500", color: "#3D2B1F" }}>{l.name}</div>
                <div style={{ fontSize: "11.5px", color: "#8C7B6B", marginTop: "2px" }}>{l.meta}</div>
              </div>
              <div style={{ fontSize: "13px", fontWeight: "600", color: "#6B7A3A" }}>{l.price}</div>
            </div>
          ))}
        </div>

        {/* PRODUCTO FAVORITO */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", padding: "22px", border: "1px solid #E8DFD0", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "10px" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: "600", color: "#3D2B1F", alignSelf: "flex-start" }}>
            ⭐ Tu producto favorito
          </div>
          <div style={{ width: "70px", height: "70px", backgroundColor: "#F5F0E8", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>🥛</div>
          <div style={{ fontWeight: "600", fontSize: "14px", color: "#3D2B1F" }}>Leche Entera Hacendado 1L</div>
          <div style={{ fontSize: "12px", color: "#8C7B6B" }}>Lo has comprado 12 veces</div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "1.6rem", fontWeight: "700", color: "#6B7A3A" }}>0,89€</div>
          <div style={{ fontSize: "12px", color: "#8C7B6B" }}>Mejor precio en Mercadona</div>
          <div style={{ backgroundColor: "rgba(107,122,58,0.1)", color: "#6B7A3A", fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px" }}>
            📉 En precio mínimo histórico
          </div>
        </div>

        {/* OFERTAS */}
        <div style={{ backgroundColor: "#FFFFFF", borderRadius: "14px", padding: "22px", border: "1px solid #E8DFD0" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "1rem", fontWeight: "600", color: "#3D2B1F", marginBottom: "16px", display: "flex", justifyContent: "space-between" }}>
            🏷️ Ofertas para ti
            <span style={{ fontSize: "12px", color: "#6B7A3A", cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>Ver todas →</span>
          </div>
          {[
            { emoji: "🥛", name: "Leche Entera 1L", super: "Mercadona", old: "0,99€", new: "0,75€", pct: "-24%" },
            { emoji: "🍗", name: "Pechuga de pollo", super: "Lidl", old: "5,20€", new: "3,90€", pct: "-25%" },
            { emoji: "🫒", name: "Aceite Oliva 1L", super: "Carrefour", old: "6,50€", new: "4,20€", pct: "-35%" },
          ].map((o) => (
            <div key={o.name} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 0", borderBottom: "1px solid #E8DFD0" }}>
              <div style={{ width: "36px", height: "36px", backgroundColor: "rgba(193,127,58,0.1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>{o.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: "500", color: "#3D2B1F" }}>{o.name}</div>
                <div style={{ fontSize: "11px", color: "#8C7B6B" }}>{o.super}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "11px", color: "#8C7B6B", textDecoration: "line-through" }}>{o.old}</div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#C17F3A" }}>{o.new}</div>
                <div style={{ backgroundColor: "#C17F3A", color: "white", fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px" }}>{o.pct}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}