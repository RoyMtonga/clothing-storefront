
import { db } from '../db';
import { cartsTable, cartItemsTable, productsTable, productVariationsTable } from '../db/schema';
import { type CartItemWithDetails, type GetCartInput } from '../schema';
import { eq } from 'drizzle-orm';

export const getCart = async (input: GetCartInput): Promise<CartItemWithDetails[]> => {
  try {
    // Get cart items with product and variation details
    const results = await db.select()
      .from(cartItemsTable)
      .innerJoin(cartsTable, eq(cartItemsTable.cart_id, cartsTable.id))
      .innerJoin(productVariationsTable, eq(cartItemsTable.product_variation_id, productVariationsTable.id))
      .innerJoin(productsTable, eq(productVariationsTable.product_id, productsTable.id))
      .where(eq(cartsTable.session_id, input.session_id))
      .execute();

    // Transform results to match CartItemWithDetails schema
    return results.map(result => {
      const cartItem = result.cart_items;
      const product = result.products;
      const variation = result.product_variations;

      // Calculate total price for this cart item
      const basePrice = parseFloat(product.base_price);
      const priceAdjustment = parseFloat(variation.price_adjustment);
      const finalPrice = basePrice + priceAdjustment;
      const totalPrice = finalPrice * cartItem.quantity;

      return {
        id: cartItem.id,
        cart_id: cartItem.cart_id,
        product_variation_id: cartItem.product_variation_id,
        quantity: cartItem.quantity,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          base_price: basePrice,
          category: product.category,
          image_url: product.image_url,
          created_at: product.created_at,
          updated_at: product.updated_at
        },
        variation: {
          id: variation.id,
          product_id: variation.product_id,
          size: variation.size,
          color: variation.color,
          price_adjustment: priceAdjustment,
          stock_quantity: variation.stock_quantity,
          sku: variation.sku,
          created_at: variation.created_at,
          updated_at: variation.updated_at
        },
        total_price: totalPrice,
        created_at: cartItem.created_at,
        updated_at: cartItem.updated_at
      };
    });
  } catch (error) {
    console.error('Get cart failed:', error);
    throw error;
  }
};
