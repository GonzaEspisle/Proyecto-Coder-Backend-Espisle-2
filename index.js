import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";


import { default as productsRouter } from "./src/routes/products.router.js";
import { default as cartsRouter } from "./src/routes/carts.router.js";
import { default as viewsRouter } from "./src/routes/views.router.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
app.locals.io = io; 

const PORT = process.env.PORT || 8080;


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB Atlas"))
  .catch((err) => console.error("❌ Error al conectar a Mongo:", err));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));


app.engine("handlebars", engine({
    helpers: {
        
        eq: (v1, v2) => v1 === v2,
        
        multiply: (v1, v2) => v1 * v2,
    }
}));
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));


app.use("/api/products", productsRouter);
app.use("/api/carts", cartsRouter);
app.use("/", viewsRouter); 


io.on("connection", (socket) => {
  console.log("🟢 Cliente conectado vía Socket.IO");
  socket.on("disconnect", () => {
    console.log("🔴 Cliente desconectado");
  });
});


httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en http://localhost:${PORT}`);
});