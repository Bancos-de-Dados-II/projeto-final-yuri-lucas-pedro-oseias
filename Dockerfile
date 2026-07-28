# Dockerfile para Deploy da API GeoPB Comunidades em Nuvem (Render / Railway)
FROM node:22-alpine

WORKDIR /app

# Copia dependências e instala
COPY package*.json ./
RUN npm ci --only=production || npm install

# Copia código fonte
COPY . .

# Expõe a porta dinâmica ou padrão 3333
EXPOSE 3333

ENV NODE_ENV=production
ENV PORT=3333

# Comando de inicialização da API
CMD ["npm", "start"]
