'use client';

import { useEffect, useState } from 'react';
import { getAllIngredients } from '@/lib/supabase';
import type { Ingredient } from '@/lib/types';

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, {
  emoji: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}> = {
  'Real Food':            { emoji: '🌾', bg: 'bg-green-50',   text: 'text-green-800',  border: 'border-green-200', dot: 'bg-green-500' },
  'Freeze-Dried Fruits':  { emoji: '🍒', bg: 'bg-purple-50',  text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-500' },
  'Protein':              { emoji: '💪', bg: 'bg-blue-50',    text: 'text-blue-800',   border: 'border-blue-200',  dot: 'bg-blue-500' },
  'Bioactive Extracts':   { emoji: '🧬', bg: 'bg-amber-50',   text: 'text-amber-800',  border: 'border-amber-200', dot: 'bg-amber-500' },
  'Sports Performance':   { emoji: '⚡', bg: 'bg-red-50',     text: 'text-red-800',    border: 'border-red-200',   dot: 'bg-red-500' },
  'Spices & Seasoning':   { emoji: '🌶️', bg: 'bg-orange-50',  text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500' },
};

function getCategoryStyle(name?: string) {
  return CATEGORY_CONFIG[name ?? ''] ?? {
    emoji: '📦', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400',
  };
}

// ─── Category badge ───────────────────────────────────────────────────────────
function CategoryBadge({ name }: { name?: string }) {
  const s = getCategoryStyle(name);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${s.bg} ${s.text} ${s.border}`}>
      {s.emoji} {name ?? 'Unknown'}
    </span>
  );
}

// ─── Density bar ──────────────────────────────────────────────────────────────
function DensityBar({ value }: { value?: number }) {
  if (!value) return <span className="text-slate-300">—</span>;
  const pct = Math.min((value / 1.2) * 100, 100);
  const colour =
    value < 0.35 ? 'bg-sky-400' :
    value < 0.55 ? 'bg-emerald-400' :
    value < 0.80 ? 'bg-amber-400' : 'bg-rose-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className={`${colour} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-slate-600 font-mono text-xs">{value.toFixed(2)}</span>
    </div>
  );
}

function DensityLabel({ value }: { value?: number }) {
  if (!value) return null;
  if (value < 0.35) return <span className="text-xs text-sky-600">very airy</span>;
  if (value < 0.55) return <span className="text-xs text-emerald-600">light</span>;
  if (value < 0.80) return <span className="text-xs text-amber-600">medium</span>;
  return <span className="text-xs text-rose-600">dense</span>;
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'density'>('category');
  const [search, setSearch] = useState('');

  useEffect(() => { loadIngredients(); }, []);

  async function loadIngredients() {
    try {
      const data = await getAllIngredients();
      setIngredients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Unique categories in config order
  const categoryOrder = Object.keys(CATEGORY_CONFIG);
  const categories = ['All', ...categoryOrder.filter(c =>
    ingredients.some(i => i.category_name === c)
  )];

  // Filter + sort
  const filtered = ingredients
    .filter(i => activeCategory === 'All' || i.category_name === activeCategory)
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'density') return (a.bulk_density_g_per_ml ?? 0) - (b.bulk_density_g_per_ml ?? 0);
      if (sortBy === 'category') {
        const catA = categoryOrder.indexOf(a.category_name ?? '');
        const catB = categoryOrder.indexOf(b.category_name ?? '');
        return catA !== catB ? catA - catB : a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    });

  // Stats
  const withDensity = ingredients.filter(i => i.bulk_density_g_per_ml);
  const avgDensity = withDensity.length > 0
    ? withDensity.reduce((s, i) => s + (i.bulk_density_g_per_ml ?? 0), 0) / withDensity.length
    : null;

  // Group by category when viewing All + sorted by category
  const grouped = sortBy === 'category' && activeCategory === 'All';
  const groupedRows: { category: string; items: Ingredient[] }[] = [];
  if (grouped) {
    categoryOrder.forEach(cat => {
      const items = filtered.filter(i => i.category_name === cat);
      if (items.length > 0) groupedRows.push({ category: cat, items });
    });
    // Uncategorised
    const other = filtered.filter(i => !i.category_name || !categoryOrder.includes(i.category_name));
    if (other.length > 0) groupedRows.push({ category: 'Other', items: other });
  }

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ingredients</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {ingredients.length} ingredients across {categories.length - 1} categories
          </p>
        </div>
        <button className="primary">+ Add Ingredient</button>
      </div>

      {/* STAT CARDS */}
      {!loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categoryOrder.filter(c => ingredients.some(i => i.category_name === c)).map(cat => {
            const s = getCategoryStyle(cat);
            const count = ingredients.filter(i => i.category_name === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? 'All' : cat)}
                className={`rounded-lg border p-3 text-left transition-all hover:shadow-sm ${
                  activeCategory === cat
                    ? `${s.bg} ${s.border} shadow-sm`
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="text-xl mb-0.5">{s.emoji}</p>
                <p className={`text-xs font-semibold ${activeCategory === cat ? s.text : 'text-slate-700'}`}>{cat}</p>
                <p className={`text-lg font-bold ${activeCategory === cat ? s.text : 'text-slate-900'}`}>{count}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* CONTROLS */}
      {!loading && (
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <input
            type="text"
            placeholder="Search ingredients…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-700 w-48 focus:outline-none focus:ring-2 focus:ring-slate-300"
          />

          {/* Category tabs */}
          <div className="flex gap-1.5 flex-wrap">
            {categories.map(cat => {
              const s = cat === 'All' ? null : getCategoryStyle(cat);
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    isActive
                      ? s ? `${s.bg} ${s.text} ${s.border}` : 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400 hover:text-slate-700'
                  }`}
                >
                  {s?.emoji} {cat} ({cat === 'All' ? ingredients.length : ingredients.filter(i => i.category_name === cat).length})
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <div className="flex gap-1 ml-auto">
            <span className="text-xs text-slate-400 self-center mr-1">Sort:</span>
            {(['category', 'name', 'density'] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  sortBy === s
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
              >
                {s === 'category' ? '🗂 Category' : s === 'name' ? 'A–Z' : 'Density ↑'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TABLE */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading ingredients…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-400">No ingredients match your filter.</div>
      ) : grouped ? (
        /* GROUPED VIEW */
        <div className="space-y-4">
          {groupedRows.map(({ category, items }) => {
            const s = getCategoryStyle(category);
            return (
              <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                {/* Group header */}
                <div className={`flex items-center gap-2 px-4 py-2.5 border-b ${s.bg} ${s.border}`}>
                  <span className="text-base">{s.emoji}</span>
                  <span className={`font-semibold text-sm ${s.text}`}>{category}</span>
                  <span className={`text-xs font-normal ${s.text} opacity-70`}>— {items.length} ingredient{items.length !== 1 ? 's' : ''}</span>
                </div>
                {/* Rows */}
                <table className="w-full">
                  <tbody>
                    {items.map((ing, idx) => (
                      <tr key={ing.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="px-4 py-3 w-64">
                          <p className="font-medium text-slate-900 text-sm">{ing.name}</p>
                          {ing.notes && <p className="text-xs text-slate-400 mt-0.5 leading-snug">{ing.notes}</p>}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 w-12">{ing.unit_of_measure}</td>
                        <td className="px-4 py-3 w-40">
                          <DensityBar value={ing.bulk_density_g_per_ml} />
                        </td>
                        <td className="px-4 py-3 w-24">
                          <DensityLabel value={ing.bulk_density_g_per_ml} />
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {ing.shelf_life_days ? `${ing.shelf_life_days}d shelf life` : ''}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 text-right">
                          {ing.target_quality_standard && (
                            <span className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5">
                              {ing.target_quality_standard}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ) : (
        /* FLAT VIEW */
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Bulk Density</th>
                <th>Flow</th>
                <th>Shelf Life</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(ing => (
                <tr key={ing.id}>
                  <td className="font-medium text-slate-900">
                    {ing.name}
                    {ing.notes && <p className="text-xs text-slate-400 font-normal mt-0.5">{ing.notes}</p>}
                  </td>
                  <td><CategoryBadge name={ing.category_name} /></td>
                  <td className="text-slate-500 text-sm">{ing.unit_of_measure}</td>
                  <td><DensityBar value={ing.bulk_density_g_per_ml} /></td>
                  <td><DensityLabel value={ing.bulk_density_g_per_ml} /></td>
                  <td className="text-slate-500 text-sm">
                    {ing.shelf_life_days ? `${ing.shelf_life_days}d` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* DENSITY GUIDE */}
      {!loading && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex flex-wrap gap-6 items-start justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Bulk Density Guide</p>
            <div className="flex flex-wrap gap-4 text-xs text-slate-500">
              <span><span className="inline-block w-2 h-2 rounded-full bg-sky-400 mr-1"></span>&lt;0.35 g/ml — very airy</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-emerald-400 mr-1"></span>0.35–0.55 — light</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1"></span>0.55–0.80 — medium</span>
              <span><span className="inline-block w-2 h-2 rounded-full bg-rose-400 mr-1"></span>&gt;0.80 — dense</span>
            </div>
          </div>
          {avgDensity && (
            <div className="text-right">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Avg density (all)</p>
              <p className="text-lg font-bold text-slate-800">{avgDensity.toFixed(3)} <span className="text-xs font-normal text-slate-400">g/ml</span></p>
            </div>
          )}
          <p className="w-full text-xs text-slate-400 mt-1">
            💡 Tell co-packers: <strong>~0.43 g/ml blend average</strong> · <strong>237 ml fill per 101g bag</strong> (250ml standup pouch, 95% fill) · <strong>2,303 ml per 981g bag</strong> (2.5L gusseted pouch)
          </p>
        </div>
      )}
    </div>
  );
}
