'use client';

export default function SKUsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">SKUs</h1>
          <p className="text-slate-600 mt-1">
            Product configurations & packaging
          </p>
        </div>
        <button className="primary">+ New SKU</button>
      </div>

      <div className="bg-slate-50 rounded-lg border border-slate-200 p-12 text-center">
        <p className="text-slate-600 mb-4">SKUs will appear here once created</p>
        <p className="text-sm text-slate-500">
          Create a formulation first, then define packaging & SKU variants
        </p>
      </div>
    </div>
  );
}
