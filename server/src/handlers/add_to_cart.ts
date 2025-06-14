
import { type CartItemWithDetails, type AddToCartInput } from '../schema';

export declare function addToCart(input: AddToCartInput): Promise<CartItemWithDetails>;
