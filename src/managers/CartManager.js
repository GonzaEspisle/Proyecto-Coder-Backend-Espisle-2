import { promises as fs } from 'fs';
import { nanoid } from 'nanoid';
import path from 'path';

export class CartManager {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async #read() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(raw || '[]');
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }

  async #write(data) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async createCart() {
    const carts = await this.#read();
    const cart = { id: nanoid(8), products: [] };
    carts.push(cart);
    await this.#write(carts);
    return cart;
  }

  async getById(cid) {
    const carts = await this.#read();
    const cart = carts.find(c => c.id === cid);
    if (!cart) throw new Error('Carrito no encontrado');
    return cart;
  }

  async addProduct(cid, pid, quantity = 1) {
    const carts = await this.#read();
    const idx = carts.findIndex(c => c.id === cid);
    if (idx === -1) throw new Error('Carrito no encontrado');

    const cart = carts[idx];
    const item = cart.products.find(p => p.product === pid);
    if (item) {
      item.quantity += Number(quantity) || 1;
    } else {
      cart.products.push({ product: pid, quantity: Number(quantity) || 1 });
    }
    carts[idx] = cart;
    await this.#write(carts);
    return cart;
  }
}
