# Caleo — Comparador de precios de supermercado

> Compara precios entre Mercadona y DIA, gestiona tu lista de la compra y controla tu presupuesto, todo en un solo lugar.

🌐 **Demo en vivo:** [caleo-app-jet.vercel.app](https://caleo-app-jet.vercel.app)  
🐳 **Imagen Docker:** `docker pull alexcb777/caleo-frontend:v1`

---

## Índice

- [Stack tecnológico](#stack-tecnológico)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos previos](#requisitos-previos)
- [Instalación y desarrollo local](#instalación-y-desarrollo-local)
  - [Backend (FastAPI)](#backend-fastapi)
  - [Frontend (Next.js)](#frontend-nextjs)
- [Variables de entorno](#variables-de-entorno)
- [Despliegue con Docker Compose](#despliegue-con-docker-compose)
- [Base de datos](#base-de-datos)
  - [Schema](#schema)
  - [Cargar datos de productos](#cargar-datos-de-productos)
- [Despliegue en producción](#despliegue-en-producción)

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Shadcn/ui, Lucide Icons |
| Backend | FastAPI, Python 3.11, Uvicorn |
| Base de datos | PostgreSQL (Supabase en producción) |
| Autenticación | JWT |
| Normalización de productos | Claude Haiku (Anthropic API) |
| Contenedores | Docker, Docker Compose |
| Despliegue frontend | Vercel |
| Despliegue backend | Render |

---

## Estructura del proyecto

```
caleo-app/
├── app/                        # Rutas y páginas Next.js (App Router)
│   ├── layout.tsx
│   ├── page.tsx
│   └── ...
├── components/                 # Componentes React reutilizables
├── hooks/                      # Custom hooks
├── lib/                        # Utilidades y configuración
├── public/                     # Assets estáticos
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── products.py     # Endpoints de productos
│   │   │   └── comparador.py   # Endpoint de comparación de precios
│   │   └── main.py
│   ├── scripts/
│   │   ├── load_mercadona.py   # Carga productos Mercadona desde Excel
│   │   ├── load_dia.py         # Carga productos DIA desde Excel
│   │   ├── cross_dia.py        # Cross-referencing entre supermercados
│   │   └── normalize_products.py # Normalización con Claude Haiku
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env.example
│   └── .python-version         # Fija Python 3.11.9
├── schema.sql                  # Schema completo de la base de datos
├── docker-compose.yaml
├── dockerfile                  # Dockerfile del frontend
└── README.md
```

---

## Requisitos previos

- [Node.js](https://nodejs.org/) 18 o superior
- [Python](https://www.python.org/) 3.11.x
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (para despliegue con Docker)
- Una base de datos PostgreSQL (local o en [Supabase](https://supabase.com))

---

## Instalación y desarrollo local

### Backend (FastAPI)

```bash
# 1. Entra en la carpeta del backend
cd backend

# 2. Crea y activa el entorno virtual
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Instala las dependencias
pip install -r requirements.txt

# 4. Copia y configura las variables de entorno
cp .env.example .env
# Edita .env con tus credenciales (ver sección Variables de entorno)

# 5. Arranca el servidor de desarrollo
uvicorn app.main:app --reload --port 8000
```

La API estará disponible en `http://localhost:8000`  
Documentación interactiva (Swagger): `http://localhost:8000/docs`

---

### Frontend (Next.js)

```bash
# 1. Desde la raíz del proyecto, instala dependencias
npm install

# 2. Copia y configura las variables de entorno
cp .env.example .env.local
# Edita .env.local con tus valores

# 3. Arranca el servidor de desarrollo
npm run dev
```

El frontend estará disponible en `http://localhost:3000`

---

## Variables de entorno

### Backend — `backend/.env`

Copia `backend/.env.example` y rellena los valores:

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://usuario:contraseña@host:5432/caleo

# Autenticación JWT
JWT_SECRET=tu_clave_secreta_muy_larga_y_segura

# Anthropic (para normalización de productos con Claude Haiku)
ANTHROPIC_API_KEY=sk-ant-...
```

### Frontend — `.env.local`

```env
# URL del backend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Supabase (si se usa el cliente JS de Supabase en el frontend)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## Despliegue con Docker Compose

Esta es la forma más rápida de levantar toda la aplicación localmente sin instalar dependencias manualmente.

### Requisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado y en marcha

### Pasos

```bash
# 1. Clona el repositorio
git clone https://github.com/Alexcb7/caleo-app.git
cd caleo-app

# 2. Configura las variables de entorno del backend
cp backend/.env.example backend/.env
# Edita backend/.env con tus credenciales de base de datos y API keys

# 3. Levanta todos los servicios
docker compose up -d

# 4. Comprueba que los contenedores están en marcha
docker compose ps
```

Una vez arriba:

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| Swagger docs | http://localhost:8000/docs |

```bash
# Ver logs en tiempo real
docker compose logs -f

# Parar todos los servicios
docker compose down
```

### Servicios definidos en docker-compose.yaml

```yaml
services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env

  frontend:
    image: alexcb777/caleo-frontend:v1
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
    depends_on:
      - backend
```

---

## Base de datos

### Schema

El archivo `schema.sql` en la raíz del repositorio contiene la definición completa de todas las tablas. Para aplicarlo sobre una base de datos PostgreSQL nueva:

**Opción A — con psql:**
```bash
psql -U postgres -d caleo -f schema.sql
```

**Opción B — desde Supabase SQL Editor:**

1. Ve a tu proyecto en [supabase.com](https://supabase.com)
2. Entra en **SQL Editor**
3. Copia y pega el contenido de `schema.sql`
4. Ejecuta

El schema crea las siguientes tablas:

| Tabla | Descripción |
|---|---|
| `users` | Usuarios registrados |
| `categories` | Categorías de productos (con jerarquía) |
| `supermarkets` | Supermercados disponibles (Mercadona, DIA) |
| `products` | Catálogo de productos normalizados |
| `supermarket_products` | Precios por producto y supermercado |
| `price_history` | Historial de precios |
| `product_mappings` | Mapeos de nombres originales a productos normalizados |
| `shopping_lists` | Listas de la compra de los usuarios |
| `shopping_list_items` | Ítems dentro de cada lista |
| `purchases` | Compras realizadas |
| `purchase_items` | Productos de cada compra |
| `user_budgets` | Presupuestos definidos por el usuario |
| `llm_conversations` | Historial de conversaciones con el asistente IA |

También inserta automáticamente los dos supermercados iniciales (Mercadona y DIA).

---

### Cargar datos de productos

Los scripts de carga se encuentran en `backend/scripts/`. Requieren los archivos Excel de datos fuente (no incluidos en el repositorio por su tamaño).

```bash
cd backend

# Activa el entorno virtual si no lo está
source venv/bin/activate  # o venv\Scripts\activate en Windows

# 1. Carga productos de Mercadona (~4.000 productos)
python scripts/load_mercadona.py

# 2. Carga productos de DIA (~3.500 productos)
python scripts/load_dia.py

# 3. Cross-referencing entre supermercados (SequenceMatcher, 96.5% match rate)
python scripts/cross_dia.py

# 4. Normalización de nombres con Claude Haiku (requiere ANTHROPIC_API_KEY)
python scripts/normalize_products.py
```

> **Nota:** Los scripts de normalización consumen tokens de la API de Anthropic. Asegúrate de tener saldo suficiente en tu cuenta antes de ejecutarlos sobre el catálogo completo.

---

## Despliegue en producción

La aplicación está desplegada con el siguiente stack:

| Componente | Plataforma | URL |
|---|---|---|
| Frontend | Vercel | [caleo-app-jet.vercel.app](https://caleo-app-jet.vercel.app) |
| Backend | Render | https://caleo-app-1.onrender.com |
| Base de datos | Supabase | PostgreSQL gestionado |

### Frontend en Vercel

1. Conecta el repositorio en [vercel.com](https://vercel.com)
2. Establece **Root Directory** → `./` (raíz del repo)
3. Añade las variables de entorno del frontend en el panel de Vercel
4. Despliega

### Backend en Render

1. Conecta el repositorio en [render.com](https://render.com)
2. Tipo de servicio: **Web Service**
3. Root Directory: `backend`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Añade las variables de entorno del backend en el panel de Render
7. Despliega

---
