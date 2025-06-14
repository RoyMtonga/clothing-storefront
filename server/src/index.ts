
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

import { 
  createProductInputSchema,
  createProductVariationInputSchema,
  addToCartInputSchema,
  updateCartItemInputSchema,
  removeFromCartInputSchema,
  getCartInputSchema,
  getProductInputSchema,
  getProductsInputSchema
} from './schema';

import { createProduct } from './handlers/create_product';
import { createProductVariation } from './handlers/create_product_variation';
import { getProducts } from './handlers/get_products';
import { getProduct } from './handlers/get_product';
import { addToCart } from './handlers/add_to_cart';
import { getCart } from './handlers/get_cart';
import { updateCartItem } from './handlers/update_cart_item';
import { removeFromCart } from './handlers/remove_from_cart';
import { seedProducts } from './handlers/seed_products';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Product management
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),

  createProductVariation: publicProcedure
    .input(createProductVariationInputSchema)
    .mutation(({ input }) => createProductVariation(input)),

  getProducts: publicProcedure
    .input(getProductsInputSchema.optional())
    .query(({ input }) => getProducts(input)),

  getProduct: publicProcedure
    .input(getProductInputSchema)
    .query(({ input }) => getProduct(input)),

  // Cart management
  addToCart: publicProcedure
    .input(addToCartInputSchema)
    .mutation(({ input }) => addToCart(input)),

  getCart: publicProcedure
    .input(getCartInputSchema)
    .query(({ input }) => getCart(input)),

  updateCartItem: publicProcedure
    .input(updateCartItemInputSchema)
    .mutation(({ input }) => updateCartItem(input)),

  removeFromCart: publicProcedure
    .input(removeFromCartInputSchema)
    .mutation(({ input }) => removeFromCart(input)),

  // Data seeding
  seedProducts: publicProcedure
    .mutation(() => seedProducts()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
