'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-8">Admin Paneli</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
        <Link
          href="/admin/products"
          className="border rounded-lg p-6 hover:shadow-md transition bg-white"
        >
          <h2 className="text-lg font-semibold mb-1">Ürünler</h2>
          <p className="text-gray-500 text-sm">Ürün ekle, düzenle, sil</p>
        </Link>
        <Link
          href="/admin/orders"
          className="border rounded-lg p-6 hover:shadow-md transition bg-white"
        >
          <h2 className="text-lg font-semibold mb-1">Siparişler</h2>
          <p className="text-gray-500 text-sm">Tüm siparişleri yönet</p>
        </Link>
      </div>
    </div>
  );
}
