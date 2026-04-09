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

      {/* INGREDIENTS TABLE */}
      {loading ? (
        <div className="text-center py-8 text-slate-600">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {ingredients.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Unit</th>
                  <th>Quality Standard</th>
                  <th>Shelf Life</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ing) => (
                  <tr key={ing.id}>
                    <td className="font-medium text-slate-900">
                      {ing.name}
                    </td>
                    <td className="text-slate-600 text-sm">
                      {ing.description || '-'}
                    </td>
                    <td className="text-slate-600">
                      {ing.unit_of_measure || '-'}
                    </td>
                    <td className="text-slate-600 text-sm">
                      {ing.target_quality_standard || '-'}
                    </td>
                    <td className="text-slate-600">
                      {ing.shelf_life_days
                        ? `${ing.shelf_life_days} days`
                        : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center">
              <p className="text-slate-600">
                No ingredients yet. Start by adding your core ingredients.
              </p>
              <button className="primary mt-4">Add First Ingredient</button>
            </div>
          )}
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
