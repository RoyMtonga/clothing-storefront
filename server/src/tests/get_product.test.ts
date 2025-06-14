
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, productVariationsTable } from '../db/schema';
import { type GetProductInput, type CreateProductInput, type CreateProductVariationInput } from '../schema';
import { getProduct } from '../handlers/get_product';

// Test data
const testProductInput: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  base_price: 29.99,
  category: 'Electronics',
  image_url: 'https://example.com/image.jpg'
};

const createTestVariation = (productId: number, size: string, color: string): CreateProductVariationInput => ({
  product_id: productId,
  size,
  color,
  price_adjustment: 5.00,
  stock_quantity: 10,
  sku: `TEST-${size}-${color}`
});

describe('getProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return product with variations', async () => {
    // Create a product
    const productResult = await db.insert(productsTable)
      .values({
        name: testProductInput.name,
        description: testProductInput.description,
        base_price: testProductInput.base_price.toString(),
        category: testProductInput.category,
        image_url: testProductInput.image_url
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create variations
    const variation1 = createTestVariation(productId, 'M', 'Red');
    const variation2 = createTestVariation(productId, 'L', 'Blue');

    await db.insert(productVariationsTable)
      .values([
        {
          product_id: variation1.product_id,
          size: variation1.size,
          color: variation1.color,
          price_adjustment: variation1.price_adjustment.toString(),
          stock_quantity: variation1.stock_quantity,
          sku: variation1.sku
        },
        {
          product_id: variation2.product_id,
          size: variation2.size,
          color: variation2.color,
          price_adjustment: variation2.price_adjustment.toString(),
          stock_quantity: variation2.stock_quantity,
          sku: variation2.sku
        }
      ])
      .execute();

    // Test the handler
    const input: GetProductInput = { id: productId };
    const result = await getProduct(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(productId);
    expect(result!.name).toEqual('Test Product');
    expect(result!.description).toEqual('A product for testing');
    expect(result!.base_price).toEqual(29.99);
    expect(typeof result!.base_price).toBe('number');
    expect(result!.category).toEqual('Electronics');
    expect(result!.image_url).toEqual('https://example.com/image.jpg');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);

    // Check variations
    expect(result!.variations).toHaveLength(2);
    
    const redVariation = result!.variations.find(v => v.color === 'Red');
    expect(redVariation).toBeDefined();
    expect(redVariation!.size).toEqual('M');
    expect(redVariation!.price_adjustment).toEqual(5.00);
    expect(typeof redVariation!.price_adjustment).toBe('number');
    expect(redVariation!.stock_quantity).toEqual(10);
    expect(redVariation!.sku).toEqual('TEST-M-Red');

    const blueVariation = result!.variations.find(v => v.color === 'Blue');
    expect(blueVariation).toBeDefined();
    expect(blueVariation!.size).toEqual('L');
    expect(blueVariation!.price_adjustment).toEqual(5.00);
    expect(typeof blueVariation!.price_adjustment).toBe('number');
    expect(blueVariation!.stock_quantity).toEqual(10);
    expect(blueVariation!.sku).toEqual('TEST-L-Blue');
  });

  it('should return product with empty variations array when no variations exist', async () => {
    // Create a product without variations
    const productResult = await db.insert(productsTable)
      .values({
        name: testProductInput.name,
        description: testProductInput.description,
        base_price: testProductInput.base_price.toString(),
        category: testProductInput.category,
        image_url: testProductInput.image_url
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const input: GetProductInput = { id: productId };
    const result = await getProduct(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(productId);
    expect(result!.name).toEqual('Test Product');
    expect(result!.base_price).toEqual(29.99);
    expect(result!.variations).toHaveLength(0);
  });

  it('should return null for non-existent product', async () => {
    const input: GetProductInput = { id: 99999 };
    const result = await getProduct(input);

    expect(result).toBeNull();
  });

  it('should handle products with null description and image_url', async () => {
    // Create a product with null optional fields
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Minimal Product',
        description: null,
        base_price: '15.50',
        category: 'Books',
        image_url: null
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const input: GetProductInput = { id: productId };
    const result = await getProduct(input);

    expect(result).not.toBeNull();
    expect(result!.name).toEqual('Minimal Product');
    expect(result!.description).toBeNull();
    expect(result!.base_price).toEqual(15.50);
    expect(result!.category).toEqual('Books');
    expect(result!.image_url).toBeNull();
    expect(result!.variations).toHaveLength(0);
  });
});
