'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

interface ValidationFlag {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

interface NormalizationResult {
  isNormalized: boolean;
  qualityScore: number;
  validationFlags: ValidationFlag[];
  normalizedData: any;
}

interface Quote {
  id: number;
  rfqId: number;
  supplier: { id: number; companyName: string; country: string };
  price: number;
  currency: string;
  leadTimeWeeks: number | null;
  incoterm: string | null;
  paymentTerms: string | null;
  warrantyDescription: string | null;
  validUntil: string | null;
  notes: string | null;
  status: 'submitted' | 'awarded' | 'rejected' | 'withdrawn';
  submittedAt: string;
}

interface RfqDetail {
  id: number;
  rfqNumber: string;
  projectName: string;
  status: string;
  categoryId?: number;
  industry?: string;
  deliveryCountry?: string;
  deliveryCity?: string;
  deliveryAddress?: string;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
  description?: string;
  specifications?: string;
  quantity?: number;
  quantityUom?: string;
  responseDeadline?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  isNormalized?: boolean;
  normalizationFlags?: ValidationFlag[];
  normalizedData?: any;
  buyer: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    companyName?: string;
  };
  category?: { id: number; name: string; slug: string };
  rfqSuppliers?: any[];
  quotes?: any[];
}

const initialQuoteForm = {
  supplierName: '',
  supplierCountry: '',
  unitPrice: '',
  totalPrice: '',
  currency: 'USD',
  leadTimeDays: '',
  validityDays: '30',
  notes: '',
  incoterms: 'EXW',
  paymentTerms: 'Net 30',
  warranty: '12 months',
};

export default function RfqDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token, loading: authLoading } = useAuth();

  const [rfq, setRfq] = useState<RfqDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Normalization state
  const [normalizing, setNormalizing] = useState(false);
  const [normalizationResult, setNormalizationResult] = useState<NormalizationResult | null>(null);

  // Supplier matching state
  const [findingSuppliers, setFindingSuppliers] = useState(false);
  const [supplierMatches, setSupplierMatches] = useState<any[] | null>(null);

  // Quote state
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [quoteForm, setQuoteForm] = useState(initialQuoteForm);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState('');
  const [updatingQuoteId, setUpdatingQuoteId] = useState<number | null>(null);

  const rfqId = params?.id as string;

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && token && rfqId) {
      fetchRfq();
      fetchQuotes();
    }
  }, [user, token, rfqId]);

  const fetchRfq = async () => {
    try {
      setLoading(true);
      setError('');
      if (!token) throw new Error('Authentication token not found');
      const response: any = await apiClient.getRfqById(parseInt(rfqId), token);
      setRfq(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch RFQ details');
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      setLoadingQuotes(true);
      if (!token) return;
      const response: any = await apiClient.getQuotesForRfq(parseInt(rfqId), token);
      setQuotes(response.data || []);
    } catch (err: any) {
      console.error('Fetch quotes error:', err);
    } finally {
      setLoadingQuotes(false);
    }
  };

  const handleNormalize = async () => {
    try {
      setNormalizing(true);
      setError('');
      if (!token) throw new Error('Authentication token not found');
      const response: any = await apiClient.normalizeRfq(rfqId, token);
      setNormalizationResult(response.data.normalization);
      if (response.data.rfq) setRfq(response.data.rfq);
    } catch (err: any) {
      setError(err.message || 'Failed to normalize RFQ');
    } finally {
      setNormalizing(false);
    }
  };

  const handleFindSuppliers = async () => {
    try {
      setFindingSuppliers(true);
      setError('');
      if (!token) throw new Error('Authentication token not found');
      const response: any = await apiClient.getMatchingSuppliers(rfqId, token);
      setSupplierMatches(response.data.matches || []);
    } catch (err: any) {
      setError(err.message || 'Failed to find matching suppliers');
    } finally {
      setFindingSuppliers(false);
    }
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteError('');
    setSubmittingQuote(true);

    try {
      if (!token) throw new Error('Authentication token not found');
      await apiClient.submitQuote(parseInt(rfqId), quoteForm, token);
      setQuoteForm(initialQuoteForm);
      setShowQuoteForm(false);
      await fetchQuotes();
    } catch (err: any) {
      setQuoteError(err.message || 'Failed to submit quote');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleQuoteStatus = async (quoteId: number, status: string) => {
    try {
      setUpdatingQuoteId(quoteId);
      if (!token) throw new Error('Authentication token not found');
      await apiClient.updateQuoteStatus(parseInt(rfqId), quoteId, status, token);
      await fetchQuotes();
      if (status === 'awarded') await fetchRfq();
    } catch (err: any) {
      setError(err.message || 'Failed to update quote status');
    } finally {
      setUpdatingQuoteId(null);
    }
  };

  const handlePublishRfq = async () => {
    try {
      if (!token) throw new Error('Authentication token not found');
      await apiClient.publishRfq(parseInt(rfqId), token);
      await fetchRfq();
    } catch (err: any) {
      setError(err.message || 'Failed to publish RFQ');
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'awarded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'awarded': return 'bg-green-100 text-green-800 border border-green-300';
      case 'submitted': return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'rejected': return 'bg-red-100 text-red-800 border border-red-300';
      case 'withdrawn': return 'bg-gray-100 text-gray-600 border border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const lowestQuote = quotes.filter(q => q.status !== 'rejected').reduce(
    (min: Quote | null, q) => (!min || q.price < min.price ? q : min),
    null
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/rfqs" className="text-gray-600 hover:text-gray-900">← Back to RFQs</Link>
            <h1 className="text-2xl font-bold text-gray-900">RFQ Details</h1>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{user.email}</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600">Loading RFQ details...</div>
          </div>
        ) : !rfq ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">RFQ Not Found</h3>
            <Link href="/rfqs" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium">
              Back to RFQs
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">{rfq.projectName}</h2>
                  <p className="text-gray-600">RFQ Number: {rfq.rfqNumber}</p>
                </div>
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusColor(rfq.status)}`}>
                  {rfq.status}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                <div>
                  <div className="text-sm text-gray-500">Created</div>
                  <div className="font-medium">{formatDate(rfq.createdAt)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Response Deadline</div>
                  <div className="font-medium">{formatDate(rfq.responseDeadline)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Published</div>
                  <div className="font-medium">{formatDate(rfq.publishedAt)}</div>
                </div>
              </div>
            </div>

            {/* Description & Specs */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description & Specifications</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
                  <p className="text-gray-900 whitespace-pre-wrap">{rfq.description || 'No description provided'}</p>
                </div>
                {rfq.specifications && (
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Technical Specifications</div>
                    <p className="text-gray-900 whitespace-pre-wrap">{rfq.specifications}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Category & Quantity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category</span>
                    <span className="font-medium">{rfq.category?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Industry</span>
                    <span className="font-medium">{rfq.industry || 'N/A'}</span>
                  </div>
                  {rfq.quantity && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quantity</span>
                      <span className="font-medium">{rfq.quantity} {rfq.quantityUom || 'units'}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Country</span>
                    <span className="font-medium">{rfq.deliveryCountry || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">City</span>
                    <span className="font-medium">{rfq.deliveryCity || 'N/A'}</span>
                  </div>
                  {rfq.deliveryWindowStart && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Window</span>
                      <span className="font-medium">{formatDate(rfq.deliveryWindowStart)} – {formatDate(rfq.deliveryWindowEnd)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ===== QUOTES SECTION ===== */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Quotes Received
                    {quotes.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                        {quotes.length}
                      </span>
                    )}
                  </h3>
                  {lowestQuote && (
                    <p className="text-sm text-green-700 mt-1">
                      Best price: {formatCurrency(lowestQuote.price, lowestQuote.currency)} from {lowestQuote.supplier.companyName}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  {user.role !== 'supplier' && quotes.length >= 2 && (
                    <Link
                      href={`/rfqs/${rfqId}/comparison`}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium text-sm"
                    >
                      Compare Quotes
                    </Link>
                  )}
                  {user.role === 'supplier' && rfq.status === 'open' && (
                    <button
                      onClick={() => {
                        if (!showQuoteForm) {
                          setQuoteForm(prev => ({
                            ...prev,
                            supplierName: prev.supplierName || user.companyName || '',
                          }));
                        }
                        setShowQuoteForm(!showQuoteForm);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      {showQuoteForm ? 'Cancel' : '+ Submit Quote'}
                    </button>
                  )}
                </div>
              </div>

              {/* Quote submission form */}
              {showQuoteForm && (
                <form onSubmit={handleSubmitQuote} className="mb-6 p-5 border-2 border-indigo-100 rounded-xl bg-indigo-50">
                  <h4 className="text-base font-semibold text-gray-900 mb-4">New Quote</h4>
                  {quoteError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {quoteError}
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                      <input
                        type="text"
                        required
                        value={quoteForm.supplierName}
                        onChange={e => setQuoteForm({ ...quoteForm, supplierName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g. Acme Corp"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Country</label>
                      <input
                        type="text"
                        value={quoteForm.supplierCountry}
                        onChange={e => setQuoteForm({ ...quoteForm, supplierCountry: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g. Germany"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={quoteForm.unitPrice}
                        onChange={e => setQuoteForm({ ...quoteForm, unitPrice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Price</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={quoteForm.totalPrice}
                        onChange={e => setQuoteForm({ ...quoteForm, totalPrice: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Auto-calculated if empty"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                      <select
                        value={quoteForm.currency}
                        onChange={e => setQuoteForm({ ...quoteForm, currency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option>USD</option>
                        <option>EUR</option>
                        <option>GBP</option>
                        <option>JPY</option>
                        <option>CNY</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Lead Time (days) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={quoteForm.leadTimeDays}
                        onChange={e => setQuoteForm({ ...quoteForm, leadTimeDays: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Incoterms</label>
                      <select
                        value={quoteForm.incoterms}
                        onChange={e => setQuoteForm({ ...quoteForm, incoterms: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option>EXW</option>
                        <option>FOB</option>
                        <option>CIF</option>
                        <option>DDP</option>
                        <option>DAP</option>
                        <option>FCA</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                      <input
                        type="text"
                        value={quoteForm.paymentTerms}
                        onChange={e => setQuoteForm({ ...quoteForm, paymentTerms: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g. Net 30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warranty</label>
                      <input
                        type="text"
                        value={quoteForm.warranty}
                        onChange={e => setQuoteForm({ ...quoteForm, warranty: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g. 12 months"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quote Validity (days)</label>
                      <input
                        type="number"
                        min="1"
                        value={quoteForm.validityDays}
                        onChange={e => setQuoteForm({ ...quoteForm, validityDays: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        rows={3}
                        value={quoteForm.notes}
                        onChange={e => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Additional notes, terms, or comments..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button
                      type="submit"
                      disabled={submittingQuote}
                      className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
                    >
                      {submittingQuote ? 'Submitting...' : 'Submit Quote'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowQuoteForm(false); setQuoteError(''); }}
                      className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Quotes table */}
              {loadingQuotes ? (
                <p className="text-gray-500 text-sm">Loading quotes...</p>
              ) : quotes.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-3">📋</div>
                  <p className="font-medium text-gray-600">No quotes yet</p>
                  <p className="text-sm mt-1">Click "+ Submit Quote" to add the first quote</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="px-4 py-3">Supplier</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Lead Time</th>
                        <th className="px-4 py-3">Incoterms</th>
                        <th className="px-4 py-3">Warranty</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {quotes.map(quote => (
                        <tr
                          key={quote.id}
                          className={`${
                            quote.status === 'awarded' ? 'bg-green-50' :
                            quote.status === 'rejected' ? 'bg-gray-50 opacity-60' : 'bg-white'
                          } hover:bg-gray-50 transition`}
                        >
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">{quote.supplier.companyName}</div>
                            <div className="text-xs text-gray-500">{quote.supplier.country}</div>
                            {quote.id === lowestQuote?.id && quote.status !== 'rejected' && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                Lowest
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-gray-900 font-semibold">
                            {formatCurrency(quote.price, quote.currency)}
                            <div className="text-xs text-gray-400">{quote.currency}</div>
                          </td>
                          <td className="px-4 py-4 text-gray-700">
                            {quote.leadTimeWeeks ? `${quote.leadTimeWeeks} wks` : 'N/A'}
                          </td>
                          <td className="px-4 py-4 text-gray-700 text-sm">
                            <div>{quote.incoterm || '—'}</div>
                            <div className="text-xs text-gray-400">{quote.paymentTerms}</div>
                          </td>
                          <td className="px-4 py-4 text-gray-700 text-sm">{quote.warrantyDescription || '—'}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${getQuoteStatusColor(quote.status)}`}>
                              {quote.status}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {user.role !== 'supplier' && quote.status !== 'awarded' && quote.status !== 'rejected' && (
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => handleQuoteStatus(quote.id, 'awarded')}
                                  disabled={updatingQuoteId === quote.id}
                                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                  Award
                                </button>
                                <button
                                  onClick={() => handleQuoteStatus(quote.id, 'rejected')}
                                  disabled={updatingQuoteId === quote.id}
                                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {quote.status === 'awarded' && (
                              <span className="text-green-700 font-semibold text-sm">Awarded</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Quote notes */}
                  {quotes.some(q => q.notes) && (
                    <div className="mt-4 space-y-2">
                      {quotes.filter(q => q.notes && q.status !== 'rejected').map(quote => (
                        <div key={`note-${quote.id}`} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="text-xs font-semibold text-gray-600 mb-1">{quote.supplier.companyName} — Notes:</div>
                          <div className="text-sm text-gray-700">{quote.notes}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Normalization — buyers/admins only */}
            {user.role !== 'supplier' && <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Data Normalization</h3>
                <button
                  onClick={handleNormalize}
                  disabled={normalizing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50"
                >
                  {normalizing ? 'Normalizing...' : rfq.isNormalized ? 'Re-normalize' : 'Normalize Data'}
                </button>
              </div>

              {normalizationResult && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm font-medium text-gray-700">Quality Score:</div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-4">
                        <div
                          className={`h-4 rounded-full ${
                            normalizationResult.qualityScore >= 80 ? 'bg-green-600' :
                            normalizationResult.qualityScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                          }`}
                          style={{ width: `${normalizationResult.qualityScore}%` }}
                        />
                      </div>
                      <span className="text-lg font-bold">{normalizationResult.qualityScore}/100</span>
                    </div>
                  </div>

                  {normalizationResult.validationFlags?.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Validation Issues:</div>
                      <div className="space-y-2">
                        {normalizationResult.validationFlags.map((flag, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg flex items-start gap-2 ${
                              flag.severity === 'error' ? 'bg-red-50 border border-red-200' :
                              flag.severity === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
                              'bg-blue-50 border border-blue-200'
                            }`}
                          >
                            <span className="font-semibold text-sm">
                              {flag.severity === 'error' ? '❌' : flag.severity === 'warning' ? '⚠️' : 'ℹ️'}
                            </span>
                            <div className="flex-1">
                              <div className="text-xs font-semibold uppercase text-gray-600">{flag.field}</div>
                              <div className="text-sm">{flag.message}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {normalizationResult.isNormalized && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                        View Normalized JSON
                      </summary>
                      <pre className="mt-2 p-4 bg-gray-50 rounded-lg text-xs overflow-x-auto border border-gray-200">
                        {JSON.stringify(normalizationResult.normalizedData, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {!normalizationResult && !rfq.isNormalized && (
                <p className="text-gray-500 text-sm">
                  Click "Normalize Data" to validate and standardize this RFQ for distribution.
                </p>
              )}
            </div>}

            {/* Supplier Matching — buyers/admins only */}
            {user.role !== 'supplier' && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Matching Suppliers</h3>
                  <button
                    onClick={handleFindSuppliers}
                    disabled={findingSuppliers}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50"
                  >
                    {findingSuppliers ? 'Finding...' : 'Find Matching Suppliers'}
                  </button>
                </div>

                {supplierMatches === null && (
                  <p className="text-gray-500 text-sm">Click "Find Matching Suppliers" to see which suppliers match this RFQ.</p>
                )}

                {supplierMatches !== null && supplierMatches.length === 0 && (
                  <p className="text-gray-500">No matching suppliers found for this RFQ.</p>
                )}

                {supplierMatches && supplierMatches.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">{supplierMatches.length} suppliers found</p>
                    {supplierMatches.map((match: any) => (
                      <div key={match.supplierId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-900">{match.supplier.companyName}</h4>
                            <p className="text-sm text-gray-500">{match.supplier.country}</p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                              match.tier?.tier === 'excellent' ? 'bg-green-100 text-green-800' :
                              match.tier?.tier === 'good' ? 'bg-blue-100 text-blue-800' :
                              match.tier?.tier === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {match.tier?.label}
                            </span>
                            <div className="text-sm font-semibold mt-1">{Math.round(match.score)}/100</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {match.matchReasons.map((reason: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">✓ {reason}</span>
                          ))}
                        </div>
                        {match.supplier.certifications?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {match.supplier.certifications.map((cert: string) => (
                              <span key={cert} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">{cert}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Draft actions — buyers/admins only */}
            {user.role !== 'supplier' && rfq.status === 'draft' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                <div className="flex gap-4">
                  <button
                    onClick={handlePublishRfq}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Publish RFQ
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
