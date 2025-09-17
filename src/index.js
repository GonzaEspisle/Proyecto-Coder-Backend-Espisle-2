import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Handlebars config
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, '../views'));

// Rutas
app.get('/', (req, res) => {
  res.render('home', { title: 'Home', products: [] });
});

app.get('/realtimeproducts', (req, res) => {
  res.render('realTimeProducts', { title: 'Real Time Products' });
});

// Websocket
io.on('connection', (socket) => {
  console.log('Cliente conectado');
  socket.on('new-product', (data) => {
    io.emit('update-products', data);
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
