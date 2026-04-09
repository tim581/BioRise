'use client';

import { useEffect, useState } from 'react';
import { getAllSKUUnitEconomics, getAllProductSKUs } from '@/lib/supabase';
import * as Types from '@/lib/types';

export default function UnitEconomicsPage() {
  const [economics, setEconomics] = useState<Types.SKUUnitEconomics[]>([]);
  const [skus, setSkus] = useState<Types.ProductSKU[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [econ, skuData] = await Promise.all([
        getAllSKUUnitEconomics(),
        getAllProductSKUs(),
      ]);
      setEconomics(econ);
      setSkus(skuData);
      setLoading(false);
    }
    load();
  }, []);

  const getSKUName = (skuId: number) => {
    return skus.find(s => s.id === skuId)?.product_name || `SKU #${skuId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Unit Economics</h1>
          <p className="text-slate-600 mt-1">
            COGS breakdown & margin analysis
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-600">Loading unit economics...</div>
      ) : economics.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">SKU</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-900">Raw Material</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-900">Blending</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-900">Freeze-Dry</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-900">QC</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-900">Packaging</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-900">Carton</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-900 bg-blue-50">Total COGS</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-900">Margin %</th>
              </tr>
            </thead>
            <tbody>
              {economics.map(econ => (
                <tr key={econ.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {getSKUName(econ.sku_id)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    €{econ.raw_material_cost_eur.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    €{econ.blending_cost_eur.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    €{econ.freeze_dry_cost_eur.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    €{econ.quality_check_cost_eur.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    €{econ.packaging_cost_eur.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-600">
                    €{econ.carton_cost_eur.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-900 font-semibold bg-blue-50">
                    €{econ.total_cogs_eur ? econ.total_cogs_eur.toFixed(2) : '0.00'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {econ.gross_margin_percent ? (
                      <span className={econ.gross_margin_percent > 50 ? 'text-green-600 font-semibold' : 'text-orange-600'}>
                        {econ.gross_margin_percent.toFixed(1)}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-600">No unit economics data yet</div>
      )}
    </div>
  );
}
