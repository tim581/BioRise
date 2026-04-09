'use client';

import { useEffect, useState } from 'react';
import { getAllSKUs } from '@/lib/supabase';

export default function UnitEconomicsPage() {
  const [skus, setSkus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSKUs();
  }, []);

  async function loadSKUs() {
    try {
      const data = await getAllSKUs();
      setSkus(data);
    } catch (error) {
      console.error('Failed to load SKUs:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Unit Economics</h1>
          <p className="text-slate-600 mt-1">
            COGS tracking, cost breakdown & scenario modeling
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Total SKUs</p>
          <p className="text-3xl font-bold text-slate-900">{skus.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Avg COGS</p>
          <p className="text-3xl font-bold text-slate-900">
            €
            {skus.length > 0
              ? (
                  skus.reduce(
                    (sum, sku) =>
                      sum + (sku.unit_economics?.[0]?.total_cogs || 0),
                    0
                  ) / skus.length
                ).toFixed(2)
              : '0.00'}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Avg Margin</p>
          <p className="text-3xl font-bold text-green-600">
            {skus.length > 0
              ? (
                  skus.reduce(
                    (sum, sku) =>
                      sum + (sku.unit_economics?.[0]?.gross_margin_percent || 0),
                    0
                  ) / skus.length
                ).toFixed(1)
              : '0.0'}
            %
          </p>
        </div>
      </div>

      {/* SKUS TABLE */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>SKU Name</th>
              <th>Pack Size</th>
              <th>Raw Materials</th>
              <th>Processing</th>
              <th>Packaging</th>
              <th>Total COGS</th>
              <th>Margin %</th>
            </tr>
          </thead>
          <tbody>
            {skus.map((sku) => {
              const econ = sku.unit_economics?.[0];
              return (
                <tr key={sku.id}>
                  <td className="font-medium text-slate-900">{sku.name}</td>
                  <td className="text-slate-600">{sku.pack_size}</td>
                  <td className="text-slate-600">
                    €{econ?.raw_material_cost?.toFixed(2) || '0.00'}
                  </td>
                  <td className="text-slate-600">
                    €{econ?.blending_cost?.toFixed(2) || '0.00'}
                  </td>
                  <td className="text-slate-600">
                    €
                    {(
                      (econ?.packaging_bag_cost || 0) +
                      (econ?.packaging_carton_cost || 0)
                    ).toFixed(2)}
                  </td>
                  <td className="font-medium text-slate-900">
                    €{econ?.total_cogs?.toFixed(2) || '0.00'}
                  </td>
                  <td className="text-green-600 font-medium">
                    {econ?.gross_margin_percent?.toFixed(1) || '0.0'}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {skus.length === 0 && !loading && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 text-center">
          <p className="text-slate-600">
            No SKUs yet. Create formulations and packaging combinations first.
          </p>
        </div>
      )}
    </div>
  );
}
