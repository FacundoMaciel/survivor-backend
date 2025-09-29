FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# instalamos todo (incluye devDependencies para que exista tsc)
RUN npm install

COPY . .

# compilamos TS -> JS
RUN npm run build

EXPOSE 4300

CMD ["node", "dist/server.js"]
