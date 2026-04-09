'use client';

export default function BatchesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Batch Planning</h1>
          <p className="text-slate-600 mt-1">
            Production scheduling & inventory management
          </p>
        </div>
        <button className="primary">+ New Batch</button>
      </div>

      <div className="bg-slate-50 rounded-lg border border-slate-200 p-12 text-center">
        <p className="text-slate-600 mb-4">Batch planning coming soon</p>
        <p className="text-sm text-slate-500">
          Create SKUs first, then plan production batches
        </p>
      </div>
    </div>
  );
}
