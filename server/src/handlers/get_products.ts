import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product, type GetProductsInput } from '../schema';
import { eq, gte, lte, and, type SQL } from 'drizzle-orm';

export const getProducts = async (input?: GetProductsInput): Promise<Product[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input?.category) {
      conditions.push(eq(productsTable.category, input.category));
    }

    if (input?.min_price !== undefined) {
      conditions.push(gte(productsTable.base_price, input.min_price.toString()));
    }

    if (input?.max_price !== undefined) {
      conditions.push(lte(productsTable.base_price, input.max_price.toString()));
    }

    // Build final query based on conditions and pagination
    let results;
    
    if (conditions.length > 0) {
      const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);
      
      if (input?.limit && input?.offset) {
        results = await db.select()
          .from(productsTable)
          .where(whereClause)
          .limit(input.limit)
          .offset(input.offset)
          .execute();
      } else if (input?.limit) {
        results = await db.select()
          .from(productsTable)
          .where(whereClause)
          .limit(input.limit)
          .execute();
      } else if (input?.offset) {
        results = await db.select()
          .from(productsTable)
          .where(whereClause)
          .offset(input.offset)
          .execute();
      } else {
        results = await db.select()
          .from(productsTable)
          .where(whereClause)
          .execute();
      }
    } else {
      // No conditions, just handle pagination
      if (input?.limit && input?.offset) {
        results = await db.select()
          .from(productsTable)
          .limit(input.limit)
          .offset(input.offset)
          .execute();
      } else if (input?.limit) {
        results = await db.select()
          .from(productsTable)
          .limit(input.limit)
          .execute();
      } else if (input?.offset) {
        results = await db.select()
          .from(productsTable)
          .offset(input.offset)
          .execute();
      } else {
        results = await db.select()
          .from(productsTable)
          .execute();
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