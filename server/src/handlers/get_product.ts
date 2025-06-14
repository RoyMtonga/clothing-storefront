
import { type ProductWithVariations, type GetProductInput } from '../schema';

export declare function getProduct(input: GetProductInput): Promise<ProductWithVariations | null>;
