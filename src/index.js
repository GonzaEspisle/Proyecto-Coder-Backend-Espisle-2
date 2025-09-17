import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// --- Handlebars config ---
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "../views"));

// --- Productos en memoria ---
let products = [];

// --- Rutas ---
app.get("/", (req, res) => {
  res.render("home", { products });
});

app.get("/realtimeproducts", (req, res) => {
  res.render("realTimeProducts", { products });
});

// --- API para productos ---
app.post("/api/products", (req, res) => {
  const { title, price } = req.body;
  if (!title || !price) {
    return res.status(400).send("Faltan campos");
  }

  const newProduct = {
    id: products.length + 1,
    title,
    price,
  };
  products.push(newProduct);

  // Emitir a todos los clientes conectados
  io.emit("updateProducts", products);

  res.status(201).send(newProduct);
});

app.delete("/api/products/:id", (req, res) => {
  const { id } = req.params;
  products = products.filter((p) => p.id != id);

  io.emit("updateProducts", products);

  res.status(200).send({ message: "Producto eliminado" });
});

// --- WebSockets ---
io.on("connection", (socket) => {
  conso
