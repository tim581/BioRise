'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Theme {
  id: number;
  slug: string;
  name: string;
  slogan: string;
  tagline: string;
  hero_emoji: string;
  hero_ingredient: string;
  color_hex: string;
  label_claim: string;
}

interface Adjustment {
  id: number;
  theme_id: number;
  action: string;
  new_dose_g: number | null;
  rationale: string;
  ingredients: { name: string };
}

const ACTION_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  boost: { label: '↑ Boost', bg: 'bg-green-100', text: 'text-green-800' },
  reduce: { label: '↓ Reduce', bg: 'bg-orange-100', text: 'text-orange-800' },
  add: { label: '➕ Add', bg: 'bg-blue-100', text: 'text-blue-800' },
  remove: { label: '✕ Remove', bg: 'bg-red-100', text: 'text-red-800' },
  keep: { label: '= Keep', bg: 'bg-slate-100', text: 'text-slate-600' },
};

export default function HealthThemesPage() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: a }] = await Promise.all([
        supabase.from('health_themes').select('*').order('id'),
        supabase
          .from('theme_ingredient_adjustments')
          .select('*, ingredients(name)')
          .order('id'),
      ]);
      setThemes(t || []);
      setAdjustments(a || []);
      if (t && t.length > 0) setSelected(t[0].id);
      setLoading(false);
    }
    load();
  }, []);

  const activeTheme = themes.find((t) => t.id === selected);
  const activeAdjustments = adjustments.filter((a) => a.theme_id === selected);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Loading health themes…
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">🌿 Health Themes</h1>
        <p className="text-slate-500 mt-1">
          Real food stacks engineered for specific health targets.
        </p>
        <div className="mt-2 text-xs text-slate-400 bg-slate-100 rounded px-3 py-2 inline-block">
          📐 Formulation rule: Freeze-dried fruit : veg ratio ≥ 2:1 for palatability
        </div>
      </div>

      {/* Theme selector */}
      <div className="grid grid-cols-5 gap-3 mb-8">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => setSelected(theme.id)}
            className={`rounded-xl p-4 text-left transition border-2 ${
              selected === theme.id
                ? 'border-slate-900 shadow-md'
                : 'border-transparent bg-white shadow hover:shadow-md'
            }`}
            style={
              selected === theme.id
                ? { backgroundColor: theme.color_hex + '18', borderColor: theme.color_hex }
                : {}
            }
          >
            <div className="text-2xl mb-1">{theme.hero_emoji}</div>
            <div className="font-semibold text-slate-900 text-sm">{theme.name}</div>
            <div
              className="text-xs font-medium mt-1 italic"
              style={{ color: theme.color_hex }}
            >
              "{theme.slogan}"
            </div>
          </button>
        ))}
      </div>

      {/* Active theme detail */}
      {activeTheme && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Hero banner */}
          <div
            className="px-8 py-6"
            style={{ backgroundColor: activeTheme.color_hex + '15' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl mb-2">{activeTheme.hero_emoji}</div>
                <h2 className="text-2xl font-bold text-slate-900">{activeTheme.name}</h2>
                <p className="text-lg font-medium italic mt-1" style={{ color: activeTheme.color_hex }}>
                  "{activeTheme.slogan}"
                </p>
                <p className="text-slate-500 mt-1 text-sm">{activeTheme.tagline}</p>
              </div>
              <div
                className="rounded-xl px-4 py-3 text-sm font-medium max-w-xs text-right"
                style={{ backgroundColor: activeTheme.color_hex + '20', color: activeTheme.color_hex }}
              >
                <div className="text-xs uppercase tracking-wide mb-1 opacity-70">Label Claim</div>
                {activeTheme.label_claim}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <span>🌾 Hero ingredient:</span>
              <span className="font-semibold text-slate-700">{activeTheme.hero_ingredient}</span>
            </div>
          </div>

          {/* Ingredient adjustments */}
          <div className="p-8">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-4">
              Ingredient Stack — {activeAdjustments.length} adjustments vs base formula
            </h3>
            <div className="space-y-3">
              {activeAdjustments.map((adj) => {
                const style = ACTION_STYLES[adj.action] || ACTION_STYLES.keep;
                return (
                  <div
                    key={adj.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <span
                      className={`text-xs font-bold px-2 py-1 rounded-lg shrink-0 ${style.bg} ${style.text}`}
                    >
                      {style.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-800">
                          {adj.ingredients?.name}
                        </span>
                        {adj.new_dose_g != null && (
                          <span className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                            {adj.new_dose_g}g
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{adj.rationale}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
