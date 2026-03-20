const API_URL = "http://localhost:8000";

export async function searchProducts(q: string, category_id?: number) {
  const url = category_id
    ? `${API_URL}/products/search?q=${q}&category_id=${category_id}`
    : `${API_URL}/products/search?q=${q}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Error buscando productos");
  return await res.json();
}

export async function getCategories() {
  const res = await fetch(`${API_URL}/products/categories`);
  if (!res.ok) throw new Error("Error obteniendo categorías");
  return await res.json();
}

export async function getProduct(id: number) {
  const res = await fetch(`${API_URL}/products/${id}`);
  if (!res.ok) throw new Error("Error obteniendo producto");
  return await res.json();
}

export async function compareProducts(items: any[], supermarket_ids: number[] = []) {
  const res = await fetch(`${API_URL}/comparador/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items, supermarket_ids }),
  });
  if (!res.ok) throw new Error("Error en el comparador");
  return await res.json();
}