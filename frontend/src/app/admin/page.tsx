'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

interface User {
  id: number;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, token, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'categories' | 'inventory'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Category form
  const [newCat, setNewCat] = useState({ name: '', slug: '', description: '' });
  const [savingCat, setSavingCat] = useState(false);

  // Inventory import
  const [inventoryFile, setInventoryFile] = useState<File | null>(null);
  const [importingInventory, setImportingInventory] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; total: number; errors: string[] } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'admin' && token) {
      fetchData();
    }
  }, [user, token]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [usersRes, catsRes]: any[] = await Promise.all([
        apiClient.getUsers(token!),
        apiClient.getCategories(token!),
      ]);
      setUsers(usersRes.data || []);
      setCategories(catsRes.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const toggleUser = async (userId: number, currentlyActive: boolean) => {
    try {
      await apiClient.updateUserStatus(userId, !currentlyActive, token!);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !currentlyActive } : u));
      setSuccess(`User ${currentlyActive ? 'deactivated' : 'activated'} successfully`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    setError('');
    try {
      const res: any = await apiClient.createCategory(newCat, token!);
      setCategories(prev => [...prev, res.data]);
      setNewCat({ name: '', slug: '', description: '' });
      setSuccess('Category created successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Delete category "${name}"? This may affect existing RFQs.`)) return;
    try {
      await apiClient.deleteCategory(id, token!);
      setCategories(prev => prev.filter(c => c.id !== id));
      setSuccess('Category deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    }
  };

  const handleInventoryImport = async () => {
    if (!inventoryFile || !token) return;
    setImportingInventory(true);
    setImportResult(null);
    setError('');
    try {
      const res: any = await apiClient.importInventoryCsv(inventoryFile, token);
      setImportResult(res.data);
      setInventoryFile(null);
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImportingInventory(false);
    }
  };

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>;
  }

  if (user.role !== 'admin') return null;

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800',
      buyer: 'bg-blue-100 text-blue-800',
      supplier: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">← Dashboard</Link>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded">ADMIN</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}
            <button onClick={() => setError('')} className="ml-2 text-red-500 hover:text-red-700">×</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">{success}</div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {(['users', 'categories', 'inventory'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'users' ? `Users (${users.length})` : tab === 'categories' ? `Categories (${categories.length})` : 'Inventory Import'}
            </button>
          ))}
        </div>

        {loadingData ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : activeTab === 'inventory' ? (
          /* Inventory Import */
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Inventory from CSV / Excel</h3>
            <p className="text-sm text-gray-500 mb-6">
              Upload a <code>.csv</code> or <code>.xlsx</code> file. Required columns: <strong>sku</strong>, <strong>description</strong>, <strong>qty</strong>.
              Optional: <em>price, currency, condition, sector, oem, mpn, shipFromCountry, earliestShipDate</em>.
            </p>

            <div className="flex items-center gap-4 mb-4">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={e => { setInventoryFile(e.target.files?.[0] || null); setImportResult(null); }}
                className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              <button
                onClick={handleInventoryImport}
                disabled={!inventoryFile || importingInventory}
                className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50 whitespace-nowrap"
              >
                {importingInventory ? 'Importing...' : 'Import'}
              </button>
            </div>

            {importResult && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-700">{importResult.created}</div>
                    <div className="text-sm text-green-600">Upserted</div>
                  </div>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-2xl font-bold text-yellow-700">{importResult.skipped}</div>
                    <div className="text-sm text-yellow-600">Skipped</div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-2xl font-bold text-gray-700">{importResult.total}</div>
                    <div className="text-sm text-gray-600">Total Rows</div>
                  </div>
                </div>
                {importResult.errors.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm font-semibold text-red-700 mb-2">Errors ({importResult.errors.length}):</div>
                    <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
                      {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeTab === 'users' ? (
          /* Users Table */
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">User</th>
                  <th className="px-6 py-3 text-left">Company</th>
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Joined</th>
                  <th className="px-6 py-3 text-left">Last Login</th>
                  <th className="px-6 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50 ${!u.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.companyName || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${roleBadge(u.role)}`}>{u.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {u.id !== user.id && (
                        <button
                          onClick={() => toggleUser(u.id, u.isActive)}
                          className={`text-xs px-3 py-1 rounded font-medium ${
                            u.isActive
                              ? 'bg-red-50 text-red-700 hover:bg-red-100'
                              : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Categories */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create form */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Category</h3>
              <form onSubmit={handleCreateCategory} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text" required value={newCat.name}
                    onChange={e => setNewCat(p => ({ ...p, name: e.target.value, slug: autoSlug(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Medical Equipment"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text" required value={newCat.slug}
                    onChange={e => setNewCat(p => ({ ...p, slug: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    placeholder="medical-equipment"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newCat.description} rows={2}
                    onChange={e => setNewCat(p => ({ ...p, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button type="submit" disabled={savingCat}
                  className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
                  {savingCat ? 'Saving...' : '+ Add Category'}
                </button>
              </form>
            </div>

            {/* Category list */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Slug</th>
                    <th className="px-6 py-3 text-left">Description</th>
                    <th className="px-6 py-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {categories.length === 0 ? (
                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400">No categories yet</td></tr>
                  ) : categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                      <td className="px-6 py-4 font-mono text-sm text-gray-500">{cat.slug}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{cat.description || '—'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="text-xs px-2 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
