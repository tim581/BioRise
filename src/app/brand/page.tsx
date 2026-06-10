'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface BrandIdentityRecord {
  id: number;
  category: string;
  key: string;
  value: string;
  notes: string | null;
  locked: boolean;
}

const CATEGORY_META: Record<string, { label: string; emoji: string; color: string }> = {
  mission:     { label: 'Mission & Purpose',    emoji: '🎯', color: 'bg-amber-50 border-amber-200' },
  positioning: { label: 'Market Positioning',   emoji: '📍', color: 'bg-blue-50 border-blue-200' },
  personality: { label: 'Brand Personality',    emoji: '✨', color: 'bg-purple-50 border-purple-200' },
  visual:      { label: 'Visual Identity',      emoji: '🎨', color: 'bg-rose-50 border-rose-200' },
  product:     { label: 'Product Rules',        emoji: '🌾', color: 'bg-green-50 border-green-200' },
  regulatory:  { label: 'Regulatory',           emoji: '⚖️', color: 'bg-slate-50 border-slate-200' },
  company:     { label: 'Company',              emoji: '🏢', color: 'bg-indigo-50 border-indigo-200' },
};

const KEY_LABELS: Record<string, string> = {
  mission_statement:      'Mission Statement',
  brand_tagline:          'Brand Tagline',
  formula_philosophy:     'Formula Philosophy',
  design_goal:            'Design Goal',
  best_or_nothing:        '"Best or Nothing" Principle',
  category:               'Product Category',
  primary_markets:        'Primary Markets',
  go_to_market:           'Go-to-Market',
  vs_competition:         'vs. Competition',
  price_per_serving:      'Price Per Serving',
  margin_floor:           'Gross Margin Floor',
  aesthetic:              'Aesthetic',
  tone_of_voice:          'Tone of Voice',
  sales_philosophy:       'Sales Philosophy',
  color_primary:          'Primary Colour',
  color_secondary:        'Secondary Colour',
  color_accent_green:     'Accent — Green',
  color_accent_gold:      'Accent — Gold',
  packaging_direction:    'Packaging Direction',
  packaging_latest_version: 'Packaging Latest Version',
  flavour_profile:        'Flavour Profile',
  protein_target:         'Protein Target',
  shelf_life:             'Shelf Life',
  serving_format:         'Serving Format',
  production_model:       'Production Model',
  geography_preference:   'Geography Preference',
  eu_framework:           'EU Framework',
  probiotic_label_rule:   'Probiotic Label Rule',
  novel_food_rule:        'Novel Food Rule',
  brand_name:             'Brand Name',
  legal_entity:           'Legal Entity',
  founder:                'Founder',
  founder_philosophy:     'Founder Philosophy',
};

const COLOUR_KEYS = ['color_primary', 'color_secondary', 'color_accent_green', 'color_accent_gold'];

export default function BrandPage() {
  const [records, setRecords] = useState<BrandIdentityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('brand_identity')
      .select('*')
      .order('id')
      .then(({ data }) => {
        setRecords(data || []);
        setLoading(false);
      });
  }, []);

  const grouped = records.reduce<Record<string, BrandIdentityRecord[]>>((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {});

  const mission = records.find(r => r.key === 'mission_statement');
  const tagline = records.find(r => r.key === 'brand_tagline');
  const colours = records.filter(r => COLOUR_KEYS.includes(r.key));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🎯 Brand Identity</h1>
        <p className="text-slate-500 mt-1">Single source of truth for all BioRise brand decisions</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-400 animate-pulse">Loading brand identity…</div>
        </div>
      ) : (
        <>
          {/* Hero mission card */}
          {mission && (
            <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, #1a0a0e 0%, #6E2230 100%)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-300 mb-3">Mission</p>
              <p className="text-2xl font-bold leading-snug max-w-2xl">"{mission.value}"</p>
              {tagline && (
                <p className="mt-4 text-amber-200 italic text-lg">— {tagline.value}</p>
              )}
            </div>
          )}

          {/* Colour palette */}
          {colours.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-3">Colour Palette</h2>
              <div className="flex gap-4 flex-wrap">
                {colours.map(c => (
                  <div key={c.key} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                    <div className="w-10 h-10 rounded-lg shadow-inner border border-slate-200" style={{ backgroundColor: c.value }} />
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{KEY_LABELS[c.key] ?? c.key}</p>
                      <p className="text-xs text-slate-400 font-mono">{c.value}</p>
                      {c.notes && <p className="text-xs text-slate-400 mt-0.5">{c.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Category sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(CATEGORY_META).map(([cat, meta]) => {
              const items = grouped[cat];
              if (!items || items.length === 0) return null;
              // Skip visual colours in the grid (shown above)
              const filtered = cat === 'visual'
                ? items.filter(i => !COLOUR_KEYS.includes(i.key))
                : items;
              if (filtered.length === 0) return null;
              return (
                <div key={cat} className={`rounded-xl border p-5 ${meta.color}`}>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-slate-600 mb-4">
                    {meta.emoji} {meta.label}
                  </h2>
                  <div className="space-y-3">
                    {filtered.map(r => (
                      <div key={r.id} className="bg-white rounded-lg px-4 py-3 shadow-sm border border-white">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-500 mb-1">
                            {KEY_LABELS[r.key] ?? r.key}
                          </p>
                          {r.locked && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium shrink-0">
                              🔒 locked
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-800 leading-relaxed">{r.value}</p>
                        {r.notes && (
                          <p className="text-xs text-slate-400 mt-1.5 italic">{r.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats footer */}
          <div className="flex gap-4 text-sm text-slate-500">
            <span>{records.length} brand attributes</span>
            <span>·</span>
            <span>{records.filter(r => r.locked).length} locked by Tim</span>
            <span>·</span>
            <span>{Object.keys(grouped).length} categories</span>
          </div>
        </>
      )}
    </div>
  );
}
