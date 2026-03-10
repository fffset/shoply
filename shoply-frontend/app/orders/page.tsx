'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Order } from '@/types';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Bekliyor', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Onaylandı', color: 'bg-green-100 text-green-800' },
  cancelled: { label: 'İptal', color: 'bg-red-100 text-red-800' },
};

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    api
      .get('/orders')
      .then((res) => setOrders(res.data.data))
      .catch(() => setError('Siparişler yüklenemedi.'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleCancel = async (orderId: string) => {
    if (!confirm('Bu siparişi iptal etmek istediğinizden emin misiniz?')) return;
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
      );
    } catch {
      setError('Sipariş iptal edilemedi.');
    }
  };

  if (authLoading || loading) return <LoadingSpinner />;

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Siparişlerim</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {orders.length === 0 ? (
        <p className="text-gray-500">Henüz siparişiniz yok.</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">Sipariş No</th>
                <th className="text-left p-3">Tarih</th>
                <th className="text-right p-3">Toplam</th>
                <th className="text-right p-3">Ürün</th>
                <th className="text-left p-3">Durum</th>
                <th className="text-right p-3">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const statusInfo = STATUS_LABELS[o.status] || {
                  label: o.status,
                  color: 'bg-gray-100',
                };
                return (
                  <tr key={o.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-mono text-xs text-gray-600">
                      {o.id.slice(0, 8)}...
                    </td>
                    <td className="p-3 text-gray-500">
                      {new Date(o.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="p-3 text-right font-medium">
                      ₺{Number(o.totalPrice).toFixed(2)}
                    </td>
                    <td className="p-3 text-right text-gray-500">
                      {o.items?.length ?? 0} ürün
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {o.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(o.id)}
                          className="text-red-500 hover:underline text-xs"
                        >
                          İptal Et
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
