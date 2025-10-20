import { Router } from 'express';
import { CartModel } from '../models/Cart.model.js';
import ProductModel from '../models/Product.model.js'; 

const router = Router();

const handleNotFoundError = (res, type, id) => {
    return res.status(404).json({ status: 'error', error: `${type} con ID ${id} no encontrado.` });
};


router.post('/', async (req, res) => {
    try {
        const cart = await CartModel.create({}); 
        res.status(201).json({ status: 'success', payload: cart });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});


router.get('/:cid', async (req, res) => {
    try {
        const cart = await CartModel.findById(req.params.cid)
            .populate('products.product') 
            .lean(); 

        if (!cart) return handleNotFoundError(res, 'Carrito', req.params.cid);

        res.json({ status: 'success', payload: cart });
    } catch (err) {
        res.status(400).json({ status: 'error', error: 'ID de carrito inválido o error en la consulta.' });
    }
});


router.post('/:cid/product/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    const qty = Number(req.body.quantity) || 1;

    try {
        const productExists = await ProductModel.findById(pid);
        if (!productExists) return handleNotFoundError(res, 'Producto', pid);

        let cart = await CartModel.findById(cid);
        if (!cart) return handleNotFoundError(res, 'Carrito', cid);

        const productIndex = cart.products.findIndex(p => p.product.toString() === pid);

        if (productIndex !== -1) {
            cart.products[productIndex].quantity += qty;
        } else {
            cart.products.push({ product: pid, quantity: qty });
        }

        await cart.save();
        
        const updatedCart = await CartModel.findById(cid).populate('products.product').lean();

        res.json({ status: 'success', payload: updatedCart });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});


router.delete('/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    try {
        const updatedCart = await CartModel.findByIdAndUpdate(
            cid,
            { $pull: { products: { product: pid } } }, 
            { new: true } 
        ).populate('products.product').lean();

        if (!updatedCart) return handleNotFoundError(res, 'Carrito', cid);

        res.json({ status: 'success', payload: updatedCart });
    } catch (err) {
        res.status(400).json({ status: 'error', error: 'ID de carrito o producto inválido.' });
    }
});


router.put('/:cid', async (req, res) => {
    const { cid } = req.params;
    const { products } = req.body; 

    if (!Array.isArray(products)) {
        return res.status(400).json({ status: 'error', error: 'El cuerpo debe contener un array de productos.' });
    }

    try {
        const updatedCart = await CartModel.findByIdAndUpdate(
            cid,
            { products: products }, 
            { new: true, runValidators: true } 
        ).populate('products.product').lean();

        if (!updatedCart) return handleNotFoundError(res, 'Carrito', cid);

        res.json({ status: 'success', payload: updatedCart });
    } catch (err) {
        res.status(400).json({ status: 'error', error: err.message });
    }
});


router.put('/:cid/products/:pid', async (req, res) => {
    const { cid, pid } = req.params;
    const { quantity } = req.body;

    if (typeof quantity !== 'number' || quantity < 1) {
        return res.status(400).json({ status: 'error', error: 'La cantidad debe ser un número mayor a cero.' });
    }

    try {
        const updatedCart = await CartModel.findOneAndUpdate(
            { _id: cid, 'products.product': pid }, 
            { $set: { 'products.$.quantity': quantity } }, 
            { new: true } 
        ).populate('products.product').lean();

        if (!updatedCart) {
            return res.status(440).json({ status: 'error', error: 'Carrito o Producto no encontrado en el carrito.' });
        }

        res.json({ status: 'success', payload: updatedCart });
    } catch (err) {
        res.status(400).json({ status: 'error', error: err.message });
    }
});


router.delete('/:cid', async (req, res) => {
    try {
        const updatedCart = await CartModel.findByIdAndUpdate(
            req.params.cid,
            { products: [] },
            { new: true }
        ).lean();

        if (!updatedCart) return handleNotFoundError(res, 'Carrito', req.params.cid);

        res.json({ status: 'success', payload: updatedCart });
    } catch (err) {
        res.status(400).json({ status: 'error', error: err.message });
    }
});

export default router;