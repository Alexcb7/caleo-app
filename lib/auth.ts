export async function login(email: string, password: string) {
  const res = await fetch("http://localhost:8000/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Error al iniciar sesión");
  }

  const data = await res.json();
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  document.cookie = `token=${data.token}; path=/; max-age=604800`;
  return data;
}

export async function register(name: string, email: string, password: string) {
  const res = await fetch("http://localhost:8000/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Error al registrarse");
  }

  const data = await res.json();
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify(data.user));
  document.cookie = `token=${data.token}; path=/; max-age=604800`;
  return data;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  document.cookie = "token=; path=/; max-age=0";
}

export function isAuthenticated() {
  return !!getToken();
}