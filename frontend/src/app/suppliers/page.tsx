'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

interface Supplier {
  id: number;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  country?: string;
  regionsServed?: string[];
  certifications?: string[];
  responsivenessScore?: number;
  isActive: boolean;
}

export default function SuppliersPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && token) {
      fetchSuppliers();
    }
  }, [user, token]);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError('');

      if (!token) throw new Error('Authentication token not found');

      const response: any = await apiClient.getSuppliers({}, token);
      setSuppliers(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  const filtered = suppliers.filter(s => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.companyName.toLowerCase().includes(q) ||
      (s.contactName || '').toLowerCase().includes(q) ||
      (s.country || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">← Back</Link>
            <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
          </div>
          <div className="text-sm text-gray-600">
            {filtered.length} of {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Search bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by company name, contact, or country..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Loading suppliers...</div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-5xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Suppliers Yet</h3>
            <p className="text-gray-600">Suppliers will appear here once they are added to the system.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No suppliers match "<strong>{search}</strong>"</p>
            <button onClick={() => setSearch('')} className="mt-3 text-sm text-indigo-600 hover:underline">Clear search</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(supplier => (
              <div key={supplier.id} className="bg-white rounded-lg shadow p-6 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-900">{supplier.companyName}</h3>
                  {supplier.responsivenessScore ? (
                    <span className="text-yellow-500 text-sm">{renderStars(supplier.responsivenessScore)}</span>
                  ) : null}
                </div>

                {supplier.contactName && (
                  <p className="text-sm text-gray-600">Contact: {supplier.contactName}</p>
                )}
                {supplier.contactEmail && (
                  <p className="text-sm text-gray-500">{supplier.contactEmail}</p>
                )}
                {supplier.country && (
                  <p className="text-sm text-gray-500">📍 {supplier.country}</p>
                )}

                {supplier.regionsServed && supplier.regionsServed.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {supplier.regionsServed.map((region: string) => (
                      <span key={region} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {region}
                      </span>
                    ))}
                  </div>
                )}

                {supplier.certifications && supplier.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {supplier.certifications.map(cert => (
                      <span key={cert} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">
                        {cert}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-auto pt-3 border-t flex justify-between items-center">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {supplier.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Link href={`/suppliers/${supplier.id}`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                    View Profile →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
