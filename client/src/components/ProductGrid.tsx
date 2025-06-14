
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Product } from '../../../server/src/schema';

interface ProductGridProps {
  products: Product[];
  onProductClick: (product: Product) => void;
  isLoading: boolean;
}

export function ProductGrid({ products, onProductClick, isLoading }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, index: number) => (
          <Card key={index} className="overflow-hidden">
            <Skeleton className="h-64 w-full" />
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No products found in this category.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product: Product) => (
        <Card
          key={product.id}
          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onProductClick(product)}
        >
          <div className="aspect-square bg-gray-100 relative overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="text-4xl">👕</span>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{product.name}</h3>
            {product.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">
                ${product.base_price.toFixed(2)}
              </span>
              <span className="text-xs text-gray-500 capitalize px-2 py-1 bg-gray-100 rounded">
                {product.category}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
