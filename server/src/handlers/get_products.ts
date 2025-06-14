
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product, type GetProductsInput } from '../schema';
import { eq } from 'drizzle-orm';

export const getProducts = async (input?: GetProductsInput): Promise<Product[]> => {
  try {
    // Build the query in one go without reassigning
    const baseQuery = db.select().from(productsTable);
    
    // Apply filters and pagination based on input
    let results;
    
    if (input?.category) {
      let query = baseQuery.where(eq(productsTable.category, input.category));
      
      if (input.limit && input.offset) {
        results = await query.limit(input.limit).offset(input.offset).execute();
      } else if (input.limit) {
        results = await query.limit(input.limit).execute();
      } else if (input.offset) {
        results = await query.offset(input.offset).execute();
      } else {
        results = await query.execute();
      }
    } else {
      if (input?.limit && input?.offset) {
        results = await baseQuery.limit(input.limit).offset(input.offset).execute();
      } else if (input?.limit) {
        results = await baseQuery.limit(input.limit).execute();
      } else if (input?.offset) {
        results = await baseQuery.offset(input.offset).execute();
      } else {
        results = await baseQuery.execute();
      }
    }

    // Convert numeric fields back to numbers
    return results.map(product => ({
      ...product,
      base_price: parseFloat(product.base_price)
    }));
  } catch (error) {
    console.error('Get products failed:', error);
    throw error;
  }
};
