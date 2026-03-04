'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Product } from '@/types';

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api
        .get('/products', { params: { limit: 100 } })
        .then((res) => setProducts(res.data.data.data))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" ürününü silmek istediğinizden emin misiniz?`)) return;
    await api.delete(`/products/${id}`);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  if (authLoading || loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ürün Yönetimi</h1>
        <Link
          href="/admin/products/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Yeni Ürün
        </Link>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-500">Henüz ürün yok.</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">Ürün Adı</th>
                <th className="text-left p-3">Kategori</th>
                <th className="text-right p-3">Fiyat</th>
                <th className="text-right p-3">Stok</th>
                <th className="text-right p-3">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3 text-gray-500">{p.category?.name || '-'}</td>
                  <td className="p-3 text-right">₺{Number(p.price).toFixed(2)}</td>
                  <td className="p-3 text-right">
                    <span className={p.stock === 0 ? 'text-red-500' : ''}>{p.stock}</span>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-blue-600 hover:underline mr-3"
                    >
                      Düzenle
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      className="text-red-500 hover:underline"
                    >
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
