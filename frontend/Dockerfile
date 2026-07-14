# frontend/Dockerfile
FROM node:20-alpine

# Configurar directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias en el contenedor
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto de Vite
EXPOSE 5173

# Comando para iniciar el servidor de desarrollo de Vite exponiendo el host
CMD ["npm", "run", "dev", "--", "--host"]
