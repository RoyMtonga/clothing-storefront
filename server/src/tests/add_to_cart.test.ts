
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, productVariationsTable, cartsTable, cartItemsTable } from '../db/schema';
import { type AddToCartInput } from '../schema';
import { addToCart } from '../handlers/add_to_cart';
import { eq, and } from 'drizzle-orm';

describe('addToCart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add new item to cart when cart does not exist', async () => {
    // Create test product and variation
    const product = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        base_price: '29.99',
        category: 'clothing',
        image_url: 'test.jpg'
      })
      .returning()
      .execute();

    const variation = await db.insert(productVariationsTable)
      .values({
        product_id: product[0].id,
        size: 'M',
        color: 'Blue',
        price_adjustment: '5.00',
        stock_quantity: 50,
        sku: 'TEST-M-BLUE'
      })
      .returning()
      .execute();

    const input: AddToCartInput = {
      session_id: 'test-session-123',
      product_variation_id: variation[0].id,
      quantity: 2
    };

    const result = await addToCart(input);

    // Validate result structure
    expect(result.quantity).toEqual(2);
    expect(result.product_variation_id).toEqual(variation[0].id);
    expect(result.product.name).toEqual('Test Product');
    expect(result.variation.size).toEqual('M');
    expect(result.variation.color).toEqual('Blue');
    expect(result.total_price).toEqual(69.98); // (29.99 + 5.00) * 2
    expect(result.id).toBeDefined();
    expect(result.cart_id).toBeDefined();

    // Verify cart was created
    const carts = await db.select()
      .from(cartsTable)
      .where(eq(cartsTable.session_id, 'test-session-123'))
      .execute();

    expect(carts).toHaveLength(1);
    expect(carts[0].session_id).toEqual('test-session-123');
  });

  it('should add item to existing cart', async () => {
    // Create test product and variation
    const product = await db.insert(productsTable)
      .values({
        name: 'Test Product 2',
        description: 'Another test product',
        base_price: '15.50',
        category: 'accessories',
        image_url: null
      })
      .returning()
      .execute();

    const variation = await db.insert(productVariationsTable)
      .values({
        product_id: product[0].id,
        size: 'L',
        color: 'Red',
        price_adjustment: '0.00',
        stock_quantity: 25,
        sku: 'TEST2-L-RED'
      })
      .returning()
      .execute();

    // Create existing cart
    const existingCart = await db.insert(cartsTable)
      .values({
        session_id: 'existing-session'
      })
      .returning()
      .execute();

    const input: AddToCartInput = {
      session_id: 'existing-session',
      product_variation_id: variation[0].id,
      quantity: 1
    };

    const result = await addToCart(input);

    expect(result.cart_id).toEqual(existingCart[0].id);
    expect(result.quantity).toEqual(1);
    expect(result.total_price).toEqual(15.50); // 15.50 + 0.00
    expect(result.product.base_price).toEqual(15.50);
    expect(result.variation.price_adjustment).toEqual(0);
  });

  it('should update quantity when adding same item to cart', async () => {
    // Create test product and variation
    const product = await db.insert(productsTable)
      .values({
        name: 'Test Product 3',
        description: 'Third test product',
        base_price: '10.00',
        category: 'electronics',
        image_url: 'test3.jpg'
      })
      .returning()
      .execute();

    const variation = await db.insert(productVariationsTable)
      .values({
        product_id: product[0].id,
        size: 'S',
        color: 'Green',
        price_adjustment: '2.50',
        stock_quantity: 100,
        sku: 'TEST3-S-GREEN'
      })
      .returning()
      .execute();

    const sessionId = 'update-session';

    // Add item first time
    const firstAdd: AddToCartInput = {
      session_id: sessionId,
      product_variation_id: variation[0].id,
      quantity: 3
    };

    await addToCart(firstAdd);

    // Add same item again
    const secondAdd: AddToCartInput = {
      session_id: sessionId,
      product_variation_id: variation[0].id,
      quantity: 2
    };

    const result = await addToCart(secondAdd);

    expect(result.quantity).toEqual(5); // 3 + 2
    expect(result.total_price).toEqual(62.50); // (10.00 + 2.50) * 5

    // Verify only one cart item exists
    const cartItems = await db.select()
      .from(cartItemsTable)
      .innerJoin(cartsTable, eq(cartItemsTable.cart_id, cartsTable.id))
      .where(eq(cartsTable.session_id, sessionId))
      .execute();

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].cart_items.quantity).toEqual(5);
  });

  it('should throw error when product variation does not exist', async () => {
    const input: AddToCartInput = {
      session_id: 'test-session',
      product_variation_id: 99999, // Non-existent ID
      quantity: 1
    };

    await expect(addToCart(input)).rejects.toThrow(/product variation not found/i);
  });

  it('should handle numeric conversions correctly', async () => {
    // Create product with decimal values
    const product = await db.insert(productsTable)
      .values({
        name: 'Decimal Test Product',
        description: 'Testing decimal handling',
        base_price: '19.95',
        category: 'test',
        image_url: null
      })
      .returning()
      .execute();

    const variation = await db.insert(productVariationsTable)
      .values({
        product_id: product[0].id,
        size: 'XL',
        color: 'Black',
        price_adjustment: '3.05',
        stock_quantity: 10,
        sku: 'DECIMAL-XL-BLACK'
      })
      .returning()
      .execute();

    const input: AddToCartInput = {
      session_id: 'decimal-session',
      product_variation_id: variation[0].id,
      quantity: 4
    };

    const result = await addToCart(input);

    expect(typeof result.product.base_price).toBe('number');
    expect(typeof result.variation.price_adjustment).toBe('number');
    expect(typeof result.total_price).toBe('number');
    expect(result.product.base_price).toEqual(19.95);
    expect(result.variation.price_adjustment).toEqual(3.05);
    expect(result.total_price).toEqual(92.00); // (19.95 + 3.05) * 4
  });
});
