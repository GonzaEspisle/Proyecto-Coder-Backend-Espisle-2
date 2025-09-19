import { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { CartManager } from '../managers/CartManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cm = new CartManager(path.join(__dirname, '..', 'data', 'carts.json'));

const router = Router();


router.post('/', async (req, res) => {
  try {
    const cart = await cm.createCart();
    res.status(201).json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:cid', async (req, res) => {
  try {
    const cart = await cm.getById(req.params.cid);
    res.json(cart.products);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});


router.post('/:cid/product/:pid', async (req, res) => {
  try {
    const qty = Number(req.body.quantity) || 1;
    const cart = await cm.addProduct(req.params.cid, req.params.pid, qty);
    res.json(cart);
  } catch (err) {
    const code = err.message.includes('no encontrado') ? 404 : 400;
    res.status(code).json({ error: err.message });
  }
});

export default router;
