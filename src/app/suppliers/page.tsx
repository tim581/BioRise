'use client';

import { useEffect, useState } from 'react';
import { getAllSuppliers, getSupplierCategories } from '@/lib/supabase';
import * as Types from '@/lib/types';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Types.Supplier[]>([]);
  const [categories, setCategories] = useState<Types.SupplierCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [supplierData, categoryData] = await Promise.all([
        getAllSuppliers(),
        getSupplierCategories(),
      ]);
      setSuppliers(supplierData);
      setCategories(categoryData);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filter === 'all' 
    ? suppliers 
    : suppliers.filter(s => s.category_id === parseInt(filter));

  const getCategoryName = (catId: number) => {
    return categories.find(c => c.id === catId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>
          <p className="text-slate-600 mt-1">
            Raw material & co-packing partners • {suppliers.length} total
          </p>
        </div>
        <button className="btn btn-primary">+ Add Supplier</button>
      </div>

      {/* FILTER BY CATEGORY */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          All ({suppliers.length})
        </button>
        {categories.map(cat => {
          const count = suppliers.filter(s => s.category_id === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id.toString())}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === cat.id.toString()
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* SUPPLIERS TABLE */}
      {loading ? (
        <div className="text-center py-8 text-slate-600">Loading suppliers...</div>
      ) : filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Location</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Contact</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(supplier => (
                <tr key={supplier.id} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{supplier.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{supplier.description}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {getCategoryName(supplier.category_id)}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-sm">
                    {supplier.location_city && supplier.location_country
                      ? `${supplier.location_city}, ${supplier.location_country}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {supplier.email ? (
                      <a href={`mailto:${supplier.email}`} className="text-blue-600 hover:underline">
                        {supplier.email}
                      </a>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {supplier.verified ? (
                      <span className="badge badge-success">Verified</span>
                    ) : (
                      <span className="badge badge-warning">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-600">No suppliers found</div>
      )}
    </div>
  );
}
