# ── Etapa 1: Construcción ──────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos solo los archivos de dependencias primero
# (así Docker cachea esta capa y no reinstala si no cambia package.json)
COPY package*.json ./
RUN npm install

# Copiamos el resto del código y construimos
COPY . .
RUN npm run build

# ── Etapa 2: Producción ────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copiamos solo lo necesario para ejecutar la app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]