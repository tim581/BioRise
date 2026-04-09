'use client';

import { useEffect, useState } from 'react';
import { getAllCompetitorSentiment } from '@/lib/supabase';
import * as Types from '@/lib/types';

export default function CompetitorsPage() {
  const [sentiment, setSentiment] = useState<Types.CompetitorSentiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getAllCompetitorSentiment();
      setSentiment(data);
      setLoading(false);
    }
    load();
  }, []);

  const getSentimentColor = (sent?: string) => {
    if (!sent) return 'bg-gray-100 text-gray-700';
    if (sent.toLowerCase().includes('positive')) return 'bg-green-100 text-green-700';
    if (sent.toLowerCase().includes('negative')) return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Competitor Tracking</h1>
          <p className="text-slate-600 mt-1">
            Market sentiment & pricing intelligence
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-slate-600">Loading competitor data...</div>
      ) : sentiment.length > 0 ? (
        <div className="space-y-4">
          {sentiment.map(sent => (
            <div key={sent.id} className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Competitor #{sent.competitor_id || 'N/A'}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    {sent.source || 'Unknown source'}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(sent.sentiment)}`}>
                  {sent.sentiment || 'Neutral'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                {sent.rating && (
                  <div>
                    <span className="text-sm text-slate-600">Rating:</span>
                    <div className="text-lg font-bold text-slate-900">
                      {parseFloat(sent.rating.toString()).toFixed(1)} / 5
                    </div>
                  </div>
                )}
                {sent.volume_of_mentions && (
                  <div>
                    <span className="text-sm text-slate-600">Mentions:</span>
                    <div className="text-lg font-bold text-slate-900">
                      {sent.volume_of_mentions}
                    </div>
                  </div>
                )}
                {sent.review_date && (
                  <div>
                    <span className="text-sm text-slate-600">Date:</span>
                    <div className="text-sm text-slate-900">
                      {new Date(sent.review_date).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              {sent.key_themes && sent.key_themes.length > 0 && (
                <div>
                  <p className="text-sm text-slate-600 mb-2 font-semibold">Key Themes:</p>
                  <div className="flex flex-wrap gap-2">
                    {sent.key_themes.map((theme, i) => (
                      <span key={i} className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {sent.raw_data && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600 font-semibold mb-2">Raw Data:</p>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">
                    {sent.raw_data}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-600">
          No competitor sentiment data yet. Set up automated tracking to get started.
        </div>
      )}
    </div>
  );
}
