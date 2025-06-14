
import { db } from '../db';
import { cartItemsTable, productVariationsTable, productsTable } from '../db/schema';
import { type UpdateCartItemInput, type CartItemWithDetails } from '../schema';
import { eq } from 'drizzle-orm';

export const updateCartItem = async (input: UpdateCartItemInput): Promise<CartItemWithDetails> => {
  try {
    // If quantity is 0, delete the cart item
    if (input.quantity === 0) {
      await db.delete(cartItemsTable)
        .where(eq(cartItemsTable.id, input.cart_item_id))
        .execute();
      
      throw new Error('Cart item removed');
    }

    // Update the cart item quantity
    const updatedCartItems = await db.update(cartItemsTable)
      .set({ 
        quantity: input.quantity,
        updated_at: new Date()
      })
      .where(eq(cartItemsTable.id, input.cart_item_id))
      .returning()
      .execute();

    if (updatedCartItems.length === 0) {
      throw new Error('Cart item not found');
    }

    // Get the updated cart item with product and variation details
    const result = await db.select()
      .from(cartItemsTable)
      .innerJoin(productVariationsTable, eq(cartItemsTable.product_variation_id, productVariationsTable.id))
      .innerJoin(productsTable, eq(productVariationsTable.product_id, productsTable.id))
      .where(eq(cartItemsTable.id, input.cart_item_id))
      .execute();

    if (result.length === 0) {
      throw new Error('Cart item not found after update');
    }

    const row = result[0];
    const cartItem = row.cart_items;
    const variation = row.product_variations;
    const product = row.products;

    // Calculate total price: (base_price + price_adjustment) * quantity
    // Use parseFloat and round to 2 decimal places to avoid floating point precision issues
    const basePrice = parseFloat(product.base_price);
    const priceAdjustment = parseFloat(variation.price_adjustment);
    const itemPrice = basePrice + priceAdjustment;
    const totalPrice = Math.round((itemPrice * cartItem.quantity) * 100) / 100;

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
  } catch (error) {
    console.error('Cart item update failed:', error);
    throw error;
  }
};
