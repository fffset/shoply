import Link from 'next/link';
import { Product } from '@/types';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition bg-white">
      <div className="h-48 bg-gray-100 flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-gray-400 text-sm">Resim yok</span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
        {product.category && (
          <p className="text-xs text-gray-500 mt-1">{product.category.name}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-blue-600">
            ₺{Number(product.price).toFixed(2)}
          </span>
          <Link
            href={`/products/${product.id}`}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            İncele
          </Link>
        </div>
      </div>
    </div>
  );
}
