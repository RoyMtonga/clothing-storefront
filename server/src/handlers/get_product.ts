
import { db } from '../db';
import { productsTable, productVariationsTable } from '../db/schema';
import { type ProductWithVariations, type GetProductInput } from '../schema';
import { eq } from 'drizzle-orm';

export const getProduct = async (input: GetProductInput): Promise<ProductWithVariations | null> => {
  try {
    // First, get the product
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (products.length === 0) {
      return null;
    }

    const product = products[0];

    // Then, get all variations for this product
    const variations = await db.select()
      .from(productVariationsTable)
      .where(eq(productVariationsTable.product_id, input.id))
      .execute();

    // Convert numeric fields and return ProductWithVariations
    return {
      ...product,
      base_price: parseFloat(product.base_price),
      variations: variations.map(variation => ({
        ...variation,
        price_adjustment: parseFloat(variation.price_adjustment)
      }))
    };
  } catch (error) {
    console.error('Product retrieval failed:', error);
    throw error;
  }
};
