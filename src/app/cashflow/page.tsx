'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CashflowRow {
  id: number;
  month_number: number;
  month_label: string;
  phase: string;
  revenue_d2c: number;
  revenue_amazon: number;
  revenue_subscriptions: number;
  revenue_other: number;
  cogs_ingredients: number;
  cogs_packaging: number;
  cogs_copacker: number;
  cogs_freight: number;
  cogs_3pl: number;
  opex_marketing: number;
  opex_ambassadors: number;
  opex_ads_paid: number;
  opex_content_production: number;
  opex_software: number;
  opex_legal_ip: number;
  opex_packaging_design: number;
  opex_product_dev: number;
  opex_samples_testing: number;
  opex_travel: number;
  opex_salary: number;
  opex_insurance: number;
  opex_other: number;
  capex_initial_inventory: number;
  capex_equipment: number;
  capex_other: number;
  cumulative_cashflow: number;
  units_sold: number;
  active_subscribers: number;
  assumptions: string | null;
}

const PHASE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  exploration: { bg: 'bg-slate-100', text: 'text-slate-700', bar: 'bg-slate-400' },
  pre_launch: { bg: 'bg-blue-100', text: 'text-blue-700', bar: 'bg-blue-500' },
  launch: { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  growth: { bg: 'bg-amber-100', text: 'text-amber-700', bar: 'bg-amber-500' },
  scale: { bg: 'bg-purple-100', text: 'text-purple-700', bar: 'bg-purple-500' },
};

function n(v: number | null | undefined): number {
  return v ?? 0;
}

function eur(v: number): string {
  if (v === 0) return '—';
  return `€${v.toLocaleString('en-IE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function totalRevenue(r: CashflowRow): number {
  return n(r.revenue_d2c) + n(r.revenue_amazon) + n(r.revenue_subscriptions) + n(r.revenue_other);
}

function totalCogs(r: CashflowRow): number {
  return n(r.cogs_ingredients) + n(r.cogs_packaging) + n(r.cogs_copacker) + n(r.cogs_freight) + n(r.cogs_3pl);
}

function totalOpex(r: CashflowRow): number {
  return n(r.opex_marketing) + n(r.opex_ambassadors) + n(r.opex_ads_paid) + n(r.opex_content_production) +
    n(r.opex_software) + n(r.opex_legal_ip) + n(r.opex_packaging_design) + n(r.opex_product_dev) +
    n(r.opex_samples_testing) + n(r.opex_travel) + n(r.opex_salary) + n(r.opex_insurance) + n(r.opex_other);
}

function totalCapex(r: CashflowRow): number {
  return n(r.capex_initial_inventory) + n(r.capex_equipment) + n(r.capex_other);
}

function totalCosts(r: CashflowRow): number {
  return totalCogs(r) + totalOpex(r) + totalCapex(r);
}

function netCashflow(r: CashflowRow): number {
  return totalRevenue(r) - totalCosts(r);
}

export default function CashflowPage() {
  const [data, setData] = useState<CashflowRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCogs, setShowCogs] = useState(false);
  const [showOpex, setShowOpex] = useState(false);
  const [showCapex, setShowCapex] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: rows, error: err } = await supabase
          .from('cashflow_projections')
          .select('*')
          .order('month_number');
        if (err) throw err;
        setData(rows || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load cashflow data');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="p-8 text-slate-500">Loading cashflow data…</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (data.length === 0) return <div className="p-8 text-slate-500">No cashflow data available.</div>;

  // KPIs
  const minCumulative = Math.min(...data.map(r => n(r.cumulative_cashflow)));
  const totalInvestment = minCumulative < 0 ? Math.abs(minCumulative) : 0;

  const first6 = data.filter(r => r.month_number <= 6);
  const avgBurnRate = first6.length > 0
    ? first6.reduce((s, r) => s + totalCosts(r), 0) / first6.length
    : 0;

  const breakEvenMonth = data.find(r => totalRevenue(r) > totalCosts(r) && totalRevenue(r) > 0);

  const runwayMonth = data.find(r => n(r.cumulative_cashflow) > 0 && r.month_number > 1);

  // Phase segments
  const phases: { phase: string; count: number }[] = [];
  data.forEach(r => {
    const last = phases[phases.length - 1];
    if (last && last.phase === r.phase) {
      last.count++;
    } else {
      phases.push({ phase: r.phase, count: 1 });
    }
  });

  // Chart data
  const maxChartVal = Math.max(
    ...data.map(r => Math.max(totalRevenue(r), totalCosts(r))),
    1
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">💸 Cashflow Projections</h1>
        <p className="text-slate-600 mt-1">24-month financial model — revenue, costs & runway</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Investment Needed</div>
          <div className="text-3xl font-bold text-red-600 mt-2">{eur(totalInvestment)}</div>
          <p className="text-xs text-slate-600 mt-2">Peak funding requirement</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase">Monthly Burn Rate</div>
          <div className="text-3xl font-bold text-slate-900 mt-2">{eur(Math.round(avgBurnRate))}</div>
          <p className="text-xs text-slate-600 mt-2">Avg first 6 months</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase">Break-even Month</div>
          <div className="text-3xl font-bold text-emerald-600 mt-2">
            {breakEvenMonth ? `M${breakEvenMonth.month_number}` : '—'}
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {breakEvenMonth ? breakEvenMonth.month_label : 'Not yet projected'}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="text-xs font-semibold text-slate-500 uppercase">Runway to Positive</div>
          <div className="text-3xl font-bold text-blue-600 mt-2">
            {runwayMonth ? `${runwayMonth.month_number} mo` : '—'}
          </div>
          <p className="text-xs text-slate-600 mt-2">
            {runwayMonth ? runwayMonth.month_label : 'Cumulative stays negative'}
          </p>
        </div>
      </div>

      {/* PHASE TIMELINE */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-3">Phase Timeline</h2>
        <div className="flex rounded-lg overflow-hidden h-10">
          {phases.map((p, i) => {
            const pct = (p.count / data.length) * 100;
            const colors = PHASE_COLORS[p.phase] || PHASE_COLORS.exploration;
            return (
              <div
                key={i}
                className={`${colors.bar} flex items-center justify-center text-white text-xs font-medium`}
                style={{ width: `${pct}%` }}
                title={`${p.phase.replace('_', ' ')} — ${p.count} months`}
              >
                {pct > 12 && (
                  <span>{p.phase.replace('_', ' ')} ({p.count}mo)</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3">
          {Object.entries(PHASE_COLORS).map(([phase, colors]) => (
            <div key={phase} className="flex items-center gap-1.5 text-xs text-slate-600">
              <div className={`w-3 h-3 rounded ${colors.bar}`} />
              <span>{phase.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* REVENUE VS COSTS CHART */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="font-semibold text-slate-800 mb-4">Revenue vs Costs (Monthly)</h2>
        <div className="flex items-end gap-1" style={{ height: '200px' }}>
          {data.map(r => {
            const rev = totalRevenue(r);
            const cost = totalCosts(r);
            const revH = (rev / maxChartVal) * 180;
            const costH = (cost / maxChartVal) * 180;
            return (
              <div key={r.month_number} className="flex-1 flex flex-col items-center gap-0.5" title={`M${r.month_number}: Rev ${eur(rev)} / Cost ${eur(cost)}`}>
                <div className="flex items-end gap-px w-full" style={{ height: '180px' }}>
                  <div
                    className="flex-1 bg-emerald-400 rounded-t-sm"
                    style={{ height: `${Math.max(revH, 1)}px` }}
                  />
                  <div
                    className="flex-1 bg-red-400 rounded-t-sm"
                    style={{ height: `${Math.max(costH, 1)}px` }}
                  />
                </div>
                <span className="text-[9px] text-slate-400">{r.month_number}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-emerald-400" /> Revenue</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-400" /> Total Costs</div>
        </div>

        {/* Cumulative cashflow line (as values) */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h3 className="text-sm font-medium text-slate-600 mb-2">Cumulative Cashflow</h3>
          <div className="flex gap-1 overflow-x-auto">
            {data.map(r => (
              <div key={r.month_number} className="flex-1 text-center min-w-[40px]">
                <div className={`text-[10px] font-mono font-semibold ${n(r.cumulative_cashflow) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {n(r.cumulative_cashflow) >= 0 ? '' : '-'}€{Math.abs(n(r.cumulative_cashflow)).toLocaleString('en-IE', { notation: 'compact' })}
                </div>
                <div className="text-[8px] text-slate-400">M{r.month_number}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAILED TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Monthly Detail</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="px-3 py-3 text-left sticky left-0 bg-slate-50 z-10">Month</th>
                <th className="px-3 py-3 text-left">Phase</th>
                {/* Revenue */}
                <th className="px-3 py-3 text-right">D2C</th>
                <th className="px-3 py-3 text-right">Amazon</th>
                <th className="px-3 py-3 text-right">Subs</th>
                <th className="px-3 py-3 text-right">Other</th>
                <th className="px-3 py-3 text-right font-bold bg-emerald-50">Revenue</th>
                {/* COGS */}
                <th className="px-3 py-3 text-right cursor-pointer hover:text-slate-700" onClick={() => setShowCogs(!showCogs)}>
                  {showCogs ? '▼' : '▶'} COGS
                </th>
                {showCogs && <>
                  <th className="px-3 py-3 text-right text-slate-400">Ingr</th>
                  <th className="px-3 py-3 text-right text-slate-400">Pkg</th>
                  <th className="px-3 py-3 text-right text-slate-400">CoPack</th>
                  <th className="px-3 py-3 text-right text-slate-400">Freight</th>
                  <th className="px-3 py-3 text-right text-slate-400">3PL</th>
                </>}
                {/* OPEX */}
                <th className="px-3 py-3 text-right cursor-pointer hover:text-slate-700" onClick={() => setShowOpex(!showOpex)}>
                  {showOpex ? '▼' : '▶'} OPEX
                </th>
                {showOpex && <>
                  <th className="px-3 py-3 text-right text-slate-400">Mktg</th>
                  <th className="px-3 py-3 text-right text-slate-400">Ambass</th>
                  <th className="px-3 py-3 text-right text-slate-400">Ads</th>
                  <th className="px-3 py-3 text-right text-slate-400">Content</th>
                  <th className="px-3 py-3 text-right text-slate-400">SW</th>
                  <th className="px-3 py-3 text-right text-slate-400">Legal</th>
                  <th className="px-3 py-3 text-right text-slate-400">PkgDes</th>
                  <th className="px-3 py-3 text-right text-slate-400">ProdDev</th>
                  <th className="px-3 py-3 text-right text-slate-400">Samples</th>
                  <th className="px-3 py-3 text-right text-slate-400">Travel</th>
                  <th className="px-3 py-3 text-right text-slate-400">Salary</th>
                  <th className="px-3 py-3 text-right text-slate-400">Insur</th>
                </>}
                {/* CAPEX */}
                <th className="px-3 py-3 text-right cursor-pointer hover:text-slate-700" onClick={() => setShowCapex(!showCapex)}>
                  {showCapex ? '▼' : '▶'} CAPEX
                </th>
                {showCapex && <>
                  <th className="px-3 py-3 text-right text-slate-400">Inventory</th>
                  <th className="px-3 py-3 text-right text-slate-400">Equip</th>
                  <th className="px-3 py-3 text-right text-slate-400">Other</th>
                </>}
                <th className="px-3 py-3 text-right font-bold">Net</th>
                <th className="px-3 py-3 text-right font-bold">Cumulative</th>
                <th className="px-3 py-3 text-right">Units</th>
                <th className="px-3 py-3 text-right">Subs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map(r => {
                const rev = totalRevenue(r);
                const cogs = totalCogs(r);
                const opex = totalOpex(r);
                const capex = totalCapex(r);
                const net = netCashflow(r);
                const cum = n(r.cumulative_cashflow);
                const phaseColor = PHASE_COLORS[r.phase] || PHASE_COLORS.exploration;

                return (
                  <tr key={r.month_number} className="hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium text-slate-800 sticky left-0 bg-white z-10">
                      {r.month_label}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${phaseColor.bg} ${phaseColor.text}`}>
                        {r.phase.replace('_', ' ')}
                      </span>
                    </td>
                    {/* Revenue breakdown */}
                    <td className="px-3 py-2 text-right text-slate-600">{eur(n(r.revenue_d2c))}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{eur(n(r.revenue_amazon))}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{eur(n(r.revenue_subscriptions))}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{eur(n(r.revenue_other))}</td>
                    <td className="px-3 py-2 text-right font-semibold text-emerald-700 bg-emerald-50">{eur(rev)}</td>
                    {/* COGS */}
                    <td className="px-3 py-2 text-right font-medium text-slate-700">{eur(cogs)}</td>
                    {showCogs && <>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.cogs_ingredients))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.cogs_packaging))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.cogs_copacker))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.cogs_freight))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.cogs_3pl))}</td>
                    </>}
                    {/* OPEX */}
                    <td className="px-3 py-2 text-right font-medium text-slate-700">{eur(opex)}</td>
                    {showOpex && <>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.opex_marketing))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.opex_ambassadors))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.opex_ads_paid))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.opex_content_production))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.opex_software))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.opex_legal_ip))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.opex_packaging_design))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.opex_product_dev))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.opex_samples_testing))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.opex_travel))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.opex_salary))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.opex_insurance))}</td>
                    </>}
                    {/* CAPEX */}
                    <td className="px-3 py-2 text-right font-medium text-slate-700">{eur(capex)}</td>
                    {showCapex && <>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.capex_initial_inventory))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.capex_equipment))}</td>
                      <td className="px-3 py-2 text-right text-slate-500">{eur(n(r.capex_other))}</td>
                    </>}
                    {/* Net & Cumulative */}
                    <td className={`px-3 py-2 text-right font-bold ${net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {net >= 0 ? '' : '-'}{eur(Math.abs(net))}
                    </td>
                    <td className={`px-3 py-2 text-right font-bold ${cum >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'}`}>
                      {cum >= 0 ? '' : '-'}{eur(Math.abs(cum))}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-600">{n(r.units_sold) || '—'}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{n(r.active_subscribers) || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* INFO */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Click ▶ COGS / OPEX / CAPEX column headers to expand or collapse sub-item columns. All values in EUR.
        </p>
      </div>
    </div>
  );
}
