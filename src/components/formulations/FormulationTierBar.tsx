'use client';

import * as Types from '@/lib/types';

export type TierMeta = {
  tier: 'foundation' | 'advanced' | 'expert';
  tagline: string;
  euStatus: 'clean' | 'novel_food';
  launchReady: boolean;
  color: {
    ring: string;
    bg: string;
    bgSelected: string;
    text: string;
    dot: string;
  };
};

const TIER_ORDER: Record<string, number> = {
  foundation: 0,
  advanced: 1,
  expert: 2,
};

type FormulationPreview = {
  form: Types.Formulation;
  meta?: TierMeta;
  ingredientCount: number;
  kcal: number;
  protein: number;
};

type Props = {
  items: FormulationPreview[];
  selectedId: number | null;
  onSelect: (form: Types.Formulation) => void;
};

export function FormulationTierBar({ items, selectedId, onSelect }: Props) {
  const sorted = [...items].sort((a, b) => {
    const ta = a.meta?.tier ? TIER_ORDER[a.meta.tier] ?? 99 : 99;
    const tb = b.meta?.tier ? TIER_ORDER[b.meta.tier] ?? 99 : 99;
    return ta - tb;
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {sorted.map(({ form, meta, ingredientCount, kcal, protein }) => {
        const selected = selectedId === form.id;
        const colors = meta?.color ?? {
          ring: 'ring-slate-400',
          bg: 'bg-white',
          bgSelected: 'bg-slate-50',
          text: 'text-slate-700',
          dot: 'bg-slate-400',
        };

        return (
          <button
            key={form.id}
            type="button"
            onClick={() => onSelect(form)}
            className={`text-left rounded-xl border p-4 transition-all ${
              selected
                ? `${colors.bgSelected} border-slate-300 ring-2 ${colors.ring} shadow-sm`
                : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${colors.dot}`} />
                <span className="font-semibold text-slate-900 truncate">{form.name}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">v{form.version ?? 1}</span>
            </div>

            <p className={`mt-2 text-xs leading-relaxed line-clamp-2 ${colors.text}`}>
              {meta?.tagline ?? form.description}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {meta?.launchReady ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                  Launch ready
                </span>
              ) : (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-700 bg-violet-50 border border-violet-200 rounded-full px-2 py-0.5">
                  Pre-launch
                </span>
              )}
              {meta?.euStatus === 'clean' ? (
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50/80 border border-emerald-100 rounded-full px-2 py-0.5">
                  EU food
                </span>
              ) : (
                <span className="text-[10px] font-medium text-red-700 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">
                  Novel food
                </span>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-bold text-slate-900">{Math.round(kcal)}</div>
                <div className="text-[10px] text-slate-500">kcal</div>
              </div>
              <div>
                <div className="text-sm font-bold text-blue-600">{protein.toFixed(0)}g</div>
                <div className="text-[10px] text-slate-500">protein</div>
              </div>
              <div>
                <div className="text-sm font-bold text-emerald-600">{ingredientCount}</div>
                <div className="text-[10px] text-slate-500">items</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export const FORMULATION_META: Record<number, TierMeta> = {
  1: {
    tier: 'foundation',
    tagline: '19 real foods · 100% EU food · zero regulatory risk · launch now',
    euStatus: 'clean',
    launchReady: true,
    color: {
      ring: 'ring-emerald-400',
      bg: 'bg-white',
      bgSelected: 'bg-emerald-50/80',
      text: 'text-emerald-800',
      dot: 'bg-emerald-500',
    },
  },
  2: {
    tier: 'advanced',
    tagline: 'Foundation + 9 supplements · 28 ingredients · immediate option',
    euStatus: 'clean',
    launchReady: true,
    color: {
      ring: 'ring-indigo-400',
      bg: 'bg-white',
      bgSelected: 'bg-indigo-50/80',
      text: 'text-indigo-800',
      dot: 'bg-indigo-500',
    },
  },
  3: {
    tier: 'expert',
    tagline: 'Advanced + novel foods · premium longevity · auth required',
    euStatus: 'novel_food',
    launchReady: false,
    color: {
      ring: 'ring-violet-400',
      bg: 'bg-white',
      bgSelected: 'bg-violet-50/80',
      text: 'text-violet-800',
      dot: 'bg-violet-500',
    },
  },
};
