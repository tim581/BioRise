'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardStats } from '@/lib/supabase';
import type { DashboardStats } from '@/lib/types';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
          Failed to load dashboard data. Check your Supabase connection.
        </div>
      </div>
    );
  }

  const quickActions = [
    { label: '➕ Add Supplier', href: '/suppliers?action=new' },
    { label: '➕ Add Ingredient', href: '/ingredients?action=new' },
    { label: '➕ Create Formulation', href: '/formulations?action=new' },
    { label: '📊 View Economics', href: '/unit-economics' },
  ];

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">
          BioRise operations & formulation management
        </p>
      </div>

      {/* KEY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Suppliers"
          value={stats.total_suppliers}
          icon="🤝"
          href="/suppliers"
        />
        <StatCard
          label="Ingredients"
          value={stats.total_ingredients}
          icon="🌾"
          href="/ingredients"
        />
        <StatCard
          label="Formulations"
          value={stats.total_formulations}
          icon="🍲"
          href="/formulations"
        />
        <StatCard
          label="Active SKUs"
          value={stats.active_skus}
          icon="📦"
          href="/skus"
        />
      </div>

      {/* ECONOMICS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            💰 Unit Economics
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-600">Average COGS</p>
              <p className="text-2xl font-bold text-slate-900">
                €{stats.average_cogs.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Average Margin</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.average_margin.toFixed(1)}%
              </p>
            </div>
            <Link
              href="/unit-economics"
              className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View detailed economics →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            🌍 Supplier Locations
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.suppliers_by_country).map(
              ([country, count]) => (
                <div key={country} className="flex justify-between items-center">
                  <span className="text-sm text-slate-700">{country}</span>
                  <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded">
                    {count}
                  </span>
                </div>
              )
            )}
          </div>
          <Link
            href="/suppliers"
            className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Manage suppliers →
          </Link>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="block bg-white border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition text-center"
            >
              <p className="font-medium text-slate-900">{action.label}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* RESEARCH SUMMARY */}
      <div className="bg-slate-100 rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">
          📚 Market Research
        </h2>
        <p className="text-slate-600">
          Competitors tracked: <strong>{stats.competitors_tracked}</strong>
        </p>
        <Link
          href="/competitors"
          className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View competitive intel →
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: number;
  icon: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition cursor-pointer">
        <div className="text-4xl mb-2">{icon}</div>
        <p className="text-sm text-slate-600">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      </div>
    </Link>
  );
}
