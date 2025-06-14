
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus } from 'lucide-react';
import type { ProductWithVariations, ProductVariation } from '../../../server/src/schema';

interface ProductModalProps {
  product: ProductWithVariations | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (productVariationId: number, quantity: number) => Promise<void>;
}

export function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  if (!product) return null;

  // Reset state when product changes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedVariation(null);
      setQuantity(1);
      onClose();
    }
  };

  // Group variations by size for easier selection
  const sizes = [...new Set(product.variations.map((v: ProductVariation) => v.size))];

  const getVariationForSelection = (size: string, color: string) => {
    return product.variations.find((v: ProductVariation) => v.size === size && v.color === color);
  };

  const handleSizeChange = (size: string) => {
    // Find first available variation with this size
    const availableVariation = product.variations.find(
      (v: ProductVariation) => v.size === size && v.stock_quantity > 0
    );
    if (availableVariation) {
      setSelectedVariation(availableVariation);
      setQuantity(1);
    }
  };

  const handleColorChange = (color: string) => {
    if (selectedVariation) {
      const newVariation = getVariationForSelection(selectedVariation.size, color);
      if (newVariation) {
        setSelectedVariation(newVariation);
        setQuantity(1);
      }
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariation) return;
    
    setIsAdding(true);
    try {
      await onAddToCart(selectedVariation.id, quantity);
    } finally {
      setIsAdding(false);
    }
  };

  const currentPrice = selectedVariation
    ? product.base_price + selectedVariation.price_adjustment
    : product.base_price;

  const maxQuantity = selectedVariation?.stock_quantity || 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-6xl">👕</span>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold">${currentPrice.toFixed(2)}</span>
                <Badge variant="secondary" className="capitalize">
                  {product.category}
                </Badge>
              </div>
              {product.description && (
                <p className="text-gray-600">{product.description}</p>
              )}
            </div>

            {/* Size Selection */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Size</label>
              <Select onValueChange={handleSizeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((size: string) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Color Selection */}
            {selectedVariation && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Color</label>
                <Select value={selectedVariation.color || ''} onValueChange={handleColorChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {product.variations
                      .filter((v: ProductVariation) => v.size === selectedVariation.size)
                      .map((v: ProductVariation) => (
                        <SelectItem key={v.id} value={v.color}>
                          {v.color}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Stock Info */}
            {selectedVariation && (
              <div className="text-sm text-gray-600">
                <span>SKU: {selectedVariation.sku}</span>
                <br />
                <span>
                  {selectedVariation.stock_quantity > 0
                    ? `${selectedVariation.stock_quantity} in stock`
                    : 'Out of stock'}
                </span>
              </div>
            )}

            {/* Quantity Selection */}
            {selectedVariation && selectedVariation.stock_quantity > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Quantity</label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                    disabled={quantity >= maxQuantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Add to Cart Button */}
            <Button
              className="w-full"
              onClick={handleAddToCart}
              disabled={!selectedVariation || selectedVariation.stock_quantity === 0 || isAdding}
            >
              {isAdding
                ? 'Adding to Cart...'
                : !selectedVariation
                ? 'Select Size & Color'
                : selectedVariation.stock_quantity === 0
                ? 'Out of Stock'
                : `Add to Cart - $${(currentPrice * quantity).toFixed(2)}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
