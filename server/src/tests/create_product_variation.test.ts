
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, productVariationsTable } from '../db/schema';
import { type CreateProductVariationInput, type CreateProductInput } from '../schema';
import { createProductVariation } from '../handlers/create_product_variation';
import { eq } from 'drizzle-orm';

// Test product to create variations for
const testProduct: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  base_price: 29.99,
  category: 'test',
  image_url: null
};

// Test variation input
const testVariationInput: CreateProductVariationInput = {
  product_id: 1, // Will be set after creating product
  size: 'M',
  color: 'Blue',
  price_adjustment: 5.00,
  stock_quantity: 50,
  sku: 'TEST-PROD-M-BLUE'
};

describe('createProductVariation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product variation', async () => {
    // Create prerequisite product first
    const productResult = await db.insert(productsTable)
      .values({
        name: testProduct.name,
        description: testProduct.description,
        base_price: testProduct.base_price.toString(),
        category: testProduct.category,
        image_url: testProduct.image_url
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const variationInput = { ...testVariationInput, product_id: productId };

    const result = await createProductVariation(variationInput);

    // Basic field validation
    expect(result.product_id).toEqual(productId);
    expect(result.size).toEqual('M');
    expect(result.color).toEqual('Blue');
    expect(result.price_adjustment).toEqual(5.00);
    expect(typeof result.price_adjustment).toEqual('number');
    expect(result.stock_quantity).toEqual(50);
    expect(result.sku).toEqual('TEST-PROD-M-BLUE');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save product variation to database', async () => {
    // Create prerequisite product first
    const productResult = await db.insert(productsTable)
      .values({
        name: testProduct.name,
        description: testProduct.description,
        base_price: testProduct.base_price.toString(),
        category: testProduct.category,
        image_url: testProduct.image_url
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const variationInput = { ...testVariationInput, product_id: productId };

    const result = await createProductVariation(variationInput);

    // Query database to verify variation was saved
    const variations = await db.select()
      .from(productVariationsTable)
      .where(eq(productVariationsTable.id, result.id))
      .execute();

    expect(variations).toHaveLength(1);
    expect(variations[0].product_id).toEqual(productId);
    expect(variations[0].size).toEqual('M');
    expect(variations[0].color).toEqual('Blue');
    expect(parseFloat(variations[0].price_adjustment)).toEqual(5.00);
    expect(variations[0].stock_quantity).toEqual(50);
    expect(variations[0].sku).toEqual('TEST-PROD-M-BLUE');
    expect(variations[0].created_at).toBeInstanceOf(Date);
    expect(variations[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when product does not exist', async () => {
    const variationInput = { ...testVariationInput, product_id: 999 };

    await expect(createProductVariation(variationInput))
      .rejects
      .toThrow(/product with id 999 not found/i);
  });

  it('should handle zero price adjustment', async () => {
    // Create prerequisite product first
    const productResult = await db.insert(productsTable)
      .values({
        name: testProduct.name,
        description: testProduct.description,
        base_price: testProduct.base_price.toString(),
        category: testProduct.category,
        image_url: testProduct.image_url
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const variationInput = { 
      ...testVariationInput, 
      product_id: productId,
      price_adjustment: 0,
      sku: 'TEST-PROD-M-BLUE-ZERO'
    };

    const result = await createProductVariation(variationInput);

    expect(result.price_adjustment).toEqual(0);
    expect(typeof result.price_adjustment).toEqual('number');
  });

  it('should handle negative price adjustment', async () => {
    // Create prerequisite product first
    const productResult = await db.insert(productsTable)
      .values({
        name: testProduct.name,
        description: testProduct.description,
        base_price: testProduct.base_price.toString(),
        category: testProduct.category,
        image_url: testProduct.image_url
      })
      .returning()
      .execute();

    const productId = productResult[0].id;
    const variationInput = { 
      ...testVariationInput, 
      product_id: productId,
      price_adjustment: -2.50,
      sku: 'TEST-PROD-M-BLUE-NEG'
    };

    const result = await createProductVariation(variationInput);

    expect(result.price_adjustment).toEqual(-2.50);
    expect(typeof result.price_adjustment).toEqual('number');
  });
});
