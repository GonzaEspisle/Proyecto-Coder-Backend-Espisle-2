// src/routes/views.router.js
import { Router } from "express";
import ProductModel from "../models/Product.model.js"; 
import { CartModel } from "../models/Cart.model.js";

const router = Router();

// RUTA RAÍZ: Redirige al listado de productos
router.get("/", (req, res) => {
    res.redirect("/products");
});

// ----------------------------------------------------------------------------------
// 1. VISTA DE PRODUCTOS (CON PAGINACIÓN)
// ----------------------------------------------------------------------------------

router.get("/products", async (req, res) => {
    try {
        const { limit = 10, page = 1, sort, query } = req.query;

        let filter = {};
        if (query) {
            const isStatusQuery = query === 'true' || query === 'false';
            filter = isStatusQuery ? { status: query === 'true' } : { category: query };
        }

        let sortOption = {};
        if (sort === 'asc') sortOption.price = 1;
        if (sort === 'desc') sortOption.price = -1;

        const result = await ProductModel.paginate(filter, {
            limit: parseInt(limit),
            page: parseInt(page),
            sort: sortOption,
            lean: true 
        });

        const buildLink = (p) => {
            if (!p) return null;
            const newParams = new URLSearchParams(req.query);
            newParams.set('page', p);
            return `/products?${newParams.toString()}`;
        };

        res.render("home", {
            products: result.docs,
            page: result.page,
            totalPages: result.totalPages,
            hasPrevPage: result.hasPrevPage,
            hasNextPage: result.hasNextPage,
            prevLink: buildLink(result.prevPage),
            nextLink: buildLink(result.nextPage),
            currentLimit: limit,
            currentSort: sort,
            currentQuery: query
        });
    } catch (error) {
        console.error("Error al cargar la vista de productos:", error);
        res.status(500).send("Error interno del servidor");
    }
});

// VISTA DE DETALLE DE PRODUCTO
router.get("/products/:pid", async (req, res) => {
    try {
        const product = await ProductModel.findById(req.params.pid).lean();
        if (!product) {
            return res.status(404).render("error", { message: "Producto no encontrado." });
        }
        res.render("productDetail", { product });
    } catch (error) {
        res.status(400).render("error", { message: "ID de producto inválido." });
    }
});


// ----------------------------------------------------------------------------------
// 2. VISTA DE CARRITO (CON POPULATE)
// ----------------------------------------------------------------------------------

router.get("/carts/:cid", async (req, res) => {
    const { cid } = req.params;
    try {
        const cart = await CartModel.findById(cid)
            .populate('products.product') 
            .lean();
        
        if (!cart) {
            return res.status(404).render("error", { message: `Carrito con ID ${cid} no encontrado.` });
        }
        
        res.render("cart", { 
            cart,
            products: cart.products 
        });
    } catch (error) {
        res.status(400).render("error", { message: "ID de carrito inválido o error al cargar el carrito." });
    }
});

export default router;