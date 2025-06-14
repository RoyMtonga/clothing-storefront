
import { type CartItemWithDetails, type GetCartInput } from '../schema';

export declare function getCart(input: GetCartInput): Promise<CartItemWithDetails[]>;
