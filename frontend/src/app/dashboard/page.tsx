'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';

interface Stats {
  totalRfqs: number;
  openRfqs: number;
  quotesReceived: number;
  activeSuppliers: number;
}

interface RecentRfq {
  id: number;
  rfqNumber: string;
  projectName: string;
  status: string;
  deliveryCountry: string;
  createdAt: string;
  _count: { quotes: number; rfqSuppliers: number };
}

const STATUS_COLORS: Record<string, string> = {
  draft:      'bg-gray-100 text-gray-700',
  open:       'bg-green-100 text-green-700',
  closed:     'bg-yellow-100 text-yellow-700',
  awarded:    'bg-blue-100 text-blue-700',
  cancelled:  'bg-red-100 text-red-700',
};

export default function DashboardPage() {
  const router = useRouter();
  const { user, token, loading, logout } = useAuth();

  const [stats, setStats] = useState<Stats>({ totalRfqs: 0, openRfqs: 0, quotesReceived: 0, activeSuppliers: 0 });
  const [recentRfqs, setRecentRfqs] = useState<RecentRfq[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!token || !user) return;

    const fetchDashboardData = async () => {
      try {
        if (user.role === 'supplier') {
          const openRes: any = await apiClient.getRfqs({ status: 'open' }, token);
          const openRfqs: RecentRfq[] = openRes.data || [];
          setStats({ totalRfqs: openRfqs.length, openRfqs: openRfqs.length, quotesReceived: 0, activeSuppliers: 0 });
          setRecentRfqs(openRfqs.slice(0, 5));
        } else {
          const [rfqsRes, suppliersRes]: any[] = await Promise.all([
            apiClient.getRfqs({}, token),
            apiClient.getSuppliers({}, token),
          ]);
          const rfqs: RecentRfq[] = rfqsRes.data || [];
          const suppliers = suppliersRes.data || [];
          const totalQuotes = rfqs.reduce((sum: number, r: RecentRfq) => sum + (r._count?.quotes || 0), 0);
          setStats({
            totalRfqs: rfqsRes.pagination?.total || rfqs.length,
            openRfqs: rfqs.filter((r: RecentRfq) => r.status === 'open').length,
            quotesReceived: totalQuotes,
            activeSuppliers: suppliersRes.pagination?.total || suppliers.length,
          });
          setRecentRfqs(rfqs.slice(0, 5));
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [token, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const isSupplier = user.role === 'supplier';
  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">RFQ Management Platform</h1>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link href="/admin" className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition">
                Admin Panel
              </Link>
            )}
            <div className="text-sm text-gray-600">
              <span className="font-medium">{user.email}</span>
              <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs">{user.role}</span>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName || user.email}!
          </h2>
          <p className="text-gray-600">
            {user.companyName && `${user.companyName} • `}
            {isSupplier ? 'Browse open RFQs and submit your best quotes' : 'Manage your RFQs and track quotes'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {isSupplier ? (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 mb-1">Open RFQs</div>
                <div className="text-3xl font-bold text-indigo-600">{loadingData ? '—' : stats.openRfqs}</div>
                <div className="text-sm text-gray-500 mt-1">Available to quote</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 mb-1">Company</div>
                <div className="text-lg font-bold text-gray-900 truncate">{user.companyName || '—'}</div>
                <div className="text-sm text-gray-500 mt-1">Your supplier account</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
                <div className="text-sm font-medium text-gray-600 mb-2">Getting Started</div>
                <div className="text-sm text-gray-700">Browse the open RFQs below and click <strong>View</strong> to read the details and submit a quote.</div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 mb-1">Total RFQs</div>
                <div className="text-3xl font-bold text-gray-900">{loadingData ? '—' : stats.totalRfqs}</div>
                <div className="text-sm text-gray-500 mt-1">All time</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 mb-1">Open RFQs</div>
                <div className="text-3xl font-bold text-indigo-600">{loadingData ? '—' : stats.openRfqs}</div>
                <div className="text-sm text-gray-500 mt-1">Awaiting quotes</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 mb-1">Quotes Received</div>
                <div className="text-3xl font-bold text-green-600">{loadingData ? '—' : stats.quotesReceived}</div>
                <div className="text-sm text-gray-500 mt-1">Ready to compare</div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-sm font-medium text-gray-600 mb-1">Suppliers</div>
                <div className="text-3xl font-bold text-gray-900">{loadingData ? '—' : stats.activeSuppliers}</div>
                <div className="text-sm text-gray-500 mt-1">Active suppliers</div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          {isSupplier ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/rfqs" className="flex items-center justify-center gap-2 p-4 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium">
                <span className="text-xl">📋</span>
                Browse Open RFQs
              </Link>
              <Link href="/inventory" className="flex items-center justify-center gap-2 p-4 border-2 border-amber-500 text-amber-700 rounded-lg hover:bg-amber-50 transition font-medium">
                <span className="text-xl">🛢️</span>
                Product Inventory
              </Link>
              <Link href="/suppliers" className="flex items-center justify-center gap-2 p-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                <span className="text-xl">🏢</span>
                Supplier Directory
              </Link>
              <Link href="/profile" className="flex items-center justify-center gap-2 p-4 border-2 border-teal-500 text-teal-700 rounded-lg hover:bg-teal-50 transition font-medium">
                <span className="text-xl">👤</span>
                My Profile
              </Link>
            </div>
          ) : (
            <div className={`grid grid-cols-1 gap-4 ${isAdmin ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
              <Link href="/rfqs/new" className="flex items-center justify-center gap-2 p-4 border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition font-medium">
                <span className="text-xl">+</span>
                Create New RFQ
              </Link>
              <Link href="/rfqs" className="flex items-center justify-center gap-2 p-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                <span className="text-xl">📊</span>
                View All RFQs
              </Link>
              <Link href="/suppliers" className="flex items-center justify-center gap-2 p-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium">
                <span className="text-xl">🤝</span>
                Manage Suppliers
              </Link>
              <Link href="/profile" className="flex items-center justify-center gap-2 p-4 border-2 border-teal-500 text-teal-700 rounded-lg hover:bg-teal-50 transition font-medium">
                <span className="text-xl">👤</span>
                My Profile
              </Link>
              {isAdmin && (
                <Link href="/admin" className="flex items-center justify-center gap-2 p-4 border-2 border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition font-medium">
                  <span className="text-xl">⚙️</span>
                  Admin Panel
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recent RFQs */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {isSupplier ? 'Open RFQs Available to Quote' : 'Recent RFQs'}
            </h3>
            <Link href="/rfqs" className="text-sm text-indigo-600 hover:text-indigo-800">
              View all →
            </Link>
          </div>

          {loadingData ? (
            <div className="p-6 text-center text-gray-400">Loading...</div>
          ) : recentRfqs.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              {isSupplier
                ? 'No open RFQs at the moment. Check back soon.'
                : <><Link href="/rfqs/new" className="text-indigo-600 hover:underline">Create your first RFQ</Link></>
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left">RFQ Number</th>
                    <th className="px-6 py-3 text-left">Project</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Destination</th>
                    <th className="px-6 py-3 text-left">Quotes</th>
                    <th className="px-6 py-3 text-left">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentRfqs.map((rfq) => (
                    <tr key={rfq.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link href={`/rfqs/${rfq.id}`} className="text-indigo-600 hover:underline font-mono text-sm">
                          {rfq.rfqNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 max-w-xs truncate">
                        {rfq.projectName}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[rfq.status] || 'bg-gray-100 text-gray-700'}`}>
                          {rfq.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{rfq.deliveryCountry}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{rfq._count?.quotes ?? 0}</td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {new Date(rfq.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
