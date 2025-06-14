import { db } from '../db';
import { productsTable, productVariationsTable } from '../db/schema';

export const seedProducts = async (): Promise<{ message: string; productsCreated: number; variationsCreated: number }> => {
  try {
    // Sample products with diverse clothing categories
    const sampleProducts = [
      {
        name: 'Classic Cotton T-Shirt',
        description: 'Comfortable 100% cotton t-shirt perfect for everyday wear.',
        base_price: '19.99',
        category: 'shirts',
        image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500'
      },
      {
        name: 'Denim Slim Fit Jeans',
        description: 'Premium denim jeans with a modern slim fit.',
        base_price: '89.99',
        category: 'pants',
        image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500'
      },
      {
        name: 'Summer Floral Dress',
        description: 'Light and breezy floral dress perfect for summer occasions.',
        base_price: '79.99',
        category: 'dresses',
        image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500'
      },
      {
        name: 'Leather Bomber Jacket',
        description: 'Stylish genuine leather bomber jacket for a timeless look.',
        base_price: '199.99',
        category: 'jackets',
        image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500'
      },
      {
        name: 'Wool Blend Sweater',
        description: 'Cozy wool blend sweater ideal for cooler weather.',
        base_price: '65.99',
        category: 'shirts',
        image_url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500'
      },
      {
        name: 'Silk Scarf Collection',
        description: 'Elegant silk scarf available in multiple patterns.',
        base_price: '45.99',
        category: 'accessories',
        image_url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'
      },
      {
        name: 'High-Waisted Trousers',
        description: 'Professional high-waisted trousers for office wear.',
        base_price: '95.99',
        category: 'pants',
        image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500'
      }
    ];

    // Insert products
    const insertedProducts = await db.insert(productsTable)
      .values(sampleProducts)
      .returning()
      .execute();

    // Sample variations for each product
    const sampleVariations = [
      // Classic Cotton T-Shirt variations
      { product_id: insertedProducts[0].id, size: 'S', color: 'White', price_adjustment: '0.00', stock_quantity: 15, sku: 'TSHIRT-WHITE-S' },
      { product_id: insertedProducts[0].id, size: 'M', color: 'White', price_adjustment: '0.00', stock_quantity: 20, sku: 'TSHIRT-WHITE-M' },
      { product_id: insertedProducts[0].id, size: 'L', color: 'White', price_adjustment: '0.00', stock_quantity: 12, sku: 'TSHIRT-WHITE-L' },
      { product_id: insertedProducts[0].id, size: 'S', color: 'Black', price_adjustment: '2.00', stock_quantity: 8, sku: 'TSHIRT-BLACK-S' },
      { product_id: insertedProducts[0].id, size: 'M', color: 'Black', price_adjustment: '2.00', stock_quantity: 0, sku: 'TSHIRT-BLACK-M' }, // Out of stock
      { product_id: insertedProducts[0].id, size: 'L', color: 'Black', price_adjustment: '2.00', stock_quantity: 5, sku: 'TSHIRT-BLACK-L' },

      // Denim Slim Fit Jeans variations
      { product_id: insertedProducts[1].id, size: '30', color: 'Blue', price_adjustment: '0.00', stock_quantity: 10, sku: 'JEANS-BLUE-30' },
      { product_id: insertedProducts[1].id, size: '32', color: 'Blue', price_adjustment: '0.00', stock_quantity: 15, sku: 'JEANS-BLUE-32' },
      { product_id: insertedProducts[1].id, size: '34', color: 'Blue', price_adjustment: '0.00', stock_quantity: 12, sku: 'JEANS-BLUE-34' },
      { product_id: insertedProducts[1].id, size: '32', color: 'Black', price_adjustment: '10.00', stock_quantity: 0, sku: 'JEANS-BLACK-32' }, // Out of stock
      { product_id: insertedProducts[1].id, size: '34', color: 'Black', price_adjustment: '10.00', stock_quantity: 8, sku: 'JEANS-BLACK-34' },

      // Summer Floral Dress variations
      { product_id: insertedProducts[2].id, size: 'XS', color: 'Pink', price_adjustment: '0.00', stock_quantity: 6, sku: 'DRESS-PINK-XS' },
      { product_id: insertedProducts[2].id, size: 'S', color: 'Pink', price_adjustment: '0.00', stock_quantity: 10, sku: 'DRESS-PINK-S' },
      { product_id: insertedProducts[2].id, size: 'M', color: 'Pink', price_adjustment: '0.00', stock_quantity: 8, sku: 'DRESS-PINK-M' },
      { product_id: insertedProducts[2].id, size: 'S', color: 'Blue', price_adjustment: '5.00', stock_quantity: 12, sku: 'DRESS-BLUE-S' },
      { product_id: insertedProducts[2].id, size: 'M', color: 'Blue', price_adjustment: '5.00', stock_quantity: 0, sku: 'DRESS-BLUE-M' }, // Out of stock

      // Leather Bomber Jacket variations
      { product_id: insertedProducts[3].id, size: 'S', color: 'Brown', price_adjustment: '0.00', stock_quantity: 4, sku: 'JACKET-BROWN-S' },
      { product_id: insertedProducts[3].id, size: 'M', color: 'Brown', price_adjustment: '0.00', stock_quantity: 6, sku: 'JACKET-BROWN-M' },
      { product_id: insertedProducts[3].id, size: 'L', color: 'Brown', price_adjustment: '0.00', stock_quantity: 3, sku: 'JACKET-BROWN-L' },
      { product_id: insertedProducts[3].id, size: 'M', color: 'Black', price_adjustment: '25.00', stock_quantity: 5, sku: 'JACKET-BLACK-M' },
      { product_id: insertedProducts[3].id, size: 'L', color: 'Black', price_adjustment: '25.00', stock_quantity: 0, sku: 'JACKET-BLACK-L' }, // Out of stock

      // Wool Blend Sweater variations
      { product_id: insertedProducts[4].id, size: 'S', color: 'Gray', price_adjustment: '0.00', stock_quantity: 12, sku: 'SWEATER-GRAY-S' },
      { product_id: insertedProducts[4].id, size: 'M', color: 'Gray', price_adjustment: '0.00', stock_quantity: 15, sku: 'SWEATER-GRAY-M' },
      { product_id: insertedProducts[4].id, size: 'L', color: 'Gray', price_adjustment: '0.00', stock_quantity: 9, sku: 'SWEATER-GRAY-L' },
      { product_id: insertedProducts[4].id, size: 'M', color: 'Navy', price_adjustment: '8.00', stock_quantity: 7, sku: 'SWEATER-NAVY-M' },

      // Silk Scarf Collection variations
      { product_id: insertedProducts[5].id, size: 'One Size', color: 'Floral', price_adjustment: '0.00', stock_quantity: 20, sku: 'SCARF-FLORAL-OS' },
      { product_id: insertedProducts[5].id, size: 'One Size', color: 'Geometric', price_adjustment: '5.00', stock_quantity: 15, sku: 'SCARF-GEO-OS' },
      { product_id: insertedProducts[5].id, size: 'One Size', color: 'Solid', price_adjustment: '-5.00', stock_quantity: 0, sku: 'SCARF-SOLID-OS' }, // Out of stock

      // High-Waisted Trousers variations
      { product_id: insertedProducts[6].id, size: '28', color: 'Navy', price_adjustment: '0.00', stock_quantity: 8, sku: 'TROUSER-NAVY-28' },
      { product_id: insertedProducts[6].id, size: '30', color: 'Navy', price_adjustment: '0.00', stock_quantity: 12, sku: 'TROUSER-NAVY-30' },
      { product_id: insertedProducts[6].id, size: '32', color: 'Navy', price_adjustment: '0.00', stock_quantity: 10, sku: 'TROUSER-NAVY-32' },
      { product_id: insertedProducts[6].id, size: '30', color: 'Black', price_adjustment: '10.00', stock_quantity: 6, sku: 'TROUSER-BLACK-30' },
      { product_id: insertedProducts[6].id, size: '32', color: 'Black', price_adjustment: '10.00', stock_quantity: 0, sku: 'TROUSER-BLACK-32' } // Out of stock
    ];

    // Insert variations
    const insertedVariations = await db.insert(productVariationsTable)
      .values(sampleVariations)
      .returning()
      .execute();

    return {
      message: 'Sample products and variations seeded successfully',
      productsCreated: insertedProducts.length,
      variationsCreated: insertedVariations.length
    };
  } catch (error) {
    console.error('Seeding products failed:', error);
    throw error;
  }
};