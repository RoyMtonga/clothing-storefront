
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, productVariationsTable, cartsTable, cartItemsTable } from '../db/schema';
import { type GetCartInput } from '../schema';
import { getCart } from '../handlers/get_cart';

const testInput: GetCartInput = {
  session_id: 'test-session-123'
};

describe('getCart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for non-existent cart', async () => {
    const result = await getCart(testInput);
    expect(result).toHaveLength(0);
  });

  it('should return cart items with product and variation details', async () => {
    // Create test product
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        base_price: '19.99',
        category: 'test',
        image_url: 'http://example.com/image.jpg'
      })
      .returning()
      .execute();

    // Create product variation
    const [variation] = await db.insert(productVariationsTable)
      .values({
        product_id: product.id,
        size: 'M',
        color: 'Red',
        price_adjustment: '5.00',
        stock_quantity: 10,
        sku: 'TEST-M-RED'
      })
      .returning()
      .execute();

    // Create cart
    const [cart] = await db.insert(cartsTable)
      .values({
        session_id: testInput.session_id
      })
      .returning()
      .execute();

    // Add item to cart
    await db.insert(cartItemsTable)
      .values({
        cart_id: cart.id,
        product_variation_id: variation.id,
        quantity: 2
      })
      .execute();

    const result = await getCart(testInput);

    expect(result).toHaveLength(1);
    
    const cartItem = result[0];
    expect(cartItem.cart_id).toEqual(cart.id);
    expect(cartItem.product_variation_id).toEqual(variation.id);
    expect(cartItem.quantity).toEqual(2);
    
    // Verify product details
    expect(cartItem.product.id).toEqual(product.id);
    expect(cartItem.product.name).toEqual('Test Product');
    expect(cartItem.product.base_price).toEqual(19.99);
    expect(cartItem.product.category).toEqual('test');
    
    // Verify variation details
    expect(cartItem.variation.id).toEqual(variation.id);
    expect(cartItem.variation.size).toEqual('M');
    expect(cartItem.variation.color).toEqual('Red');
    expect(cartItem.variation.price_adjustment).toEqual(5.00);
    expect(cartItem.variation.stock_quantity).toEqual(10);
    expect(cartItem.variation.sku).toEqual('TEST-M-RED');
    
    // Verify calculated total price (base_price + price_adjustment) * quantity
    expect(cartItem.total_price).toEqual((19.99 + 5.00) * 2);
    
    // Verify timestamps
    expect(cartItem.created_at).toBeInstanceOf(Date);
    expect(cartItem.updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple cart items correctly', async () => {
    // Create test product
    const [product] = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        description: 'A test product',
        base_price: '10.00',
        category: 'test',
        image_url: null
      })
      .returning()
      .execute();

    // Create two variations
    const [variation1] = await db.insert(productVariationsTable)
      .values({
        product_id: product.id,
        size: 'S',
        color: 'Blue',
        price_adjustment: '0.00',
        stock_quantity: 5,
        sku: 'TEST-S-BLUE'
      })
      .returning()
      .execute();

    const [variation2] = await db.insert(productVariationsTable)
      .values({
        product_id: product.id,
        size: 'L',
        color: 'Green',
        price_adjustment: '2.50',
        stock_quantity: 3,
        sku: 'TEST-L-GREEN'
      })
      .returning()
      .execute();

    // Create cart
    const [cart] = await db.insert(cartsTable)
      .values({
        session_id: testInput.session_id
      })
      .returning()
      .execute();

    // Add multiple items to cart
    await db.insert(cartItemsTable)
      .values([
        {
          cart_id: cart.id,
          product_variation_id: variation1.id,
          quantity: 1
        },
        {
          cart_id: cart.id,
          product_variation_id: variation2.id,
          quantity: 3
        }
      ])
      .execute();

    const result = await getCart(testInput);

    expect(result).toHaveLength(2);
    
    // Verify both items are returned with correct calculations
    const item1 = result.find(item => item.variation.sku === 'TEST-S-BLUE');
    const item2 = result.find(item => item.variation.sku === 'TEST-L-GREEN');
    
    expect(item1).toBeDefined();
    expect(item1!.total_price).toEqual(10.00 * 1); // base_price + 0 adjustment
    
    expect(item2).toBeDefined();
    expect(item2!.total_price).toEqual((10.00 + 2.50) * 3); // (base_price + adjustment) * quantity
  });
});
