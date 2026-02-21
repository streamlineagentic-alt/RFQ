'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';

export default function SupplierProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user, token, loading: authLoading } = useAuth();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && token && params.id) {
      fetchSupplier();
    }
  }, [user, token, params.id]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      const res: any = await apiClient.getSupplierById(Number(params.id), token!);
      setSupplier(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load supplier');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>;
  }

  const renderStars = (score: number) =>
    '★'.repeat(Math.min(5, Math.round(score))) + '☆'.repeat(5 - Math.min(5, Math.round(score)));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <Link href="/suppliers" className="text-gray-500 hover:text-gray-900">← Suppliers</Link>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Profile</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 mb-6">{error}</div>}

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading supplier...</div>
        ) : !supplier ? (
          <div className="text-center py-20 text-gray-500">Supplier not found.</div>
        ) : (
          <div className="space-y-6">
            {/* Header card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{supplier.companyName}</h2>
                  {supplier.supplierType && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                      {supplier.supplierType}
                    </span>
                  )}
                  {supplier.description && (
                    <p className="mt-3 text-gray-600 text-sm max-w-2xl">{supplier.description}</p>
                  )}
                </div>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${supplier.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{supplier._count?.rfqSuppliers ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-1">RFQs Received</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{supplier._count?.quotes ?? 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Quotes Submitted</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-500">{renderStars(supplier.responsivenessScore ?? 3)}</div>
                  <div className="text-xs text-gray-500 mt-1">Responsiveness</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Contact Details</h3>
                <dl className="space-y-3 text-sm">
                  {supplier.contactName && (
                    <div className="flex gap-2"><dt className="text-gray-500 w-24 shrink-0">Name</dt><dd className="text-gray-900">{supplier.contactName}</dd></div>
                  )}
                  {supplier.contactEmail && (
                    <div className="flex gap-2"><dt className="text-gray-500 w-24 shrink-0">Email</dt><dd className="text-gray-900"><a href={`mailto:${supplier.contactEmail}`} className="text-indigo-600 hover:underline">{supplier.contactEmail}</a></dd></div>
                  )}
                  {supplier.contactPhone && (
                    <div className="flex gap-2"><dt className="text-gray-500 w-24 shrink-0">Phone</dt><dd className="text-gray-900">{supplier.contactPhone}</dd></div>
                  )}
                  {supplier.website && (
                    <div className="flex gap-2"><dt className="text-gray-500 w-24 shrink-0">Website</dt><dd><a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{supplier.website}</a></dd></div>
                  )}
                </dl>
              </div>

              {/* Location */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-4">Location</h3>
                <dl className="space-y-3 text-sm">
                  {supplier.country && (
                    <div className="flex gap-2"><dt className="text-gray-500 w-24 shrink-0">Country</dt><dd className="text-gray-900">{supplier.country}</dd></div>
                  )}
                  {supplier.city && (
                    <div className="flex gap-2"><dt className="text-gray-500 w-24 shrink-0">City</dt><dd className="text-gray-900">{supplier.city}</dd></div>
                  )}
                  {supplier.address && (
                    <div className="flex gap-2"><dt className="text-gray-500 w-24 shrink-0">Address</dt><dd className="text-gray-900">{supplier.address}</dd></div>
                  )}
                  {supplier.canExportToUkraine && (
                    <div className="flex gap-2 items-center">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">Can export to Ukraine</span>
                    </div>
                  )}
                </dl>
              </div>

              {/* Regions */}
              {supplier.regionsServed && supplier.regionsServed.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Regions Served</h3>
                  <div className="flex flex-wrap gap-2">
                    {supplier.regionsServed.map((r: string) => (
                      <span key={r} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">{r}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {supplier.certifications && supplier.certifications.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Certifications</h3>
                  <div className="flex flex-wrap gap-2">
                    {supplier.certifications.map((c: string) => (
                      <span key={c} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {supplier.categories && supplier.categories.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Product Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {supplier.categories.map((sc: any) => (
                      <span key={sc.id} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">{sc.category?.name}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
