'use client'

import { useState, useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
interface Phase {
  id: string
  label: string
  description: string
  timeMinLow: number
  timeMinHigh: number
  workers: number
  format: 'shared' | 'large' | 'small'
}

// ─── Default phases (editable) ────────────────────────────────────────────────
const DEFAULT_PHASES: Phase[] = [
  { id: 'p1', label: '1. Setup & Sanitation',   description: 'Clean workspace, sanitize equipment, fetch ingredients from storage, prep batch record', timeMinLow: 30,  timeMinHigh: 45,  workers: 2, format: 'shared' },
  { id: 'p2', label: '2. Weighing & Loading',   description: '16 ingredients × ~5–7 min each (weigh, record, pour into blender)',                    timeMinLow: 80,  timeMinHigh: 110, workers: 2, format: 'shared' },
  { id: 'p3', label: '3. Blending',             description: 'Run dry-blend cycle, homogeneity check. 1 worker free for other prep.',                 timeMinLow: 45,  timeMinHigh: 60,  workers: 1, format: 'shared' },
  { id: 'p4', label: '4. Filling — 1 kg bags',  description: 'Semi-auto filler: ~101 bags at 1–2 min each',                                          timeMinLow: 90,  timeMinHigh: 120, workers: 2, format: 'large'  },
  { id: 'p5', label: '4. Filling — small bags', description: 'Semi-auto volumetric filler @ ~300 bags/hr: ~990 bags',                                 timeMinLow: 180, timeMinHigh: 220, workers: 2, format: 'small'  },
  { id: 'p6', label: '5. Heat Sealing',         description: 'Inline sealer (1 kg); inline or rotary sealer (small bags)',                            timeMinLow: 20,  timeMinHigh: 45,  workers: 1, format: 'shared' },
  { id: 'p7', label: '6. Boxing (small only)',  description: '99 display boxes × 10 bags — manual packing',                                           timeMinLow: 60,  timeMinHigh: 90,  workers: 1, format: 'small'  },
  { id: 'p8', label: '7. Labelling',            description: '101 labels (large) / 990 bag + 99 box labels (small)',                                  timeMinLow: 25,  timeMinHigh: 60,  workers: 1, format: 'shared' },
  { id: 'p9', label: '8. Cleanup',              description: 'Disassemble, wash & sanitize blender, filler and workspace',                            timeMinLow: 30,  timeMinHigh: 45,  workers: 2, format: 'shared' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function phasesByFormat(phases: Phase[], fmt: 'large' | 'small') {
  return phases.filter(p => p.format === 'shared' || p.format === fmt)
}

function batchTotals(phases: Phase[], fmt: 'large' | 'small') {
  const relevant = phasesByFormat(phases, fmt)
  const wallLow  = relevant.reduce((s, p) => s + p.timeMinLow,  0)
  const wallHigh = relevant.reduce((s, p) => s + p.timeMinHigh, 0)
  const laborLow  = relevant.reduce((s, p) => s + p.timeMinLow  * p.workers, 0)
  const laborHigh = relevant.reduce((s, p) => s + p.timeMinHigh * p.workers, 0)
  return { wallLow, wallHigh, laborLow, laborHigh }
}

function fmtEur(v: number, dec = 2) {
  return `€${v.toFixed(dec)}`
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function UnitEconomicsPage() {
  // --- Batch config ---
  const [batchKg,          setBatchKg]          = useState(100)
  const [smallBagG,        setSmallBagG]        = useState(101)
  const [largeBagG,        setLargeBagG]        = useState(981)
  const [bagsPerBox,       setBagsPerBox]       = useState(10)

  // --- Ingredient cost ---
  const [ingredCostPer100g, setIngredCostPer100g] = useState(0.40)

  // --- Packaging cost ---
  const [pkgLarge,         setPkgLarge]         = useState(1.00)
  const [pkgSmallBag,      setPkgSmallBag]      = useState(0.10)
  const [pkgBox,           setPkgBox]           = useState(1.50)

  // --- Labor ---
  const [laborRate,        setLaborRate]        = useState(20)   // €/hr fully loaded
  const [phases,           setPhases]           = useState<Phase[]>(DEFAULT_PHASES)

  // --- Overhead ---
  const [overheadPct,      setOverheadPct]      = useState(10)

  // --- Retail prices ---
  const [retailLarge,      setRetailLarge]      = useState(39.99)
  const [retailSmall,      setRetailSmall]      = useState(5.49)

  // --- Tabs ---
  const [activeTab,        setActiveTab]        = useState<'overview' | 'process' | 'margins'>('overview')

  // --- Derived ---
  const nSmall = useMemo(() => Math.floor(batchKg * 1000 / smallBagG), [batchKg, smallBagG])
  const nLarge = useMemo(() => Math.floor(batchKg * 1000 / largeBagG), [batchKg, largeBagG])
  const nBoxes = useMemo(() => Math.ceil(nSmall / bagsPerBox),          [nSmall, bagsPerBox])

  const largeTotals = useMemo(() => batchTotals(phases, 'large'), [phases])
  const smallTotals = useMemo(() => batchTotals(phases, 'small'), [phases])

  const laborPerLarge = useMemo(() => ({
    low:  (largeTotals.laborLow  / 60) * laborRate / nLarge,
    high: (largeTotals.laborHigh / 60) * laborRate / nLarge,
  }), [largeTotals, laborRate, nLarge])

  const laborPerSmall = useMemo(() => ({
    low:  (smallTotals.laborLow  / 60) * laborRate / nSmall,
    high: (smallTotals.laborHigh / 60) * laborRate / nSmall,
  }), [smallTotals, laborRate, nSmall])

  // COGS (using midpoint labor)
  const ingredLarge  = ingredCostPer100g * (largeBagG / 100)
  const ingredSmall  = ingredCostPer100g * (smallBagG / 100)
  const pkgPerSmall  = pkgSmallBag + pkgBox / bagsPerBox

  const laborMidLarge = (laborPerLarge.low  + laborPerLarge.high)  / 2
  const laborMidSmall = (laborPerSmall.low  + laborPerSmall.high)  / 2

  const cogsLargeBase  = ingredLarge + pkgLarge   + laborMidLarge
  const cogsSmallBase  = ingredSmall + pkgPerSmall + laborMidSmall
  const cogsLarge      = cogsLargeBase  * (1 + overheadPct / 100)
  const cogsSmall      = cogsSmallBase  * (1 + overheadPct / 100)

  const marginLarge    = retailLarge > 0 ? ((retailLarge - cogsLarge)  / retailLarge * 100) : 0
  const marginSmall    = retailSmall > 0 ? ((retailSmall - cogsSmall)  / retailSmall * 100) : 0

  // Margin table price points (anchored around 80% GM minimum)
  const largePrices = [24.99, 29.99, 34.99, 39.99, 44.99]
  const smallPrices = [3.99, 4.49, 4.99, 5.49, 5.99]

  // Min price for target gross margin
  const TARGET_GM = 0.80
  const minPriceLarge = cogsLarge / (1 - TARGET_GM)
  const minPriceSmall = cogsSmall / (1 - TARGET_GM)

  // Waterfall bar widths (% of retail)
  function barPct(cost: number, retail: number) {
    return Math.min(100, retail > 0 ? (cost / retail) * 100 : 0)
  }

  // Phase editing
  function updatePhase(id: string, field: keyof Phase, value: number) {
    setPhases(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const tab = (id: typeof activeTab, label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
        activeTab === id
          ? 'bg-green-600 text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )

  const Slider = ({ label, value, min, max, step, unit, onChange }: {
    label: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void
  }) => (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-gray-800">{unit === '€' ? `€${value.toFixed(2)}` : `${value}${unit}`}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-green-600"
      />
    </div>
  )

  // ─── Cost bar ─────────────────────────────────────────────────────────────
  function CostBar({ label, value, retail, color }: { label: string; value: number; retail: number; color: string }) {
    const pct = barPct(value, retail)
    return (
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-500 mb-0.5">
          <span>{label}</span>
          <span>{fmtEur(value)}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }

  // ─── Margin table row ─────────────────────────────────────────────────────
  function MarginRow({ price, cogs }: { price: number; cogs: number }) {
    const margin = price > 0 ? ((price - cogs) / price * 100) : 0
    const profit = price - cogs
    const color  = margin >= 80 ? 'text-green-600' : margin >= 70 ? 'text-yellow-600' : 'text-red-500'
    return (
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="py-2 px-3 font-medium">{fmtEur(price)}</td>
        <td className="py-2 px-3">{fmtEur(profit)}</td>
        <td className={`py-2 px-3 font-bold ${color}`}>{margin.toFixed(1)}%</td>
        <td className="py-2 px-3 text-gray-500 text-xs">
          {margin >= 80 ? '✅ Target met' : margin >= 70 ? '⚠️ Below target' : '❌ Too low'}
        </td>
      </tr>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Unit Economics</h1>
        <p className="text-gray-500 text-sm mt-1">Full COGS model — 100 kg batch · 1 formulation · 2 formats</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tab('overview', '📊 Overview')}
        {tab('process',  '🏭 Production Process')}
        {tab('margins',  '💰 Margin Tables')}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — sliders */}
          <div className="space-y-4">
            {/* Batch config */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">⚙️ Batch Config</h3>
              <Slider label="Batch size (kg)" value={batchKg} min={50} max={500} step={10} unit=" kg" onChange={setBatchKg} />
              <Slider label="Small bag weight (g)" value={smallBagG} min={80} max={150} step={1} unit="g" onChange={setSmallBagG} />
              <Slider label="Large bag weight (g)" value={largeBagG} min={800} max={1200} step={10} unit="g" onChange={setLargeBagG} />
              <Slider label="Bags per display box" value={bagsPerBox} min={5} max={20} step={1} unit=" units" onChange={setBagsPerBox} />
              <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
                <div><div className="font-bold text-gray-800">{nSmall}</div><div className="text-gray-400">small bags</div></div>
                <div><div className="font-bold text-gray-800">{nLarge}</div><div className="text-gray-400">1 kg bags</div></div>
                <div><div className="font-bold text-gray-800">{nBoxes}</div><div className="text-gray-400">display boxes</div></div>
              </div>
            </div>

            {/* Ingredients */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">🌾 Ingredients</h3>
              <Slider label="Ingredient cost per 100g" value={ingredCostPer100g} min={0.20} max={1.50} step={0.01} unit="€" onChange={setIngredCostPer100g} />
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-500">
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-semibold text-gray-700">{fmtEur(ingredSmall)}</div>
                  <div>per small bag</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-semibold text-gray-700">{fmtEur(ingredLarge)}</div>
                  <div>per 1 kg bag</div>
                </div>
              </div>
            </div>

            {/* Packaging */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">📦 Packaging</h3>
              <Slider label="1 kg bag cost" value={pkgLarge} min={0.30} max={2.00} step={0.05} unit="€" onChange={setPkgLarge} />
              <Slider label="Small pouch cost" value={pkgSmallBag} min={0.05} max={0.60} step={0.01} unit="€" onChange={setPkgSmallBag} />
              <Slider label="Display box cost (per box)" value={pkgBox} min={0.50} max={4.00} step={0.10} unit="€" onChange={setPkgBox} />
              <div className="mt-2 text-xs text-gray-400">
                Box cost per unit: {fmtEur(pkgBox / bagsPerBox)} &nbsp;·&nbsp; Total small pkg: {fmtEur(pkgPerSmall)}
              </div>
            </div>

            {/* Labor & overhead */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">👷 Labor & Overhead</h3>
              <Slider label="Labor rate (fully loaded €/hr)" value={laborRate} min={14} max={40} step={1} unit="€/hr" onChange={setLaborRate} />
              <Slider label="Overhead %" value={overheadPct} min={0} max={30} step={1} unit="%" onChange={setOverheadPct} />
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-500">
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-semibold text-gray-700">{fmtEur(laborMidSmall)}</div>
                  <div>labor/small bag</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="font-semibold text-gray-700">{fmtEur(laborMidLarge)}</div>
                  <div>labor/1 kg bag</div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle — SKU cards */}
          <div className="space-y-4">
            {/* Small bag card */}
            <div className="bg-white rounded-xl border-2 border-green-200 p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-gray-800">400 kcal Pouch</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">~{smallBagG}g</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">{nSmall} units · {nBoxes} display boxes of {bagsPerBox}</p>

              <div className="space-y-1 mb-4">
                <CostBar label="Ingredients"  value={ingredSmall}        retail={retailSmall} color="bg-blue-400" />
                <CostBar label="Pouch"        value={pkgSmallBag}        retail={retailSmall} color="bg-purple-400" />
                <CostBar label="Box (÷{bagsPerBox})".replace('{bagsPerBox}', String(bagsPerBox)) value={pkgBox/bagsPerBox} retail={retailSmall} color="bg-pink-400" />
                <CostBar label="Labor (mid)"  value={laborMidSmall}      retail={retailSmall} color="bg-orange-400" />
                <CostBar label="Overhead"     value={cogsSmall - cogsSmallBase} retail={retailSmall} color="bg-yellow-300" />
              </div>

              <div className="border-t border-gray-100 pt-3 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total COGS</span>
                  <span className="font-bold text-gray-900">{fmtEur(cogsSmall)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Labor range</span>
                  <span>{fmtEur(laborPerSmall.low)} – {fmtEur(laborPerSmall.high)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Retail price</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">€</span>
                  <input
                    type="number" step="0.10" min="0" value={retailSmall}
                    onChange={e => setRetailSmall(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm font-semibold"
                  />
                </div>
                <div className={`mt-2 text-center text-lg font-bold rounded-lg py-1 ${
                  marginSmall >= 80 ? 'bg-green-50 text-green-600' :
                  marginSmall >= 70 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-500'}`}>
                  {marginSmall.toFixed(1)}% GM &nbsp;·&nbsp; {fmtEur(retailSmall - cogsSmall)} profit
                </div>
                <div className={`mt-1 text-center text-xs rounded px-2 py-0.5 ${marginSmall >= 80 ? 'text-green-600' : 'text-orange-500 font-semibold'}`}>
                  {marginSmall >= 80 ? '✅ Above 80% target' : `⚠️ Min for 80% GM: ${fmtEur(minPriceSmall)}`}
                </div>
              </div>
            </div>

            {/* 1 kg card */}
            <div className="bg-white rounded-xl border-2 border-blue-200 p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-gray-800">1 kg Bag</h2>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">~{largeBagG}g</span>
              </div>
              <p className="text-xs text-gray-400 mb-4">{nLarge} units per batch</p>

              <div className="space-y-1 mb-4">
                <CostBar label="Ingredients" value={ingredLarge}        retail={retailLarge} color="bg-blue-400" />
                <CostBar label="Bag"         value={pkgLarge}           retail={retailLarge} color="bg-purple-400" />
                <CostBar label="Labor (mid)" value={laborMidLarge}      retail={retailLarge} color="bg-orange-400" />
                <CostBar label="Overhead"    value={cogsLarge - cogsLargeBase} retail={retailLarge} color="bg-yellow-300" />
              </div>

              <div className="border-t border-gray-100 pt-3 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total COGS</span>
                  <span className="font-bold text-gray-900">{fmtEur(cogsLarge)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>Labor range</span>
                  <span>{fmtEur(laborPerLarge.low)} – {fmtEur(laborPerLarge.high)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 block mb-1">Retail price</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">€</span>
                  <input
                    type="number" step="0.50" min="0" value={retailLarge}
                    onChange={e => setRetailLarge(parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm font-semibold"
                  />
                </div>
                <div className={`mt-2 text-center text-lg font-bold rounded-lg py-1 ${
                  marginLarge >= 80 ? 'bg-green-50 text-green-600' :
                  marginLarge >= 70 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-500'}`}>
                  {marginLarge.toFixed(1)}% GM &nbsp;·&nbsp; {fmtEur(retailLarge - cogsLarge)} profit
                </div>
                <div className={`mt-1 text-center text-xs rounded px-2 py-0.5 ${marginLarge >= 80 ? 'text-green-600' : 'text-orange-500 font-semibold'}`}>
                  {marginLarge >= 80 ? '✅ Above 80% target' : `⚠️ Min for 80% GM: ${fmtEur(minPriceLarge)}`}
                </div>
              </div>
            </div>
          </div>

          {/* Right — batch summary */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">📋 Batch Summary</h3>
              <table className="w-full text-xs">
                <tbody>
                  {[
                    ['Batch size', `${batchKg} kg`],
                    ['', ''],
                    ['Small bags', `${nSmall} units`],
                    ['Display boxes', `${nBoxes} × ${bagsPerBox}`],
                    ['Wall-clock time', `${(smallTotals.wallLow/60).toFixed(1)}–${(smallTotals.wallHigh/60).toFixed(1)} hrs`],
                    ['Labor person-hrs', `${(smallTotals.laborLow/60).toFixed(1)}–${(smallTotals.laborHigh/60).toFixed(1)} hrs`],
                    ['Labor cost/batch', `${fmtEur((smallTotals.laborLow/60)*laborRate)}–${fmtEur((smallTotals.laborHigh/60)*laborRate)}`],
                    ['COGS per small bag', fmtEur(cogsSmall)],
                    ['Revenue (all small)', fmtEur(retailSmall * nSmall)],
                    ['Gross profit', fmtEur((retailSmall - cogsSmall) * nSmall)],
                    ['', ''],
                    ['1 kg bags', `${nLarge} units`],
                    ['Wall-clock time', `${(largeTotals.wallLow/60).toFixed(1)}–${(largeTotals.wallHigh/60).toFixed(1)} hrs`],
                    ['Labor cost/batch', `${fmtEur((largeTotals.laborLow/60)*laborRate)}–${fmtEur((largeTotals.laborHigh/60)*laborRate)}`],
                    ['COGS per 1 kg bag', fmtEur(cogsLarge)],
                    ['Revenue (all large)', fmtEur(retailLarge * nLarge)],
                    ['Gross profit', fmtEur((retailLarge - cogsLarge) * nLarge)],
                  ].map(([k, v], i) => k === '' ? (
                    <tr key={i}><td colSpan={2} className="py-1"><hr className="border-gray-100"/></td></tr>
                  ) : (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="py-1.5 text-gray-500">{k}</td>
                      <td className="py-1.5 text-right font-semibold text-gray-800">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Key insight */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <div className="font-semibold mb-1">💡 Key insight</div>
              <p className="text-xs leading-relaxed">
                Labor is the hidden cost. At €{laborRate}/hr fully loaded, you spend{' '}
                <strong>{fmtEur((smallTotals.laborLow/60)*laborRate)}–{fmtEur((smallTotals.laborHigh/60)*laborRate)}</strong> in labor for a {batchKg}kg run of small bags.
                A semi-auto filling line vs. manual is the single biggest lever to improve margins.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <div className="font-semibold mb-1">🏭 Co-packer alternative</div>
              <p className="text-xs leading-relaxed">
                If you outsource to a co-packer, replace labor + overhead with a tolling fee.
                Typical range: €0.20–€0.60 per small bag, €1.50–€3.00 per 1 kg bag.
                Request quotes to compare vs. in-house.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── PROCESS TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'process' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Large format process */}
            {(['large', 'small'] as const).map(fmt => {
              const totals = fmt === 'large' ? largeTotals : smallTotals
              const nUnits = fmt === 'large' ? nLarge : nSmall
              const laborCostLow  = (totals.laborLow  / 60) * laborRate
              const laborCostHigh = (totals.laborHigh / 60) * laborRate
              return (
                <div key={fmt} className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-bold text-gray-800 mb-1">
                    {fmt === 'large' ? '📦 1 kg Bag Format' : '🫙 400 kcal Pouch Format'}
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    {(totals.wallLow/60).toFixed(1)}–{(totals.wallHigh/60).toFixed(1)} h wall-clock &nbsp;·&nbsp;
                    {(totals.laborLow/60).toFixed(1)}–{(totals.laborHigh/60).toFixed(1)} person-hrs &nbsp;·&nbsp;
                    €{laborCostLow.toFixed(0)}–€{laborCostHigh.toFixed(0)} labor &nbsp;·&nbsp;
                    {nUnits} units
                  </p>

                  <div className="space-y-3">
                    {phasesByFormat(phases, fmt).map(phase => (
                      <div key={phase.id} className={`rounded-lg p-3 ${
                        phase.format === 'shared' ? 'bg-gray-50 border border-gray-100' : 'bg-green-50 border border-green-100'
                      }`}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <div className="text-xs font-semibold text-gray-700">{phase.label}</div>
                            <div className="text-xs text-gray-400">{phase.description}</div>
                          </div>
                          <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                            phase.format === 'shared' ? 'bg-gray-200 text-gray-500' : 'bg-green-200 text-green-700'
                          }`}>
                            {phase.format === 'shared' ? 'shared' : fmt}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <label className="text-xs text-gray-400 block">Min (min)</label>
                            <input
                              type="number" min={1} max={480} value={phase.timeMinLow}
                              onChange={e => updatePhase(phase.id, 'timeMinLow', parseInt(e.target.value) || 1)}
                              className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block">Max (min)</label>
                            <input
                              type="number" min={1} max={480} value={phase.timeMinHigh}
                              onChange={e => updatePhase(phase.id, 'timeMinHigh', parseInt(e.target.value) || 1)}
                              className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-400 block">Workers</label>
                            <input
                              type="number" min={1} max={10} value={phase.workers}
                              onChange={e => updatePhase(phase.id, 'workers', parseInt(e.target.value) || 1)}
                              className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-xs"
                            />
                          </div>
                        </div>

                        <div className="mt-1.5 text-xs text-gray-400">
                          Labor: {phase.workers} × {phase.timeMinLow}–{phase.timeMinHigh} min
                          = {(phase.workers * phase.timeMinLow / 60 * laborRate).toFixed(2)}–
                          {(phase.workers * phase.timeMinHigh / 60 * laborRate).toFixed(2)} €
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">⏱ Process Timeline</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left py-2 px-3 font-medium text-gray-500">Phase</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Workers</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Time (min)</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Person-hrs</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Labor cost</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500">Format</th>
                  </tr>
                </thead>
                <tbody>
                  {phases.map(p => (
                    <tr key={p.id} className="border-b border-gray-100">
                      <td className="py-2 px-3 font-medium">{p.label}</td>
                      <td className="py-2 px-3 text-center">{p.workers}</td>
                      <td className="py-2 px-3 text-center">{p.timeMinLow}–{p.timeMinHigh}</td>
                      <td className="py-2 px-3 text-center">{(p.workers*p.timeMinLow/60).toFixed(1)}–{(p.workers*p.timeMinHigh/60).toFixed(1)}</td>
                      <td className="py-2 px-3 text-center">
                        €{(p.workers*p.timeMinLow/60*laborRate).toFixed(0)}–€{(p.workers*p.timeMinHigh/60*laborRate).toFixed(0)}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          p.format === 'shared' ? 'bg-gray-100 text-gray-500' :
                          p.format === 'large'  ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                        }`}>{p.format}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MARGINS TAB ──────────────────────────────────────────────────────── */}
      {activeTab === 'margins' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Small bag table */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-1">🫙 400 kcal Pouch</h3>
            <p className="text-xs text-gray-400 mb-4">COGS: {fmtEur(cogsSmall)} &nbsp;·&nbsp; {nSmall} units/batch</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500">
                  <th className="text-left py-2 px-3">Retail</th>
                  <th className="text-left py-2 px-3">Profit/unit</th>
                  <th className="text-left py-2 px-3">Margin</th>
                  <th className="text-left py-2 px-3">Rating</th>
                </tr>
              </thead>
              <tbody>
                {smallPrices.map(p => <MarginRow key={p} price={p} cogs={cogsSmall} />)}
              </tbody>
            </table>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Batch revenue at each price point:</p>
              {smallPrices.map(p => (
                <div key={p} className="flex justify-between text-xs py-1">
                  <span className="text-gray-600">{fmtEur(p)} × {nSmall} units</span>
                  <span className="font-semibold">{fmtEur(p * nSmall)} revenue / {fmtEur((p - cogsSmall) * nSmall)} GP</span>
                </div>
              ))}
            </div>
          </div>

          {/* Large bag table */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-bold text-gray-800 mb-1">📦 1 kg Bag</h3>
            <p className="text-xs text-gray-400 mb-4">COGS: {fmtEur(cogsLarge)} &nbsp;·&nbsp; {nLarge} units/batch</p>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500">
                  <th className="text-left py-2 px-3">Retail</th>
                  <th className="text-left py-2 px-3">Profit/unit</th>
                  <th className="text-left py-2 px-3">Margin</th>
                  <th className="text-left py-2 px-3">Rating</th>
                </tr>
              </thead>
              <tbody>
                {largePrices.map(p => <MarginRow key={p} price={p} cogs={cogsLarge} />)}
              </tbody>
            </table>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Batch revenue at each price point:</p>
              {largePrices.map(p => (
                <div key={p} className="flex justify-between text-xs py-1">
                  <span className="text-gray-600">{fmtEur(p)} × {nLarge} units</span>
                  <span className="font-semibold">{fmtEur(p * nLarge)} revenue / {fmtEur((p - cogsLarge) * nLarge)} GP</span>
                </div>
              ))}
            </div>
          </div>

          {/* Break-even */}
          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">🎯 Break-even Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Small @ €2.99', retail: 2.99, cogs: cogsSmall },
                { label: 'Small @ €3.49', retail: 3.49, cogs: cogsSmall },
                { label: '1 kg @ €14.99', retail: 14.99, cogs: cogsLarge },
                { label: '1 kg @ €19.99', retail: 19.99, cogs: cogsLarge },
              ].map(({ label, retail, cogs }) => {
                const margin = ((retail - cogs) / retail * 100)
                const monthlyUnitsToBreakEven = 5000 / (retail - cogs) // arbitrary €5k fixed cost target
                return (
                  <div key={label} className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-xs text-gray-400 mb-1">{label}</div>
                    <div className={`text-xl font-bold ${margin >= 65 ? 'text-green-600' : margin >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                      {margin.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {fmtEur(retail - cogs)} profit/unit
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {Math.ceil(monthlyUnitsToBreakEven)} units to cover €5k/mo fixed
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
