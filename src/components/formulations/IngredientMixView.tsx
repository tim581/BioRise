'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { FormulationIngredientEnriched } from '@/lib/supabase';
import { IngredientThumbnail } from '@/components/IngredientThumbnail';

type MacroFn = (id: number) => { kcal: number; protein: number } | undefined;
type CostFn = (id: number, grams: number) => number;

type Props = {
  items: FormulationIngredientEnriched[];
  totalWeight: number;
  nutrition: { kcal: number; protein: number };
  ingredientCost: number;
  getMacros: MacroFn;
  getCost: CostFn;
  originFlags: Record<number, { flag: string; label: string }>;
  scoreEmoji: (score: number | undefined) => ReactNode;
  regulatoryBadge: (status?: string) => ReactNode;
};

function MixBar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-indigo-500 rounded-full transition-all"
        style={{ width: `${Math.min(pct, 100)}%` }}
      />
    </div>
  );
}

function sortByGramsDesc(a: FormulationIngredientEnriched, b: FormulationIngredientEnriched) {
  return Number(b.quantity_grams) - Number(a.quantity_grams);
}

export function IngredientMixView({
  items,
  totalWeight,
  nutrition,
  ingredientCost,
  getMacros,
  getCost,
  originFlags,
  scoreEmoji,
  regulatoryBadge,
}: Props) {
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const base = !query.trim()
      ? items
      : items.filter((item) => {
          const q = query.toLowerCase();
          return (
            item.ingredient?.name?.toLowerCase().includes(q) ||
            item.ingredient?.category_name?.toLowerCase().includes(q) ||
            item.ingredient?.health_benefit?.toLowerCase().includes(q)
          );
        });
    return [...base].sort(sortByGramsDesc);
  }, [items, query]);

  const renderCard = (item: FormulationIngredientEnriched, rank: number) => {
    const g = Number(item.quantity_grams);
    const pct = totalWeight > 0 ? (g / totalWeight) * 100 : 0;
    const macros = getMacros(item.ingredient_id);
    const kcal = macros ? (macros.kcal / 100) * g : 0;
    const prot = macros ? (macros.protein / 100) * g : 0;
    const cost = getCost(item.ingredient_id, g);
    const isNovel = item.ingredient?.eu_regulatory_status === 'novel_food';

    return (
      <article
        key={item.id}
        className={`rounded-xl border p-4 flex gap-4 ${
          isNovel ? 'border-red-200 bg-red-50/30' : 'border-slate-200 bg-white'
        }`}
      >
        <IngredientThumbnail ingredient={item.ingredient} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 leading-tight">
                {item.ingredient?.name ?? `#${item.ingredient_id}`}
              </p>
              {item.ingredient?.category_name && (
                <p className="text-[10px] uppercase tracking-wide text-slate-400 mt-0.5">
                  {item.ingredient.category_name}
                </p>
              )}
              {item.ingredient?.health_benefit && (
                <p className="text-xs text-indigo-600 mt-1 line-clamp-2">
                  {item.ingredient.health_benefit}
                </p>
              )}
            </div>
            <span className="text-xs text-slate-400 font-mono flex-shrink-0">#{rank}</span>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-lg font-bold text-slate-900 tabular-nums">{g}g</span>
            <span className="text-sm text-slate-500 tabular-nums">{pct.toFixed(1)}%</span>
            <div className="flex-1">
              <MixBar pct={pct} />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            {kcal > 0 && <span>{kcal.toFixed(0)} kcal</span>}
            {prot > 0 && <span className="text-blue-600">{prot.toFixed(1)}g protein</span>}
            {cost > 0 && <span>€{cost.toFixed(3)}</span>}
            {originFlags[item.ingredient_id] && (
              <span title={originFlags[item.ingredient_id].label}>
                {originFlags[item.ingredient_id].flag} {originFlags[item.ingredient_id].label}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-2 items-center">
            {regulatoryBadge(item.ingredient?.eu_regulatory_status)}
            {scoreEmoji(item.ingredient?.digestibility_score)}
          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">Recipe breakdown</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            {totalWeight.toFixed(1)}g dry weight · {Math.round(nutrition.kcal)} kcal · €{ingredientCost.toFixed(3)} ingredient cost
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Filter ingredients…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 w-full sm:w-48"
          />
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setView('cards')}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                view === 'cards' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                view === 'table' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {view === 'cards' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((item, idx) => renderCard(item, idx + 1))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ingredient</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Grams</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Mix %</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Protein</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">EU</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const g = Number(item.quantity_grams);
                  const pct = totalWeight > 0 ? (g / totalWeight) * 100 : 0;
                  const macros = getMacros(item.ingredient_id);
                  const prot = macros ? (macros.protein / 100) * g : 0;
                  const cost = getCost(item.ingredient_id, g);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <IngredientThumbnail ingredient={item.ingredient} size="md" />
                          <span className="font-medium text-slate-900">{item.ingredient?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{g}g</td>
                      <td className="px-4 py-3 text-right text-slate-500">{pct.toFixed(1)}%</td>
                      <td className="px-4 py-3 text-right text-blue-600">{prot.toFixed(1)}g</td>
                      <td className="px-4 py-3 text-center">{regulatoryBadge(item.ingredient?.eu_regulatory_status)}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs">{cost > 0 ? `€${cost.toFixed(3)}` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex flex-wrap gap-4 justify-between text-sm">
        <span className="font-semibold text-slate-700">Total per serving</span>
        <div className="flex flex-wrap gap-4 text-slate-600">
          <span><strong className="text-slate-900">{totalWeight.toFixed(1)}g</strong> weight</span>
          <span><strong className="text-slate-900">{Math.round(nutrition.kcal)}</strong> kcal</span>
          <span><strong className="text-blue-700">{nutrition.protein.toFixed(1)}g</strong> protein</span>
          <span><strong className="text-slate-900">€{ingredientCost.toFixed(3)}</strong> ingredients</span>
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-900">
        <strong>Shelf life:</strong> 12 months from manufacture. Limiting factors: ground flaxseed and freeze-dried fruits.
        Nitrogen flush + O₂ absorber required.
      </div>
    </div>
  );
}
