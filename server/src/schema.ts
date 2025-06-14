
import { z } from 'zod';

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  base_price: z.number(),
  category: z.string(),
  image_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Product variation schema
export const productVariationSchema = z.object({
  id: z.number(),
  product_id: z.number(),
  size: z.string(),
  color: z.string(),
  price_adjustment: z.number(),
  stock_quantity: z.number().int(),
  sku: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ProductVariation = z.infer<typeof productVariationSchema>;

// Cart schema
export const cartSchema = z.object({
  id: z.number(),
  session_id: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Cart = z.infer<typeof cartSchema>;

// Cart item schema
export const cartItemSchema = z.object({
  id: z.number(),
  cart_id: z.number(),
  product_variation_id: z.number(),
  quantity: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CartItem = z.infer<typeof cartItemSchema>;

// Extended cart item with product and variation details
export const cartItemWithDetailsSchema = z.object({
  id: z.number(),
  cart_id: z.number(),
  product_variation_id: z.number(),
  quantity: z.number().int(),
  product: productSchema,
  variation: productVariationSchema,
  total_price: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CartItemWithDetails = z.infer<typeof cartItemWithDetailsSchema>;

// Product with variations schema
export const productWithVariationsSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  base_price: z.number(),
  category: z.string(),
  image_url: z.string().nullable(),
  variations: z.array(productVariationSchema),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ProductWithVariations = z.infer<typeof productWithVariationsSchema>;

// Input schemas
export const createProductInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  base_price: z.number().positive(),
  category: z.string(),
  image_url: z.string().nullable()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const createProductVariationInputSchema = z.object({
  product_id: z.number(),
  size: z.string(),
  color: z.string(),
  price_adjustment: z.number(),
  stock_quantity: z.number().int().nonnegative(),
  sku: z.string()
});

export type CreateProductVariationInput = z.infer<typeof createProductVariationInputSchema>;

export const addToCartInputSchema = z.object({
  session_id: z.string(),
  product_variation_id: z.number(),
  quantity: z.number().int().positive()
});

export type AddToCartInput = z.infer<typeof addToCartInputSchema>;

export const updateCartItemInputSchema = z.object({
  cart_item_id: z.number(),
  quantity: z.number().int().nonnegative()
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>;

export const removeFromCartInputSchema = z.object({
  cart_item_id: z.number()
});

export type RemoveFromCartInput = z.infer<typeof removeFromCartInputSchema>;

export const getCartInputSchema = z.object({
  session_id: z.string()
});

export type GetCartInput = z.infer<typeof getCartInputSchema>;

export const getProductInputSchema = z.object({
  id: z.number()
});

export type GetProductInput = z.infer<typeof getProductInputSchema>;

export const getProductsInputSchema = z.object({
  category: z.string().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional()
});

export type GetProductsInput = z.infer<typeof getProductsInputSchema>;
