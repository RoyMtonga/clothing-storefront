
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type CreateProductInput, type GetProductsInput } from '../schema';
import { getProducts } from '../handlers/get_products';

// Helper function to create test products
const createTestProduct = async (overrides: Partial<CreateProductInput> = {}) => {
  const defaultProduct = {
    name: 'Test Product',
    description: 'A test product',
    base_price: 29.99,
    category: 'electronics',
    image_url: null
  };

  const productData = { ...defaultProduct, ...overrides };

  const result = await db.insert(productsTable)
    .values({
      ...productData,
      base_price: productData.base_price.toString()
    })
    .returning()
    .execute();

  return result[0];
};

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all products when no input provided', async () => {
    // Create test products
    await createTestProduct({ name: 'Product 1', category: 'electronics' });
    await createTestProduct({ name: 'Product 2', category: 'clothing' });

    const result = await getProducts();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBeDefined();
    expect(typeof result[0].base_price).toBe('number');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no products exist', async () => {
    const result = await getProducts();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should filter products by category', async () => {
    // Create products in different categories
    await createTestProduct({ name: 'Phone', category: 'electronics' });
    await createTestProduct({ name: 'Shirt', category: 'clothing' });
    await createTestProduct({ name: 'Laptop', category: 'electronics' });

    const input: GetProductsInput = {
      category: 'electronics'
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(2);
    result.forEach(product => {
      expect(product.category).toBe('electronics');
    });
  });

  it('should return empty array for non-existent category', async () => {
    await createTestProduct({ category: 'electronics' });

    const input: GetProductsInput = {
      category: 'nonexistent'
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(0);
  });

  it('should apply limit correctly', async () => {
    // Create multiple products
    await createTestProduct({ name: 'Product 1' });
    await createTestProduct({ name: 'Product 2' });
    await createTestProduct({ name: 'Product 3' });

    const input: GetProductsInput = {
      limit: 2
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(2);
  });

  it('should apply offset correctly', async () => {
    // Create products with distinct names
    await createTestProduct({ name: 'Product A' });
    await createTestProduct({ name: 'Product B' });
    await createTestProduct({ name: 'Product C' });

    const input: GetProductsInput = {
      offset: 1,
      limit: 2
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(2);
    // Should get products starting from the second one
  });

  it('should combine category filter with pagination', async () => {
    // Create products in electronics category
    await createTestProduct({ name: 'Phone', category: 'electronics' });
    await createTestProduct({ name: 'Laptop', category: 'electronics' });
    await createTestProduct({ name: 'Tablet', category: 'electronics' });
    // Create product in different category
    await createTestProduct({ name: 'Shirt', category: 'clothing' });

    const input: GetProductsInput = {
      category: 'electronics',
      limit: 2,
      offset: 1
    };

    const result = await getProducts(input);

    expect(result).toHaveLength(2);
    result.forEach(product => {
      expect(product.category).toBe('electronics');
    });
  });

  it('should convert numeric fields correctly', async () => {
    await createTestProduct({
      name: 'Price Test Product',
      base_price: 123.45
    });

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(typeof result[0].base_price).toBe('number');
    expect(result[0].base_price).toBe(123.45);
  });

  it('should handle products with null optional fields', async () => {
    await createTestProduct({
      name: 'Minimal Product',
      description: null,
      image_url: null
    });

    const result = await getProducts();

    expect(result).toHaveLength(1);
    expect(result[0].description).toBeNull();
    expect(result[0].image_url).toBeNull();
    expect(result[0].name).toBe('Minimal Product');
  });
});
