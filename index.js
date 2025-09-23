import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { engine } from "express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import ProductManager from "./managers/ProductManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../public")));


app.engine("handlebars", engine());
app.set("view engine", "handlebars");
app.set("views", path.join(__dirname, "views"));



const productsFile = path.join(__dirname, "./data/products.json");
const pm = new ProductManager(productsFile);


let products = [];
(async () => {
  products = await pm.getAll();
})();


app.get("/", async (req, res) => {
  products = await pm.getAll();
  res.render("home", { products });
});

app.get("/realtimeproducts", async (req, res) => {
  products = await pm.getAll();
  res.render("realTimeProducts", { products });
});


app.post("/api/products", async (req, res) => {
  try {
    const { title, price } = req.body;
    if (!title || !price) return res.status(400).json({ error: "Faltan campos" });

    const newProduct = await pm.add({ title, price });
    products = await pm.getAll();

   
    io.emit("updateProducts", products);

    return res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});


app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pm.deleteById(id);
    products = await pm.getAll();
    io.emit("updateProducts", products);
    res.json({ message: "Producto eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno" });
  }
});


io.on("connection", (socket) => {
  console.log("Un cliente se ha conectado");
  socket.emit("updateProducts", products);

  socket.on("disconnect", () => {
    console.log("Un cliente se ha desconectado");
  });
});


const PORT = 8080;
httpServer.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
