'use client';

import { useEffect, useState } from 'react';
import { getAllSuppliers } from '@/lib/supabase';
import type { Supplier } from '@/lib/types';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCountry, setFilterCountry] = useState<string>('');

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    try {
      const data = await getAllSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Failed to load suppliers:', error);
    } finally {
      setLoading(false);
    }
  }

  const filtered = filterCountry
    ? suppliers.filter((s) => s.location_country === filterCountry)
    : suppliers;

  const countries = [...new Set(suppliers.map((s) => s.location_country))].sort();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Suppliers</h1>
          <p className="text-slate-600 mt-1">
            {filtered.length} suppliers • Belgium/EU focus
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-4">
        <select
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded text-slate-900"
        >
          <option value="">All Countries</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>
      </div>

      {/* SUPPLIERS TABLE */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-600">Loading...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Location</th>
                <th>Contact</th>
                <th>Lead Time</th>
                <th>Quality</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((supplier) => (
                <tr key={supplier.id}>
                  <td>
                    <span className="font-medium text-slate-900">
                      {supplier.name}
                    </span>
                  </td>
                  <td className="text-slate-600">{supplier.category_id}</td>
                  <td className="text-slate-600">
                    {supplier.location_city}, {supplier.location_country}
                  </td>
                  <td className="text-slate-600">
                    {supplier.email && (
                      <a
                        href={`mailto:${supplier.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {supplier.email}
                      </a>
                    )}
                  </td>
                  <td className="text-slate-600">
                    {supplier.lead_time_days
                      ? `${supplier.lead_time_days} days`
                      : '-'}
                  </td>
                  <td>
                    <span className="badge badge-info">
                      {supplier.quality_grade || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 text-center">
          <p className="text-slate-600">No suppliers found</p>
        </div>
      )}
    </div>
  );
}
