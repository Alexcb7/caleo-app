"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, ShoppingCart, List, RefreshCw } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const SUGGESTIONS = [
  "¿Qué productos están en oferta esta semana?",
  "Hazme una paella para 8 personas y dime qué necesito",
  "Lista equilibrada para 2 personas con 60€ para una semana",
  "¿Cómo uso el modo Super Ahorro?",
  "¿Dónde es más barato el aceite de oliva?",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "¡Buenas! Soy Paco, el asistente de Caleo 👴 Llevo toda la vida en esto de los mercados y te puedo ayudar a encontrar los mejores precios, hacer listas de la compra, sugerirte recetas o explicarte cómo funciona la app. ¿Qué necesitas, hijo?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getUserId = () => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored).id : 1;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      // Solo enviamos el historial real sin el mensaje de bienvenida
      const history = updatedMessages
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch(`${API_URL}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          user_id: getUserId(),
        }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.content,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Lo siento, no he podido conectar con el servidor. Inténtalo de nuevo.",
        timestamp: new Date(),
      }]);
    }

    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const clearChat = () => {
    setMessages([{
      id: "welcome",
      role: "assistant",
      content: "¡Buenas! Soy Paco, el asistente de Caleo 👴 Llevo toda la vida en esto de los mercados y te puedo ayudar a encontrar los mejores precios, hacer listas de la compra, sugerirte recetas o explicarte cómo funciona la app. ¿Qué necesitas, hijo?",
      timestamp: new Date(),
    }]);
  };

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });

  return (
    <div style={{ height: "calc(100dvh - 0px)", display: "flex", flexDirection: "column", background: "#F5F0E8" }}>

      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #E8DFD0", background: "#F5F0E8", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #6B7A3A, #8A9B4A)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Bot size={20} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: "1rem", fontWeight: 700, color: "#3D2B1F", fontFamily: "Georgia, serif", margin: 0 }}>Chat IA</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ width: 6, height: 6, borderRadius: "50%", background: "#6B7A3A" }}
              />
              <span style={{ fontSize: "0.72rem", color: "#8C7B6B", fontFamily: "system-ui" }}>Llama 3.3 · Groq · Paco</span>
            </div>
          </div>
        </div>
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={clearChat}
          style={{ background: "#F5F0E8", border: "1.5px solid #E8DFD0", borderRadius: 10, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, color: "#8C7B6B", fontFamily: "system-ui", fontSize: "0.8rem" }}>
          <RefreshCw size={14} />
          Limpiar
        </motion.button>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {messages.length === 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 8 }}>
            {[
              { icon: <ShoppingCart size={13} />, label: "Comparar precios" },
              { icon: <List size={13} />, label: "Crear listas" },
              { icon: <Sparkles size={13} />, label: "Recomendaciones" },
            ].map((chip, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "white", border: "1.5px solid #E8DFD0", borderRadius: 20, fontSize: "0.78rem", color: "#8C7B6B", fontFamily: "system-ui" }}>
                {chip.icon}
                {chip.label}
              </div>
            ))}
          </motion.div>
        )}

        {messages.map((msg) => (
          <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            style={{ display: "flex", gap: 10, alignItems: "flex-end", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: msg.role === "assistant" ? "linear-gradient(135deg, #6B7A3A, #8A9B4A)" : "#3D2B1F" }}>
              {msg.role === "assistant" ? <Bot size={15} color="white" /> : <User size={15} color="white" />}
            </div>
            <div style={{ maxWidth: "70%" }}>
              <div style={{ padding: "12px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", background: msg.role === "user" ? "#3D2B1F" : "white", border: msg.role === "assistant" ? "1.5px solid #E8DFD0" : "none", boxShadow: "0 2px 8px rgba(61,43,31,0.06)" }}>
                <p style={{ fontSize: "0.9rem", color: msg.role === "user" ? "white" : "#3D2B1F", fontFamily: "system-ui", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {msg.content}
                </p>
              </div>
              <p style={{ fontSize: "0.68rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "4px 8px 0", textAlign: msg.role === "user" ? "right" : "left" }}>
                {formatTime(msg.timestamp)}
              </p>
            </div>
          </motion.div>
        ))}

        <AnimatePresence>
          {loading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #6B7A3A, #8A9B4A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bot size={15} color="white" />
              </div>
              <div style={{ padding: "14px 18px", background: "white", border: "1.5px solid #E8DFD0", borderRadius: "18px 18px 18px 4px", boxShadow: "0 2px 8px rgba(61,43,31,0.06)", display: "flex", gap: 5, alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    style={{ width: 7, height: 7, borderRadius: "50%", background: "#B8A06A" }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Sugerencias */}
      {messages.length <= 2 && !loading && (
        <div style={{ padding: "0 24px 16px", display: "flex", gap: 8, overflowX: "auto", flexShrink: 0 }}>
          {SUGGESTIONS.map((s, i) => (
            <motion.button key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => handleSuggestion(s)}
              style={{ padding: "8px 14px", background: "white", border: "1.5px solid #E8DFD0", borderRadius: 20, fontSize: "0.78rem", color: "#3D2B1F", fontFamily: "system-ui", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {s}
            </motion.button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "12px 24px 20px", background: "#F5F0E8", borderTop: "1px solid #E8DFD0", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", background: "white", borderRadius: 16, padding: "10px 10px 10px 16px", border: "1.5px solid #6B7A3A" }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Pregúntame sobre precios, productos o listas..."
            rows={1}
            style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "0.92rem", color: "#3D2B1F", fontFamily: "system-ui", resize: "none", maxHeight: 120, lineHeight: 1.5 }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = "auto";
              t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
            }}
          />
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{ width: 38, height: 38, background: "#6B7A3A", border: "none", borderRadius: 10, cursor: input.trim() && !loading ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Send size={16} color="white" />
          </motion.button>
        </div>
        <p style={{ fontSize: "0.68rem", color: "#8C7B6B", fontFamily: "system-ui", margin: "8px 0 0", textAlign: "center" }}>
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  );
}