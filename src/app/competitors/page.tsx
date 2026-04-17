'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CompetitorProduct {
  id: number;
  brand_name: string;
  product_name: string;
  variant: string | null;
  country: string | null;
  serving_size_g: number | null;
  calories_kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  price_per_serving_eur: number | null;
  real_food_score: number | null;
  threat_level: string | null;
  clean_label_score: number | null;
  has_artificial_sweetener: boolean | null;
  has_added_sugar: boolean | null;
  has_emulsifier: boolean | null;
  has_synthetic_vitamins: boolean | null;
  website_url: string | null;
  notes: string | null;
  created_at: string | null;
}

interface CompetitorIngredient {
  id: number;
  competitor_product_id: number;
  ingredient_name: string;
  ingredient_type: string | null;
  dose_g: number | null;
  is_synthetic: boolean | null;
  is_also_in_biorise: boolean | null;
  notes: string | null;
}

type SortKey = 'brand_name' | 'product_name' | 'country' | 'serving_size_g' | 'calories_kcal' | 'protein_g' | 'price_per_serving_eur' | 'real_food_score' | 'threat_level';

const COUNTRY_FLAGS: Record<string, string> = {
  'Belgium': '🇧🇪', 'Netherlands': '🇳🇱', 'Germany': '🇩🇪', 'France': '🇫🇷',
  'UK': '🇬🇧', 'United Kingdom': '🇬🇧', 'USA': '🇺🇸', 'United States': '🇺🇸',
  'Sweden': '🇸🇪', 'Denmark': '🇩🇰', 'Switzerland': '🇨🇭', 'Spain': '🇪🇸',
  'Italy': '🇮🇹', 'Austria': '🇦🇹', 'Ireland': '🇮🇪', 'Finland': '🇫🇮',
  'Norway': '🇳🇴', 'Portugal': '🇵🇹', 'Poland': '🇵🇱', 'Czech Republic': '🇨🇿',
};

const THREAT_ICONS: Record<string, string> = {
  high: '🔴', medium: '🟡', low: '🟢',
};

export default function CompetitorsPage() {
  const [products, setProducts] = useState<CompetitorProduct[]>([]);
  const [ingredients, setIngredients] = useState<CompetitorIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('brand_name');
  const [sortAsc, setSortAsc] = useState(true);
  const [threatFilter, setThreatFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [prodRes, ingRes] = await Promise.all([
          supabase.from('competitor_products').select('*').order('brand_name'),
          supabase.from('competitor_ingredients').select('*').order('ingredient_type'),
        ]);
        if (prodRes.error) throw prodRes.error;
        if (ingRes.error) throw ingRes.error;
        setProducts(prodRes.data || []);
        setIngredients(ingRes.data || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filtered = products.filter(p =>
    threatFilter === 'all' || (p.threat_level?.toLowerCase() === threatFilter)
  );

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
  });

  // Summary calculations
  const totalCompetitors = products.length;
  const avgPrice = products.length > 0
    ? products.reduce((s, p) => s + (p.price_per_serving_eur || 0), 0) / products.filter(p => p.price_per_serving_eur).length
    : 0;
  const avgProtein = products.length > 0
    ? products.reduce((s, p) => s + (p.protein_g || 0), 0) / products.filter(p => p.protein_g).length
    : 0;
  const avgRealFood = products.length > 0
    ? products.reduce((s, p) => s + (p.real_food_score || 0), 0) / products.filter(p => p.real_food_score).length
    : 0;

  const getScoreColor = (score: number | null) => {
    if (score == null) return 'text-slate-400';
    if (score >= 8) return 'text-green-600 font-bold';
    if (score >= 5) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-bold';
  };

  const getScoreBg = (score: number | null) => {
    if (score == null) return '';
    if (score >= 8) return 'bg-green-50';
    if (score >= 5) return 'bg-yellow-50';
    return 'bg-red-50';
  };

  const ingredientsFor = (productId: number) =>
    ingredients.filter(i => i.competitor_product_id === productId);

  const groupedIngredients = (productId: number) => {
    const ings = ingredientsFor(productId);
    const groups: Record<string, CompetitorIngredient[]> = {};
    ings.forEach(i => {
      const type = i.ingredient_type || 'Other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(i);
    });
    return groups;
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <th
      className="px-3 py-3 text-left cursor-pointer hover:text-slate-700 select-none"
      onClick={() => handleSort(sortKeyName)}
    >
      {label} {sortKey === sortKeyName ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  );

  if (loading) return <div className="p-8 text-slate-500">Loading competitor data…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🏆 Competitor Analysis</h1>
        <p className="text-slate-600 mt-1">
          Product benchmarking, nutritional comparison & ingredient intelligence
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Competitors</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{totalCompetitors}</div>
          <p className="text-xs text-slate-600 mt-2">Products tracked</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase">Avg Price/Serving</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">€{avgPrice.toFixed(2)}</div>
          <p className="text-xs text-slate-600 mt-2">BioRise: €5.99</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase">Avg Protein</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{avgProtein.toFixed(1)}g</div>
          <p className="text-xs text-slate-600 mt-2">BioRise: 31g</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase">Avg Real Food Score</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{avgRealFood.toFixed(1)}/10</div>
          <p className="text-xs text-slate-600 mt-2">BioRise: 9/10</p>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-600">Filter by threat:</span>
        {['all', 'high', 'medium', 'low'].map(level => (
          <button
            key={level}
            onClick={() => setThreatFilter(level)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
              threatFilter === level
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {level === 'all' ? 'All' : `${THREAT_ICONS[level] || ''} ${level.charAt(0).toUpperCase() + level.slice(1)}`}
          </button>
        ))}
        <span className="text-xs text-slate-400 ml-2">{filtered.length} products</span>
      </div>

      {/* MAIN TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wide">
              <tr>
                <SortHeader label="Brand" sortKeyName="brand_name" />
                <SortHeader label="Product" sortKeyName="product_name" />
                <SortHeader label="Country" sortKeyName="country" />
                <SortHeader label="Serving" sortKeyName="serving_size_g" />
                <SortHeader label="Kcal" sortKeyName="calories_kcal" />
                <SortHeader label="Protein" sortKeyName="protein_g" />
                <SortHeader label="€/Serving" sortKeyName="price_per_serving_eur" />
                <SortHeader label="Real Food" sortKeyName="real_food_score" />
                <SortHeader label="Threat" sortKeyName="threat_level" />
                <th className="px-3 py-3 text-center">🧪 Sweetener</th>
                <th className="px-3 py-3 text-center">🍬 Sugar</th>
                <th className="px-3 py-3 text-center">🧴 Emulsifier</th>
                <th className="px-3 py-3 text-center">💊 Synth Vit</th>
                <th className="px-3 py-3 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map(p => {
                const expanded = expandedId === p.id;
                const grouped = groupedIngredients(p.id);
                return (
                  <><tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-medium text-slate-900">{p.brand_name}</td>
                    <td className="px-3 py-3 text-slate-700">
                      {p.product_name}
                      {p.variant && <span className="text-xs text-slate-400 ml-1">({p.variant})</span>}
                    </td>
                    <td className="px-3 py-3 text-slate-600">
                      {p.country ? `${COUNTRY_FLAGS[p.country] || '🌍'} ${p.country}` : '—'}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {p.serving_size_g ? `${p.serving_size_g}g` : '—'}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-600">
                      {p.calories_kcal ?? '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-medium text-slate-800">
                      {p.protein_g ? `${p.protein_g}g` : '—'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-medium text-slate-800">
                      {p.price_per_serving_eur ? `€${p.price_per_serving_eur.toFixed(2)}` : '—'}
                    </td>
                    <td className={`px-3 py-3 text-right ${getScoreColor(p.real_food_score)} ${getScoreBg(p.real_food_score)}`}>
                      {p.real_food_score != null ? `${p.real_food_score}/10` : '—'}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {p.threat_level ? `${THREAT_ICONS[p.threat_level.toLowerCase()] || ''} ${p.threat_level}` : '—'}
                    </td>
                    <td className="px-3 py-3 text-center">{p.has_artificial_sweetener ? '❌' : '✅'}</td>
                    <td className="px-3 py-3 text-center">{p.has_added_sugar ? '❌' : '✅'}</td>
                    <td className="px-3 py-3 text-center">{p.has_emulsifier ? '❌' : '✅'}</td>
                    <td className="px-3 py-3 text-center">{p.has_synthetic_vitamins ? '❌' : '✅'}</td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => setExpandedId(expanded ? null : p.id)}
                        className="text-xs bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 px-3 py-1 rounded-full transition"
                      >
                        {expanded ? '▲ Hide' : '▼ Show'}
                      </button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr key={`${p.id}-detail`}>
                      <td colSpan={14} className="bg-slate-50 px-6 py-4">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-slate-700 text-sm">
                            Ingredients — {p.brand_name} {p.product_name}
                          </h4>
                          {Object.keys(grouped).length === 0 ? (
                            <p className="text-sm text-slate-400 italic">No ingredient data available</p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {Object.entries(grouped).map(([type, ings]) => (
                                <div key={type} className="bg-white rounded-lg border border-slate-200 p-3">
                                  <h5 className="text-xs font-semibold text-slate-500 uppercase mb-2">{type}</h5>
                                  <ul className="space-y-1">
                                    {ings.map(ing => (
                                      <li key={ing.id} className="text-sm text-slate-700 flex items-center gap-2">
                                        <span>{ing.ingredient_name}</span>
                                        {ing.dose_g != null && (
                                          <span className="text-xs text-slate-400">{ing.dose_g}g</span>
                                        )}
                                        {ing.is_synthetic && (
                                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">synthetic</span>
                                        )}
                                        {ing.is_also_in_biorise && (
                                          <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded">in BioRise</span>
                                        )}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}
                          {p.notes && (
                            <p className="text-xs text-slate-500 mt-2">
                              <strong>Notes:</strong> {p.notes}
                            </p>
                          )}
                          {p.website_url && (
                            <a href={p.website_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline">
                              🔗 Website
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}</>
                );
              })}

              {/* BIORISE BENCHMARK ROW */}
              <tr className="bg-emerald-50 border-t-2 border-emerald-300 font-semibold">
                <td className="px-3 py-3 text-emerald-900">🌱 BioRise</td>
                <td className="px-3 py-3 text-emerald-800">Superbreakfast</td>
                <td className="px-3 py-3 text-emerald-700">🇧🇪 Belgium</td>
                <td className="px-3 py-3 text-right text-emerald-700">103g</td>
                <td className="px-3 py-3 text-right text-emerald-700">448</td>
                <td className="px-3 py-3 text-right text-emerald-800">31g</td>
                <td className="px-3 py-3 text-right font-mono text-emerald-800">€5.99</td>
                <td className="px-3 py-3 text-right text-green-700 font-bold bg-green-100 rounded">9/10</td>
                <td className="px-3 py-3 text-center">—</td>
                <td className="px-3 py-3 text-center">✅</td>
                <td className="px-3 py-3 text-center">✅</td>
                <td className="px-3 py-3 text-center">✅</td>
                <td className="px-3 py-3 text-center">✅</td>
                <td className="px-3 py-3 text-center text-emerald-600 text-xs">benchmark</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* LEGEND */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Clean Label:</strong> ✅ = free from · ❌ = contains &nbsp;|&nbsp;
          <strong>Real Food Score:</strong>{' '}
          <span className="text-green-600 font-semibold">8+ great</span> ·{' '}
          <span className="text-yellow-600 font-semibold">5-7 okay</span> ·{' '}
          <span className="text-red-600 font-semibold">&lt;5 poor</span> &nbsp;|&nbsp;
          <strong>Threat:</strong> 🔴 High · 🟡 Medium · 🟢 Low
        </p>
      </div>
    </div>
  );
}
