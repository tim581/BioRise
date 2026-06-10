'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getAllFormulations,
  getFormulationIngredientsWithDetails,
  FormulationIngredientEnriched,
} from '@/lib/supabase';
import * as Types from '@/lib/types';
import { FormulationTierBar, FORMULATION_META } from '@/components/formulations/FormulationTierBar';
import { IngredientMixView } from '@/components/formulations/IngredientMixView';

const MACROS_PER_100G: Record<number, {
  kcal: number; protein: number; carbs: number; fat: number;
  fiber: number; sugar: number; sodium_mg: number;
}> = {
  1:  { kcal: 389, protein: 17.0, carbs: 66.0, fat: 7.0,  fiber: 10.0, sugar: 1.0,  sodium_mg: 2   },
  2:  { kcal: 370, protein: 90.0, carbs: 3.0,  fat: 1.0,  fiber: 0.0,  sugar: 2.0,  sodium_mg: 120 },
  3:  { kcal: 375, protein: 80.0, carbs: 8.0,  fat: 2.0,  fiber: 0.0,  sugar: 4.0,  sodium_mg: 140 },
  32: { kcal: 650, protein: 6.0,  carbs: 14.0, fat: 65.0, fiber: 0.0,  sugar: 7.0,  sodium_mg: 40  },
  5:  { kcal: 486, protein: 17.0, carbs: 42.0, fat: 31.0, fiber: 34.0, sugar: 0.0,  sodium_mg: 16  },
  6:  { kcal: 534, protein: 18.0, carbs: 29.0, fat: 42.0, fiber: 27.0, sugar: 1.5,  sodium_mg: 30  },
  7:  { kcal: 579, protein: 21.0, carbs: 22.0, fat: 50.0, fiber: 12.0, sugar: 4.4,  sodium_mg: 1   },
  8:  { kcal: 654, protein: 15.0, carbs: 14.0, fat: 65.0, fiber: 6.7,  sugar: 2.6,  sodium_mg: 2   },
  17: { kcal: 350, protein: 3.0,  carbs: 85.0, fat: 1.0,  fiber: 9.0,  sugar: 57.0, sodium_mg: 5   },
  18: { kcal: 340, protein: 3.0,  carbs: 82.0, fat: 1.0,  fiber: 4.0,  sugar: 64.0, sodium_mg: 5   },
  29: { kcal: 325, protein: 12.0, carbs: 74.0, fat: 1.0,  fiber: 14.0, sugar: 50.0, sodium_mg: 106 },
  27: { kcal: 400, protein: 30.0, carbs: 50.0, fat: 5.0,  fiber: 15.0, sugar: 10.0, sodium_mg: 40  },
  13: { kcal: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0,  fiber: 0.0,  sugar: 0.0,  sodium_mg: 0   },
  14: { kcal: 0,   protein: 0.0,  carbs: 0.0,  fat: 0.0,  fiber: 0.0,  sugar: 0.0,  sodium_mg: 38750 },
};

const PRICE_PER_KG: Record<number, number> = {
  1: 0.60, 2: 9.00, 3: 7.50, 32: 6.00, 5: 2.50, 6: 1.20,
  7: 6.50, 8: 6.00, 17: 18.00, 18: 22.00,
  29: 10.00, 27: 65.00, 13: 25.00, 14: 0.30,
};

const ORIGIN_FLAGS: Record<number, { flag: string; label: string }> = {
  1:  { flag: '🇳🇱🇩🇪', label: 'NL / DE / PL' },
  2:  { flag: '🇳🇱🇮🇪', label: 'NL / IE' },
  3:  { flag: '🇳🇱🇫🇷', label: 'NL / FR' },
  32: { flag: '🌍', label: 'SE Asia' },
  5:  { flag: '🌍', label: 'S. America' },
  6:  { flag: '🇵🇱🇩🇪', label: 'PL / DE' },
  7:  { flag: '🇪🇸', label: 'Spain' },
  8:  { flag: '🇫🇷🇷🇴', label: 'FR / RO' },
  17: { flag: '🇵🇱🇩🇪', label: 'PL / DE / NL' },
  18: { flag: '🇵🇱🇩🇪', label: 'PL / DE / HU' },
  29: { flag: '🇳🇱🇩🇪', label: 'NL / DE / PL' },
  27: { flag: '🇩🇪🇮🇹', label: 'DE / IT' },
  13: { flag: '🌍', label: 'CN / PY' },
  14: { flag: '🇫🇷🇵🇹', label: 'FR / PT / ES' },
};

function computeNutrition(items: FormulationIngredientEnriched[]) {
  let kcal = 0, protein = 0, carbs = 0, fat = 0, fiber = 0, sugar = 0, sodium_mg = 0;
  for (const item of items) {
    const m = MACROS_PER_100G[item.ingredient_id];
    if (!m) continue;
    const g = item.quantity_grams;
    kcal += (m.kcal / 100) * g;
    protein += (m.protein / 100) * g;
    carbs += (m.carbs / 100) * g;
    fat += (m.fat / 100) * g;
    fiber += (m.fiber / 100) * g;
    sugar += (m.sugar / 100) * g;
    sodium_mg += (m.sodium_mg / 100) * g;
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
  if (!score) return <span className="text-slate-300 text-xs">—</span>;
  const dots = '●'.repeat(score) + '○'.repeat(5 - score);
  const color = score >= 4 ? 'text-emerald-600' : score === 3 ? 'text-amber-500' : 'text-red-500';
  return <span className={`font-mono text-xs ${color}`}>{dots}</span>;
}

function RegulatoryBadge({ status }: { status?: string }) {
  if (!status) return <span className="text-slate-300 text-xs">—</span>;
  if (status === 'food') {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        EU Food
      </span>
    );
  }
  if (status === 'novel_food') {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-50 text-red-700 border border-red-200">
        Novel Food
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
      Check
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
      <div className="flex rounded-full overflow-hidden h-2.5">
        <div className="bg-blue-500" style={{ width: `${pPct}%` }} />
        <div className="bg-amber-400" style={{ width: `${cPct}%` }} />
        <div className="bg-rose-400" style={{ width: `${fPct}%` }} />
      </div>
      <div className="flex gap-4 mt-2 text-xs text-slate-500">
        <span>Protein {pPct.toFixed(0)}%</span>
        <span>Carbs {cPct.toFixed(0)}%</span>
        <span>Fat {fPct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

type TabId = 'ingredients' | 'nutrition' | 'regulatory' | 'specs';

export default function FormulationsPage() {
  const [formulations, setFormulations] = useState<Types.Formulation[]>([]);
  const [ingredientsByForm, setIngredientsByForm] = useState<Record<number, FormulationIngredientEnriched[]>>({});
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('ingredients');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const formData = await getAllFormulations();
      setFormulations(formData);

      const entries = await Promise.all(
        formData.map(async (form) => {
          const items = await getFormulationIngredientsWithDetails(form.id);
          return [form.id, items] as const;
        })
      );
      const map: Record<number, FormulationIngredientEnriched[]> = {};
      for (const [id, items] of entries) map[id] = items;
      setIngredientsByForm(map);

      const foundation = formData.find((f) => FORMULATION_META[f.id]?.tier === 'foundation');
      setSelectedId(foundation?.id ?? formData[0]?.id ?? null);
      setLoading(false);
    }
    load();
  }, []);

  const selectedForm = formulations.find((f) => f.id === selectedId) ?? null;
  const formIngredients = selectedId ? ingredientsByForm[selectedId] ?? [] : [];
  const meta = selectedId ? FORMULATION_META[selectedId] : null;

  const nutrition = computeNutrition(formIngredients);
  const ingredientCost = computeCost(formIngredients);
  const totalWeight = formIngredients.reduce((s, i) => s + Number(i.quantity_grams), 0);

  const tierPreviews = useMemo(
    () =>
      formulations.map((form) => {
        const items = ingredientsByForm[form.id] ?? [];
        const n = computeNutrition(items);
        return {
          form,
          meta: FORMULATION_META[form.id],
          ingredientCount: items.length,
          kcal: n.kcal,
          protein: n.protein,
        };
      }),
    [formulations, ingredientsByForm]
  );

  const novelFoodIngredients = formIngredients.filter((i) => i.ingredient?.eu_regulatory_status === 'novel_food');
  const checkNeededIngredients = formIngredients.filter((i) => i.ingredient?.eu_regulatory_status === 'check_needed');
  const avgDigestibility =
    formIngredients.length > 0
      ? formIngredients.reduce((s, i) => s + (i.ingredient?.digestibility_score ?? 0), 0) / formIngredients.length
      : 0;
  const minShelfLife =
    formIngredients.length > 0
      ? Math.min(...formIngredients.map((i) => i.ingredient?.shelf_life_months ?? 999).filter((v) => v < 999))
      : 0;

  const getMacros = useCallback((id: number) => MACROS_PER_100G[id], []);
  const getCost = useCallback(
    (id: number, grams: number) => ((PRICE_PER_KG[id] ?? 0) / 1000) * grams,
    []
  );

  const TABS: { id: TabId; label: string; hint?: string }[] = [
    { id: 'ingredients', label: 'Ingredients', hint: `${formIngredients.length}` },
    { id: 'nutrition', label: 'Nutrition' },
    {
      id: 'regulatory',
      label: 'Regulatory',
      hint: novelFoodIngredients.length > 0 ? `${novelFoodIngredients.length} flagged` : undefined,
    },
    { id: 'specs', label: 'Packaging & specs' },
  ];

  return (
    <div className="space-y-6 pb-10">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Formulations</h1>
        <p className="text-slate-500 mt-1 max-w-2xl">
          Compare product tiers, inspect the full recipe, and review nutrition, regulatory status, and packaging specs.
        </p>
      </header>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading formulas…</div>
      ) : (
        <>
          <FormulationTierBar
            items={tierPreviews}
            selectedId={selectedId}
            onSelect={(form) => setSelectedId(form.id)}
          />

          {selectedForm && (
            <div className="space-y-0">
              {/* Sticky tab bar */}
              <div className="sticky top-0 z-10 -mx-2 px-2 pt-2 pb-0 bg-slate-50/95 backdrop-blur border-b border-slate-200">
                <div className="flex items-center gap-1 overflow-x-auto pb-px">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-t-lg border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-indigo-600 text-indigo-700 bg-white'
                          : 'border-transparent text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab.label}
                      {tab.hint && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                            activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {tab.hint}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-b-xl rounded-tr-xl border border-slate-200 border-t-0 p-6 min-h-[420px]">
                {activeTab === 'ingredients' && (
                  <IngredientMixView
                    items={formIngredients}
                    totalWeight={totalWeight}
                    nutrition={nutrition}
                    ingredientCost={ingredientCost}
                    getMacros={getMacros}
                    getCost={getCost}
                    originFlags={ORIGIN_FLAGS}
                    scoreEmoji={scoreEmoji}
                    regulatoryBadge={(status) => <RegulatoryBadge status={status} />}
                  />
                )}

                {activeTab === 'nutrition' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <section>
                      <h3 className="font-semibold text-slate-900 mb-4">Macronutrients</h3>
                      <MacroBar protein={nutrition.protein} carbs={nutrition.carbs} fat={nutrition.fat} />
                      <dl className="mt-6 space-y-3">
                        {[
                          { label: 'Energy', value: `${Math.round(nutrition.kcal)} kcal`, sub: `${(nutrition.kcal * 4.184).toFixed(0)} kJ` },
                          { label: 'Protein', value: `${nutrition.protein.toFixed(1)} g`, sub: `${nutrition.kcal > 0 ? ((nutrition.protein * 4 / nutrition.kcal) * 100).toFixed(0) : '—'}% of kcal` },
                          { label: 'Carbohydrates', value: `${nutrition.carbs.toFixed(1)} g`, sub: `sugars ${nutrition.sugar.toFixed(1)} g` },
                          { label: 'Fiber', value: `${nutrition.fiber.toFixed(1)} g`, sub: 'prebiotic & soluble' },
                          { label: 'Fat', value: `${nutrition.fat.toFixed(1)} g`, sub: 'nuts + MCTs' },
                          { label: 'Sodium', value: `${nutrition.sodium_mg.toFixed(0)} mg`, sub: 'from sea salt' },
                        ].map((row) => (
                          <div key={row.label} className="flex justify-between items-baseline gap-4 py-2 border-b border-slate-50">
                            <dt className="text-sm text-slate-600">{row.label}</dt>
                            <dd className="text-right">
                              <span className="font-semibold text-slate-900">{row.value}</span>
                              <span className="text-xs text-slate-400 ml-2">{row.sub}</span>
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </section>

                    <div className="space-y-6">
                      <section className="rounded-xl border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-900 mb-4">Formula quality</h3>
                        <dl className="space-y-3 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-slate-600">Avg. digestibility</dt>
                            <dd className="flex items-center gap-2">{scoreEmoji(Math.round(avgDigestibility))}<span className="font-semibold">{avgDigestibility.toFixed(1)}/5</span></dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-slate-600">Limiting shelf life</dt>
                            <dd className="font-semibold">{minShelfLife > 0 ? `${minShelfLife} mo` : '12 mo'}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-slate-600">Novel food items</dt>
                            <dd>{novelFoodIngredients.length === 0 ? <span className="text-emerald-700 font-medium">None</span> : <span className="text-red-700 font-medium">{novelFoodIngredients.length} flagged</span>}</dd>
                          </div>
                        </dl>
                      </section>

                      <section className="rounded-xl border border-slate-200 p-5">
                        <h3 className="font-semibold text-slate-900 mb-4">Cost per serving</h3>
                        <dl className="space-y-2 text-sm">
                          <div className="flex justify-between"><dt className="text-slate-600">Ingredients</dt><dd className="font-semibold">€{ingredientCost.toFixed(3)}</dd></div>
                          <div className="flex justify-between"><dt className="text-slate-600">Packaging + toll</dt><dd className="font-semibold">€0.50</dd></div>
                          <div className="flex justify-between border-t border-slate-100 pt-2"><dt className="font-medium text-slate-700">Est. COGS</dt><dd className="font-bold">€{(ingredientCost + 0.5).toFixed(2)}</dd></div>
                          <div className="flex justify-between"><dt className="font-medium text-slate-700">GM at €5.99</dt><dd className={`font-bold ${((5.99 - (ingredientCost + 0.5)) / 5.99) >= 0.8 ? 'text-emerald-600' : 'text-amber-600'}`}>{(((5.99 - (ingredientCost + 0.5)) / 5.99) * 100).toFixed(1)}%</dd></div>
                        </dl>
                      </section>

                      {selectedForm.description && (
                        <section className="rounded-xl bg-slate-50 border border-slate-200 p-5 text-sm text-slate-600 leading-relaxed">
                          <h3 className="font-semibold text-slate-900 mb-2">About this formula</h3>
                          <p>{selectedForm.description}</p>
                          {meta && <p className={`mt-2 text-xs font-medium ${meta.color.text}`}>{meta.tagline}</p>}
                        </section>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'regulatory' && (
                  <div className="space-y-5 max-w-4xl">
                    {novelFoodIngredients.length === 0 ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                        <h3 className="font-bold text-emerald-900 text-lg">100% clean EU food</h3>
                        <p className="text-emerald-800 text-sm mt-2 leading-relaxed">
                          All ingredients fall under standard EU food law. No pre-market authorisation required.
                          Notify FASFC (Belgium) before first sale.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                        <h3 className="font-bold text-red-900 text-lg">Novel food authorisation required</h3>
                        <p className="text-red-800 text-sm mt-2">
                          {novelFoodIngredients.length} ingredient(s) need EU 2015/2283 approval · 12–18 months · €50–100K+ per item
                        </p>
                      </div>
                    )}

                    {novelFoodIngredients.length > 0 && (
                      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                        {novelFoodIngredients.map((item) => (
                          <li key={item.id} className="flex justify-between gap-4 px-4 py-3 bg-red-50/20">
                            <span className="font-medium text-slate-900">{item.ingredient?.name}</span>
                            <span className="font-mono text-sm text-slate-600">{item.quantity_grams}g</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {checkNeededIngredients.length > 0 && (
                      <ul className="divide-y divide-slate-100 rounded-xl border border-amber-200 overflow-hidden">
                        {checkNeededIngredients.map((item) => (
                          <li key={item.id} className="flex justify-between gap-4 px-4 py-3 bg-amber-50/30">
                            <span className="font-medium text-slate-900">{item.ingredient?.name}</span>
                            <span className="text-xs text-amber-800">Verify before launch</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {activeTab === 'specs' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <section className="rounded-xl border border-slate-200 p-5">
                      <h3 className="font-semibold text-slate-900 mb-4">Physical properties</h3>
                      <dl className="space-y-3 text-sm">
                        {[
                          { label: 'Dry weight / serving', value: `${totalWeight.toFixed(1)} g` },
                          { label: 'Bulk density', value: '~0.43 g/ml' },
                          { label: 'Pouch fill volume', value: `~${Math.round(totalWeight / 0.43)} ml` },
                          { label: 'Recommended pouch', value: '250 ml stand-up' },
                          { label: 'Colour (dry)', value: 'Warm beige, purple-blue specks' },
                          { label: 'Texture', value: 'Fine-coarse powder, visible chia' },
                        ].map((row) => (
                          <div key={row.label} className="flex justify-between gap-4 py-1 border-b border-slate-50">
                            <dt className="text-slate-500">{row.label}</dt>
                            <dd className="font-medium text-slate-900 text-right">{row.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>

                    <section className="space-y-4">
                      {[
                        { format: '400 kcal pouch', price: '€5.99', weight: `~${totalWeight.toFixed(0)}g`, gm: `${(((5.99 - (ingredientCost + 0.5)) / 5.99) * 100).toFixed(1)}%` },
                        { format: '1 kg bag', price: '€49.90', weight: '~981g', gm: '~84%' },
                      ].map((row) => (
                        <div key={row.format} className="rounded-xl border border-slate-200 p-5">
                          <h4 className="font-bold text-slate-900">{row.format}</h4>
                          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <dt className="text-slate-500">Fill weight</dt><dd>{row.weight}</dd>
                            <dt className="text-slate-500">Price</dt><dd className="font-bold">{row.price}</dd>
                            <dt className="text-slate-500">Est. COGS</dt><dd>~€{(ingredientCost + 0.5).toFixed(2)}</dd>
                            <dt className="text-slate-500">Gross margin</dt><dd className={`font-bold ${parseFloat(row.gm) >= 80 ? 'text-emerald-600' : 'text-amber-600'}`}>{row.gm}</dd>
                          </dl>
                        </div>
                      ))}
                      <p className="text-xs text-slate-500 leading-relaxed rounded-lg bg-slate-50 border border-slate-200 p-4">
                        No preservatives · N₂ flush at fill · O₂ absorber recommended · 12 month shelf life claim
                      </p>
                    </section>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
