// src/managers/ProductManager.js
import fs from 'fs/promises';

export default class ProductManager {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async #readFile() {
    try {
      const content = await fs.readFile(this.filePath, 'utf8');
      return JSON.parse(content || '[]');
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }

  async #writeFile(data) {
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }

  async getAll() {
    return await this.#readFile();
  }

  async add(product) {
    const list = await this.#readFile();
    const newProduct = { id: Date.now().toString(), ...product };
    list.push(newProduct);
    await this.#writeFile(list);
    return newProduct;
  }

  async deleteById(id) {
    const list = await this.#readFile();
    const newList = list.filter(p => p.id !== id);
    await this.#writeFile(newList);
    return newList;
  }
}
