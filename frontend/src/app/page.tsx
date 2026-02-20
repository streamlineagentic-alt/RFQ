'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gradient-to-b from-blue-50 to-white">
      <div className="z-10 max-w-5xl w-full items-center justify-center">
        <h1 className="text-5xl font-bold text-center mb-4 text-gray-900">
          RFQ Management Platform
        </h1>
        <p className="text-center text-xl mb-8 text-gray-600">
          Streamline your procurement with intelligent supplier matching and quote comparison
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <Link
            href="/login"
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-8 py-3 bg-white text-indigo-600 border-2 border-indigo-600 rounded-lg hover:bg-indigo-50 transition font-semibold"
          >
            Register as Buyer
          </Link>
          <Link
            href="/register/supplier"
            className="px-8 py-3 bg-white text-green-700 border-2 border-green-600 rounded-lg hover:bg-green-50 transition font-semibold"
          >
            Register as Supplier
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="text-indigo-600 text-3xl mb-3">📝</div>
            <h2 className="text-xl font-semibold mb-2">RFQ Intake</h2>
            <p className="text-gray-600">
              Upload or create RFQs with structured data capture and validation
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="text-indigo-600 text-3xl mb-3">🤝</div>
            <h2 className="text-xl font-semibold mb-2">Supplier Matching</h2>
            <p className="text-gray-600">
              AI-powered matching based on categories, regions, and compliance
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="text-indigo-600 text-3xl mb-3">📊</div>
            <h2 className="text-xl font-semibold mb-2">Quote Comparison</h2>
            <p className="text-gray-600">
              Side-by-side analysis with risk flags and recommendations
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
