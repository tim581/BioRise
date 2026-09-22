'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getAllFormulations,
  getFormulationIngredientsWithDetails,
  FormulationIngredientEnriched,
  getAllHealthThemes,
  getThemeAdjustments,
  getAllIngredients,
} from '@/lib/supabase';
import * as Types from '@/lib/types';

// ============================================================
// INGREDIENT PRICE PER KG (wholesale B2B estimates) — mirrors formulations page
// ============================================================
const PRICE_PER_KG: Record<number, number> = {
  2: 9.00,   // Whey Isolate
  5: 2.50,   // Chia
  6: 1.20,   // Flaxseed
  7: 6.50,   // Almonds
  8: 6.00,   // Walnuts
  9: 8.00,   // Cacao
  10: 8.00,  // Cinnamon
  11: 5.00,  // Inulin
  13: 25.00, // Stevia
  14: 0.30,  // Sea Salt
  15: 6.00,  // Turmeric
  17: 18.00, // Blueberry FD
  18: 22.00, // Sour Cherry FD
  22: 45.00, // Spinach FD
  27: 40.00, // Broccoli FD
  29: 10.00, // Beetroot
  32: 6.00,  // Coconut
  33: 0.60,  // Oat Bran
  34: 3.50,  // Wheat Germ
  35: 5.00,  // Black Pepper
  48: 50.00, // Kiwi FD
  49: 8.00,  // Banana Powder
  50: 20.00, // Raspberry Powder
};

const FORMULATION_TIER_LABEL: Record<number, string> = {
  1: 'Foundation',
  2: 'Advanced',
  3: 'Expert',
};

function computeCost(items: FormulationIngredientEnriched[]) {
  let total = 0;
  for (const item of items) {
    const pricePerKg = PRICE_PER_KG[item.ingredient_id] ?? 0;
    total += (pricePerKg / 1000) * item.quantity_grams;
  }
  return total;
}

export default function BatchesPage() {
  const [formulations, setFormulations] = useState<Types.Formulation[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  const [formIngredients, setFormIngredients] = useState<FormulationIngredientEnriched[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  // Health theme selector state (same pattern as formulations page)
  const [themes, setThemes] = useState<any[]>([]);
  const [selectedThemeId, setSelectedThemeId] = useState<number | null>(null);
  const [themeAdjustments, setThemeAdjustments] = useState<any[]>([]);
  const [allIngredients, setAllIngredients] = useState<Record<number, Types.Ingredient>>({});

  // Batch size input
  const [totalKg, setTotalKg] = useState<number>(5);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [formData, themeData, ingredientList] = await Promise.all([
        getAllFormulations(),
        getAllHealthThemes(),
        getAllIngredients(),
      ]);
      setFormulations(formData);
      setThemes(themeData);
      const ingredientMap: Record<number, Types.Ingredient> = {};
      for (const ing of ingredientList) ingredientMap[ing.id] = ing;
      setAllIngredients(ingredientMap);
      if (formData.length > 0) {
        setSelectedFormId(formData[0].id);
        const items = await getFormulationIngredientsWithDetails(formData[0].id);
        setFormIngredients(items);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSelectFormulation = async (formId: number) => {
    setSelectedFormId(formId);
    setLoadingIngredients(true);
    const items = await getFormulationIngredientsWithDetails(formId);
    setFormIngredients(items);
    setLoadingIngredients(false);
  };

  const handleSelectTheme = async (themeId: number | null) => {
    setSelectedThemeId(themeId);
    if (themeId === null) {
      setThemeAdjustments([]);
      return;
    }
    const adjustments = await getThemeAdjustments(themeId);
    setThemeAdjustments(adjustments);
  };

  const selectedForm = formulations.find(f => f.id === selectedFormId) ?? null;
  const selectedTheme = themes.find(t => t.id === selectedThemeId) ?? null;

  // Filter out rejected ingredients — never render or compute with them
  const activeIngredients = formIngredients.filter(i => i.ingredient?.formula_status !== 'rejected');

  // Merge base (active) ingredients with the selected theme's adjustments — mirrors formulations page
  const themedIngredients: FormulationIngredientEnriched[] = useMemo(() => {
    if (selectedThemeId === null || themeAdjustments.length === 0) return activeIngredients;

    let result = activeIngredients.map(i => ({ ...i }));

    for (const adj of themeAdjustments) {
      const idx = result.findIndex(i => i.ingredient_id === adj.ingredient_id);

      if (adj.action === 'boost' || adj.action === 'reduce') {
        if (idx !== -1 && adj.new_dose_g != null) {
          result[idx] = { ...result[idx], quantity_grams: adj.new_dose_g };
        }
      } else if (adj.action === 'add') {
        if (idx === -1) {
          const ingredientDetails = allIngredients[adj.ingredient_id];
          if (ingredientDetails && ingredientDetails.formula_status !== 'rejected') {
            result.push({
              id: -adj.ingredient_id,
              formulation_id: selectedFormId ?? 0,
              ingredient_id: adj.ingredient_id,
              quantity_grams: adj.new_dose_g ?? 0,
              order_priority: 999,
              ingredient: ingredientDetails,
            } as FormulationIngredientEnriched);
          }
        }
      } else if (adj.action === 'remove') {
        if (idx !== -1) result.splice(idx, 1);
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIngredients, selectedThemeId, themeAdjustments, allIngredients, selectedFormId]);

  const displayIngredients = selectedThemeId !== null ? themedIngredients : activeIngredients;

  // Sort by mixing order priority
  const sortedIngredients = [...displayIngredients].sort(
    (a, b) => (a.order_priority ?? 999) - (b.order_priority ?? 999)
  );

  const servingSizeG = displayIngredients.reduce((s, i) => s + Number(i.quantity_grams), 0);
  const servings = servingSizeG > 0 ? (totalKg * 1000) / servingSizeG : 0;
  const costPerServing = computeCost(displayIngredients);
  const totalBatchCost = costPerServing * servings;

  const canCalculate = !!selectedForm && totalKg > 0 && servingSizeG > 0;

  return (
    <div className="space-y-6 print:space-y-4">
      {/* PAGE HEADER */}
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Production Batches</h1>
          <p className="text-slate-500 mt-1">Batch calculator · scale a formulation to a production run</p>
        </div>
        {canCalculate && (
          <button onClick={() => window.print()} className="btn btn-primary">
            🖨️ Print / Export
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400">Loading formula data...</div>
      ) : (
        <div className="grid grid-cols-4 gap-6 print:block">
          {/* LEFT: CONFIG PANEL */}
          <div className="col-span-1 space-y-4 print:hidden">
            {/* STEP 1: FORMULATION */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Step 1 · Formulation</h4>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white"
                value={selectedFormId ?? ''}
                onChange={e => handleSelectFormulation(Number(e.target.value))}
              >
                {formulations.length === 0 && <option value="">No formulations</option>}
                {formulations.map(form => (
                  <option key={form.id} value={form.id}>
                    {form.name} ({FORMULATION_TIER_LABEL[form.id] ?? form.tier ?? 'formula'})
                  </option>
                ))}
              </select>
            </div>

            {/* STEP 2: HEALTH THEME (optional) */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Step 2 · Health Theme (optional)</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleSelectTheme(null)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    selectedThemeId === null
                      ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Base formula
                </button>
                {themes.map(theme => {
                  const isActive = selectedThemeId === theme.id;
                  const isFlagship = !!theme.is_flagship;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleSelectTheme(theme.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                        isActive
                          ? isFlagship
                            ? 'bg-amber-50 border-amber-400 text-amber-800 ring-1 ring-amber-300'
                            : 'bg-indigo-50 border-indigo-400 text-indigo-700'
                          : isFlagship
                            ? 'bg-white border-amber-300 text-amber-700 hover:bg-amber-50'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                      title={theme.tagline ?? undefined}
                    >
                      {theme.hero_emoji ? `${theme.hero_emoji} ` : ''}{theme.name}{isFlagship ? ' ⭐' : ''}
                    </button>
                  );
                })}
              </div>
              {selectedTheme && (
                <p className="text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                  Batching base + {selectedTheme.name} adjustments
                </p>
              )}
            </div>

            {/* STEP 3: TOTAL KG */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Step 3 · Batch Size</h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={totalKg}
                  onChange={e => setTotalKg(parseFloat(e.target.value) || 0)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800"
                />
                <span className="text-sm text-slate-500 font-medium">kg</span>
              </div>
              <p className="text-xs text-slate-400">Quantities auto-calculate as you edit this.</p>
            </div>
          </div>

          {/* RIGHT: RESULTS */}
          <div className="col-span-3 space-y-6">
            {!canCalculate ? (
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Select a formulation and batch size</h3>
                <p className="text-slate-600">Choose a formulation, optionally a health theme, and a total kg amount to generate a batch sheet.</p>
              </div>
            ) : (
              <>
                {/* SUMMARY CARD */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{selectedForm?.name}</h3>
                      <p className="text-sm text-slate-500">
                        {FORMULATION_TIER_LABEL[selectedForm?.id ?? 0] ?? selectedForm?.tier} tier
                        {selectedTheme ? ` · ${selectedTheme.name} theme` : ' · base formula'}
                      </p>
                    </div>
                    <div className="text-xs text-slate-400 print:hidden">Batch sheet · generated {new Date().toLocaleDateString()}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-slate-900">{totalKg.toFixed(2)}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Total kg</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-slate-900">{servingSizeG.toFixed(1)}g</div>
                      <div className="text-xs text-slate-500 mt-0.5">Serving size</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-emerald-600">{Math.floor(servings).toLocaleString()}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Servings</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-slate-900">€{totalBatchCost.toFixed(2)}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Est. batch cost</div>
                    </div>
                  </div>
                </div>

                {/* BATCH SHEET TABLE */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide">Batch Sheet</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">#</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Ingredient</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Per Serving (g)</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">% Mix</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Batch Qty (g)</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Batch Qty (kg)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedIngredients.map((item, idx) => {
                          const g = Number(item.quantity_grams);
                          const pct = servingSizeG > 0 ? (g / servingSizeG) * 100 : 0;
                          const batchQtyG = servingSizeG > 0 ? (g / servingSizeG) * totalKg * 1000 : 0;
                          const batchQtyKg = batchQtyG / 1000;
                          return (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 text-slate-400 text-xs">{item.order_priority ?? idx + 1}</td>
                              <td className="px-4 py-3 font-medium text-slate-900">
                                {item.ingredient?.name ?? `#${item.ingredient_id}`}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-slate-700">{g}g</td>
                              <td className="px-4 py-3 text-right text-slate-500 text-xs">{pct.toFixed(1)}%</td>
                              <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">{batchQtyG.toFixed(1)}g</td>
                              <td className="px-4 py-3 text-right font-mono text-emerald-700">{batchQtyKg.toFixed(3)}kg</td>
                            </tr>
                          );
                        })}
                        {/* TOTALS ROW */}
                        <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold">
                          <td className="px-4 py-3" colSpan={2}>
                            <span className="text-slate-700">TOTAL</span>
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-900">{servingSizeG.toFixed(1)}g</td>
                          <td className="px-4 py-3 text-right text-slate-500">100%</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-900">{(totalKg * 1000).toFixed(1)}g</td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-700">{totalKg.toFixed(3)}kg</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* MIXING INSTRUCTIONS */}
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <h3 className="font-semibold text-sm text-slate-700 uppercase tracking-wide mb-4">Mixing Instructions</h3>
                  <ol className="space-y-3">
                    {sortedIngredients.map((item, idx) => {
                      const batchQtyG = servingSizeG > 0 ? (Number(item.quantity_grams) / servingSizeG) * totalKg * 1000 : 0;
                      return (
                        <li key={item.id} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-medium text-slate-900">
                              Add {batchQtyG.toFixed(1)}g ({(batchQtyG / 1000).toFixed(3)}kg) of {item.ingredient?.name ?? `#${item.ingredient_id}`}
                            </span>
                            {item.ingredient?.notes && (
                              <p className="text-xs text-slate-500 mt-0.5">{item.ingredient.notes.split('—')[0]}</p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center mt-0.5">
                        ✓
                      </span>
                      <span className="font-medium text-slate-900">
                        Blend thoroughly, verify total batch weight ≈ {(totalKg * 1000).toFixed(1)}g, then portion into {Math.floor(servings).toLocaleString()} servings of {servingSizeG.toFixed(1)}g each.
                      </span>
                    </li>
                  </ol>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
