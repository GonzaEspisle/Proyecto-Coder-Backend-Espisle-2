import express from 'express';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';

import productsRouter from './routes/products.router.js';
import cartsRouter from './routes/carts.router.js';
import { ProductManager } from './managers/ProductManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer);


app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/static', express.static(path.join(__dirname, '../public')));


app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));


app.locals.io = io;


app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);


app.get('/', async (req, res) => {
  const pm = new ProductManager(path.join(__dirname, 'data', 'products.json'));
  const products = await pm.getAll();
  return res.render('home', { products });
});

app.get('/realtimeproducts', async (req, res) => {
  return res.render('realTimeProducts');
});


io.on('connection', async (socket) => {
  const pm = new ProductManager(path.join(__dirname, 'data', 'products.json'));

  
  socket.emit('products', await pm.getAll());

  
  socket.on('createProduct', async (payload, ack) => {
    try {
      const created = await pm.create(payload);
      io.emit('products', await pm.getAll()); 
      ack && ack({ ok: true, product: created });
    } catch (err) {
      ack && ack({ ok: false, error: err.message });
    }
  });


  socket.on('deleteProduct', async (pid, ack) => {
    try {
      await pm.deleteById(pid);
      io.emit('products', await pm.getAll()); 
      ack && ack({ ok: true });
    } catch (err) {
      ack && ack({ ok: false, error: err.message });
    }
  });
});

const PORT = process.env.PORT || 8080;
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

