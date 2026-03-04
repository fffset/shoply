'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Category } from '@/types';

export default function NewProductPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    imageUrl: '',
    categoryId: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.data));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/products', {
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        imageUrl: form.imageUrl || undefined,
        categoryId: form.categoryId || undefined,
      });
      router.push('/admin/products');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Ürün eklenemedi';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <Link href="/admin/products" className="text-blue-600 hover:underline text-sm mb-4 inline-block">
        ← Ürünlere Dön
      </Link>
      <h1 className="text-2xl font-bold mb-6">Yeni Ürün Ekle</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Ürün Adı *</label>
          <input
            type="text"
            name="name"
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Açıklama</label>
          <textarea
            name="description"
            rows={3}
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Fiyat (₺) *</label>
            <input
              type="number"
              name="price"
              step="0.01"
              min="0"
              className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.price}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-600 mb-1">Stok *</label>
            <input
              type="number"
              name="stock"
              min="0"
              className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.stock}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Resim URL</label>
          <input
            type="url"
            name="imageUrl"
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.imageUrl}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Kategori</label>
          <select
            name="categoryId"
            className="border p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={form.categoryId}
            onChange={handleChange}
          >
            <option value="">Seçiniz</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Kaydediliyor...' : 'Ürünü Kaydet'}
        </button>
      </form>
    </div>
  );
}
