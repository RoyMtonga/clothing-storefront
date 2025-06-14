
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductModal } from '@/components/ProductModal';
import { Cart } from '@/components/Cart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Filter } from 'lucide-react';
import type { Product, ProductWithVariations, CartItemWithDetails } from '../../server/src/schema';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithVariations | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isLoading, setIsLoading] = useState(false);

  const categories = ['all', 'shirts', 'pants', 'dresses', 'jackets', 'accessories'];

  const loadProducts = useCallback(async () => {
    try {
      const input = selectedCategory === 'all' ? undefined : { category: selectedCategory };
      const result = await trpc.getProducts.query(input);
      setProducts(result);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, [selectedCategory]);

  const loadCart = useCallback(async () => {
    try {
      const result = await trpc.getCart.query({ session_id: sessionId });
      setCartItems(result);
    } catch (error) {
      console.error('Failed to load cart:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleProductClick = async (product: Product) => {
    setIsLoading(true);
    try {
      const productWithVariations = await trpc.getProduct.query({ id: product.id });
      if (productWithVariations) {
        setSelectedProduct(productWithVariations);
        setIsProductModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to load product details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async (productVariationId: number, quantity: number) => {
    try {
      await trpc.addToCart.mutate({
        session_id: sessionId,
        product_variation_id: productVariationId,
        quantity
      });
      await loadCart();
      setIsProductModalOpen(false);
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  const handleUpdateCartItem = async (cartItemId: number, quantity: number) => {
    try {
      if (quantity === 0) {
        await trpc.removeFromCart.mutate({ cart_item_id: cartItemId });
      } else {
        await trpc.updateCartItem.mutate({ cart_item_id: cartItemId, quantity });
      }
      await loadCart();
    } catch (error) {
      console.error('Failed to update cart item:', error);
    }
  };

  const handleRemoveFromCart = async (cartItemId: number) => {
    try {
      await trpc.removeFromCart.mutate({ cart_item_id: cartItemId });
      await loadCart();
    } catch (error) {
      console.error('Failed to remove from cart:', error);
    }
  };

  const cartItemCount = cartItems.reduce((sum: number, item: CartItemWithDetails) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">ClothesShop</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCartOpen(true)}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Category Filter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center space-x-2 mb-6">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Categories:</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((category: string) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={products}
          onProductClick={handleProductClick}
          isLoading={isLoading}
        />
      </div>

      {/* Product Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Sidebar */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartItem}
        onRemoveItem={handleRemoveFromCart}
      />
    </div>
  );
}

export default App;
