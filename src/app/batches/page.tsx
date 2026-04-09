'use client';

export default function BatchesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Production Batches</h1>
          <p className="text-slate-600 mt-1">
            Track manufacturing runs & quality control
          </p>
        </div>
        <button className="btn btn-primary">+ Create Batch</button>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Coming Soon
          </h3>
          <p className="text-slate-600 mb-4">
            Production batch tracking and quality control management will be available here.
          </p>
          <p className="text-sm text-slate-500">
            For now, track production through formulations and SKU economics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a href="/formulations" className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition">
          <h4 className="font-semibold text-slate-900">View Formulations</h4>
          <p className="text-sm text-slate-600 mt-1">Check recipe versions and ingredients</p>
        </a>
        <a href="/unit-economics" className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition">
          <h4 className="font-semibold text-slate-900">View Economics</h4>
          <p className="text-sm text-slate-600 mt-1">Analyze production costs per batch</p>
        </a>
      </div>
    </div>
  );
}
