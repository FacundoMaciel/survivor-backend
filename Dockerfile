FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Solo dependencias necesarias
RUN npm ci --only=production

COPY . .

# Compilamos TS a JS
RUN npm run build

EXPOSE 4300

CMD ["node", "dist/server.js"]