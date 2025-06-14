
import { db } from '../db';
import { cartsTable, cartItemsTable, productsTable, productVariationsTable } from '../db/schema';
import { type AddToCartInput, type CartItemWithDetails } from '../schema';
import { eq, and } from 'drizzle-orm';

export const addToCart = async (input: AddToCartInput): Promise<CartItemWithDetails> => {
  try {
    // First, check if the product variation exists
    const variationResult = await db.select()
      .from(productVariationsTable)
      .where(eq(productVariationsTable.id, input.product_variation_id))
      .execute();

    if (variationResult.length === 0) {
      throw new Error('Product variation not found');
    }

    // Find or create cart for this session
    let cart = await db.select()
      .from(cartsTable)
      .where(eq(cartsTable.session_id, input.session_id))
      .execute();

    let cartId: number;
    if (cart.length === 0) {
      // Create new cart
      const newCart = await db.insert(cartsTable)
        .values({
          session_id: input.session_id
        })
        .returning()
        .execute();
      cartId = newCart[0].id;
    } else {
      cartId = cart[0].id;
    }

    // Check if item already exists in cart
    const existingItem = await db.select()
      .from(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.cart_id, cartId),
          eq(cartItemsTable.product_variation_id, input.product_variation_id)
        )
      )
      .execute();

    let cartItem;
    if (existingItem.length > 0) {
      // Update existing item quantity
      const updatedItems = await db.update(cartItemsTable)
        .set({
          quantity: existingItem[0].quantity + input.quantity,
          updated_at: new Date()
        })
        .where(eq(cartItemsTable.id, existingItem[0].id))
        .returning()
        .execute();
      cartItem = updatedItems[0];
    } else {
      // Create new cart item
      const newItems = await db.insert(cartItemsTable)
        .values({
          cart_id: cartId,
          product_variation_id: input.product_variation_id,
          quantity: input.quantity
        })
        .returning()
        .execute();
      cartItem = newItems[0];
    }

    // Get full cart item details with product and variation info
    const result = await db.select()
      .from(cartItemsTable)
      .innerJoin(productVariationsTable, eq(cartItemsTable.product_variation_id, productVariationsTable.id))
      .innerJoin(productsTable, eq(productVariationsTable.product_id, productsTable.id))
      .where(eq(cartItemsTable.id, cartItem.id))
      .execute();

    const itemData = result[0];
    const product = itemData.products;
    const variationData = itemData.product_variations;
    const cartItemInfo = itemData.cart_items;

    // Calculate total price (round to 2 decimal places to avoid floating point precision issues)
    const basePrice = parseFloat(product.base_price);
    const priceAdjustment = parseFloat(variationData.price_adjustment);
    const totalPrice = Math.round((basePrice + priceAdjustment) * cartItemInfo.quantity * 100) / 100;

    return {
      id: cartItemInfo.id,
      cart_id: cartItemInfo.cart_id,
      product_variation_id: cartItemInfo.product_variation_id,
      quantity: cartItemInfo.quantity,
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
        id: variationData.id,
        product_id: variationData.product_id,
        size: variationData.size,
        color: variationData.color,
        price_adjustment: priceAdjustment,
        stock_quantity: variationData.stock_quantity,
        sku: variationData.sku,
        created_at: variationData.created_at,
        updated_at: variationData.updated_at
      },
      total_price: totalPrice,
      created_at: cartItemInfo.created_at,
      updated_at: cartItemInfo.updated_at
    };
  } catch (error) {
    console.error('Add to cart failed:', error);
    throw error;
  }
};
