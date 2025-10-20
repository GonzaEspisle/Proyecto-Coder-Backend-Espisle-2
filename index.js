import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Importaciones robustas para evitar errores de módulos
import { default as productsRouter } from "./src/routes/products.router.js";
import { default as cartsRouter } from "./src/routes/carts.router.js";
import { default as viewsRouter } from "./src/routes/views.router.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
app.locals.io = io; // Compartir IO con routers

const PORT = process.env.PORT || 8080;

// 📌 Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error al conectar a Mongo:", err));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Handlebars con Helpers (CRÍTICO para filtros y subtotales)
app.engine("handlebars", engine({
    helpers: {
        // Helper 'eq' para comparación de strings en home.handlebars
        eq: (v1, v2) => v1 === v2,
        // Helper 'multiply' para subtotal en cart.handlebars
        multiply: (v1, v2) => v1 * v2,
    }
}));
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));

// Routers
app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/", viewsRouter); // Routers de vistas

// WebSockets
io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado vía Socket.IO");
  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado");
  });
});

// Levantar servidor
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});