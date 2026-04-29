from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from typing import List
from app.db.connection import get_db
from groq import Groq
import os

router = APIRouter(prefix="/chat", tags=["chat"])

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    user_id: int

def get_context(user_id: int, db: Session, user_message: str = "") -> str:
    context_parts = []

    # Ofertas activas
    try:
        ofertas = db.execute(text("""
            SELECT p.name, sp.price, sp.original_price, s.name as supermarket
            FROM supermarket_products sp
            JOIN products p ON p.id = sp.product_id
            JOIN supermarkets s ON s.id = sp.supermarket_id
            WHERE sp.is_offer = true AND sp.in_stock = true
            ORDER BY (sp.original_price - sp.price) DESC
            LIMIT 15
        """)).fetchall()
        if ofertas:
            context_parts.append("OFERTAS ACTIVAS EN LA APP:")
            for o in ofertas:
                desc = round((1 - float(o.price) / float(o.original_price)) * 100) if o.original_price else 0
                context_parts.append(f"- {o.name} en {o.supermarket}: {float(o.price):.2f}€ (antes {float(o.original_price):.2f}€, -{desc}%)")
    except:
        pass

    # Compras del usuario
    try:
        purchases = db.execute(text("""
            SELECT title, total_price, created_at
            FROM purchases
            WHERE user_id = :uid AND is_completed = true
            ORDER BY created_at DESC LIMIT 5
        """), {"uid": user_id}).fetchall()
        if purchases:
            context_parts.append("\nÚLTIMAS COMPRAS DEL USUARIO:")
            for p in purchases:
                context_parts.append(f"- {p.title}: {float(p.total_price):.2f}€")
    except:
        pass

    # Listas del usuario
    try:
        listas = db.execute(text("""
            SELECT sl.name, COUNT(sli.id) as items
            FROM shopping_lists sl
            LEFT JOIN shopping_list_items sli ON sli.list_id = sl.id
            WHERE sl.user_id = :uid
            GROUP BY sl.id, sl.name
        """), {"uid": user_id}).fetchall()
        if listas:
            context_parts.append("\nLISTAS DE LA COMPRA DEL USUARIO:")
            for l in listas:
                context_parts.append(f"- {l.name} ({l.items} productos)")
    except:
        pass

    # Búsqueda dinámica basada en el mensaje del usuario
    keywords = [w.lower() for w in user_message.split() if len(w) > 3]
    if keywords:
        try:
            conditions = " OR ".join([f"LOWER(p.name) LIKE :kw{i}" for i, _ in enumerate(keywords)])
            params = {f"kw{i}": f"%{kw}%" for i, kw in enumerate(keywords)}
            resultados = db.execute(text(f"""
                SELECT p.name, sp.price, sp.original_price, sp.is_offer, s.name as supermarket, c.name as category
                FROM supermarket_products sp
                JOIN products p ON p.id = sp.product_id
                JOIN supermarkets s ON s.id = sp.supermarket_id
                JOIN categories c ON c.id = p.category_id
                WHERE sp.in_stock = true AND ({conditions})
                ORDER BY p.name ASC, sp.price ASC
                LIMIT 60
            """), params).fetchall()
            if resultados:
                context_parts.append("\nPRODUCTOS ENCONTRADOS RELACIONADOS CON LA CONSULTA:")
                for p in resultados:
                    oferta = " (EN OFERTA)" if p.is_offer else ""
                    precio_original = f" antes {float(p.original_price):.2f}€" if p.is_offer and p.original_price else ""
                    context_parts.append(f"- {p.name} ({p.category}): {float(p.price):.2f}€ en {p.supermarket}{precio_original}{oferta}")
        except:
            pass

    # Muestra general de productos (fallback) — sin DISTINCT para ver todos los supers
    try:
        productos = db.execute(text("""
            SELECT p.name, sp.price, s.name as supermarket, c.name as category
            FROM supermarket_products sp
            JOIN products p ON p.id = sp.product_id
            JOIN supermarkets s ON s.id = sp.supermarket_id
            JOIN categories c ON c.id = p.category_id
            WHERE sp.in_stock = true
            ORDER BY p.name ASC, sp.price ASC
            LIMIT 40
        """)).fetchall()
        if productos:
            context_parts.append("\nMUESTRA GENERAL DE PRODUCTOS:")
            for p in productos:
                context_parts.append(f"- {p.name} ({p.category}): {float(p.price):.2f}€ en {p.supermarket}")
    except:
        pass

    return "\n".join(context_parts)


SYSTEM_PROMPT = """Eres Paco, el asistente de compras de Caleo. 

Tu personalidad:
- Eres un señor mayor de unos 70 años, entrañable y sabio
- Llevas toda la vida yendo al mercado y conoces los precios de memoria
- Hablas con cariño, usas expresiones como "mira chaval", "te lo digo yo", "en mis tiempos", "hijo/hija"
- Eres directo y práctico, sin rodeos, pero siempre amable
- Te gusta presumir de que sabes cocinar de toda la vida y conoces recetas tradicionales
- A veces haces comentarios graciosos sobre los precios ("esto es un robo!" o "que tiempos aquellos cuando el aceite costaba...")
- Pero cuando hay que ser serio y util, lo eres

Tus capacidades:
1. PRECIOS Y PRODUCTOS: Conoces todos los productos y precios de Mercadona y DIA que aparecen en los datos. Siempre dices en que supermercado es mas barato.

2. RECETAS: Eres un experto cocinero. Si alguien quiere hacer una receta, le dices los ingredientes, las cantidades, y buscas en los datos si hay alguno en oferta.

3. LISTAS DE LA COMPRA: Cuando hagas una lista de la compra, SIEMPRE agrupa los productos por estas categorias usando exactamente estos encabezados con emoji:

🥦 Frutas y Verduras
🥩 Carne
🐟 Pescado y Marisco
🥛 Lacteos y Huevos
🥖 Pan y Bolleria
🥫 Conservas y Enlatados
🧴 Limpieza e Higiene
🍝 Pasta, Arroz y Legumbres
🧃 Bebidas
🧂 Aceites, Salsas y Condimentos
🛒 Otros

Formato de cada producto dentro de su categoria:
- Nombre del producto: cantidad — X.XX€ en Supermercado

Si un producto no tiene precio, ponlo sin precio y sin ningun comentario al respecto.
Al final de la lista pon el coste estimado total.

4. AYUDA CON LA APP: Conoces perfectamente como funciona Caleo y puedes explicar al usuario como usar cada funcion:
   - La Compra: busca productos, elige modo Super Ahorro o Normal, añade al carrito y compara
   - Mis Listas: crea listas personalizadas con emoji y nombre
   - Ofertas: ve las mejores ofertas filtradas por supermercado
   - Mis Compras: historial de todas tus compras completadas
   - Ajustes: configura tu presupuesto diario/semanal/mensual

5. ANALISIS DE GASTO: Puedes analizar el historial de compras del usuario y darle consejos para ahorrar mas.

Reglas de formato — MUY IMPORTANTES:
- Responde SIEMPRE en español
- NUNCA uses caracteres de markdown: nada de **, *, #, ##, ___, >, ni similares
- NUNCA uses emojis salvo en los encabezados de categoria de las listas de la compra
- Usa solo texto plano, guiones (-) para listas, y saltos de linea para separar secciones
- Usa los datos reales del contexto cuando los tengas
- Si un producto no esta en los datos, ponlo en la lista sin precio y sin comentarios
- Sé conciso y ordenado — usa secciones claras cuando la respuesta lo requiera
- No mas de 5 parrafos por respuesta salvo que sea una lista de la compra o receta
- Nunca uses parentesis para hacer aclaraciones sobre la disponibilidad de productos

{context}"""


@router.post("/message")
def chat_message(data: ChatRequest, db: Session = Depends(get_db)):
    try:
        # Coge el último mensaje del usuario para la búsqueda dinámica
        last_user_message = next(
            (m.content for m in reversed(data.messages) if m.role == "user"), ""
        )

        context = get_context(data.user_id, db, last_user_message)
        system = SYSTEM_PROMPT.replace(
            "{context}",
            f"\nDATOS ACTUALES DE CALEO:\n{context}" if context else ""
        )

        messages = [{"role": "system", "content": system}]
        for msg in data.messages:
            messages.append({"role": msg.role, "content": msg.content})

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            max_tokens=1024,
            temperature=0.75,
        )

        return {
            "content": response.choices[0].message.content,
            "model": response.model,
        }

    except Exception as e:
        return {
            "content": "Ay hijo, que me ha fallado la conexion. Intentalo otra vez en un momento.",
            "model": "error"
        }