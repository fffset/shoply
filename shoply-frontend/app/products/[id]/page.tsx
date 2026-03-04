'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useCart } from '@/context/CartContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Product } from '@/types';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();
  const router = useRouter();

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data.data))
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return <LoadingSpinner />;
  if (!product) return null;

  const outOfStock = product.stock === 0;

  return (
    <div>
      <Link href="/" className="text-blue-600 hover:underline text-sm mb-6 inline-block">
        ← Ürünlere Dön
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        <div className="bg-gray-100 rounded-lg h-80 flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-gray-400">Resim yok</span>
          )}
        </div>

        <div>
          {product.category && (
            <p className="text-sm text-gray-500 mb-1">{product.category.name}</p>
          )}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.name}</h1>
          <p className="text-3xl font-bold text-blue-600 mb-4">
            ₺{Number(product.price).toFixed(2)}
          </p>

          {product.description && (
            <p className="text-gray-600 mb-6">{product.description}</p>
          )}

          <p className={`text-sm mb-4 ${outOfStock ? 'text-red-500' : 'text-green-600'}`}>
            {outOfStock ? 'Stokta yok' : `Stok: ${product.stock} adet`}
          </p>

          {!outOfStock && (
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm text-gray-600">Adet:</label>
              <div className="flex items-center border rounded">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-1 hover:bg-gray-100"
                >
                  −
                </button>
                <span className="px-3 py-1 border-x">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-3 py-1 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {added ? '✓ Sepete Eklendi!' : 'Sepete Ekle'}
          </button>
        </div>
      </div>
    </div>
  );
}
