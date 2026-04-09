'use client';

import { useEffect, useState } from 'react';
import { getAllProductSKUs } from '@/lib/supabase';
import * as Types from '@/lib/types';

export default function SKUsPage() {
  const [skus, setSkus] = useState<Types.ProductSKU[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getAllProductSKUs();
      setSkus(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">SKUs & Products</h1>
          <p className="text-slate-600 mt-1">
            Product variants, packaging & specs
          </p>
        </div>
        <button className="btn btn-primary">+ New SKU</button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-600">Loading SKUs...</div>
      ) : skus.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {skus.map(sku => (
            <div key={sku.id} className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{sku.product_name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{sku.sku_code}</p>
                </div>
                <span className={`badge text-xs ${sku.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                  {sku.status || 'draft'}
                </span>
              </div>

              {sku.variant && (
                <p className="text-sm text-slate-600 mb-3">Variant: {sku.variant}</p>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                {sku.bag_count && (
                  <div>
                    <span className="text-slate-600">Bags:</span>
                    <span className="font-mono ml-2">{sku.bag_count}</span>
                  </div>
                )}
                {sku.kcal_per_bag && (
                  <div>
                    <span className="text-slate-600">kcal/bag:</span>
                    <span className="font-mono ml-2">{sku.kcal_per_bag}</span>
                  </div>
                )}
                {sku.target_price && (
                  <div>
                    <span className="text-slate-600">Price:</span>
                    <span className="font-mono ml-2">€{sku.target_price}</span>
                  </div>
                )}
                {sku.manufacturing_cost && (
                  <div>
                    <span className="text-slate-600">COGS:</span>
                    <span className="font-mono ml-2">€{sku.manufacturing_cost}</span>
                  </div>
                )}
              </div>

              {sku.certifications && sku.certifications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-xs text-slate-600 font-semibold mb-2">Certifications:</p>
                  <div className="flex flex-wrap gap-2">
                    {sku.certifications.map((cert, i) => (
                      <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-600">No SKUs yet</div>
      )}
    </div>
  );
}
