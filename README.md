# 🏆 Survivor Backend

Backend para el juego **Survivor/Penka** desarrollado en **Node.js + Express + MongoDB** con **TypeScript**.  
Permite gestionar torneos, partidos, predicciones y rankings de jugadores.  
Incluye documentación automática con **Swagger**.

---

## 🚀 Stack Tecnológico

- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/)  
- [MongoDB](https://www.mongodb.com/) (con soporte Docker)  
- [Mongoose](https://mongoosejs.com/) (ODM)  
- [TypeScript](https://www.typescriptlang.org/)  
- [Swagger](https://swagger.io/) (API docs)  
- [Docker Compose](https://docs.docker.com/compose/) (para levantar entorno local)

---

## 📦 Modelos principales

### Survivor
```ts
{
  name: string;
  competition: [{ jornada: number; matches: IMatch[] }];
  startDate: Date;
  lives: number;
  finished?: boolean;
  survivorResults?: any;
}
```

### GambleSurvivor
```ts
{
  userId: string;
  survivorId: ObjectId;
  joinedAt: Date;
  lives: number;
  eliminated: boolean;
}
```

### PredictionSurvivor
```ts
{
  userId: string;
  survivorId: ObjectId;
  predictions: [{ matchId: string; teamId: string; result: "success" | "fail" | "pending" }];
  createdAt: Date;
}
```

---

## ⚙️ Levantar entorno local con Docker

### Requisitos previos
- Tener instalado **Docker Desktop**
- Clonar este repositorio

### Comandos
```bash
# Levantar backend + MongoDB
docker compose up

# Detener contenedores
docker compose down
```

Esto levantará:
- API backend en [http://localhost:4300](http://localhost:4300)  
- MongoDB en `mongodb://localhost:27017/survivor`

> ⚠️ Mientras tengas Docker Desktop abierto, el backend funcionará.

---

## 🔥 Levantar sin Docker (alternativa)

```bash
# Instalar dependencias
npm install

# Levantar en modo desarrollo
npm run dev:watch

# Compilar + ejecutar
npm start
```

> Se conecta a la URI configurada en `.env` (`MONGO_URI`).

---

## 📖 Documentación API

La documentación Swagger está disponible en:  
👉 [http://localhost:4300/api-docs](http://localhost:4300/api-docs)

### Endpoints principales

- `POST /api/survivor/join` → unirse a un survivor  
- `POST /api/survivor/pick` → seleccionar un equipo  
- `POST /api/survivor/simulate` → simular partidos  
- `GET /api/survivor/ranking/:id` → ver ranking de un survivor  

Cada endpoint está documentado en Swagger con request/response.

---

## 📂 Estructura del proyecto

```
survivor-backend/
│── models/              # Modelos Mongoose
│── routes/              # Rutas Express (API REST)
│── seeds/               # Seeds iniciales
│── server.ts            # Punto de entrada
│── docker-compose.yml   # Configuración Docker
│── package.json
│── tsconfig.json
└── README.md
```

---

## 🚀 Deploy

- Configurar variable de entorno `MONGO_URI` en el servidor de producción.  
- Ejecutar:

```bash
npm install
npm run build
npm start
```

- Asegurarse de exponer el puerto `4300` o configurarlo con `PORT`.

---

## 👨‍💻 Autores
Facundo Maciel
Proyecto desarrollado para **gestión de Survivor/Penka** con frontend en Flutter.  
Incluye backend escalable con API REST y documentación interactiva.

---
