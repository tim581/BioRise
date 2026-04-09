'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllFormulations } from '@/lib/supabase';
import type { Formulation } from '@/lib/types';

export default function FormulationsPage() {
  const [formulations, setFormulations] = useState<Formulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFormulations();
  }, []);

  async function loadFormulations() {
    try {
      const data = await getAllFormulations();
      setFormulations(data);
    } catch (error) {
      console.error('Failed to load formulations:', error);
    } finally {
      setLoading(false);
    }
  }

  const statusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'badge-warning',
      testing: 'badge-info',
      approved: 'badge-success',
      discontinued: 'badge-danger',
    };
    return colors[status] || 'badge-info';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Formulations</h1>
          <p className="text-slate-600 mt-1">
            Recipe management & version control
          </p>
        </div>
        <button className="primary">+ New Formulation</button>
      </div>

      {/* FORMULATIONS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center py-8 text-slate-600">
            Loading...
          </div>
        ) : formulations.length > 0 ? (
          formulations.map((form) => (
            <FormulationCard key={form.id} formulation={form} />
          ))
        ) : (
          <div className="col-span-2 bg-slate-50 rounded-lg border border-slate-200 p-6 text-center">
            <p className="text-slate-600">No formulations yet</p>
            <button className="primary mt-4">Create First Formulation</button>
          </div>
        )}
      </div>
    </div>
  );
}

function FormulationCard({ formulation }: { formulation: Formulation }) {
  const statusColor: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800',
    testing: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    discontinued: 'bg-red-100 text-red-800',
  };

  return (
    <Link href={`/formulations/${formulation.id}`}>
      <div className="bg-white rounded-lg border border-slate-200 p-6 hover:border-slate-300 hover:shadow-md transition cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {formulation.name}
            </h3>
            <p className="text-sm text-slate-600">v{formulation.version}</p>
          </div>
          <span
            className={`px-3 py-1 text-sm font-medium rounded ${
              statusColor[formulation.status] || 'bg-slate-100'
            }`}
          >
            {formulation.status}
          </span>
        </div>

        {formulation.description && (
          <p className="text-sm text-slate-600 mb-4">{formulation.description}</p>
        )}

        <div className="text-xs text-slate-500">
          Created {new Date(formulation.created_at).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
}
