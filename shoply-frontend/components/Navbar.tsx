'use client';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          Shoply
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-blue-600">
            Ürünler
          </Link>

          <Link href="/cart" className="relative text-gray-600 hover:text-blue-600">
            Sepet
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>

          {user ? (
            <>
              <span className="text-gray-700 text-sm">
                {user.firstName}
              </span>
              {user.role === 'admin' && (
                <Link href="/admin" className="text-purple-600 hover:text-purple-800 text-sm font-medium">
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="text-sm text-red-500 hover:text-red-700"
              >
                Çıkış
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-gray-600 hover:text-blue-600 text-sm">
                Giriş
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
