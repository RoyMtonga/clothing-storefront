
import { db } from '../db';
import { productVariationsTable, productsTable } from '../db/schema';
import { type CreateProductVariationInput, type ProductVariation } from '../schema';
import { eq } from 'drizzle-orm';

export const createProductVariation = async (input: CreateProductVariationInput): Promise<ProductVariation> => {
  try {
    // Verify the product exists first
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.product_id))
      .execute();

    if (existingProduct.length === 0) {
      throw new Error(`Product with id ${input.product_id} not found`);
    }

    // Insert product variation record
    const result = await db.insert(productVariationsTable)
      .values({
        product_id: input.product_id,
        size: input.size,
        color: input.color,
        price_adjustment: input.price_adjustment.toString(), // Convert number to string for numeric column
        stock_quantity: input.stock_quantity,
        sku: input.sku
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const variation = result[0];
    return {
      ...variation,
      price_adjustment: parseFloat(variation.price_adjustment) // Convert string back to number
    };
  } catch (error) {
    console.error('Product variation creation failed:', error);
    throw error;
  }
};
