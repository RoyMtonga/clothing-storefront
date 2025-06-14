import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { ProductGrid } from '@/components/ProductGrid';
import { ProductModal } from '@/components/ProductModal';
import { Cart } from '@/components/Cart';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Filter, Database, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import type { Product, ProductWithVariations, CartItemWithDetails } from '../../server/src/schema';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithVariations | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItemWithDetails[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeedingProducts, setIsSeedingProducts] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const categories = ['all', 'shirts', 'pants', 'dresses', 'jackets', 'accessories'];

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const loadProducts = useCallback(async () => {
    try {
      const input: { category?: string; min_price?: number; max_price?: number } = {};
      
      if (selectedCategory !== 'all') {
        input.category = selectedCategory;
      }
      
      if (minPrice && !isNaN(parseFloat(minPrice))) {
        input.min_price = parseFloat(minPrice);
      }
      
      if (maxPrice && !isNaN(parseFloat(maxPrice))) {
        input.max_price = parseFloat(maxPrice);
      }
      
      const hasFilters = Object.keys(input).length > 0;
      const result = await trpc.getProducts.query(hasFilters ? input : undefined);
      setProducts(result);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, [selectedCategory, minPrice, maxPrice]);

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

  const handleSeedProducts = async () => {
    setIsSeedingProducts(true);
    try {
      const result = await trpc.seedProducts.mutate();
      showNotification(`${result.message} - ${result.productsCreated} products, ${result.variationsCreated} variations created`, 'success');
      await loadProducts();
    } catch (error) {
      console.error('Failed to seed products:', error);
      showNotification('Failed to seed products. Please try again.', 'error');
    } finally {
      setIsSeedingProducts(false);
    }
  };

  const handlePriceFilter = () => {
    loadProducts();
  };

  const clearPriceFilter = () => {
    setMinPrice('');
    setMaxPrice('');
  };

  const cartItemCount = cartItems.reduce((sum: number, item: CartItemWithDetails) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg flex items-center space-x-2 ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          <span className="text-sm">{notification.message}</span>
        </div>
      )}

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
                onClick={handleSeedProducts}
                disabled={isSeedingProducts}
                className="text-xs"
              >
                <Database className="h-3 w-3 mr-1" />
                {isSeedingProducts ? 'Seeding...' : 'Seed Data'}
              </Button>
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

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Category Filter */}
        <div className="flex items-center space-x-2 mb-4">
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

        {/* Price Filter */}
        <div className="flex items-center space-x-2 mb-6">
          <DollarSign className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Price Range:</span>
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinPrice(e.target.value)}
              className="w-20 h-8 text-xs"
              min="0"
              step="0.01"
            />
            <span className="text-gray-500">to</span>
            <Input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMaxPrice(e.target.value)}
              className="w-20 h-8 text-xs"
              min="0"
              step="0.01"
            />
            <Button
              size="sm"
              onClick={handlePriceFilter}
              className="h-8 text-xs"
            >
              Apply
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearPriceFilter}
              className="h-8 text-xs"
            >
              Clear
            </Button>
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