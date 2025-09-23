import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProductManager } from '../managers/productmanager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pm = new ProductManager(path.join(__dirname, '..', 'data', 'products.json'));

const router = Router();


router.get('/', async (req, res) => {
  try {
    const products = await pm.getAll();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:pid', async (req, res) => {
  try {
    const product = await pm.getById(req.params.pid);
    res.json(product);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});


router.post('/', async (req, res) => {
  try {
    const product = await pm.create(req.body);
    
    req.app.locals.io.emit('products', await pm.getAll());
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


router.put('/:pid', async (req, res) => {
  try {
    const updated = await pm.updateById(req.params.pid, req.body);
    req.app.locals.io.emit('products', await pm.getAll());
    res.json(updated);
  } catch (err) {
    const code = err.message.includes('no encontrado') ? 404 : 400;
    res.status(code).json({ error: err.message });
  }
});


router.delete('/:pid', async (req, res) => {
  try {
    await pm.deleteById(req.params.pid);
    req.app.locals.io.emit('products', await pm.getAll());
    res.status(204).end();
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
