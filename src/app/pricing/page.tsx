'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PriceEstimate {
  id: number;
  ingredient_id: number;
  price_per_kg_eur: number;
  moq_kg: number;
  quality_grade: string;
  source: string;
  source_type: string;
  notes: string;
  researched_at: string;
}

interface SupplierQuote {
  id: number;
  ingredient_id: number;
  supplier_name: string;
  price_per_kg_eur: number;
  moq_kg: number;
  lead_time_days: number | null;
  valid_until: string | null;
  quality_grade: string;
  notes: string;
  quoted_at: string;
}

interface Ingredient {
  id: number;
  name: string;
  unit_of_measure: string;
  estimates: PriceEstimate[];
  quotes: SupplierQuote[];
  // Formulation amounts (400 kcal bag)
  grams_per_bag: number;
}

// Formulation amounts per bag (400 kcal)
const FORMULATION: Record<number, number> = {
  1: 40.0,   // Oats
  2: 12.0,   // Whey
  3: 8.0,    // Casein
  4: 4.0,    // Collagen
  5: 6.0,    // Chia
  6: 6.0,    // Flax
  7: 8.0,    // Almonds
  8: 6.0,    // Walnuts
  9: 4.0,    // Cacao
  10: 0.8,   // Cinnamon
  11: 1.2,   // Inulin
  12: 2.0,   // Creatine
  13: 0.4,   // Stevia
  14: 0.4,   // Salt
  15: 0.6,   // Turmeric
  16: 2.0,   // L-Glutamine (optional)
  17: 4.0,   // FD Blueberries (premium)
};

export default function PricingPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuoteForm, setShowQuoteForm] = useState<number | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    supplier_name: '',
    price_per_kg_eur: '',
    moq_kg: '',
    lead_time_days: '',
    valid_until: '',
    quality_grade: 'conventional',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [ingRes, estRes, quotesRes] = await Promise.all([
        supabase.from('ingredients').select('*').order('id'),
        supabase.from('ingredient_price_estimates').select('*').order('price_per_kg_eur'),
        supabase.from('supplier_quotes').select('*').order('quoted_at', { ascending: false }),
      ]);

      if (ingRes.error) throw ingRes.error;

      const ings: Ingredient[] = (ingRes.data || []).map((ing: { id: number; name: string; unit_of_measure: string }) => ({
        ...ing,
        estimates: (estRes.data || []).filter((e: PriceEstimate) => e.ingredient_id === ing.id),
        quotes: (quotesRes.data || []).filter((q: SupplierQuote) => q.ingredient_id === ing.id),
        grams_per_bag: FORMULATION[ing.id] || 0,
      }));

      setIngredients(ings);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  }

  function getBestEstimatePrice(ing: Ingredient): number | null {
    if (ing.estimates.length === 0) return null;
    return Math.min(...ing.estimates.map(e => e.price_per_kg_eur));
  }

  function getBestQuotePrice(ing: Ingredient): number | null {
    if (ing.quotes.length === 0) return null;
    return Math.min(...ing.quotes.map(q => q.price_per_kg_eur));
  }

  function getCostPerBag(ing: Ingredient): { estimate: number | null; quote: number | null } {
    const factor = ing.grams_per_bag / 1000;
    const est = getBestEstimatePrice(ing);
    const quote = getBestQuotePrice(ing);
    return {
      estimate: est !== null ? est * factor : null,
      quote: quote !== null ? quote * factor : null,
    };
  }

  function getSavings(ing: Ingredient): number | null {
    const est = getBestEstimatePrice(ing);
    const quote = getBestQuotePrice(ing);
    if (!est || !quote) return null;
    return ((est - quote) / est) * 100;
  }

  // Calculate totals
  const totals = ingredients.reduce(
    (acc, ing) => {
      const { estimate, quote } = getCostPerBag(ing);
      if (estimate !== null) acc.estimate += estimate;
      if (quote !== null) acc.quote += quote;
      return acc;
    },
    { estimate: 0, quote: 0 }
  );

  const baseIngredients = ingredients.filter(i => i.id !== 16 && i.id !== 17);
  const baseTotals = baseIngredients.reduce(
    (acc, ing) => {
      const { estimate, quote } = getCostPerBag(ing);
      if (estimate !== null) acc.estimate += estimate;
      if (quote !== null) acc.quote += quote;
      return acc;
    },
    { estimate: 0, quote: 0 }
  );

  async function submitQuote(ingredientId: number) {
    setSaving(true);
    try {
      const { error } = await supabase.from('supplier_quotes').insert({
        ingredient_id: ingredientId,
        supplier_name: quoteForm.supplier_name,
        price_per_kg_eur: parseFloat(quoteForm.price_per_kg_eur),
        moq_kg: parseFloat(quoteForm.moq_kg),
        lead_time_days: quoteForm.lead_time_days ? parseInt(quoteForm.lead_time_days) : null,
        valid_until: quoteForm.valid_until || null,
        quality_grade: quoteForm.quality_grade,
        notes: quoteForm.notes,
        quoted_at: new Date().toISOString().split('T')[0],
      });
      if (error) throw error;
      setShowQuoteForm(null);
      setQuoteForm({ supplier_name: '', price_per_kg_eur: '', moq_kg: '', lead_time_days: '', valid_until: '', quality_grade: 'conventional', notes: '' });
      fetchData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to save quote');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-slate-500">Loading pricing data…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">💰 Ingredient Pricing</h1>
        <p className="text-slate-500 mt-1">Market estimates vs. actual supplier quotes — per ingredient and per bag</p>
      </div>

      {/* COST SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Base Bag Cost (estimate)</p>
          <p className="text-2xl font-bold text-blue-800 mt-1">€{baseTotals.estimate.toFixed(3)}</p>
          <p className="text-xs text-blue-500 mt-1">excl. L-Glut & blueberries</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Premium Bag Cost (estimate)</p>
          <p className="text-2xl font-bold text-purple-800 mt-1">€{totals.estimate.toFixed(3)}</p>
          <p className="text-xs text-purple-500 mt-1">incl. L-Glut + blueberries</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Best Quoted Cost</p>
          <p className="text-2xl font-bold text-green-800 mt-1">
            {totals.quote > 0 ? `€${totals.quote.toFixed(3)}` : '—'}
          </p>
          <p className="text-xs text-green-500 mt-1">from logged supplier quotes</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">Ingredients Quoted</p>
          <p className="text-2xl font-bold text-orange-800 mt-1">
            {ingredients.filter(i => i.quotes.length > 0).length}/{ingredients.length}
          </p>
          <p className="text-xs text-orange-500 mt-1">need actual quotes</p>
        </div>
      </div>

      {/* INGREDIENT PRICING TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Ingredient Price Breakdown</h2>
          <span className="text-xs text-slate-400">Per bag = 400 kcal serving</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Ingredient</th>
                <th className="px-4 py-3 text-right">g/bag</th>
                <th className="px-4 py-3 text-right">Best Estimate</th>
                <th className="px-4 py-3 text-right">MOQ</th>
                <th className="px-4 py-3 text-right">Cost/bag (est)</th>
                <th className="px-4 py-3 text-right">Best Quote</th>
                <th className="px-4 py-3 text-right">Cost/bag (quote)</th>
                <th className="px-4 py-3 text-right">Savings</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ingredients.map(ing => {
                const bestEst = getBestEstimatePrice(ing);
                const bestQuote = getBestQuotePrice(ing);
                const { estimate: costEst, quote: costQuote } = getCostPerBag(ing);
                const savings = getSavings(ing);
                const isOptional = ing.id === 16;
                const isPremium = ing.id === 17;

                return (
                  <tr key={ing.id} className={`hover:bg-slate-50 ${isOptional ? 'opacity-70' : ''}`}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {ing.name}
                      {isOptional && <span className="ml-2 text-xs text-slate-400">(optional)</span>}
                      {isPremium && <span className="ml-2 text-xs text-purple-500">(premium)</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{ing.grams_per_bag}g</td>
                    <td className="px-4 py-3 text-right">
                      {bestEst !== null ? (
                        <span className="font-mono text-blue-700">€{bestEst.toFixed(2)}/kg</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">
                      {ing.estimates.length > 0
                        ? `${Math.min(...ing.estimates.map(e => e.moq_kg))}kg`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {costEst !== null ? (
                        <span className={`font-mono font-semibold ${costEst > 0.1 ? 'text-orange-600' : 'text-slate-700'}`}>
                          €{costEst.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {bestQuote !== null ? (
                        <span className="font-mono text-green-700">€{bestQuote.toFixed(2)}/kg</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {costQuote !== null ? (
                        <span className="font-mono font-semibold text-green-700">€{costQuote.toFixed(4)}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {savings !== null ? (
                        <span className={`font-semibold ${savings > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {savings > 0 ? '↓' : '↑'}{Math.abs(savings).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setShowQuoteForm(showQuoteForm === ing.id ? null : ing.id)}
                        className="text-xs bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 px-3 py-1 rounded-full transition"
                      >
                        + Quote
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold text-sm border-t-2 border-slate-200">
              <tr>
                <td className="px-4 py-3 text-slate-700" colSpan={4}>Base bag total (excl. L-Glut + blueberries)</td>
                <td className="px-4 py-3 text-right font-mono text-blue-800">€{baseTotals.estimate.toFixed(4)}</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-right font-mono text-green-800">
                  {baseTotals.quote > 0 ? `€${baseTotals.quote.toFixed(4)}` : '—'}
                </td>
                <td className="px-4 py-3" colSpan={2}></td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-slate-700" colSpan={4}>Premium bag total (all ingredients)</td>
                <td className="px-4 py-3 text-right font-mono text-purple-800">€{totals.estimate.toFixed(4)}</td>
                <td className="px-4 py-3"></td>
                <td className="px-4 py-3 text-right font-mono text-green-800">
                  {totals.quote > 0 ? `€${totals.quote.toFixed(4)}` : '—'}
                </td>
                <td className="px-4 py-3" colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* INLINE QUOTE FORM */}
      {showQuoteForm !== null && (
        <div className="bg-white rounded-xl border border-blue-200 shadow-lg p-6 mb-8">
          <h3 className="font-semibold text-slate-800 mb-4">
            📋 Log Supplier Quote for: <span className="text-blue-700">{ingredients.find(i => i.id === showQuoteForm)?.name}</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Supplier Name *</label>
              <input
                type="text"
                value={quoteForm.supplier_name}
                onChange={e => setQuoteForm({ ...quoteForm, supplier_name: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. Frubero"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Price per kg (€) *</label>
              <input
                type="number"
                step="0.01"
                value={quoteForm.price_per_kg_eur}
                onChange={e => setQuoteForm({ ...quoteForm, price_per_kg_eur: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">MOQ (kg) *</label>
              <input
                type="number"
                step="0.5"
                value={quoteForm.moq_kg}
                onChange={e => setQuoteForm({ ...quoteForm, moq_kg: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="25"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Lead Time (days)</label>
              <input
                type="number"
                value={quoteForm.lead_time_days}
                onChange={e => setQuoteForm({ ...quoteForm, lead_time_days: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="14"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Valid Until</label>
              <input
                type="date"
                value={quoteForm.valid_until}
                onChange={e => setQuoteForm({ ...quoteForm, valid_until: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Quality Grade</label>
              <select
                value={quoteForm.quality_grade}
                onChange={e => setQuoteForm({ ...quoteForm, quality_grade: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="conventional">Conventional</option>
                <option value="organic">Organic</option>
                <option value="pharmaceutical">Pharmaceutical</option>
              </select>
            </div>
            <div className="col-span-2 md:col-span-3">
              <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
              <input
                type="text"
                value={quoteForm.notes}
                onChange={e => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Incoterms, certifications, payment terms, etc."
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => submitQuote(showQuoteForm)}
              disabled={saving || !quoteForm.supplier_name || !quoteForm.price_per_kg_eur || !quoteForm.moq_kg}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving…' : 'Save Quote'}
            </button>
            <button
              onClick={() => setShowQuoteForm(null)}
              className="bg-slate-100 text-slate-600 px-6 py-2 rounded-lg text-sm hover:bg-slate-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* EXISTING QUOTES */}
      {ingredients.some(i => i.quotes.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">📋 Logged Supplier Quotes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Ingredient</th>
                  <th className="px-4 py-3 text-left">Supplier</th>
                  <th className="px-4 py-3 text-right">Price/kg</th>
                  <th className="px-4 py-3 text-right">MOQ</th>
                  <th className="px-4 py-3 text-right">Lead Time</th>
                  <th className="px-4 py-3 text-right">vs Estimate</th>
                  <th className="px-4 py-3 text-right">Valid Until</th>
                  <th className="px-4 py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ingredients
                  .filter(i => i.quotes.length > 0)
                  .flatMap(ing =>
                    ing.quotes.map(q => {
                      const est = getBestEstimatePrice(ing);
                      const diff = est ? ((q.price_per_kg_eur - est) / est) * 100 : null;
                      return (
                        <tr key={q.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-800">{ing.name}</td>
                          <td className="px-4 py-3 text-slate-700">{q.supplier_name}</td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-green-700">
                            €{q.price_per_kg_eur.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">{q.moq_kg}kg</td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            {q.lead_time_days ? `${q.lead_time_days}d` : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {diff !== null ? (
                              <span className={`font-semibold ${diff < 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {diff < 0 ? '↓' : '↑'}{Math.abs(diff).toFixed(1)}%
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">{q.valid_until || '—'}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{q.notes}</td>
                        </tr>
                      );
                    })
                  )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BLUEBERRY COST IMPACT BOX */}
      <div className="mt-8 bg-purple-50 border border-purple-200 rounded-xl p-6">
        <h3 className="font-semibold text-purple-800 mb-3">🫐 Freeze-Dried Blueberry Cost Impact (100kg batch)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {[
            { g: 3, label: 'Minimal (3g/bag)' },
            { g: 4, label: 'Standard (4g/bag)' },
            { g: 6, label: 'Premium (6g/bag)' },
            { g: 8, label: 'Ultra (8g/bag)' },
          ].map(({ g, label }) => {
            const fdEst = ingredients.find(i => i.id === 17);
            const pricePerKg = fdEst ? Math.min(...fdEst.estimates.map(e => e.price_per_kg_eur)) : 39;
            const bagWeight = 99.4 + g; // base + blueberries
            const bags = Math.floor(100000 / bagWeight);
            const totalBluberries = (g * bags) / 1000;
            const cost = totalBluberries * pricePerKg;
            return (
              <div key={g} className="bg-white rounded-lg p-3 border border-purple-100">
                <p className="font-medium text-purple-700">{label}</p>
                <p className="text-slate-600 mt-1">{bags} bags</p>
                <p className="text-slate-600">{totalBluberries.toFixed(1)}kg needed</p>
                <p className="font-bold text-purple-900 mt-1">€{cost.toFixed(0)} total</p>
                <p className="text-xs text-slate-400">€{(cost / bags).toFixed(2)}/bag</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
