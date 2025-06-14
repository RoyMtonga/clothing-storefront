
import { db } from '../db';
import { cartItemsTable } from '../db/schema';
import { type RemoveFromCartInput } from '../schema';
import { eq } from 'drizzle-orm';

export const removeFromCart = async (input: RemoveFromCartInput): Promise<{ success: boolean }> => {
  try {
    // Delete the cart item
    const result = await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.id, input.cart_item_id))
      .execute();

    // Return success status based on whether a row was affected
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Remove from cart failed:', error);
    throw error;
  }
};
