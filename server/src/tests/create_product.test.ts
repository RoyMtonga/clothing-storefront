
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateProductInput = {
  name: 'Test Product',
  description: 'A product for testing',
  base_price: 19.99,
  category: 'Electronics',
  image_url: 'https://example.com/image.jpg'
};

const testInputWithNulls: CreateProductInput = {
  name: 'Test Product Minimal',
  description: null,
  base_price: 29.99,
  category: 'Books',
  image_url: null
};

describe('createProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a product with all fields', async () => {
    const result = await createProduct(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Product');
    expect(result.description).toEqual('A product for testing');
    expect(result.base_price).toEqual(19.99);
    expect(typeof result.base_price).toEqual('number');
    expect(result.category).toEqual('Electronics');
    expect(result.image_url).toEqual('https://example.com/image.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a product with null fields', async () => {
    const result = await createProduct(testInputWithNulls);

    expect(result.name).toEqual('Test Product Minimal');
    expect(result.description).toBeNull();
    expect(result.base_price).toEqual(29.99);
    expect(typeof result.base_price).toEqual('number');
    expect(result.category).toEqual('Books');
    expect(result.image_url).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save product to database', async () => {
    const result = await createProduct(testInput);

    // Query using proper drizzle syntax
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Test Product');
    expect(products[0].description).toEqual('A product for testing');
    expect(parseFloat(products[0].base_price)).toEqual(19.99);
    expect(products[0].category).toEqual('Electronics');
    expect(products[0].image_url).toEqual('https://example.com/image.jpg');
    expect(products[0].created_at).toBeInstanceOf(Date);
    expect(products[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle decimal prices correctly', async () => {
    const decimalInput: CreateProductInput = {
      name: 'Decimal Price Product',
      description: 'Testing decimal handling',
      base_price: 123.45, // Use 2 decimal places to match database precision
      category: 'Test',
      image_url: null
    };

    const result = await createProduct(decimalInput);

    // Verify numeric conversion maintains precision
    expect(result.base_price).toEqual(123.45);
    expect(typeof result.base_price).toEqual('number');

    // Verify database storage
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(parseFloat(products[0].base_price)).toEqual(123.45);
  });
});
