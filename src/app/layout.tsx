import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'BioRise — Operations Dashboard',
  description:
    'Premium oatmeal-based superbreakfast operations, research & formulation management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50">
        <div className="flex min-h-screen">
          {/* SIDEBAR */}
          <aside className="w-64 bg-slate-900 text-white p-6 border-r border-slate-800">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">BioRise</h1>
              <p className="text-xs text-slate-400 mt-1">
                Operations Dashboard
              </p>
            </div>

            <nav className="space-y-4">
              <NavLink href="/" label="📊 Dashboard" />
              <NavLink href="/suppliers" label="🤝 Suppliers" />
              <NavLink href="/ingredients" label="🌾 Ingredients" />
              <NavLink href="/formulations" label="🍲 Formulations" />
              <NavLink href="/skus" label="📦 SKUs" />
              <NavLink href="/pricing" label="💶 Ingredient Pricing" />
              <NavLink
                href="/unit-economics"
                label="💰 Unit Economics"
              />
              <NavLink href="/audiences" label="🎯 Target Audiences" />
              <NavLink href="/competitors" label="🏆 Competitors" />
              <NavLink href="/batches" label="📋 Batches" />
            </nav>

            <hr className="border-slate-700 my-6" />

            <div className="text-xs text-slate-400 space-y-2">
              <p>🇧🇪 Antwerp, Belgium</p>
              <p>v1.0.0</p>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1">
            <div className="max-w-7xl mx-auto p-8">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block text-sm text-slate-300 hover:text-white hover:bg-slate-800 px-3 py-2 rounded transition"
    >
      {label}
    </Link>
  );
}
