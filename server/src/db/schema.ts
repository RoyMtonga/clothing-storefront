
import { serial, text, pgTable, timestamp, numeric, integer, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  base_price: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  image_url: text('image_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const productVariationsTable = pgTable('product_variations', {
  id: serial('id').primaryKey(),
  product_id: integer('product_id').notNull(),
  size: varchar('size', { length: 20 }).notNull(),
  color: varchar('color', { length: 50 }).notNull(),
  price_adjustment: numeric('price_adjustment', { precision: 10, scale: 2 }).notNull().default('0'),
  stock_quantity: integer('stock_quantity').notNull().default(0),
  sku: varchar('sku', { length: 100 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const cartsTable = pgTable('carts', {
  id: serial('id').primaryKey(),
  session_id: varchar('session_id', { length: 255 }).notNull().unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const cartItemsTable = pgTable('cart_items', {
  id: serial('id').primaryKey(),
  cart_id: integer('cart_id').notNull(),
  product_variation_id: integer('product_variation_id').notNull(),
  quantity: integer('quantity').notNull().default(1),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const productsRelations = relations(productsTable, ({ many }) => ({
  variations: many(productVariationsTable),
}));

export const productVariationsRelations = relations(productVariationsTable, ({ one, many }) => ({
  product: one(productsTable, {
    fields: [productVariationsTable.product_id],
    references: [productsTable.id],
  }),
  cartItems: many(cartItemsTable),
}));

export const cartsRelations = relations(cartsTable, ({ many }) => ({
  items: many(cartItemsTable),
}));

export const cartItemsRelations = relations(cartItemsTable, ({ one }) => ({
  cart: one(cartsTable, {
    fields: [cartItemsTable.cart_id],
    references: [cartsTable.id],
  }),
  productVariation: one(productVariationsTable, {
    fields: [cartItemsTable.product_variation_id],
    references: [productVariationsTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Product = typeof productsTable.$inferSelect;
export type NewProduct = typeof productsTable.$inferInsert;
export type ProductVariation = typeof productVariationsTable.$inferSelect;
export type NewProductVariation = typeof productVariationsTable.$inferInsert;
export type Cart = typeof cartsTable.$inferSelect;
export type NewCart = typeof cartsTable.$inferInsert;
export type CartItem = typeof cartItemsTable.$inferSelect;
export type NewCartItem = typeof cartItemsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  products: productsTable,
  productVariations: productVariationsTable,
  carts: cartsTable,
  cartItems: cartItemsTable
};
