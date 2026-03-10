'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return <LoadingSpinner />;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profilim</h1>

      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">Ad</p>
          <p className="font-medium">{user.firstName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Soyad</p>
          <p className="font-medium">{user.lastName}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">E-posta</p>
          <p className="font-medium">{user.email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Rol</p>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              user.role === 'admin'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
          </span>
        </div>
      </div>

      <div className="mt-4">
        <Link href="/orders" className="text-blue-600 hover:underline text-sm">
          Siparişlerimi Görüntüle →
        </Link>
      </div>
    </div>
  );
}
