# Dockerfile para Build
FROM node:18-bullseye

# Instala dependências do Linux necessárias para compilar Electron
# (Mesmo que o alvo seja Windows, o builder precisa de algumas libs)
RUN apt-get update && apt-get install -y \
    wine \
    zip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Comando padrão para buildar o app
CMD ["npm", "run", "build"]