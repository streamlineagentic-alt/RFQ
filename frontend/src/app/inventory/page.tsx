'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api/client';

const SECTOR_COLORS: Record<string, string> = {
  upstream: 'bg-amber-100 text-amber-800',
  midstream: 'bg-blue-100 text-blue-800',
  downstream: 'bg-purple-100 text-purple-800',
  consumer: 'bg-green-100 text-green-800',
};

const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  surplus_new: 'Surplus New',
  refurbished: 'Refurbished',
  used: 'Used',
};

const CONDITION_COLORS: Record<string, string> = {
  new: 'bg-green-100 text-green-800',
  surplus_new: 'bg-yellow-100 text-yellow-800',
  refurbished: 'bg-orange-100 text-orange-800',
  used: 'bg-gray-100 text-gray-700',
};

function formatPrice(price: any, currency: string) {
  if (!price) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD', maximumFractionDigits: 0 }).format(Number(price));
}

export default function InventoryPage() {
  const router = useRouter();
  const { user, token, loading } = useAuth();

  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loadingData, setLoadingData] = useState(true);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [sector, setSector] = useState('');
  const [productFamily, setProductFamily] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [h2s, setH2s] = useState('');
  const [nace, setNace] = useState('');
  const [condition, setCondition] = useState('');

  // Filter options from API
  const [sectors, setSectors] = useState<string[]>([]);
  const [families, setFamilies] = useState<string[]>([]);
  const [vendors, setVendors] = useState<{ id: number; name: string }[]>([]);

  // Selected item for detail panel
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  // Load filter options once
  useEffect(() => {
    if (!token) return;
    apiClient.getInventoryFilters(token).then((res: any) => {
      setSectors(res.data?.sectors || []);
      setFamilies(res.data?.productFamilies || []);
      setVendors(res.data?.vendors || []);
    }).catch(console.error);
  }, [token]);

  const fetchItems = useCallback(async (page = 1) => {
    if (!token) return;
    setLoadingData(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '30' };
      if (keyword) params.keyword = keyword;
      if (sector) params.sector = sector;
      if (productFamily) params.productFamily = productFamily;
      if (vendorId) params.vendorId = vendorId;
      if (h2s) params.h2s = h2s;
      if (nace) params.nace = nace;
      if (condition) params.condition = condition;

      const res: any = await apiClient.getInventory(params, token);
      setItems(res.data || []);
      setPagination(res.pagination || { total: 0, page: 1, pages: 1 });
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingData(false);
    }
  }, [token, keyword, sector, productFamily, vendorId, h2s, nace, condition]);

  useEffect(() => {
    fetchItems(1);
  }, [fetchItems]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchItems(1);
  };

  const clearFilters = () => {
    setKeyword(''); setSector(''); setProductFamily('');
    setVendorId(''); setH2s(''); setNace(''); setCondition('');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-xl">Loading...</div></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-xl font-bold text-gray-900">Supplier Inventory</h1>
          </div>
          <div className="text-sm text-gray-500">
            {pagination.total} products across {vendors.length} vendors
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex gap-6">
        {/* Sidebar filters */}
        <aside className="w-64 flex-shrink-0">
          <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button type="button" onClick={clearFilters} className="text-xs text-indigo-600 hover:underline">Clear all</button>
            </div>

            {/* Keyword */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Keyword / Part No.</label>
              <input
                type="text"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="e.g. PDC bit, API 6A, X65..."
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Sector */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Sector</label>
              <select value={sector} onChange={e => setSector(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">All sectors</option>
                {sectors.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>

            {/* Product family */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Product Family</label>
              <select value={productFamily} onChange={e => setProductFamily(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">All families</option>
                {families.map(f => <option key={f as string} value={f as string}>{f as string}</option>)}
              </select>
            </div>

            {/* Vendor */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vendor</label>
              <select value={vendorId} onChange={e => setVendorId(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">All vendors</option>
                {vendors.map(v => <option key={v.id} value={String(v.id)}>{v.name}</option>)}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
              <select value={condition} onChange={e => setCondition(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="">Any condition</option>
                <option value="new">New</option>
                <option value="surplus_new">Surplus New</option>
                <option value="refurbished">Refurbished</option>
                <option value="used">Used</option>
              </select>
            </div>

            {/* Service flags */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-600">Service Requirements</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={h2s === 'true'} onChange={e => setH2s(e.target.checked ? 'true' : '')}
                  className="rounded border-gray-300 text-indigo-600" />
                <span className="text-sm text-gray-700">H2S / Sour Service</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={nace === 'true'} onChange={e => setNace(e.target.checked ? 'true' : '')}
                  className="rounded border-gray-300 text-indigo-600" />
                <span className="text-sm text-gray-700">NACE MR0175 Compliant</span>
              </label>
            </div>

            <button type="submit"
              className="w-full py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition">
              Search
            </button>
          </form>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Sector quick-tabs */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['', 'upstream', 'midstream', 'downstream', 'consumer'].map(s => (
              <button key={s} onClick={() => setSector(s)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  sector === s
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}>
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {loadingData ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">Loading inventory...</div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              No products found matching your filters.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {items.map(item => {
                  const spec = item.oilGasSpec;
                  return (
                    <div key={item.id}
                      onClick={() => setSelected(selected?.id === item.id ? null : item)}
                      className={`bg-white rounded-lg shadow p-4 cursor-pointer transition border-2 ${
                        selected?.id === item.id ? 'border-indigo-500' : 'border-transparent hover:border-gray-200'
                      }`}>
                      {/* Top row */}
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex gap-2 mb-1">
                            {spec?.sector && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${SECTOR_COLORS[spec.sector] || 'bg-gray-100 text-gray-700'}`}>
                                {spec.sector}
                              </span>
                            )}
                            {spec?.productFamily && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                {spec.productFamily}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 line-clamp-2">{item.description}</p>
                        </div>
                        <div className="ml-3 text-right flex-shrink-0">
                          <div className="text-lg font-bold text-indigo-700">{formatPrice(item.price, item.currency)}</div>
                          <div className="text-xs text-gray-500">per {item.qtyUom}</div>
                        </div>
                      </div>

                      {/* Meta row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mb-2">
                        <span>SKU: <span className="text-gray-700 font-mono">{item.vendorSku}</span></span>
                        {item.mpn && <span>MPN: <span className="text-gray-700 font-mono">{item.mpn}</span></span>}
                        {spec?.manufacturerName && <span>MFR: {spec.manufacturerName}</span>}
                        {item.vendor?.name && <span>Vendor: {item.vendor.name}</span>}
                      </div>

                      {/* Specs row */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {spec?.apiStandard && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{spec.apiStandard}</span>}
                        {spec?.pressureClassAnsi && <span className="px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded text-xs">{spec.pressureClassAnsi}</span>}
                        {spec?.sizeNps && <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded text-xs">{Number(spec.sizeNps)}" NPS</span>}
                        {spec?.endConnection && <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded text-xs">{spec.endConnection}</span>}
                        {spec?.materialGrade && <span className="px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded text-xs">{spec.materialGrade}</span>}
                        {spec?.isH2sService && <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-xs font-semibold">H2S</span>}
                        {spec?.naceCompliant && <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-xs">NACE</span>}
                        {spec?.exRating && <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-800 rounded text-xs">{spec.exRating}</span>}
                      </div>

                      {/* Availability row */}
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${CONDITION_COLORS[item.condition] || 'bg-gray-100 text-gray-700'}`}>
                            {CONDITION_LABELS[item.condition] || item.condition}
                          </span>
                          <span className="text-gray-600">
                            Qty: <strong>{Number(item.qtyAvailable)} {item.qtyUom}</strong>
                          </span>
                          {item.shipFromCountry && <span className="text-gray-500">{item.shipFromLocation || item.shipFromCountry}</span>}
                        </div>
                        {spec?.leadTimeDays && (
                          <span className="text-gray-500">Lead: {spec.leadTimeDays}d</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="mt-6 flex justify-center gap-2">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => fetchItems(p)}
                      className={`px-3 py-1 rounded text-sm ${pagination.page === p ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Detail slide-over */}
        {selected && (
          <aside className="w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow p-5 sticky top-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 pr-2">{selected.description}</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">✕</button>
              </div>

              <div className="text-2xl font-bold text-indigo-700 mb-1">{formatPrice(selected.price, selected.currency)}</div>
              <div className="text-xs text-gray-500 mb-3">per {selected.qtyUom} · {selected.currency}</div>

              <div className="space-y-3 text-sm">
                <Section title="Identification">
                  <Row label="SKU" value={selected.vendorSku} mono />
                  {selected.mpn && <Row label="MPN" value={selected.mpn} mono />}
                  {selected.oem && <Row label="OEM" value={selected.oem} />}
                  {selected.oilGasSpec?.manufacturerName && <Row label="Manufacturer" value={selected.oilGasSpec.manufacturerName} />}
                  <Row label="Vendor" value={selected.vendor?.name} />
                </Section>

                {selected.oilGasSpec && (
                  <>
                    <Section title="Classification">
                      <Row label="Sector" value={selected.oilGasSpec.sector} />
                      <Row label="Product Family" value={selected.oilGasSpec.productFamily} />
                      {selected.oilGasSpec.apiStandard && <Row label="API Standard" value={selected.oilGasSpec.apiStandard} />}
                      {selected.oilGasSpec.astmStandard && <Row label="ASTM" value={selected.oilGasSpec.astmStandard} />}
                      {selected.oilGasSpec.otherStandard && <Row label="Other Std" value={selected.oilGasSpec.otherStandard} />}
                    </Section>

                    <Section title="Ratings">
                      {selected.oilGasSpec.pressureRatingPsi && <Row label="Pressure" value={`${selected.oilGasSpec.pressureRatingPsi.toLocaleString()} PSI`} />}
                      {selected.oilGasSpec.pressureClassAnsi && <Row label="Class" value={selected.oilGasSpec.pressureClassAnsi} />}
                      {(selected.oilGasSpec.temperatureRatingMinC !== null || selected.oilGasSpec.temperatureRatingMaxC !== null) && (
                        <Row label="Temp Range" value={`${selected.oilGasSpec.temperatureRatingMinC ?? '?'}°C to ${selected.oilGasSpec.temperatureRatingMaxC ?? '?'}°C`} />
                      )}
                    </Section>

                    <Section title="Dimensions">
                      {selected.oilGasSpec.sizeNps && <Row label="NPS" value={`${Number(selected.oilGasSpec.sizeNps)}"`} />}
                      {selected.oilGasSpec.sizeMm && <Row label="OD" value={`${Number(selected.oilGasSpec.sizeMm)} mm`} />}
                      {selected.oilGasSpec.wallThicknessIn && <Row label="Wall" value={`${Number(selected.oilGasSpec.wallThicknessIn)}" WT`} />}
                      {selected.oilGasSpec.endConnection && <Row label="End Connection" value={selected.oilGasSpec.endConnection} />}
                      {selected.oilGasSpec.materialGrade && <Row label="Material" value={selected.oilGasSpec.materialGrade} />}
                    </Section>

                    <Section title="Service">
                      {selected.oilGasSpec.fluidService && <Row label="Fluid" value={selected.oilGasSpec.fluidService} />}
                      <Row label="H2S Service" value={selected.oilGasSpec.isH2sService ? 'Yes' : 'No'} />
                      <Row label="NACE Compliant" value={selected.oilGasSpec.naceCompliant ? 'Yes' : 'No'} />
                      {selected.oilGasSpec.exRating && <Row label="EX Rating" value={selected.oilGasSpec.exRating} />}
                    </Section>

                    <Section title="Compliance">
                      {selected.oilGasSpec.countryOfOrigin && <Row label="Country of Origin" value={selected.oilGasSpec.countryOfOrigin} />}
                      {selected.oilGasSpec.hsCode && <Row label="HS Code" value={selected.oilGasSpec.hsCode} mono />}
                      {selected.oilGasSpec.certifications && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Certifications</div>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(selected.oilGasSpec.certifications)
                              .filter(([, v]) => v)
                              .map(([k]) => (
                                <span key={k} className="px-1.5 py-0.5 bg-green-50 text-green-700 text-xs rounded">{k}</span>
                              ))}
                          </div>
                        </div>
                      )}
                    </Section>
                  </>
                )}

                <Section title="Availability">
                  <Row label="Qty Available" value={`${Number(selected.qtyAvailable)} ${selected.qtyUom}`} />
                  <Row label="Condition" value={CONDITION_LABELS[selected.condition] || selected.condition} />
                  {selected.shipFromLocation && <Row label="Ships From" value={`${selected.shipFromLocation}, ${selected.shipFromCountry}`} />}
                  {selected.oilGasSpec?.leadTimeDays && <Row label="Lead Time" value={`${selected.oilGasSpec.leadTimeDays} days`} />}
                  {selected.oilGasSpec?.incoterms && <Row label="Incoterms" value={selected.oilGasSpec.incoterms} />}
                  {selected.oilGasSpec?.minOrderQty && <Row label="Min Order" value={`${Number(selected.oilGasSpec.minOrderQty)} ${selected.qtyUom}`} />}
                </Section>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className={`text-gray-900 text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
