'use client';

import { useEffect, useState } from 'react';
import { getDashboardSummary } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import * as Types from '@/lib/types';

export default function Dashboard() {
  const [summary, setSummary] = useState<Types.DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [maxInvestment, setMaxInvestment] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [data, cashflowRes] = await Promise.all([
        getDashboardSummary(),
        supabase
          .from('cashflow_projections')
          .select('cumulative_cashflow')
          .order('cumulative_cashflow', { ascending: true })
          .limit(1),
      ]);
      setSummary(data);
      if (cashflowRes.data && cashflowRes.data.length > 0) {
        const min = cashflowRes.data[0].cumulative_cashflow;
        setMaxInvestment(min < 0 ? Math.abs(min) : 0);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-slate-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">BioRise Dashboard</h1>
        <p className="text-slate-600 mt-2">
          Internal operations hub • Product formulation, sourcing & unit economics
        </p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* SUPPLIERS */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Suppliers</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">
            {summary?.total_suppliers || 0}
          </div>
          <p className="text-xs text-slate-600 mt-2">Sourcing partners</p>
        </div>

        {/* INGREDIENTS */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase">Ingredients</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">
            {summary?.total_ingredients || 0}
          </div>
          <p className="text-xs text-slate-600 mt-2">Master list</p>
        </div>

        {/* FORMULATIONS */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase">Formulations</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">
            {summary?.active_formulations || 0}
          </div>
          <p className="text-xs text-slate-600 mt-2">Active versions</p>
        </div>

        {/* SKUS */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase">SKUs</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">
            {summary?.total_skus || 0}
          </div>
          <p className="text-xs text-slate-600 mt-2">Product variants</p>
        </div>

        {/* AVG COGS */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase">Avg COGS</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">
            €{summary?.average_cogs_eur?.toFixed(2) || '0.00'}
          </div>
          <p className="text-xs text-slate-600 mt-2">Per unit</p>
        </div>

        {/* TOTAL INVESTMENT NEEDED */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase">Investment Needed</div>
          <div className="text-3xl font-bold text-red-600 mt-2">
            {maxInvestment !== null ? `€${maxInvestment.toLocaleString('en-IE')}` : '—'}
          </div>
          <p className="text-xs text-slate-600 mt-2">Peak funding</p>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/suppliers" className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
          <h3 className="font-semibold text-slate-900">Manage Suppliers</h3>
          <p className="text-sm text-slate-600 mt-1">
            View sourcing partners, quotes & benchmarks
          </p>
        </a>

        <a href="/ingredients" className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
          <h3 className="font-semibold text-slate-900">Ingredients</h3>
          <p className="text-sm text-slate-600 mt-1">
            Master ingredient library & categories
          </p>
        </a>

        <a href="/formulations" className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
          <h3 className="font-semibold text-slate-900">Formulations</h3>
          <p className="text-sm text-slate-600 mt-1">
            Recipe development & versioning
          </p>
        </a>

        <a href="/skus" className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
          <h3 className="font-semibold text-slate-900">SKUs & Packaging</h3>
          <p className="text-sm text-slate-600 mt-1">
            Product variants & packaging specs
          </p>
        </a>

        <a href="/unit-economics" className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
          <h3 className="font-semibold text-slate-900">Unit Economics</h3>
          <p className="text-sm text-slate-600 mt-1">
            COGS breakdown & pricing analysis
          </p>
        </a>

        <a href="/cashflow" className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
          <h3 className="font-semibold text-slate-900">💸 Cashflow Projections</h3>
          <p className="text-sm text-slate-600 mt-1">
            24-month financial model, revenue & runway
          </p>
        </a>

        <a href="/competitors" className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-md transition">
          <h3 className="font-semibold text-slate-900">Competitor Tracking</h3>
          <p className="text-sm text-slate-600 mt-1">
            Product benchmarking & ingredient intelligence
          </p>
        </a>
      </div>

      {/* INFO BOX */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> This is an internal operations dashboard for BioRise. Customer-facing storefront will be on Shopify.
        </p>
      </div>
    </div>
  );
}
