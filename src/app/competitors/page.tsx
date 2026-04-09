'use client';

import { useEffect, useState } from 'react';
import { getAllCompetitors } from '@/lib/supabase';
import type { Competitor } from '@/lib/types';

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetitors();
  }, []);

  async function loadCompetitors() {
    try {
      const data = await getAllCompetitors();
      setCompetitors(data);
    } catch (error) {
      console.error('Failed to load competitors:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Competitors</h1>
          <p className="text-slate-600 mt-1">
            Market research & competitive intelligence
          </p>
        </div>
        <button className="primary">+ Track Competitor</button>
      </div>

      {/* COMPETITORS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-8 text-slate-600">
            Loading...
          </div>
        ) : competitors.length > 0 ? (
          competitors.map((competitor) => (
            <div
              key={competitor.id}
              className="bg-white rounded-lg border border-slate-200 p-6"
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {competitor.name}
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                {competitor.description}
              </p>
              <div className="space-y-2 text-sm">
                {competitor.positioning && (
                  <p>
                    <span className="text-slate-600">Positioning:</span>{' '}
                    {competitor.positioning}
                  </p>
                )}
                {competitor.target_market && (
                  <p>
                    <span className="text-slate-600">Target:</span>{' '}
                    {competitor.target_market}
                  </p>
                )}
                {competitor.website && (
                  <a
                    href={competitor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {competitor.website}
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 bg-slate-50 rounded-lg border border-slate-200 p-6 text-center">
            <p className="text-slate-600">
              No competitors tracked yet. Start adding them to track pricing &
              positioning.
            </p>
            <button className="primary mt-4">Add First Competitor</button>
          </div>
        )}
      </div>
    </div>
  );
}
