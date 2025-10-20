import { Router } from 'express';
import ProductModel from '../models/Product.model.js';

const router = Router();

/**
 * GET /api/products
 * Implementa paginación, filtros (query), y ordenamiento (sort).
 */
router.get('/', async (req, res) => {
    try {
        const { limit = 10, page = 1, sort, query } = req.query;

        // 1. Construir el Filtro Dinámico
        let filter = {};
        if (query) {
            const isStatusQuery = query === 'true' || query === 'false';
            
            if (isStatusQuery) {
                filter.status = query === 'true'; 
            } else {
                filter.category = query; 
            }
        }

        // 2. Construir la Opción de Ordenamiento
        let sortOption = {};
        if (sort === 'asc') sortOption.price = 1;
        if (sort === 'desc') sortOption.price = -1;

        // 3. Ejecutar la Paginate
        const result = await ProductModel.paginate(filter, {
            limit: parseInt(limit),
            page: parseInt(page),
            sort: sortOption,
            lean: true 
        });

        // 4. Función para Construir los Links (Preservando query params)
        const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
        const buildLink = (p) => {
            if (!p) return null;
            const newParams = new URLSearchParams(req.query);
            newParams.set('page', p);
            return `${baseUrl}?${newParams.toString()}`;
        };

        // 5. Retornar el Formato Solicitado
        res.json({
            status: result.docs.length > 0 ? 'success' : 'error',
            payload: result.docs,
            totalPages: result.totalPages,
            prevPage: result.prevPage,
            nextPage: result.nextPage,
            page: result.page,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: buildLink(result.prevPage), 
            nextLink: buildLink(result.nextPage) 
        });

    } catch (err) {
        console.error('❌ Error al obtener productos:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// GET /api/products/:pid
router.get('/:pid', async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.pid).lean();
        if (!product) {
            return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
        }
        res.json(product);
    } catch (err) {
        res.status(400).json({ status: 'error', error: err.message });
    }
});

// POST /api/products
router.post('/', async (req, res) => {
    try {
        const product = await ProductModel.create(req.body);
        res.status(201).json(product);
    } catch (err) {
        res.status(400).json({ status: 'error', error: err.message });
    }
});

// PUT /api/products/:pid
router.put('/:pid', async (req, res) => {
    try {
        const updated = await ProductModel.findByIdAndUpdate(req.params.pid, req.body, { new: true });
        if (!updated) return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ status: 'error', error: err.message });
    }
});

// DELETE /api/products/:pid
router.delete('/:pid', async (req, res) => {
    try {
        const deleted = await ProductModel.findByIdAndDelete(req.params.pid);
        if (!deleted) return res.status(404).json({ status: 'error', error: 'Producto no encontrado' });
        res.status(204).end();
    } catch (err) {
        res.status(400).json({ status: 'error', error: err.message });
    }
});

export default router;