'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';

interface EnrichedQuote {
  id: number;
  rfqId: number;
  supplierId: number;
  price: number;
  currency: string;
  leadTimeWeeks: number | null;
  incoterm: string | null;
  paymentTerms: string | null;
  warrantyDescription: string | null;
  validUntil: string | null;
  notes: string | null;
  status: string;
  submittedAt: string;
  supplier: {
    id: number;
    companyName: string;
    country: string | null;
    supplierType: string | null;
    responsivenessScore: number;
  };
  isBestPrice: boolean;
  isFastestDelivery: boolean;
  isBalanced: boolean;
  riskFlags: string[];
  compositeScore: number;
  priceScore: number;
  leadTimeScore: number;
}

interface Recommendation {
  rank: number;
  quoteId: number;
  supplierId: number;
  supplierName: string;
  country: string | null;
  price: number;
  currency: string;
  leadTimeWeeks: number | null;
  compositeScore: number;
  reasons: string[];
  riskCount: number;
}

interface ComparisonData {
  rfqId: number;
  rfqNumber: string;
  quotes: EnrichedQuote[];
  recommendations: Recommendation[];
  savedRecommendation: { buyerNotes?: string } | null;
}

const RANK_COLORS = ['bg-yellow-400', 'bg-gray-300', 'bg-orange-300'];
const RANK_LABELS = ['Best Overall', 'Runner-up', 'Alternative'];

export default function QuoteComparisonPage() {
  const router = useRouter();
  const params = useParams();
  const { user, token, loading: authLoading } = useAuth();

  const [data, setData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const rfqId = params?.id as string;

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchComparison = useCallback(async () => {
    if (!token || !rfqId) return;
    try {
      setLoading(true);
      setError('');
      const res: any = await apiClient.getQuoteComparison(rfqId, token);
      setData(res.data);
      setBuyerNotes(res.data.savedRecommendation?.buyerNotes || '');
    } catch (err: any) {
      setError(err.message || 'Failed to load comparison');
    } finally {
      setLoading(false);
    }
  }, [token, rfqId]);

  useEffect(() => {
    if (user && token && rfqId) fetchComparison();
  }, [user, token, rfqId, fetchComparison]);

  const handleSaveNotes = async () => {
    if (!token) return;
    setSavingNotes(true);
    setNotesSaved(false);
    try {
      await apiClient.saveRecommendation(rfqId, { buyerNotes }, token);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const exportCsv = () => {
    if (!data) return;
    const headers = [
      'Supplier', 'Country', 'Price', 'Currency', 'Lead Time (weeks)',
      'Incoterms', 'Payment Terms', 'Warranty', 'Valid Until',
      'Status', 'Risk Flags', 'Composite Score'
    ];
    const rows = data.quotes.map(q => [
      q.supplier.companyName,
      q.supplier.country || '',
      q.price,
      q.currency,
      q.leadTimeWeeks ?? '',
      q.incoterm || '',
      q.paymentTerms || '',
      q.warrantyDescription || '',
      q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '',
      q.status,
      q.riskFlags.join('; '),
      q.compositeScore
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes-${data.rfqNumber}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', minimumFractionDigits: 2 }).format(amount);

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const renderStars = (score: number) =>
    '★'.repeat(Math.min(5, Math.round(score))) + '☆'.repeat(5 - Math.min(5, Math.round(score)));

  if (authLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href={`/rfqs/${rfqId}`} className="text-gray-500 hover:text-gray-900">← Back to RFQ</Link>
            <h1 className="text-2xl font-bold text-gray-900">Quote Comparison</h1>
            {data && (
              <span className="text-sm text-gray-500">{data.rfqNumber}</span>
            )}
          </div>
          <button
            onClick={exportCsv}
            disabled={!data || data.quotes.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 text-sm font-medium"
          >
            Export CSV
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-500">Loading comparison...</div>
        ) : !data || data.quotes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-5xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Quotes to Compare</h3>
            <p className="text-gray-600 mb-6">Submit at least one quote to see the comparison.</p>
            <Link href={`/rfqs/${rfqId}`} className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
              Back to RFQ
            </Link>
          </div>
        ) : (
          <>
            {/* ===== PROCUREMENT RECOMMENDATIONS ===== */}
            {data.recommendations.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Procurement Recommendations</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.recommendations.map((rec, i) => (
                    <div
                      key={rec.quoteId}
                      className={`relative bg-white rounded-xl shadow border-2 p-5 ${
                        i === 0 ? 'border-yellow-400' : i === 1 ? 'border-gray-300' : 'border-orange-300'
                      }`}
                    >
                      {/* Rank badge */}
                      <div className={`absolute -top-3 left-4 px-3 py-0.5 rounded-full text-xs font-bold text-white ${RANK_COLORS[i]}`}>
                        #{rec.rank} {RANK_LABELS[i]}
                      </div>

                      <div className="mt-2">
                        <h3 className="text-base font-bold text-gray-900">{rec.supplierName}</h3>
                        {rec.country && <p className="text-xs text-gray-500 mb-3">{rec.country}</p>}

                        <div className="flex gap-4 mb-3">
                          <div>
                            <div className="text-lg font-bold text-indigo-700">{formatCurrency(rec.price, rec.currency)}</div>
                            <div className="text-xs text-gray-400">Total price</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-gray-800">
                              {rec.leadTimeWeeks != null ? `${rec.leadTimeWeeks}w` : '—'}
                            </div>
                            <div className="text-xs text-gray-400">Lead time</div>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-green-700">{rec.compositeScore}</div>
                            <div className="text-xs text-gray-400">Score/100</div>
                          </div>
                        </div>

                        <div className="space-y-1 mb-3">
                          {rec.reasons.map((r, j) => (
                            <div key={j} className="flex items-center gap-1.5 text-xs text-gray-700">
                              <span className="text-green-500 font-bold">✓</span>
                              {r}
                            </div>
                          ))}
                        </div>

                        {rec.riskCount > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            <span>⚠️</span>
                            {rec.riskCount} risk flag{rec.riskCount > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ===== BUYER NOTES ===== */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Buyer Notes / Decision Rationale</h2>
              <textarea
                rows={3}
                value={buyerNotes}
                onChange={e => setBuyerNotes(e.target.value)}
                placeholder="Record your sourcing decision rationale here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
                {notesSaved && <span className="text-sm text-green-600">Notes saved.</span>}
              </div>
            </section>

            {/* ===== COMPARISON TABLE ===== */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  All Quotes
                  <span className="ml-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-sm rounded-full">{data.quotes.length}</span>
                </h2>
                <div className="flex gap-3 text-xs text-gray-600">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-400 inline-block"></span> Best Price</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-400 inline-block"></span> Fastest</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-100 border border-purple-400 inline-block"></span> Best Balance</span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg shadow">
                <table className="min-w-full bg-white text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Supplier</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Price</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Lead Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Incoterms</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Payment</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Warranty</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Valid Until</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Rating</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Score</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Risk Flags</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.quotes.map(quote => {
                      const rowBg =
                        quote.status === 'awarded' ? 'bg-green-50' :
                        quote.status === 'rejected' ? 'bg-gray-50 opacity-60' :
                        quote.isBestPrice && quote.isBalanced ? 'bg-purple-50' :
                        quote.isBestPrice ? 'bg-green-50' :
                        quote.isFastestDelivery ? 'bg-blue-50' :
                        quote.isBalanced ? 'bg-purple-50' : 'bg-white';

                      return (
                        <tr key={quote.id} className={`${rowBg} hover:brightness-95 transition`}>
                          {/* Supplier */}
                          <td className="px-4 py-4">
                            <div className="font-semibold text-gray-900">{quote.supplier.companyName}</div>
                            {quote.supplier.country && <div className="text-xs text-gray-400">{quote.supplier.country}</div>}
                            {quote.supplier.supplierType && <div className="text-xs text-indigo-500">{quote.supplier.supplierType}</div>}
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {quote.isBestPrice && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Best Price</span>
                              )}
                              {quote.isFastestDelivery && (
                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Fastest</span>
                              )}
                              {quote.isBalanced && (
                                <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Balanced</span>
                              )}
                            </div>
                          </td>

                          {/* Price */}
                          <td className="px-4 py-4">
                            <div className="font-bold text-gray-900">{formatCurrency(quote.price, quote.currency)}</div>
                            <div className="text-xs text-gray-400">{quote.currency}</div>
                          </td>

                          {/* Lead Time */}
                          <td className="px-4 py-4 text-gray-700">
                            {quote.leadTimeWeeks != null ? (
                              <span className={quote.isFastestDelivery ? 'font-bold text-blue-700' : ''}>
                                {quote.leadTimeWeeks} wk{quote.leadTimeWeeks !== 1 ? 's' : ''}
                              </span>
                            ) : <span className="text-gray-300">—</span>}
                          </td>

                          {/* Incoterms */}
                          <td className="px-4 py-4 text-gray-700">{quote.incoterm || <span className="text-gray-300">—</span>}</td>

                          {/* Payment */}
                          <td className="px-4 py-4 text-gray-700 whitespace-nowrap">{quote.paymentTerms || <span className="text-gray-300">—</span>}</td>

                          {/* Warranty */}
                          <td className="px-4 py-4 text-gray-700">{quote.warrantyDescription || <span className="text-gray-300">—</span>}</td>

                          {/* Valid Until */}
                          <td className="px-4 py-4 text-gray-600 whitespace-nowrap">{formatDate(quote.validUntil)}</td>

                          {/* Responsiveness */}
                          <td className="px-4 py-4 text-yellow-500 whitespace-nowrap text-sm">
                            {renderStars(quote.supplier.responsivenessScore)}
                          </td>

                          {/* Composite Score */}
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    quote.compositeScore >= 70 ? 'bg-green-500' :
                                    quote.compositeScore >= 40 ? 'bg-yellow-500' : 'bg-red-400'
                                  }`}
                                  style={{ width: `${quote.compositeScore}%` }}
                                />
                              </div>
                              <span className="text-sm font-semibold text-gray-700">{quote.compositeScore}</span>
                            </div>
                          </td>

                          {/* Risk Flags */}
                          <td className="px-4 py-4">
                            {quote.riskFlags.length === 0 ? (
                              <span className="text-green-600 text-xs font-medium">No flags</span>
                            ) : (
                              <div className="space-y-1">
                                {quote.riskFlags.map((flag, i) => (
                                  <div key={i} className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                                    <span>⚠️</span>
                                    {flag}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                              quote.status === 'awarded' ? 'bg-green-100 text-green-800' :
                              quote.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {quote.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="mt-4 bg-white rounded-lg p-4 border border-gray-100">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Score Methodology</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-600">
                  <div className="flex items-start gap-2">
                    <span className="text-green-500 font-bold mt-0.5">40%</span>
                    <div><strong>Price</strong> — Normalized rank (lowest price = 100 pts)</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">40%</span>
                    <div><strong>Speed</strong> — Normalized rank (shortest lead time = 100 pts)</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-500 font-bold mt-0.5">20%</span>
                    <div><strong>Reliability</strong> — Supplier responsiveness rating (1–5 stars)</div>
                  </div>
                </div>
              </div>

              {/* Notes section (if any quote has notes) */}
              {data.quotes.some(q => q.notes) && (
                <div className="mt-4 bg-white rounded-lg p-4 border border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Supplier Notes</div>
                  <div className="space-y-2">
                    {data.quotes.filter(q => q.notes).map(q => (
                      <div key={q.id} className="p-3 bg-gray-50 rounded border border-gray-100">
                        <div className="text-xs font-semibold text-gray-600 mb-1">{q.supplier.companyName}</div>
                        <div className="text-sm text-gray-700">{q.notes}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
