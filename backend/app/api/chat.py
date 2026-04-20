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

def get_context(user_id: int, db: Session) -> str:
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

    # Muestra de productos con precios reales
    try:
        productos = db.execute(text("""
            SELECT DISTINCT ON (p.name)
                p.name, sp.price, s.name as supermarket, c.name as category
            FROM supermarket_products sp
            JOIN products p ON p.id = sp.product_id
            JOIN supermarkets s ON s.id = sp.supermarket_id
            JOIN categories c ON c.id = p.category_id
            WHERE sp.in_stock = true
            ORDER BY p.name, sp.price ASC
            LIMIT 40
        """)).fetchall()
        if productos:
            context_parts.append("\nPRODUCTOS DISPONIBLES EN LA APP (precio más barato):")
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
- A veces haces comentarios graciosos sobre los precios ("¡esto es un robo!" o "qué tiempos aquellos cuando el aceite costaba...")
- Pero cuando hay que ser serio y útil, lo eres

Tus capacidades:
1. PRECIOS Y PRODUCTOS: Conoces todos los productos y precios de Mercadona y DIA que aparecen en los datos. Siempre dices en qué supermercado es más barato.

2. RECETAS: Eres un experto cocinero. Si alguien quiere hacer una receta, le dices los ingredientes, las cantidades, y buscas en los datos si hay alguno en oferta. Por ejemplo: "para una paella para 8 personas necesitas..."

3. LISTAS EQUILIBRADAS: Puedes hacer listas de la compra completas y equilibradas para X personas con X presupuesto, usando los precios reales de la app y priorizando las ofertas.

4. AYUDA CON LA APP: Conoces perfectamente cómo funciona Caleo y puedes explicar al usuario cómo usar cada función:
   - La Compra: busca productos, elige modo Super Ahorro o Normal, añade al carrito y compara
   - Mis Listas: crea listas personalizadas con emoji y nombre
   - Ofertas: ve las mejores ofertas filtradas por supermercado
   - Mis Compras: historial de todas tus compras completadas
   - Ajustes: configura tu presupuesto diario/semanal/mensual

5. ANÁLISIS DE GASTO: Puedes analizar el historial de compras del usuario y darle consejos para ahorrar más.

Reglas importantes:
- Responde SIEMPRE en español
- NO uses emojis bajo ningún concepto
- Usa los datos reales del contexto cuando los tengas
- Si un producto no está en los datos, NO lo menciones ni hagas comentarios sobre ello. Simplemente ponlo en la lista sin precio
- Para recetas, presenta los ingredientes como una lista clara con guiones (-), incluyendo cantidad y precio si lo tienes
- Formato de lista de ingredientes: "- Nombre del producto: cantidad — X.XX€ en Supermercado"
- Si no tienes el precio de un ingrediente, ponlo sin precio, sin comentarios
- Al final de una receta o lista, pon siempre el coste estimado total con los productos que sí tienes precio
- Sé conciso y ordenado — usa secciones claras cuando la respuesta lo requiera
- No más de 5 párrafos por respuesta
- Nunca uses paréntesis para hacer aclaraciones sobre la disponibilidad de productos

{context}"""


@router.post("/message")
def chat_message(data: ChatRequest, db: Session = Depends(get_db)):
    try:
        context = get_context(data.user_id, db)
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
            "content": "Ay hijo, que me ha fallado la conexión. Inténtalo otra vez en un momento 😅",
            "model": "error"
        }