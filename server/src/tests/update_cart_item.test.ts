
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, productVariationsTable, cartsTable, cartItemsTable } from '../db/schema';
import { type UpdateCartItemInput } from '../schema';
import { updateCartItem } from '../handlers/update_cart_item';
import { eq } from 'drizzle-orm';

describe('updateCartItem', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testCartItemId: number;
  let testCartId: number;
  let testProductId: number;
  let testVariationId: number;

  beforeEach(async () => {
    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        base_price: '29.99',
        category: 'Electronics',
        image_url: 'test-image.jpg'
      })
      .returning()
      .execute();
    testProductId = productResult[0].id;

    // Create test variation
    const variationResult = await db.insert(productVariationsTable)
      .values({
        product_id: testProductId,
        size: 'M',
        color: 'Blue',
        price_adjustment: '5.00',
        stock_quantity: 50,
        sku: 'TEST-M-BLUE'
      })
      .returning()
      .execute();
    testVariationId = variationResult[0].id;

    // Create test cart
    const cartResult = await db.insert(cartsTable)
      .values({
        session_id: 'test-session-123'
      })
      .returning()
      .execute();
    testCartId = cartResult[0].id;

    // Create test cart item
    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        cart_id: testCartId,
        product_variation_id: testVariationId,
        quantity: 2
      })
      .returning()
      .execute();
    testCartItemId = cartItemResult[0].id;
  });

  it('should update cart item quantity', async () => {
    const input: UpdateCartItemInput = {
      cart_item_id: testCartItemId,
      quantity: 5
    };

    const result = await updateCartItem(input);

    expect(result.id).toEqual(testCartItemId);
    expect(result.quantity).toEqual(5);
    expect(result.cart_id).toEqual(testCartId);
    expect(result.product_variation_id).toEqual(testVariationId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should return complete cart item with product and variation details', async () => {
    const input: UpdateCartItemInput = {
      cart_item_id: testCartItemId,
      quantity: 3
    };

    const result = await updateCartItem(input);

    // Check product details
    expect(result.product.id).toEqual(testProductId);
    expect(result.product.name).toEqual('Test Product');
    expect(result.product.base_price).toEqual(29.99);
    expect(result.product.category).toEqual('Electronics');

    // Check variation details
    expect(result.variation.id).toEqual(testVariationId);
    expect(result.variation.size).toEqual('M');
    expect(result.variation.color).toEqual('Blue');
    expect(result.variation.price_adjustment).toEqual(5.00);
    expect(result.variation.stock_quantity).toEqual(50);

    // Check calculated total price: (29.99 + 5.00) * 3 = 104.97
    expect(result.total_price).toEqual(104.97);
  });

  it('should update cart item in database', async () => {
    const input: UpdateCartItemInput = {
      cart_item_id: testCartItemId,
      quantity: 4
    };

    await updateCartItem(input);

    // Verify database was updated
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, testCartItemId))
      .execute();

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toEqual(4);
    expect(cartItems[0].updated_at).toBeInstanceOf(Date);
  });

  it('should remove cart item when quantity is 0', async () => {
    const input: UpdateCartItemInput = {
      cart_item_id: testCartItemId,
      quantity: 0
    };

    await expect(updateCartItem(input)).rejects.toThrow(/cart item removed/i);

    // Verify cart item was deleted from database
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, testCartItemId))
      .execute();

    expect(cartItems).toHaveLength(0);
  });

  it('should throw error for non-existent cart item', async () => {
    const input: UpdateCartItemInput = {
      cart_item_id: 99999,
      quantity: 1
    };

    await expect(updateCartItem(input)).rejects.toThrow(/cart item not found/i);
  });

  it('should calculate total price correctly with price adjustment', async () => {
    // Create variation with negative price adjustment
    const variationResult = await db.insert(productVariationsTable)
      .values({
        product_id: testProductId,
        size: 'S',
        color: 'Red',
        price_adjustment: '-2.50',
        stock_quantity: 25,
        sku: 'TEST-S-RED'
      })
      .returning()
      .execute();

    const newVariationId = variationResult[0].id;

    const cartItemResult = await db.insert(cartItemsTable)
      .values({
        cart_id: testCartId,
        product_variation_id: newVariationId,
        quantity: 2
      })
      .returning()
      .execute();

    const input: UpdateCartItemInput = {
      cart_item_id: cartItemResult[0].id,
      quantity: 3
    };

    const result = await updateCartItem(input);

    // Check calculated total price: (29.99 - 2.50) * 3 = 82.47
    expect(result.total_price).toEqual(82.47);
    expect(result.variation.price_adjustment).toEqual(-2.5);
  });
});
