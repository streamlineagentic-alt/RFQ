'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

const SUPPLIER_TYPES = ['manufacturer', 'distributor', 'trader', 'service_provider', 'other'];

export default function SupplierRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Account
  const [account, setAccount] = useState({
    email: '', password: '', confirmPassword: '',
    firstName: '', lastName: '', companyName: '',
  });

  // Step 2: Supplier profile
  const [profile, setProfile] = useState({
    supplierType: 'manufacturer',
    contactName: '', contactEmail: '', contactPhone: '',
    country: '', city: '', website: '',
    description: '',
    regionsServed: '',
    certifications: '',
    canExportToUkraine: false,
  });

  const handleAccountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAccount(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (account.password !== account.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (account.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Register the user account as supplier role
      const regRes: any = await apiClient.register({
        email: account.email,
        password: account.password,
        role: 'supplier',
        firstName: account.firstName,
        lastName: account.lastName,
        companyName: account.companyName,
      });

      const token = regRes.data.token;

      // 2. Create the supplier profile
      await apiClient.createSupplier({
        companyName: account.companyName,
        supplierType: profile.supplierType,
        contactName: profile.contactName || `${account.firstName} ${account.lastName}`.trim(),
        contactEmail: profile.contactEmail || account.email,
        contactPhone: profile.contactPhone,
        country: profile.country,
        city: profile.city,
        website: profile.website,
        description: profile.description,
        regionsServed: profile.regionsServed ? profile.regionsServed.split(',').map(s => s.trim()).filter(Boolean) : [],
        certifications: profile.certifications ? profile.certifications.split(',').map(s => s.trim()).filter(Boolean) : [],
        canExportToUkraine: profile.canExportToUkraine,
      }, token);

      router.push('/login?registered=supplier');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Supplier Registration</h1>
          <p className="text-gray-600 mt-2">Register as a supplier to receive RFQs and submit quotes</p>
          <div className="flex items-center justify-center gap-4 mt-4">
            {[1, 2].map(n => (
              <div key={n} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= n ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>{n}</div>
                <span className="text-sm text-gray-600">{n === 1 ? 'Account' : 'Profile'}</span>
                {n < 2 && <div className="w-8 h-px bg-gray-300" />}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input name="firstName" type="text" value={account.firstName} onChange={handleAccountChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input name="lastName" type="text" value={account.lastName} onChange={handleAccountChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input name="companyName" type="text" required value={account.companyName} onChange={handleAccountChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input name="email" type="email" required value={account.email} onChange={handleAccountChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input name="password" type="password" required value={account.password} onChange={handleAccountChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input name="confirmPassword" type="password" required value={account.confirmPassword} onChange={handleAccountChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button type="submit" className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                Continue →
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Supplier Profile</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Type *</label>
                  <select name="supplierType" value={profile.supplierType} onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500">
                    {SUPPLIER_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <input name="country" type="text" required value={profile.country} onChange={handleProfileChange}
                    placeholder="e.g. Germany"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input name="city" type="text" value={profile.city} onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input name="website" type="url" value={profile.website} onChange={handleProfileChange}
                    placeholder="https://"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input name="contactEmail" type="email" value={profile.contactEmail} onChange={handleProfileChange}
                  placeholder="Leave blank to use account email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input name="contactPhone" type="tel" value={profile.contactPhone} onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={3} value={profile.description} onChange={handleProfileChange}
                  placeholder="Brief description of your company and capabilities"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Regions Served <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                <input name="regionsServed" type="text" value={profile.regionsServed} onChange={handleProfileChange}
                  placeholder="e.g. Europe, Middle East, North America"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certifications <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                <input name="certifications" type="text" value={profile.certifications} onChange={handleProfileChange}
                  placeholder="e.g. ISO 9001, CE, FDA"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="flex items-center gap-3">
                <input name="canExportToUkraine" type="checkbox" id="canExport"
                  checked={profile.canExportToUkraine} onChange={handleProfileChange}
                  className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="canExport" className="text-sm text-gray-700">Can export to Ukraine</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                  ← Back
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
                  {loading ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account? <Link href="/login" className="text-indigo-600 hover:underline">Sign in</Link>
          {' · '}
          <Link href="/register" className="text-indigo-600 hover:underline">Register as Buyer</Link>
        </p>
      </div>
    </div>
  );
}
