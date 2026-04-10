'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface TargetAudience {
  id: number;
  segment_name: string;
  segment_code: string;
  tagline: string;
  age_range: string;
  gender_skew: string;
  income_range: string;
  geography: string;
  identity_keywords: string[];
  pain_point: string;
  buying_trigger: string;
  price_sensitivity: string;
  ltv_potential: 'high' | 'medium' | 'low';
  acquisition_channel: string[];
  real_competitors: string[];
  persona_description: string;
  is_primary: boolean;
  priority_rank: number;
}

const SEGMENT_STYLES: Record<string, { emoji: string; color: string; bg: string; border: string; badge: string }> = {
  biohacker: {
    emoji: '🧬',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  busy_performer: {
    emoji: '💼',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
  },
  rec_athlete: {
    emoji: '🏋️',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
  },
};

const LTV_STYLES = {
  high: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  low: 'bg-red-100 text-red-700 border border-red-200',
};

const PRICE_SENSITIVITY_ICON = (s: string) => {
  if (s.toLowerCase().startsWith('low')) return { icon: '🟢', label: 'Low sensitivity' };
  if (s.toLowerCase().startsWith('medium')) return { icon: '🟡', label: 'Medium sensitivity' };
  return { icon: '🔴', label: 'High sensitivity' };
};

export default function AudiencesPage() {
  const [audiences, setAudiences] = useState<TargetAudience[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('target_audiences')
        .select('*')
        .order('priority_rank');
      setAudiences(data || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400 text-sm animate-pulse">Loading target audiences…</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">🎯 Target Audiences</h1>
        <p className="text-slate-500 mt-1">
          Who pays €12.99+ for BioRise — and why they don't even blink.
        </p>
      </div>

      {/* Core insight banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6">
        <p className="text-lg font-semibold mb-1">The core insight</p>
        <p className="text-slate-300 text-sm leading-relaxed">
          Income is less important than <span className="text-white font-semibold">identity</span>. 
          These buyers don't price-compare — they <span className="text-white font-semibold">justify</span>. 
          Once they're in the habit, cancelling feels like regression. 
          The real competitor is a €12 café breakfast with worse nutrition. BioRise wins on every dimension.
        </p>
      </div>

      {/* Segment cards */}
      <div className="space-y-6">
        {audiences.map((a) => {
          const style = SEGMENT_STYLES[a.segment_code] || SEGMENT_STYLES['biohacker'];
          const ltvStyle = LTV_STYLES[a.ltv_potential];
          const ps = PRICE_SENSITIVITY_ICON(a.price_sensitivity);
          const isOpen = expanded === a.id;

          return (
            <div
              key={a.id}
              className={`rounded-2xl border-2 ${style.border} ${style.bg} overflow-hidden`}
            >
              {/* Card header */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{style.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className={`text-xl font-bold ${style.color}`}>{a.segment_name}</h2>
                        {a.is_primary && (
                          <span className="text-xs bg-slate-900 text-white px-2 py-0.5 rounded-full font-medium">
                            Primary
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-medium">#{a.priority_rank}</span>
                      </div>
                      <p className="text-slate-600 text-sm mt-0.5 italic">"{a.tagline}"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${ltvStyle}`}>
                      LTV: {a.ltv_potential.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Persona description */}
                <p className="mt-4 text-sm text-slate-700 leading-relaxed border-l-4 border-current pl-4 ml-1" style={{borderColor: 'currentColor'}}>
                  {a.persona_description}
                </p>

                {/* Quick stats row */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-xl p-3 text-center">
                    <div className="text-xs text-slate-500 mb-1">Age</div>
                    <div className="text-sm font-bold text-slate-800">{a.age_range}</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center">
                    <div className="text-xs text-slate-500 mb-1">Gender</div>
                    <div className="text-sm font-bold text-slate-800">{a.gender_skew}</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center">
                    <div className="text-xs text-slate-500 mb-1">Price sensitivity</div>
                    <div className="text-sm font-bold text-slate-800">{ps.icon} {ps.label}</div>
                  </div>
                  <div className="bg-white rounded-xl p-3 text-center">
                    <div className="text-xs text-slate-500 mb-1">Geography</div>
                    <div className="text-xs font-semibold text-slate-800 leading-snug">{a.geography.split(',')[0]}…</div>
                  </div>
                </div>

                {/* Identity keywords */}
                <div className="mt-4">
                  <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wide">Identity keywords</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(a.identity_keywords || []).map((kw) => (
                      <span key={kw} className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => setExpanded(isOpen ? null : a.id)}
                  className={`mt-4 text-xs font-semibold ${style.color} hover:underline`}
                >
                  {isOpen ? '▲ Less detail' : '▼ Full breakdown'}
                </button>
              </div>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-current border-opacity-20 bg-white p-6 grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">💥 Pain point</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{a.pain_point}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">⚡ Buying trigger</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">{a.buying_trigger}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">💰 Income range</h3>
                    <p className="text-sm text-slate-700">{a.income_range}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">🌍 Full geography</h3>
                    <p className="text-sm text-slate-700">{a.geography}</p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">📣 Acquisition channels</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(a.acquisition_channel || []).map((ch) => (
                        <span key={ch} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{ch}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">🥊 Real competitors</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {(a.real_competitors || []).map((c) => (
                        <span key={c} className="text-xs bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Positioning statement */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6">
        <p className="text-xs uppercase tracking-widest text-slate-400 mb-3">BioRise positioning</p>
        <p className="text-xl font-bold leading-snug mb-2">
          "Real food, engineered to perfection."
        </p>
        <p className="text-slate-400 text-sm">
          Not competing with €3 porridge. Not another extract-heavy powder. 
          The thing your best customers already wished existed — they just didn't know where to find it.
        </p>
      </div>
    </div>
  );
}
