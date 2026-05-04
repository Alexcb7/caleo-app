Despliegue con Docker

Requisitos previos
- Docker Desktop instalado y en marcha
  Descarga: https://www.docker.com/products/docker-desktop

Pasos

1. Clona el repositorio

   git clone https://github.com/alexcb777/caleo-app.git
   cd caleo-app

2. Crea el archivo de variables de entorno

   cp backend/.env.example backend/.env

   Abre backend/.env y rellena las credenciales necesarias:

   DATABASE_URL=postgresql://...
   JWT_SECRET=...

3. Levanta la aplicacion

   docker compose up -d

4. Accede en el navegador

   Frontend: http://localhost:3000
   API docs: http://localhost:8000/docs

Parar la aplicacion

   docker compose down

Imagen Docker

La imagen del frontend esta disponible publicamente en Docker Hub:

   docker pull alexcb777/caleo-frontend:v1
