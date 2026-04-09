'use client';

import { useState, useMemo } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface CostInputs {
  ingredientCostPer100g: number;       // €/100g for base formula
  fdBlueberryGrams: number;            // grams of FD blueberries added
  fdBlueberryCostPerKg: number;        // €/kg for FD blueberries
  smallBagPackaging: number;           // € per small bag
  largeBagPackaging: number;           // € per large bag
  boxCost: number;                     // € per display box (holds 10 small bags)
  blendingCostPerKg: number;           // € co-packer blending per kg of product
  labellingCostPerUnit: number;        // € per unit (labour/stickering)
  qcCostPerKg: number;                 // € QC / testing per kg
  overheadPercent: number;             // % overhead on top of direct costs
}

interface SKUEconomics {
  name: string;
  format: 'small' | 'large';
  weightG: number;
  ingredientCost: number;
  fdBBCost: number;
  packagingCost: number;
  boxAllocation: number;
  blendingCost: number;
  labellingCost: number;
  qcCost: number;
  subtotal: number;
  overhead: number;
  totalCOGS: number;
}

// ─── Base ingredient cost breakdown (wholesale estimates per ingredient) ───────
const INGREDIENT_COST_PER_100G = 0.397; // €/100g base formula (from our research)

const BASE_FORMULA_WEIGHT_G = 97; // grams dry weight for base 400kcal bag

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calcSKU(inputs: CostInputs): { small: SKUEconomics; large: SKUEconomics } {
  // ── Small bag (400 kcal) ──────────────────────────────────────────────────
  const smallWeightBase = BASE_FORMULA_WEIGHT_G;
  const smallWeightTotal = smallWeightBase + inputs.fdBlueberryGrams;

  const smallIngredient = (inputs.ingredientCostPer100g / 100) * smallWeightBase;
  const smallFDBB = (inputs.fdBlueberryCostPerKg / 1000) * inputs.fdBlueberryGrams;
  const smallPackaging = inputs.smallBagPackaging;
  const smallBoxAlloc = inputs.boxCost / 10;
  const smallBlending = (inputs.blendingCostPerKg / 1000) * smallWeightTotal;
  const smallLabelling = inputs.labellingCostPerUnit;
  const smallQC = (inputs.qcCostPerKg / 1000) * smallWeightTotal;
  const smallSubtotal = smallIngredient + smallFDBB + smallPackaging + smallBoxAlloc + smallBlending + smallLabelling + smallQC;
  const smallOverhead = smallSubtotal * (inputs.overheadPercent / 100);
  const smallTotal = smallSubtotal + smallOverhead;

  // ── Large bag (1 kg) ─────────────────────────────────────────────────────
  // 1kg bag = same formula scaled to 970g (some headroom)
  const largeWeightG = 970;
  const largeFactor = largeWeightG / smallWeightBase;
  const largeFDBlueberryG = inputs.fdBlueberryGrams * largeFactor;
  const largeTotalWeightG = largeWeightG + largeFDBlueberryG;

  const largeIngredient = (inputs.ingredientCostPer100g / 100) * largeWeightG;
  const largeFDBB = (inputs.fdBlueberryCostPerKg / 1000) * largeFDBlueberryG;
  const largePackaging = inputs.largeBagPackaging;
  const largeBoxAlloc = 0; // no display box for large format
  const largeBlending = (inputs.blendingCostPerKg / 1000) * largeTotalWeightG;
  const largeLabelling = inputs.labellingCostPerUnit;
  const largeQC = (inputs.qcCostPerKg / 1000) * largeTotalWeightG;
  const largeSubtotal = largeIngredient + largeFDBB + largePackaging + largeBoxAlloc + largeBlending + largeLabelling + largeQC;
  const largeOverhead = largeSubtotal * (inputs.overheadPercent / 100);
  const largeTotal = largeSubtotal + largeOverhead;

  return {
    small: {
      name: '400 kcal Pouch',
      format: 'small',
      weightG: smallWeightTotal,
      ingredientCost: smallIngredient,
      fdBBCost: smallFDBB,
      packagingCost: smallPackaging,
      boxAllocation: smallBoxAlloc,
      blendingCost: smallBlending,
      labellingCost: smallLabelling,
      qcCost: smallQC,
      subtotal: smallSubtotal,
      overhead: smallOverhead,
      totalCOGS: smallTotal,
    },
    large: {
      name: '1 kg Bag',
      format: 'large',
      weightG: largeTotalWeightG,
      ingredientCost: largeIngredient,
      fdBBCost: largeFDBB,
      packagingCost: largePackaging,
      boxAllocation: 0,
      blendingCost: largeBlending,
      labellingCost: largeLabelling,
      qcCost: largeQC,
      subtotal: largeSubtotal,
      overhead: largeOverhead,
      totalCOGS: largeTotal,
    },
  };
}

function marginColor(pct: number) {
  if (pct >= 65) return 'text-green-600';
  if (pct >= 50) return 'text-lime-600';
  if (pct >= 35) return 'text-orange-500';
  return 'text-red-500';
}

function fmt(n: number, decimals = 2) {
  return `€${n.toFixed(decimals)}`;
}

// ─── Waterfall bar ────────────────────────────────────────────────────────────
function CostBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = Math.max((value / total) * 100, 0);
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-32 text-xs text-slate-500 text-right shrink-0">{label}</div>
      <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-14 text-right text-xs font-mono text-slate-700 shrink-0">{fmt(value)}</div>
      <div className="w-10 text-right text-xs text-slate-400 shrink-0">{pct.toFixed(0)}%</div>
    </div>
  );
}

// ─── Margin table ─────────────────────────────────────────────────────────────
function MarginTable({ cogs, prices, label }: { cogs: number; prices: number[]; label: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label} — Margin at price points</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="px-3 py-2 text-left font-medium text-slate-600">Retail Price</th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">Gross Margin</th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">Profit / unit</th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">Break-even units*</th>
          </tr>
        </thead>
        <tbody>
          {prices.map(p => {
            const margin = ((p - cogs) / p) * 100;
            const profit = p - cogs;
            const breakEven = Math.ceil(5000 / profit); // assuming €5k fixed monthly overhead
            return (
              <tr key={p} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 font-mono font-semibold">{fmt(p)}</td>
                <td className={`px-3 py-2 text-right font-mono font-semibold ${marginColor(margin)}`}>
                  {margin.toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-right font-mono text-slate-700">{fmt(profit)}</td>
                <td className="px-3 py-2 text-right font-mono text-slate-500">{breakEven.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="text-xs text-slate-400 mt-1">* Break-even assumes €5,000/mo fixed overhead (adjust as needed)</p>
    </div>
  );
}

// ─── Slider control ───────────────────────────────────────────────────────────
function Slider({
  label, value, min, max, step, unit, onChange, hint,
}: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-mono font-semibold text-blue-700">
          {unit === '€' ? `€${value.toFixed(2)}` : unit === '%' ? `${value}%` : `${value}${unit}`}
        </span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full accent-blue-600"
      />
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

// ─── SKU Card ─────────────────────────────────────────────────────────────────
function SKUCard({ sku, pricePoints }: { sku: SKUEconomics; pricePoints: number[] }) {
  const bars = [
    { label: 'Ingredients', value: sku.ingredientCost, color: 'bg-blue-500' },
    { label: 'FD Blueberries', value: sku.fdBBCost, color: 'bg-purple-500' },
    { label: 'Packaging', value: sku.packagingCost, color: 'bg-amber-500' },
    { label: 'Box (÷10)', value: sku.boxAllocation, color: 'bg-amber-300' },
    { label: 'Blending', value: sku.blendingCost, color: 'bg-teal-500' },
    { label: 'Labelling', value: sku.labellingCost, color: 'bg-pink-400' },
    { label: 'QC', value: sku.qcCost, color: 'bg-slate-400' },
    { label: 'Overhead', value: sku.overhead, color: 'bg-red-300' },
  ].filter(b => b.value > 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{sku.name}</h3>
          <p className="text-sm text-slate-500">{sku.weightG.toFixed(0)}g net weight</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-900">{fmt(sku.totalCOGS)}</div>
          <div className="text-xs text-slate-500 uppercase tracking-wide">Total COGS</div>
        </div>
      </div>

      {/* Cost waterfall */}
      <div className="space-y-0.5">
        {bars.map(b => (
          <CostBar key={b.label} label={b.label} value={b.value} total={sku.totalCOGS} color={b.color} />
        ))}
        <div className="flex items-center gap-3 py-1 border-t border-slate-200 mt-1 pt-2">
          <div className="w-32 text-xs font-semibold text-slate-700 text-right">Total COGS</div>
          <div className="flex-1" />
          <div className="w-14 text-right text-sm font-mono font-bold text-slate-900">{fmt(sku.totalCOGS)}</div>
          <div className="w-10" />
        </div>
      </div>

      {/* Margin table */}
      <MarginTable cogs={sku.totalCOGS} prices={pricePoints} label={sku.name} />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function UnitEconomicsPage() {
  const [inputs, setInputs] = useState<CostInputs>({
    ingredientCostPer100g: INGREDIENT_COST_PER_100G,
    fdBlueberryGrams: 4,
    fdBlueberryCostPerKg: 28,
    smallBagPackaging: 0.20,
    largeBagPackaging: 1.00,
    boxCost: 1.50,
    blendingCostPerKg: 0.20,
    labellingCostPerUnit: 0.05,
    qcCostPerKg: 0.10,
    overheadPercent: 10,
  });

  const set = (key: keyof CostInputs) => (v: number) =>
    setInputs(prev => ({ ...prev, [key]: v }));

  const { small, large } = useMemo(() => calcSKU(inputs), [inputs]);

  const smallPrices = [1.49, 1.99, 2.49, 2.99, 3.49];
  const largePrices = [9.99, 12.99, 15.99, 19.99, 24.99];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Unit Economics</h1>
        <p className="text-slate-500 mt-1">
          Interactive COGS builder · 1 formula · 2 packaging formats
        </p>
      </div>

      {/* Summary banner */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-center">
          <div>
            <div className="text-sm text-blue-600 font-medium">400 kcal Pouch — COGS</div>
            <div className="text-3xl font-bold text-blue-900 mt-0.5">{fmt(small.totalCOGS)}</div>
          </div>
          <div className="text-right text-sm text-blue-500">
            <div>{small.weightG.toFixed(0)}g / unit</div>
            <div className="font-mono">{fmt(small.totalCOGS / (small.weightG / 1000), 0)}/kg</div>
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex justify-between items-center">
          <div>
            <div className="text-sm text-emerald-600 font-medium">1 kg Bag — COGS</div>
            <div className="text-3xl font-bold text-emerald-900 mt-0.5">{fmt(large.totalCOGS)}</div>
          </div>
          <div className="text-right text-sm text-emerald-500">
            <div>{large.weightG.toFixed(0)}g / unit</div>
            <div className="font-mono">{fmt(large.totalCOGS / (large.weightG / 1000), 0)}/kg</div>
          </div>
        </div>
      </div>

      {/* Controls + SKU cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Sliders panel */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-5 space-y-5">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            🎛️ Cost Inputs
          </h2>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Ingredients</div>
            <Slider label="Base ingredient cost" value={inputs.ingredientCostPer100g} min={0.20} max={0.80} step={0.01}
              unit="€" onChange={set('ingredientCostPer100g')} hint="Per 100g of dry formula (excl. FD blueberries)" />
            <Slider label="FD Blueberry amount" value={inputs.fdBlueberryGrams} min={0} max={12} step={0.5}
              unit="g" onChange={set('fdBlueberryGrams')} hint="Grams added per 400kcal bag" />
            <Slider label="FD Blueberry price" value={inputs.fdBlueberryCostPerKg} min={15} max={50} step={0.5}
              unit="€" onChange={set('fdBlueberryCostPerKg')} hint="€/kg — get quotes from Frubero / VALIO" />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Packaging</div>
            <Slider label="Small bag (400 kcal)" value={inputs.smallBagPackaging} min={0.05} max={0.50} step={0.01}
              unit="€" onChange={set('smallBagPackaging')} hint="Target ≤ €0.20" />
            <Slider label="1 kg bag" value={inputs.largeBagPackaging} min={0.20} max={2.00} step={0.05}
              unit="€" onChange={set('largeBagPackaging')} hint="Target ≤ €1.00" />
            <Slider label="Display box (÷10 pouches)" value={inputs.boxCost} min={0.50} max={4.00} step={0.10}
              unit="€" onChange={set('boxCost')} hint="€1.50 per box → €0.15 allocated per small bag" />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Production</div>
            <Slider label="Co-packer blending" value={inputs.blendingCostPerKg} min={0.05} max={1.00} step={0.05}
              unit="€" onChange={set('blendingCostPerKg')} hint="€/kg product — get quotes!" />
            <Slider label="Labelling / handling" value={inputs.labellingCostPerUnit} min={0} max={0.20} step={0.01}
              unit="€" onChange={set('labellingCostPerUnit')} hint="€ per unit" />
            <Slider label="QC & testing" value={inputs.qcCostPerKg} min={0} max={0.50} step={0.01}
              unit="€" onChange={set('qcCostPerKg')} hint="€/kg — labs, certificates" />
          </div>

          <div className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Overhead</div>
            <Slider label="Overhead %" value={inputs.overheadPercent} min={0} max={30} step={1}
              unit="%" onChange={set('overheadPercent')} hint="Applied on top of all direct costs" />
          </div>

          {/* Reset button */}
          <button
            onClick={() => setInputs({
              ingredientCostPer100g: INGREDIENT_COST_PER_100G,
              fdBlueberryGrams: 4,
              fdBlueberryCostPerKg: 28,
              smallBagPackaging: 0.20,
              largeBagPackaging: 1.00,
              boxCost: 1.50,
              blendingCostPerKg: 0.20,
              labellingCostPerUnit: 0.05,
              qcCostPerKg: 0.10,
              overheadPercent: 10,
            })}
            className="w-full text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg py-2 hover:bg-slate-50 transition"
          >
            Reset to defaults
          </button>
        </div>

        {/* SKU cards */}
        <div className="lg:col-span-2 space-y-6">
          <SKUCard sku={small} pricePoints={smallPrices} />
          <SKUCard sku={large} pricePoints={largePrices} />
        </div>
      </div>

      {/* Ingredient cost breakdown legend */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-700 mb-3">📦 Ingredient cost breakdown (base formula, wholesale estimates)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            { name: 'Oats (40g)', cost: 0.024 },
            { name: 'Whey Isolate (12g)', cost: 0.108 },
            { name: 'Casein (8g)', cost: 0.060 },
            { name: 'Collagen (4g)', cost: 0.036 },
            { name: 'Almonds (8g)', cost: 0.052 },
            { name: 'Walnuts (6g)', cost: 0.036 },
            { name: 'Chia Seeds (6g)', cost: 0.015 },
            { name: 'Ground Flax (6g)', cost: 0.0072 },
            { name: 'Cacao (4g)', cost: 0.014 },
            { name: 'Creatine (2g)', cost: 0.010 },
            { name: 'L-Glutamine (2g)', cost: 0.016 },
            { name: 'Inulin (1.2g)', cost: 0.0048 },
            { name: 'Cinnamon (0.8g)', cost: 0.0024 },
            { name: 'Turmeric (0.6g)', cost: 0.0021 },
            { name: 'Stevia (0.4g)', cost: 0.010 },
            { name: 'Salt (0.4g)', cost: 0.0001 },
          ].map(item => (
            <div key={item.name} className="flex justify-between bg-white border border-slate-100 rounded-lg px-3 py-2">
              <span className="text-slate-600">{item.name}</span>
              <span className="font-mono font-semibold text-slate-800">€{item.cost.toFixed(3)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between text-sm font-semibold text-slate-700 border-t border-slate-200 pt-3">
          <span>Total base ingredients (97g)</span>
          <span className="font-mono">€{INGREDIENT_COST_PER_100G.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}
