'use client';

import { useEffect, useState } from 'react';
import { getAllFormulations, getFormulationIngredients, getAllIngredients } from '@/lib/supabase';
import * as Types from '@/lib/types';

export default function FormulationsPage() {
  const [formulations, setFormulations] = useState<Types.Formulation[]>([]);
  const [ingredients, setIngredients] = useState<Types.Ingredient[]>([]);
  const [selectedForm, setSelectedForm] = useState<Types.Formulation | null>(null);
  const [formIngredients, setFormIngredients] = useState<Types.FormulationIngredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [formData, ingData] = await Promise.all([
        getAllFormulations(),
        getAllIngredients(),
      ]);
      setFormulations(formData);
      setIngredients(ingData);
      if (formData.length > 0) {
        setSelectedForm(formData[0]);
        const ingList = await getFormulationIngredients(formData[0].id);
        setFormIngredients(ingList);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSelectFormulation = async (form: Types.Formulation) => {
    setSelectedForm(form);
    const ingList = await getFormulationIngredients(form.id);
    setFormIngredients(ingList);
  };

  const getIngredientName = (ingId: number) => {
    return ingredients.find(i => i.id === ingId)?.name || `Ingredient #${ingId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Formulations</h1>
          <p className="text-slate-600 mt-1">
            Recipe development & versions • {formulations.length} total
          </p>
        </div>
        <button className="btn btn-primary">+ New Formulation</button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-600">Loading formulations...</div>
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {/* FORMULATIONS LIST */}
          <div className="col-span-1">
            <div className="bg-white rounded-lg border border-slate-200">
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-semibold text-slate-900">Versions</h3>
              </div>
              <div className="divide-y divide-slate-200">
                {formulations.length > 0 ? (
                  formulations.map(form => (
                    <button
                      key={form.id}
                      onClick={() => handleSelectFormulation(form)}
                      className={`w-full text-left px-4 py-3 transition ${
                        selectedForm?.id === form.id
                          ? 'bg-blue-50 border-l-2 border-blue-500'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-medium text-slate-900">{form.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        v{form.version || 1} • {form.status || 'draft'}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-600 text-sm">No formulations</div>
                )}
              </div>
            </div>
          </div>

          {/* FORMULATION DETAILS */}
          <div className="col-span-2">
            {selectedForm ? (
              <div className="space-y-4">
                {/* HEADER */}
                <div className="bg-white rounded-lg border border-slate-200 p-6">
                  <h2 className="text-2xl font-bold text-slate-900">{selectedForm.name}</h2>
                  <p className="text-slate-600 mt-2">{selectedForm.description}</p>
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase">Target Calories</div>
                      <div className="text-lg font-bold text-slate-900">
                        {selectedForm.target_calories || '-'} kcal
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase">Dry Weight</div>
                      <div className="text-lg font-bold text-slate-900">
                        {selectedForm.total_dry_weight_grams || '-'} g
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase">Status</div>
                      <div className="text-lg font-bold text-slate-900 capitalize">
                        {selectedForm.status || 'draft'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase">Version</div>
                      <div className="text-lg font-bold text-slate-900">
                        v{selectedForm.version || 1}
                      </div>
                    </div>
                  </div>
                </div>

                {/* INGREDIENTS TABLE */}
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-900">
                      Ingredients ({formIngredients.length})
                    </h3>
                  </div>
                  {formIngredients.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Priority</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Name</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">Quantity</th>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {formIngredients.map(fi => (
                          <tr key={fi.id} className="hover:bg-slate-50">
                            <td className="px-4 py-2 text-slate-600">
                              {fi.order_priority || '-'}
                            </td>
                            <td className="px-4 py-2 font-medium text-slate-900">
                              {getIngredientName(fi.ingredient_id)}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-slate-900">
                              {fi.quantity_grams}g
                            </td>
                            <td className="px-4 py-2 text-slate-600 text-xs">
                              {fi.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-center text-slate-600">No ingredients added yet</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-600">
                Select a formulation to view details
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
