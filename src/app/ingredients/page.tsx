'use client';

import { useEffect, useState } from 'react';
import { getAllIngredients } from '@/lib/supabase';
import type { Ingredient } from '@/lib/types';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIngredients();
  }, []);

  async function loadIngredients() {
    try {
      const data = await getAllIngredients();
      setIngredients(data);
    } catch (error) {
      console.error('Failed to load ingredients:', error);
    } finally {
      setLoading(false);
    }
  }

  const categorized = ingredients.reduce(
    (acc, ing) => {
      if (!acc[ing.category]) acc[ing.category] = [];
      acc[ing.category].push(ing);
      return acc;
    },
    {} as Record<string, Ingredient[]>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ingredients</h1>
          <p className="text-slate-600 mt-1">
            Master ingredient list • Sourcing & pricing
          </p>
        </div>
        <button className="primary">+ Add Ingredient</button>
      </div>

      {/* BY CATEGORY */}
      {loading ? (
        <div className="text-center py-8 text-slate-600">Loading...</div>
      ) : (
        <div className="space-y-8">
          {Object.entries(categorized).map(([category, items]) => (
            <div key={category}>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 capitalize">
                {category}
              </h2>
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Unit</th>
                      <th>Cost/Unit</th>
                      <th>Organic</th>
                      <th>Shelf Life</th>
                      <th>Supplier</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((ing) => (
                      <tr key={ing.id}>
                        <td className="font-medium text-slate-900">
                          {ing.name}
                        </td>
                        <td className="text-slate-600">{ing.unit}</td>
                        <td className="text-slate-600">
                          {ing.cost_per_unit
                            ? `€${ing.cost_per_unit.toFixed(2)}`
                            : '-'}
                        </td>
                        <td>
                          {ing.organic_certified ? (
                            <span className="badge badge-success">Yes</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="text-slate-600">
                          {ing.shelf_life_days
                            ? `${ing.shelf_life_days} days`
                            : '-'}
                        </td>
                        <td className="text-slate-600 text-sm">
                          {ing.primary_supplier_id ? 'Assigned' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {ingredients.length === 0 && !loading && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 text-center">
          <p className="text-slate-600">
            No ingredients yet. Start by adding your core ingredients.
          </p>
          <button className="primary mt-4">Add First Ingredient</button>
        </div>
      )}
    </div>
  );
}
