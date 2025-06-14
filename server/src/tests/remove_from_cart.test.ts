
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, productVariationsTable, cartsTable, cartItemsTable } from '../db/schema';
import { type RemoveFromCartInput } from '../schema';
import { removeFromCart } from '../handlers/remove_from_cart';
import { eq } from 'drizzle-orm';

describe('removeFromCart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove cart item successfully', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        base_price: '19.99',
        category: 'Electronics',
        image_url: null
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create test product variation
    const variationResult = await db.insert(productVariationsTable)
      .values({
        product_id: productId,
        size: 'M',
        color: 'Blue',
        price_adjustment: '0.00',
        stock_quantity: 50,
        sku: 'TEST-M-BLUE'
      })
      .returning()
      .execute();

    const variationId = variationResult[0].id;

    // Create test cart
    const cartResult = await db.insert(cartsTable)
      .values({
        session_id: 'test-session-123'
      })
      .returning()
      .execute();

    const cartId = cartResult[0].id;

    // Create test cart item
    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        cart_id: cartId,
        product_variation_id: variationId,
        quantity: 2
      })
      .returning()
      .execute();

    const cartItemId = cartItemResult[0].id;

    const input: RemoveFromCartInput = {
      cart_item_id: cartItemId
    };

    // Remove cart item
    const result = await removeFromCart(input);

    // Verify result
    expect(result.success).toBe(true);

    // Verify cart item was deleted from database
    const remainingItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItemId))
      .execute();

    expect(remainingItems).toHaveLength(0);
  });

  it('should return false for non-existent cart item', async () => {
    const input: RemoveFromCartInput = {
      cart_item_id: 99999 // Non-existent ID
    };

    const result = await removeFromCart(input);

    expect(result.success).toBe(false);
  });

  it('should not affect other cart items', async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        base_price: '19.99',
        category: 'Electronics',
        image_url: null
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create test product variation
    const variationResult = await db.insert(productVariationsTable)
      .values({
        product_id: productId,
        size: 'M',
        color: 'Blue',
        price_adjustment: '0.00',
        stock_quantity: 50,
        sku: 'TEST-M-BLUE'
      })
      .returning()
      .execute();

    const variationId = variationResult[0].id;

    // Create test cart
    const cartResult = await db.insert(cartsTable)
      .values({
        session_id: 'test-session-123'
      })
      .returning()
      .execute();

    const cartId = cartResult[0].id;

    // Create two cart items
    const cartItem1Result = await db.insert(cartItemsTable)
      .values({
        cart_id: cartId,
        product_variation_id: variationId,
        quantity: 2
      })
      .returning()
      .execute();

    const cartItem2Result = await db.insert(cartItemsTable)
      .values({
        cart_id: cartId,
        product_variation_id: variationId,
        quantity: 1
      })
      .returning()
      .execute();

    const cartItem1Id = cartItem1Result[0].id;
    const cartItem2Id = cartItem2Result[0].id;

    const input: RemoveFromCartInput = {
      cart_item_id: cartItem1Id
    };

    // Remove first cart item
    const result = await removeFromCart(input);

    expect(result.success).toBe(true);

    // Verify first item was deleted
    const deletedItem = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem1Id))
      .execute();

    expect(deletedItem).toHaveLength(0);

    // Verify second item still exists
    const remainingItem = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem2Id))
      .execute();

    expect(remainingItem).toHaveLength(1);
    expect(remainingItem[0].quantity).toBe(1);
  });
});
