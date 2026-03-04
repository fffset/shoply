'use client';
import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handlePlaceOrder = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/orders', {
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      });
      setOrderId(res.data.data.id);
      clearCart();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Sipariş verilemedi';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (orderId) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-bold mb-2">Siparişiniz Alındı!</h2>
        <p className="text-gray-500 text-sm mb-6">Sipariş No: {orderId.slice(0, 8)}...</p>
        <Link href="/" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Alışverişe Devam Et
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg mb-4">Sepetiniz boş</p>
        <Link href="/" className="text-blue-600 underline">
          Ürünlere Göz At
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Sepetim</h1>

      <div className="bg-white border rounded-lg overflow-hidden mb-6">
        {items.map((item) => (
          <div
            key={item.product.id}
            className="flex items-center gap-4 p-4 border-b last:border-0"
          >
            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
              {item.product.imageUrl ? (
                <img
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <span className="text-xs text-gray-400">Resim yok</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-800 truncate">{item.product.name}</p>
              <p className="text-blue-600 text-sm">
                ₺{Number(item.product.price).toFixed(2)}
              </p>
            </div>

            <div className="flex items-center border rounded">
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                className="px-2 py-1 hover:bg-gray-100 text-sm"
              >
                −
              </button>
              <span className="px-3 py-1 text-sm border-x">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                className="px-2 py-1 hover:bg-gray-100 text-sm"
              >
                +
              </button>
            </div>

            <p className="font-semibold text-gray-800 w-20 text-right">
              ₺{(Number(item.product.price) * item.quantity).toFixed(2)}
            </p>

            <button
              onClick={() => removeItem(item.product.id)}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              Sil
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-lg p-4">
        <div className="flex justify-between items-center text-lg font-bold mb-4">
          <span>Toplam</span>
          <span className="text-blue-600">₺{totalPrice.toFixed(2)}</span>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {user ? (
          <button
            onClick={handlePlaceOrder}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {loading ? 'Sipariş veriliyor...' : 'Sipariş Ver'}
          </button>
        ) : (
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-3">
              Sipariş vermek için giriş yapmalısınız
            </p>
            <Link
              href="/login"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-block"
            >
              Giriş Yap
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
