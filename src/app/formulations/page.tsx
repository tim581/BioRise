'use client';

import { useEffect, useState } from 'react';
import { getAllFormulations, getFormulationIngredientsWithDetails, FormulationIngredientEnriched } from '@/lib/supabase';
import * as Types from '@/lib/types';

// ============================================================
// INGREDIENT MACRO DATABASE (per 100g)
// Source: USDA / manufacturer specs / EU food DB
// ============================================================
const MACROS_PER_100G: Record<number, {
  kcal: number; protein: number; carbs: number; fat: number;
  fiber: number; sugar: number; sodium_mg: number;
}> = {
  1:  { kcal: 389, protein: 17.0, carbs: 66.0, fat: 7.0,  fiber: 10.0, sugar: 1.0,  sodium_mg: 2   }, // Rolled Oats / Oat Bran
  2:  { kcal: 370, protein: 90.0, carbs: 3.0,  fat: 1.0,  fiber: 0.0,  sugar: 2.0,  sodium_mg: 120 }, // Whey Isolate
  3:  { kcal: 375, protein: 80.0, carbs: 8.0,  fat: 2.0,  fiber: 0.0,  sugar: 4.0,  sodium_mg: 140 }, // Casein
  32: { kcal: 650, protein: 6.0,  carbs: 14.0, fat: 65.0, fiber: 0.0,  sugar: 7.0,  sodium_mg: 40  }, // Coconut Milk Powder
  5:  { kcal: 486, protein: 17.0, carbs: 42.0, fat: 31.0, fiber: 34.0, sugar: 0.0,  sodium_mg: 16  }, // Chia Seeds
  6:  { kcal: 534, protein: 18.0, carbs: 29.0, fat: 42.0, fiber: 27.0, sugar: 1.5,  sodium_mg: 30  }, // Ground Flaxseed
  7:  { kcal: 579, protein: 21.0, carbs: 22.0, fat: 50.0, fiber: 12.0, sugar: 4.4,  sodium_mg: 1   }, // Almonds
  8:  { kcal: 654, protein: 15.0, carbs: 14.0, fat: 65.0, fiber: 6.7,  sugar: 2.6,  sodium_mg: 2   }, // Walnuts
  17: { kcal: 350, protein: 3.0,  carbs: 85.0, fat: 1.0,  fiber: 9.0,  sugar: 57.0, sodium_mg: 5   }, // Blueberry FD
  18: { kcal: 340, protein: 3.0,  carbs: 82.0, fat: 1.0,  fiber: 4.0,  sugar: 64.0, sodium_mg: 5   }, // Sour Cherry FD
  29: { kcal: 325, protein: 12.0, carbs: 74.0, fat: 1.0,  fiber: 14.0, sugar: 50.0, sodium_mg: 106 }, // Beetroot Powder
  27: { kcal: 400, protein: 30.0, carbs: 50.0, fat: 5.0,  fiber: 15.0, sugar: 10.0, sodium_mg: 40  }, // Broccoli Sprout
  13: { kcal: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0,  fiber: 0.0,  sugar: 0.0,  sodium_mg: 0   }, // Stevia
  14: { kcal: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0,  fiber: 0.0,  sugar: 0.0,  sodium_mg: 38750 }, // Sea Salt
};

// ============================================================
// INGREDIENT PRICE PER KG (wholesale B2B estimates)
// ============================================================
const PRICE_PER_KG: Record<number, number> = {
  1: 0.60, 2: 9.00, 3: 7.50, 32: 6.00, 5: 2.50, 6: 1.20,
  7: 6.50, 8: 6.00, 17: 18.00, 18: 22.00,
  29: 10.00, 27: 65.00, 13: 25.00, 14: 0.30,
};

// ============================================================
// ORIGIN FLAGS
// ============================================================
const ORIGIN_FLAGS: Record<number, { flag: string; label: string }> = {
  1:  { flag: '🇳🇱🇩🇪', label: 'NL / DE / PL' },
  2:  { flag: '🇳🇱🇮🇪', label: 'NL / IE' },
  3:  { flag: '🇳🇱🇫🇷', label: 'NL / FR' },
  32: { flag: '🌍', label: 'SE Asia (PH/TH)' },
  5:  { flag: '🌍', label: 'S. America (BO/AR)' },
  6:  { flag: '🇵🇱🇩🇪', label: 'PL / DE' },
  7:  { flag: '🇪🇸', label: 'Spain (EU)' },
  8:  { flag: '🇫🇷🇷🇴', label: 'FR / RO' },
  17: { flag: '🇵🇱🇩🇪', label: 'PL / DE / NL' },
  18: { flag: '🇵🇱🇩🇪', label: 'PL / DE / HU' },
  29: { flag: '🇳🇱🇩🇪', label: 'NL / DE / PL' },
  27: { flag: '🇩🇪🇮🇹', label: 'DE / IT' },
  13: { flag: '🌍', label: 'CN / PY (EU proc.)' },
  14: { flag: '🇫🇷🇵🇹', label: 'FR / PT / ES' },
};

// ============================================================
// FORMULATION METADATA
// ============================================================
const FORMULATION_META: Record<number, {
  tier: 'foundation' | 'pro';
  tagline: string;
  euStatus: 'clean' | 'novel_food';
  launchReady: boolean;
  color: { bg: string; border: string; text: string; badge: string };
}> = {
  1: {
    tier: 'foundation',
    tagline: 'Launch formula — 100% clean EU food. Zero regulatory risk.',
    euStatus: 'clean',
    launchReady: true,
    color: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  },
  2: {
    tier: 'pro',
    tagline: 'Premium tier — Novel Food authorisation required before EU sale.',
    euStatus: 'novel_food',
    launchReady: false,
    color: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  },
};

function computeNutrition(items: FormulationIngredientEnriched[]) {
  let kcal = 0, protein = 0, carbs = 0, fat = 0, fiber = 0, sugar = 0, sodium_mg = 0;
  for (const item of items) {
    const m = MACROS_PER_100G[item.ingredient_id];
    if (!m) continue;
    const g = item.quantity_grams;
    kcal     += (m.kcal     / 100) * g;
    protein  += (m.protein  / 100) * g;
    carbs    += (m.carbs    / 100) * g;
    fat      += (m.fat      / 100) * g;
    fiber    += (m.fiber    / 100) * g;
    sugar    += (m.sugar    / 100) * g;
    sodium_mg+= (m.sodium_mg/ 100) * g;
  }
  return { kcal, protein, carbs, fat, fiber, sugar, sodium_mg };
}

function computeCost(items: FormulationIngredientEnriched[]) {
  let total = 0;
  for (const item of items) {
    const pricePerKg = PRICE_PER_KG[item.ingredient_id] ?? 0;
    total += (pricePerKg / 1000) * item.quantity_grams;
  }
  return total;
}

function scoreEmoji(score: number | undefined) {
  if (!score) return '—';
  const dots = '●'.repeat(score) + '○'.repeat(5 - score);
  const color = score >= 4 ? 'text-emerald-600' : score === 3 ? 'text-amber-500' : 'text-red-500';
  return <span className={`font-mono text-xs ${color}`}>{dots}</span>;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    testing: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    archived: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  );
}

function RegulatoryBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-slate-300 text-xs">—</span>;
  if (status === 'food') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
      ✅ EU Food
    </span>
  );
  if (status === 'novel_food') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
      🔴 Novel Food
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      ⚠️ Check
    </span>
  );
}

function MacroBar({ protein, carbs, fat }: { protein: number; carbs: number; fat: number }) {
  const proteinKcal = protein * 4;
  const carbKcal = carbs * 4;
  const fatKcal = fat * 9;
  const total = proteinKcal + carbKcal + fatKcal || 1;
  const pPct = (proteinKcal / total) * 100;
  const cPct = (carbKcal / total) * 100;
  const fPct = (fatKcal / total) * 100;
  return (
    <div>
      <div className="flex rounded-full overflow-hidden h-3">
        <div className="bg-blue-500 transition-all" style={{ width: `${pPct}%` }} title={`Protein ${pPct.toFixed(0)}%`} />
        <div className="bg-amber-400 transition-all" style={{ width: `${cPct}%` }} title={`Carbs ${cPct.toFixed(0)}%`} />
        <div className="bg-rose-400 transition-all" style={{ width: `${fPct}%` }} title={`Fat ${fPct.toFixed(0)}%`} />
      </div>
      <div className="flex gap-4 mt-2 text-xs text-slate-500">
        <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />Protein {pPct.toFixed(0)}%</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1" />Carbs {cPct.toFixed(0)}%</span>
        <span><span className="inline-block w-2 h-2 rounded-full bg-rose-400 mr-1" />Fat {fPct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default function FormulationsPage() {
  const [formulations, setFormulations] = useState<Types.Formulation[]>([]);
  const [selectedForm, setSelectedForm] = useState<Types.Formulation | null>(null);
  const [formIngredients, setFormIngredients] = useState<FormulationIngredientEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'nutrition' | 'ingredients' | 'regulatory' | 'specs'>('nutrition');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const formData = await getAllFormulations();
      setFormulations(formData);
      if (formData.length > 0) {
        setSelectedForm(formData[0]);
        const items = await getFormulationIngredientsWithDetails(formData[0].id);
        setFormIngredients(items);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSelect = async (form: Types.Formulation) => {
    setSelectedForm(form);
    const items = await getFormulationIngredientsWithDetails(form.id);
    setFormIngredients(items);
    setActiveTab('nutrition');
  };

  const nutrition = computeNutrition(formIngredients);
  const ingredientCost = computeCost(formIngredients);
  const totalWeight = formIngredients.reduce((s, i) => s + Number(i.quantity_grams), 0);
  const avgDigestibility = formIngredients.length > 0
    ? formIngredients.reduce((s, i) => s + (i.ingredient?.digestibility_score ?? 0), 0) / formIngredients.length
    : 0;
  const minShelfLife = formIngredients.length > 0
    ? Math.min(...formIngredients.map(i => i.ingredient?.shelf_life_months ?? 999).filter(v => v < 999))
    : 0;

  const novelFoodIngredients = formIngredients.filter(i => i.ingredient?.eu_regulatory_status === 'novel_food');
  const checkNeededIngredients = formIngredients.filter(i => i.ingredient?.eu_regulatory_status === 'check_needed');
  const meta = selectedForm ? FORMULATION_META[selectedForm.id] : null;

  const TABS = [
    { id: 'nutrition', label: '🧬 Nutrition' },
    { id: 'ingredients', label: '📋 Ingredients' },
    { id: 'regulatory', label: `⚖️ Regulatory${novelFoodIngredients.length > 0 ? ` (${novelFoodIngredients.length}🔴)` : ''}` },
    { id: 'specs', label: '📦 Specs' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Formulations</h1>
          <p className="text-slate-500 mt-1">Recipe engineering · {formulations.length} formula{formulations.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading formula data...</div>
      ) : (
        <div className="grid grid-cols-4 gap-6">

          {/* LEFT: VERSION LIST */}
          <div className="col-span-1">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">Product Tiers</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {formulations.length === 0 ? (
                  <p className="p-4 text-sm text-slate-400">No formulations yet</p>
                ) : formulations.map(form => {
                  const m = FORMULATION_META[form.id];
                  const isSelected = selectedForm?.id === form.id;
                  const borderColor = m?.tier === 'foundation' ? 'border-emerald-500' : 'border-violet-500';
                  const bgColor = m?.tier === 'foundation' ? 'bg-emerald-50' : 'bg-violet-50';
                  return (
                    <button
                      key={form.id}
                      onClick={() => handleSelect(form)}
                      className={`w-full text-left px-4 py-4 transition-colors border-l-4 ${
                        isSelected
                          ? `${bgColor} ${borderColor}`
                          : 'hover:bg-slate-50 border-transparent'
                      }`}
                    >
                      <div className="font-semibold text-sm text-slate-900 leading-tight">{form.name}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-xs text-slate-400">v{form.version ?? 1}</span>
                        {statusBadge(form.status ?? 'draft')}
                      </div>
                      {m && (
                        <div className="mt-2">
                          {m.euStatus === 'clean' ? (
                            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">🟢 Clean EU Food</span>
                          ) : (
                            <span className="text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">🔴 Novel Food Req.</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TIER COMPARISON CARD */}
            <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Product Roadmap</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">●</span>
                  <div>
                    <p className="font-semibold text-slate-800">Foundation</p>
                    <p className="text-slate-500">Launch now · 100% EU food · FASFC notify only</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-violet-500 mt-0.5">●</span>
                  <div>
                    <p className="font-semibold text-slate-800">Longevity Pro</p>
                    <p className="text-slate-500">+12–18 months · Novel Food auth required · Premium tier</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: DETAIL PANEL */}
          <div className="col-span-3 space-y-4">
            {selectedForm ? (
              <>
                {/* FORMULA HEADER */}
                <div className={`rounded-xl border p-6 ${meta ? meta.color.bg + ' ' + meta.color.border : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h2 className="text-2xl font-bold text-slate-900">{selectedForm.name}</h2>
                        {statusBadge(selectedForm.status ?? 'draft')}
                        <span className="text-xs text-slate-400 font-mono">v{selectedForm.version ?? 1}</span>
                        {meta?.launchReady ? (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-full px-2.5 py-0.5">🚀 Launch Ready</span>
                        ) : (
                          <span className="text-xs font-semibold text-violet-700 bg-violet-100 border border-violet-200 rounded-full px-2.5 py-0.5">⏳ Pre-Launch</span>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm">{selectedForm.description}</p>
                      {meta && (
                        <p className={`text-xs mt-1.5 font-medium ${meta.color.text}`}>{meta.tagline}</p>
                      )}
                    </div>
                  </div>

                  {/* QUICK STATS */}
                  <div className="grid grid-cols-5 gap-4 mt-5 pt-5 border-t border-white/50">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-slate-900">{Math.round(nutrition.kcal) || '~405'}</div>
                      <div className="text-xs text-slate-500 mt-0.5">kcal / serving</div>
                    </div>
                    <div className="text-center border-l border-white/50">
                      <div className="text-2xl font-bold text-blue-600">{nutrition.protein.toFixed(1) !== '0.0' ? nutrition.protein.toFixed(1) : '~30'}g</div>
                      <div className="text-xs text-slate-500 mt-0.5">Protein</div>
                    </div>
                    <div className="text-center border-l border-white/50">
                      <div className="text-2xl font-bold text-amber-500">{nutrition.carbs.toFixed(1)}g</div>
                      <div className="text-xs text-slate-500 mt-0.5">Carbs</div>
                    </div>
                    <div className="text-center border-l border-white/50">
                      <div className="text-2xl font-bold text-rose-500">{nutrition.fat.toFixed(1)}g</div>
                      <div className="text-xs text-slate-500 mt-0.5">Fat</div>
                    </div>
                    <div className="text-center border-l border-white/50">
                      <div className="text-2xl font-bold text-emerald-600">{formIngredients.length}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Ingredients</div>
                    </div>
                  </div>
                </div>

                {/* TABS */}
                <div className="flex gap-1 border-b border-slate-200">
                  {TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                        activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-700'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* TAB: NUTRITION PANEL */}
                {activeTab === 'nutrition' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <h3 className="font-semibold text-slate-800 mb-4">Macronutrients</h3>
                      <MacroBar protein={nutrition.protein} carbs={nutrition.carbs} fat={nutrition.fat} />
                      <div className="mt-5 space-y-3">
                        {[
                          { label: 'Energy', value: `${Math.round(nutrition.kcal)} kcal`, sub: `${(nutrition.kcal * 4.184).toFixed(0)} kJ`, color: 'bg-slate-300' },
                          { label: 'Protein', value: `${nutrition.protein.toFixed(1)} g`, sub: `${nutrition.kcal > 0 ? ((nutrition.protein * 4 / nutrition.kcal) * 100).toFixed(0) : '~30'}% of kcal`, color: 'bg-blue-500' },
                          { label: 'Carbohydrates', value: `${nutrition.carbs.toFixed(1)} g`, sub: `of which sugars ${nutrition.sugar.toFixed(1)} g`, color: 'bg-amber-400' },
                          { label: 'Dietary Fiber', value: `${nutrition.fiber.toFixed(1)} g`, sub: 'prebiotic & soluble', color: 'bg-emerald-500' },
                          { label: 'Fat', value: `${nutrition.fat.toFixed(1)} g`, sub: 'incl. omega-3 rich nuts + MCTs', color: 'bg-rose-400' },
                          { label: 'Sodium', value: `${(nutrition.sodium_mg).toFixed(0)} mg`, sub: 'from sea salt', color: 'bg-slate-400' },
                        ].map(row => (
                          <div key={row.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2.5 h-2.5 rounded-full ${row.color}`} />
                              <span className="text-sm text-slate-700">{row.label}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-slate-900">{row.value}</span>
                              <span className="text-xs text-slate-400 ml-2">{row.sub}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-800 mb-4">Formula Quality</h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Avg. Digestibility</span>
                            <div className="flex items-center gap-2">
                              {scoreEmoji(Math.round(avgDigestibility))}
                              <span className="text-sm font-bold text-slate-800">{avgDigestibility.toFixed(1)}/5</span>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Limiting Shelf Life</span>
                            <span className="text-sm font-bold text-slate-800">{minShelfLife > 0 ? `${minShelfLife} months` : '12 months'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Novel Food ingredients</span>
                            {novelFoodIngredients.length === 0 ? (
                              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">✅ None</span>
                            ) : (
                              <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">🔴 {novelFoodIngredients.length} flagged</span>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Preservatives?</span>
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py.5 rounded-full">✅ None required</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Packaging</span>
                            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">N₂ flush + O₂ absorber</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-800 mb-4">Cost Estimate / Serving</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Ingredient cost</span>
                            <span className="text-sm font-bold text-slate-900">€{ingredientCost.toFixed(3)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Packaging (small pouch)</span>
                            <span className="text-sm font-bold text-slate-900">€0.10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Display box (÷10)</span>
                            <span className="text-sm font-bold text-slate-900">€0.15</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-slate-600">Co-packer toll</span>
                            <span className="text-sm font-bold text-slate-900">€0.25</span>
                          </div>
                          <div className="border-t border-slate-100 pt-2 flex justify-between">
                            <span className="text-sm font-semibold text-slate-700">Est. COGS</span>
                            <span className="text-sm font-bold text-slate-900">€{(ingredientCost + 0.50).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm font-semibold text-slate-700">At €5.99/serving</span>
                            <span className={`text-sm font-bold ${
                              ((5.99 - (ingredientCost + 0.50)) / 5.99) >= 0.80
                                ? 'text-emerald-600'
                                : 'text-amber-600'
                            }`}>
                              {(((5.99 - (ingredientCost + 0.50)) / 5.99) * 100).toFixed(1)}% GM
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: INGREDIENT BREAKDOWN */}
                {activeTab === 'ingredients' && (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ingredient</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Grams</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">% Mix</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">kcal</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Protein</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Digest.</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">EU Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Origin</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Cost/svg</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {formIngredients.map((item, idx) => {
                            const m = MACROS_PER_100G[item.ingredient_id];
                            const g = Number(item.quantity_grams);
                            const kcal = m ? (m.kcal / 100) * g : 0;
                            const prot = m ? (m.protein / 100) * g : 0;
                            const pct = totalWeight > 0 ? (g / totalWeight) * 100 : 0;
                            const cost = PRICE_PER_KG[item.ingredient_id]
                              ? (PRICE_PER_KG[item.ingredient_id] / 1000) * g
                              : 0;
                            const isNovelFood = item.ingredient?.eu_regulatory_status === 'novel_food';
                            return (
                              <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isNovelFood ? 'bg-red-50/30' : ''}`}>
                                <td className="px-4 py-3 text-slate-400 text-xs">{item.order_priority ?? idx + 1}</td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-slate-900">{item.ingredient?.name ?? `#${item.ingredient_id}`}</div>
                                  {item.ingredient?.category_name && (
                                    <div className="text-xs text-slate-400">{item.ingredient.category_name}</div>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right font-mono font-semibold text-slate-800">{g}g</td>
                                <td className="px-4 py-3 text-right text-slate-500 text-xs">{pct.toFixed(1)}%</td>
                                <td className="px-4 py-3 text-right text-slate-700">{kcal.toFixed(0)}</td>
                                <td className="px-4 py-3 text-right text-blue-600">{prot.toFixed(1)}g</td>
                                <td className="px-4 py-3 text-center">{scoreEmoji(item.ingredient?.digestibility_score)}</td>
                                <td className="px-4 py-3 text-center">
                                  <RegulatoryBadge status={item.ingredient?.eu_regulatory_status} />
                                </td>
                                <td className="px-4 py-3">
                                  {ORIGIN_FLAGS[item.ingredient_id] ? (
                                    <div className="flex flex-col">
                                      <span className="text-base leading-tight">{ORIGIN_FLAGS[item.ingredient_id].flag}</span>
                                      <span className="text-xs text-slate-400 leading-tight whitespace-nowrap">{ORIGIN_FLAGS[item.ingredient_id].label}</span>
                                    </div>
                                  ) : '—'}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-700 font-mono text-xs">
                                  {cost > 0 ? `€${cost.toFixed(3)}` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                          {/* TOTALS ROW */}
                          <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                            <td className="px-4 py-3" colSpan={2}><span className="text-slate-700">TOTAL / SERVING</span></td>
                            <td className="px-4 py-3 text-right font-mono text-slate-900">{totalWeight.toFixed(1)}g</td>
                            <td className="px-4 py-3 text-right text-slate-500">100%</td>
                            <td className="px-4 py-3 text-right text-slate-900">{Math.round(nutrition.kcal)}</td>
                            <td className="px-4 py-3 text-right text-blue-700">{nutrition.protein.toFixed(1)}g</td>
                            <td colSpan={3} className="px-4 py-3" />
                            <td className="px-4 py-3 text-right text-slate-900 font-mono text-xs">€{ingredientCost.toFixed(3)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-800 flex items-start gap-2">
                      <span className="mt-0.5">⚠️</span>
                      <span>
                        <strong>Shelf life governed by weakest ingredient.</strong> Ground Flaxseed (12 mo) and Freeze-Dried Fruits (18 mo) are limiting.
                        Shelf life claim: <strong>12 months</strong> from manufacture. Nitrogen flush + O₂ absorber required.
                      </span>
                    </div>
                  </div>
                )}

                {/* TAB: REGULATORY */}
                {activeTab === 'regulatory' && (
                  <div className="space-y-4">
                    {/* Summary banner */}
                    {novelFoodIngredients.length === 0 ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-start gap-4">
                        <span className="text-3xl">✅</span>
                        <div>
                          <h3 className="font-bold text-emerald-800 text-lg">100% Clean EU Food</h3>
                          <p className="text-emerald-700 text-sm mt-1">All ingredients in this formula fall under standard EU food law (EU 178/2002 + 1169/2011). No pre-market authorisation required.</p>
                          <p className="text-emerald-600 text-sm mt-2 font-medium">Action needed: Notify FASFC (Belgium) before first sale. Engage EU food regulatory consultant ~6 months pre-launch.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4">
                        <span className="text-3xl">🔴</span>
                        <div>
                          <h3 className="font-bold text-red-800 text-lg">Novel Food Authorisation Required</h3>
                          <p className="text-red-700 text-sm mt-1">{novelFoodIngredients.length} ingredient{novelFoodIngredients.length > 1 ? 's' : ''} in this formula require Novel Food authorisation under EU 2015/2283 before this product can be sold in the EU.</p>
                          <p className="text-red-600 text-sm mt-2 font-medium">Timeline: 12–18 months · Estimated cost: €50–100K+ per ingredient</p>
                        </div>
                      </div>
                    )}

                    {/* Novel Food ingredients */}
                    {novelFoodIngredients.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 bg-red-50 border-b border-red-100">
                          <h3 className="font-semibold text-red-800 text-sm">🔴 Novel Food Ingredients ({novelFoodIngredients.length})</h3>
                        </div>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ingredient</th>
                              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Dose</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Regulation</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {novelFoodIngredients.map(item => (
                              <tr key={item.id} className="bg-red-50/30">
                                <td className="px-4 py-3 font-medium text-slate-900">{item.ingredient?.name}</td>
                                <td className="px-4 py-3 text-right font-mono text-slate-700">{item.quantity_grams}g</td>
                                <td className="px-4 py-3 text-xs text-red-700 font-medium">EU 2015/2283</td>
                                <td className="px-4 py-3 text-xs text-slate-500">{item.ingredient?.notes?.split('—')[0]}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Check needed */}
                    {checkNeededIngredients.length > 0 && (
                      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="px-4 py-3 bg-amber-50 border-b border-amber-100">
                          <h3 className="font-semibold text-amber-800 text-sm">⚠️ Verification Needed ({checkNeededIngredients.length})</h3>
                        </div>
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-slate-100">
                            {checkNeededIngredients.map(item => (
                              <tr key={item.id} className="bg-amber-50/20">
                                <td className="px-4 py-3 font-medium text-slate-900">{item.ingredient?.name}</td>
                                <td className="px-4 py-3 text-right font-mono text-slate-700">{item.quantity_grams}g</td>
                                <td className="px-4 py-3 text-xs text-amber-700">Verify strain-specific Novel Food status with regulatory consultant pre-launch</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* EU Food law context */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-sm">
                      <h3 className="font-semibold text-slate-800">EU Regulatory Framework</h3>
                      <div className="grid grid-cols-2 gap-4 text-xs text-slate-600">
                        <div className="space-y-1.5">
                          <p><strong className="text-slate-700">Category:</strong> Complete Meal Powder (food product)</p>
                          <p><strong className="text-slate-700">Governing law:</strong> EU 178/2002 + 1169/2011</p>
                          <p><strong className="text-slate-700">NOT a supplement:</strong> Directive 2002/46/EC does not apply</p>
                          <p><strong className="text-slate-700">NOT a meal replacement:</strong> EU 609/2013 does not apply</p>
                        </div>
                        <div className="space-y-1.5">
                          <p><strong className="text-slate-700">Pre-market auth:</strong> NOT required for food products</p>
                          <p><strong className="text-slate-700">FASFC notification:</strong> Required before first BE sale</p>
                          <p><strong className="text-slate-700">Label ban:</strong> "Probiotic" — use strain name only</p>
                          <p><strong className="text-slate-700">Consultant:</strong> Engage ~6 months before launch</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB: PHYSICAL SPECS */}
                {activeTab === 'specs' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                      <h3 className="font-semibold text-slate-800">Physical Properties</h3>
                      {[
                        { label: 'Total dry weight', value: `${totalWeight.toFixed(1)} g / serving` },
                        { label: 'Bulk density (blend)', value: `~0.43 g/ml` },
                        { label: 'Fill volume (small pouch)', value: `~${Math.round(totalWeight / 0.43)} ml` },
                        { label: 'Recommended pouch', value: '250ml standup pouch' },
                        { label: 'Fill volume (1kg bag)', value: `~${Math.round(981 / 0.43)} ml` },
                        { label: 'Recommended bag', value: '2.5L standup pouch with gusset' },
                        { label: 'Colour (dry)', value: 'Warm beige with purple-blue specks (FD blueberry)' },
                        { label: 'Texture (dry)', value: 'Fine-coarse mixed powder with chia seeds visible' },
                      ].map(row => (
                        <div key={row.label} className="flex justify-between items-start gap-4 border-b border-slate-50 pb-2">
                          <span className="text-sm text-slate-500">{row.label}</span>
                          <span className="text-sm font-semibold text-slate-800 text-right">{row.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                      <h3 className="font-semibold text-slate-800">Packaging Formats</h3>
                      {[
                        { format: '400 kcal Pouch', weight: `~${totalWeight.toFixed(0)}g`, volume: '250ml', price: '€5.99', packaging: '€0.10', cogs: `~€${(ingredientCost + 0.50).toFixed(2)}`, gm: `${(((5.99 - (ingredientCost + 0.50)) / 5.99) * 100).toFixed(1)}%` },
                        { format: '1 kg Bag', weight: '~981g', volume: '2.5L', price: '€49.90', packaging: '€1.00', cogs: '~€8.00', gm: '~84%' },
                      ].map(row => (
                        <div key={row.format} className="rounded-lg border border-slate-200 p-4">
                          <div className="font-bold text-slate-900 mb-2">{row.format}</div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                            <span className="text-slate-500">Fill weight</span><span className="font-medium text-slate-800">{row.weight}</span>
                            <span className="text-slate-500">Fill volume</span><span className="font-medium text-slate-800">{row.volume}</span>
                            <span className="text-slate-500">Price</span><span className="font-bold text-slate-900">{row.price}</span>
                            <span className="text-slate-500">Packaging cost</span><span className="font-medium text-slate-800">{row.packaging}</span>
                            <span className="text-slate-500">Est. COGS</span><span className="font-medium text-slate-800">{row.cogs}</span>
                            <span className="text-slate-500">Gross margin</span>
                            <span className={`font-bold ${parseFloat(row.gm) >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{row.gm}</span>
                          </div>
                        </div>
                      ))}
                      <div className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-600 space-y-1">
                        <p>🌿 <strong>No preservatives required</strong> — all-dry formula with low water activity</p>
                        <p>🔵 <strong>Nitrogen flush</strong> at fill point to prevent oxidation</p>
                        <p>🟠 <strong>O₂ absorber sachet</strong> inside each pouch recommended</p>
                        <p>🏷️ <strong>Shelf life claim:</strong> 12 months from manufacture date</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 text-slate-400">Select a formulation to view details</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
