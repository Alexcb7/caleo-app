import os
import sys
import json
import anthropic
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(BASE_DIR, '.env'))

from app.db.connection import SessionLocal
from app.models.all_models import SupermarketProduct, Product, ProductMapping, Category

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ── PASADA 1: Mercadona por categorías ──────────────────────────────────────

SYSTEM_MERCADONA = """Eres un experto en normalización de productos de supermercado español.

Dado un listado de productos de Mercadona de la misma categoría, crea productos genéricos agrupando:
- Marca blanca (Hacendado): quita la marca y crea un genérico limpio. Ej: "Leche entera Hacendado 1L" → "Leche entera 1L"
- Marca comercial: mantén la marca pero limpia el nombre. Ej: "Coca-Cola lata 33cl pack 8" → "Coca-Cola lata 33cl"
- Agrupa variantes del mismo producto si tienen el mismo formato/tamaño

Responde SOLO con JSON válido sin markdown ni texto extra:
{
  "genericos": [
    {
      "nombre_generico": "Nombre limpio",
      "ids_originales": [1, 2]
    }
  ]
}"""

SYSTEM_DIA = """Eres un experto en normalización de productos de supermercado español.

Dado un listado de productos de DIA, debes encontrar si cada producto coincide con algún producto genérico ya existente o si es un producto nuevo.

Reglas:
- Si el producto DIA es equivalente a un genérico existente (mismo tipo, mismo formato aproximado), asígnalo a ese genérico
- Marca blanca DIA: compara con genéricos de marca blanca existentes
- Marca comercial: compara por nombre de marca y formato
- Si no hay equivalente, crea un nuevo genérico

Responde SOLO con JSON válido sin markdown ni texto extra:
{
  "asignaciones": [
    {
      "id_dia": 123,
      "generico_id": 45,
      "es_nuevo": false
    },
    {
      "id_dia": 456,
      "nombre_generico_nuevo": "Nombre del nuevo genérico",
      "es_nuevo": true
    }
  ]
}"""


def pasada_mercadona(db):
    """Pasada 1: normaliza Mercadona por categorías"""
    print("\n📦 PASADA 1: Normalizando Mercadona por categorías...")
    
    categorias = db.query(Category).all()
    total_genericos = 0

    for cat in categorias:
        productos = db.query(SupermarketProduct).filter(
            SupermarketProduct.supermarket_id == 1,
            SupermarketProduct.product_id == None
        ).join(Product, isouter=True).filter(
            SupermarketProduct.raw_data['categoria'].astext == cat.name
        ).all()

        # Filtrar por categoría usando raw_data
        productos_cat = [
            sp for sp in db.query(SupermarketProduct).filter(
                SupermarketProduct.supermarket_id == 1,
                SupermarketProduct.product_id == None
            ).all()
            if sp.raw_data and sp.raw_data.get("categoria") == cat.name
        ]

        if not productos_cat:
            continue

        print(f"  📂 {cat.name}: {len(productos_cat)} productos")

        # Procesar en lotes de 50
        BATCH = 50
        for i in range(0, len(productos_cat), BATCH):
            batch = productos_cat[i:i+BATCH]
            
            productos_text = "\n".join([
                f"ID:{sp.id} | {sp.name_original} | {sp.price}€"
                for sp in batch
            ])

            try:
                message = client.messages.create(
                    model="claude-haiku-4-5-20251001",
                    max_tokens=3000,
                    messages=[{"role": "user", "content": f"Normaliza estos productos de Mercadona:\n\n{productos_text}"}],
                    system=SYSTEM_MERCADONA
                )

                response_text = message.content[0].text.strip()
                start = response_text.find('{')
                end = response_text.rfind('}') + 1
                data = json.loads(response_text[start:end])

                for generico in data.get("genericos", []):
                    nombre = generico.get("nombre_generico", "").strip()
                    ids = generico.get("ids_originales", [])
                    if not nombre or not ids:
                        continue

                    # Imagen del primer producto
                    primer = db.query(SupermarketProduct).filter(SupermarketProduct.id == ids[0]).first()
                    imagen = primer.raw_data.get("imagen") if primer and primer.raw_data else None

                    product = Product(name=nombre, category_id=cat.id, image_url=imagen)
                    db.add(product)
                    db.flush()

                    for sp_id in ids:
                        sp = db.query(SupermarketProduct).filter(SupermarketProduct.id == sp_id).first()
                        if sp:
                            sp.product_id = product.id
                            db.add(ProductMapping(
                                raw_name=sp.name_original,
                                product_id=product.id,
                                supermarket_id=1,
                                confidence=0.90,
                                mapped_by="llm"
                            ))
                    
                    total_genericos += 1

                db.commit()
                time.sleep(0.3)

            except Exception as e:
                print(f"    ❌ Error en lote: {e}")
                db.rollback()
                continue

    print(f"  ✅ Pasada 1 completada: {total_genericos} genéricos creados")
    return total_genericos


def pasada_dia(db):
    """Pasada 2: cruza DIA contra genéricos existentes"""
    print("\n🔄 PASADA 2: Cruzando DIA contra genéricos existentes...")

    productos_dia = db.query(SupermarketProduct).filter(
        SupermarketProduct.supermarket_id == 2,
        SupermarketProduct.product_id == None
    ).all()

    print(f"  📦 {len(productos_dia)} productos DIA a procesar")

    # Obtener todos los genéricos existentes
    genericos = db.query(Product).all()
    genericos_text = "\n".join([f"GEN_ID:{p.id} | {p.name}" for p in genericos])

    BATCH = 30
    nuevos = 0
    cruzados = 0

    for i in range(0, len(productos_dia), BATCH):
        batch = productos_dia[i:i+BATCH]
        batch_num = (i // BATCH) + 1
        total_batches = (len(productos_dia) + BATCH - 1) // BATCH

        print(f"  🔄 Lote {batch_num}/{total_batches}...")

        productos_text = "\n".join([
            f"ID:{sp.id} | {sp.name_original} | {sp.price}€"
            for sp in batch
        ])

        try:
            message = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=3000,
                messages=[{
                    "role": "user",
                    "content": f"Productos genéricos existentes:\n{genericos_text}\n\nProductos DIA a asignar:\n{productos_text}"
                }],
                system=SYSTEM_DIA
            )

            response_text = message.content[0].text.strip()
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            data = json.loads(response_text[start:end])

            for asignacion in data.get("asignaciones", []):
                id_dia = asignacion.get("id_dia")
                es_nuevo = asignacion.get("es_nuevo", False)

                sp = db.query(SupermarketProduct).filter(SupermarketProduct.id == id_dia).first()
                if not sp:
                    continue

                if not es_nuevo:
                    generico_id = asignacion.get("generico_id")
                    product = db.query(Product).filter(Product.id == generico_id).first()
                    if product:
                        sp.product_id = product.id
                        db.add(ProductMapping(
                            raw_name=sp.name_original,
                            product_id=product.id,
                            supermarket_id=2,
                            confidence=0.85,
                            mapped_by="llm"
                        ))
                        cruzados += 1
                else:
                    nombre_nuevo = asignacion.get("nombre_generico_nuevo", "").strip()
                    if nombre_nuevo:
                        imagen = sp.raw_data.get("imagen") if sp.raw_data else None
                        product = Product(name=nombre_nuevo, image_url=imagen)
                        db.add(product)
                        db.flush()
                        sp.product_id = product.id
                        db.add(ProductMapping(
                            raw_name=sp.name_original,
                            product_id=product.id,
                            supermarket_id=2,
                            confidence=0.85,
                            mapped_by="llm"
                        ))
                        genericos.append(product)
                        genericos_text += f"\nGEN_ID:{product.id} | {product.name}"
                        nuevos += 1

            db.commit()
            time.sleep(0.3)

        except Exception as e:
            print(f"    ❌ Error en lote {batch_num}: {e}")
            db.rollback()
            continue

    print(f"  ✅ Pasada 2 completada: {cruzados} cruzados, {nuevos} nuevos genéricos")


def normalize_all(test_mode=False):
    print("🤖 Iniciando normalización con Claude Haiku...")
    db = SessionLocal()

    try:
        if test_mode:
            print("🧪 MODO TEST: solo primera categoría")
            # Solo procesar primera categoría en test
            cat = db.query(Category).first()
            productos = [
                sp for sp in db.query(SupermarketProduct).filter(
                    SupermarketProduct.supermarket_id == 1
                ).limit(30).all()
            ]
            print(f"  Procesando {len(productos)} productos de prueba...")
        else:
            pasada_mercadona(db)
            pasada_dia(db)

        # Stats finales
        total_products = db.query(Product).count()
        total_mappings = db.query(ProductMapping).count()
        cruzados = db.query(SupermarketProduct).filter(SupermarketProduct.product_id != None).count()

        print(f"\n📊 RESULTADO FINAL:")
        print(f"  ✅ Productos genéricos: {total_products}")
        print(f"  ✅ Mappings creados: {total_mappings}")
        print(f"  ✅ Supermarket products cruzados: {cruzados}")
        print(f"🎉 Todo completado")

    except Exception as e:
        db.rollback()
        print(f"❌ Error general: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    test_mode = "--all" not in sys.argv
    if test_mode:
        print("💡 Modo TEST. Usa --all para procesar todos.")
    normalize_all(test_mode=test_mode)