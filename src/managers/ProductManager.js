import { promises as fs } from 'fs';
import { nanoid } from 'nanoid';
import path from 'path';

export class ProductManager {
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

  async getAll() {
    return this.#read();
  }

  async getById(id) {
    const data = await this.#read();
    const found = data.find(p => p.id === id);
    if (!found) throw new Error('Producto no encontrado');
    return found;
  }

  async create({ title, description, code, price, status = true, stock, category, thumbnails = [] }) {
    if (!title || !description || !code || price == null || stock == null || !category) {
      throw new Error('Campos obligatorios faltantes');
    }
    const data = await this.#read();
    if (data.some(p => p.code === code)) {
      throw new Error('El código ya existe');
    }
    const product = {
      id: nanoid(8),
      title,
      description,
      code,
      price: Number(price),
      status: Boolean(status),
      stock: Number(stock),
      category,
      thumbnails: Array.isArray(thumbnails) ? thumbnails : []
    };
    data.push(product);
    await this.#write(data);
    return product;
  }

  async updateById(id, updates) {
    const data = await this.#read();
    const idx = data.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Producto no encontrado');
    const { id: _ignore, ...rest } = updates; // impedir editar id
    data[idx] = { ...data[idx], ...rest };
    await this.#write(data);
    return data[idx];
  }

  async deleteById(id) {
    const data = await this.#read();
    const newData = data.filter(p => p.id !== id);
    if (newData.length === data.length) throw new Error('Producto no encontrado');
    await this.#write(newData);
  }
}
