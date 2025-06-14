import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type GetProductsInput } from '../schema';
import { getProducts } from '../handlers/get_products';

describe('getProducts price filtering', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Create test products with different prices
    await db.insert(productsTable).values([
      {
        name: 'Cheap Product',
        description: 'Low price product',
        base_price: '10.00',
        category: 'shirts',
        image_url: null
      },
      {
        name: 'Medium Product',
        description: 'Medium price product',
        base_price: '50.00',
        category: 'pants',
        image_url: null
      },
      {
        name: 'Expensive Product',
        description: 'High price product',
        base_price: '100.00',
        category: 'jackets',
        image_url: null
      }
    ]).execute();
  });

  it('should filter products by minimum price', async () => {
    const input: GetProductsInput = {
      min_price: 25
    };

    const result = await getProducts(input);

    expect(result.length).toEqual(2);
    expect(result.every(p => p.base_price >= 25)).toBe(true);
  });

  it('should filter products by maximum price', async () => {
    const input: GetProductsInput = {
      max_price: 75
    };

    const result = await getProducts(input);

    expect(result.length).toEqual(2);
    expect(result.every(p => p.base_price <= 75)).toBe(true);
  });

  it('should filter products by price range', async () => {
    const input: GetProductsInput = {
      min_price: 25,
      max_price: 75
    };

    const result = await getProducts(input);

    expect(result.length).toEqual(1);
    expect(result[0].base_price).toEqual(50);
  });

  it('should combine category and price filters', async () => {
    const input: GetProductsInput = {
      category: 'pants',
      min_price: 25,
      max_price: 75
    };

    const result = await getProducts(input);

    expect(result.length).toEqual(1);
    expect(result[0].category).toEqual('pants');
    expect(result[0].base_price).toEqual(50);
  });

  it('should return empty array when no products match price range', async () => {
    const input: GetProductsInput = {
      min_price: 200,
      max_price: 300
    };

    const result = await getProducts(input);

    expect(result.length).toEqual(0);
  });

  it('should convert numeric fields correctly', async () => {
    const input: GetProductsInput = {
      min_price: 10,
      max_price: 100
    };

    const result = await getProducts(input);

    result.forEach(product => {
      expect(typeof product.base_price).toBe('number');
      expect(product.base_price).toBeGreaterThanOrEqual(10);
      expect(product.base_price).toBeLessThanOrEqual(100);
    });
  });
});