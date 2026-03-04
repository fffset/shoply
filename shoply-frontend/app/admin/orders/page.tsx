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

export default function AdminOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const loadOrders = (status?: string) => {
    setLoading(true);
    api
      .get('/admin/orders', { params: status ? { status } : {} })
      .then((res) => setOrders(res.data.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadOrders(filter || undefined);
    }
  }, [user, filter]);

  const handleStatusChange = async (orderId: string, status: 'confirmed' | 'cancelled') => {
    await api.patch(`/admin/orders/${orderId}/status`, { status });
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  if (authLoading || loading) return <LoadingSpinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Sipariş Yönetimi</h1>

      <div className="flex gap-2 mb-4">
        {['', 'pending', 'confirmed', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 rounded border text-sm ${
              filter === s ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'
            }`}
          >
            {s === '' ? 'Tümü' : STATUS_LABELS[s]?.label}
          </button>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="text-gray-500">Sipariş bulunamadı.</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">Sipariş No</th>
                <th className="text-left p-3">Tarih</th>
                <th className="text-right p-3">Toplam</th>
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
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {o.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleStatusChange(o.id, 'confirmed')}
                            className="text-green-600 hover:underline text-xs"
                          >
                            Onayla
                          </button>
                          <button
                            onClick={() => handleStatusChange(o.id, 'cancelled')}
                            className="text-red-500 hover:underline text-xs"
                          >
                            İptal
                          </button>
                        </div>
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
