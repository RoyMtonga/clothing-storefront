import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, productVariationsTable } from '../db/schema';
import { seedProducts } from '../handlers/seed_products';

describe('seedProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should seed products and variations successfully', async () => {
    const result = await seedProducts();

    expect(result.message).toEqual('Sample products and variations seeded successfully');
    expect(result.productsCreated).toBeGreaterThan(0);
    expect(result.variationsCreated).toBeGreaterThan(0);
  });

  it('should create products in database', async () => {
    await seedProducts();

    const products = await db.select().from(productsTable).execute();
    expect(products.length).toBeGreaterThan(0);

    // Check that each product has required fields
    products.forEach(product => {
      expect(product.name).toBeDefined();
      expect(product.base_price).toBeDefined();
      expect(product.category).toBeDefined();
      expect(product.created_at).toBeInstanceOf(Date);
    });
  });

  it('should create product variations in database', async () => {
    await seedProducts();

    const variations = await db.select().from(productVariationsTable).execute();
    expect(variations.length).toBeGreaterThan(0);

    // Check that each variation has required fields
    variations.forEach(variation => {
      expect(variation.product_id).toBeDefined();
      expect(variation.size).toBeDefined();
      expect(variation.color).toBeDefined();
      expect(variation.price_adjustment).toBeDefined();
      expect(variation.stock_quantity).toBeGreaterThanOrEqual(0);
      expect(variation.sku).toBeDefined();
      expect(variation.created_at).toBeInstanceOf(Date);
    });
  });

  it('should create variations with some out of stock items', async () => {
    await seedProducts();

    const variations = await db.select().from(productVariationsTable).execute();
    const outOfStockVariations = variations.filter(v => v.stock_quantity === 0);
    
    expect(outOfStockVariations.length).toBeGreaterThan(0);
  });

  it('should create products with different base prices', async () => {
    await seedProducts();

    const products = await db.select().from(productsTable).execute();
    const prices = products.map(p => parseFloat(p.base_price));
    const uniquePrices = [...new Set(prices)];
    
    expect(uniquePrices.length).toBeGreaterThan(1);
  });
});