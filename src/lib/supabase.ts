import { createClient } from '@supabase/supabase-js';
import type {
  Supplier,
  Ingredient,
  Formulation,
  SKU,
  Competitor,
  DashboardStats,
} from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Supabase URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
console.log('Supabase Key:', supabaseAnonKey ? '✓ Set' : '✗ Missing');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// SUPPLIERS
// ============================================================================

export async function getAllSuppliers() {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('location_country, name');

  if (error) throw error;
  return data as Supplier[];
}

export async function getSuppliersByCategory(categoryId: number) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('category_id', categoryId)
    .order('name');

  if (error) throw error;
  return data as Supplier[];
}

export async function getSuppliersByCountry(country: string) {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('location_country', country)
    .order('name');

  if (error) throw error;
  return data as Supplier[];
}

// ============================================================================
// INGREDIENTS
// ============================================================================

export async function getAllIngredients() {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('category, name');

  if (error) throw error;
  return data as Ingredient[];
}

export async function getIngredientsByCategory(category: string) {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('category', category)
    .order('name');

  if (error) throw error;
  return data as Ingredient[];
}

// ============================================================================
// FORMULATIONS
// ============================================================================

export async function getAllFormulations() {
  const { data, error } = await supabase
    .from('formulations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Formulation[];
}

export async function getFormulationWithIngredients(formulationId: number) {
  const { data: formulation, error: formulationError } = await supabase
    .from('formulations')
    .select('*')
    .eq('id', formulationId)
    .single();

  if (formulationError) throw formulationError;

  const { data: ingredients, error: ingredientsError } = await supabase
    .from('formulation_ingredients')
    .select(`
      *,
      ingredients:ingredient_id(name, unit, category)
    `)
    .eq('formulation_id', formulationId)
    .order('id');

  if (ingredientsError) throw ingredientsError;

  return { formulation, ingredients };
}

// ============================================================================
// SKUS
// ============================================================================

export async function getAllSKUs() {
  const { data, error } = await supabase
    .from('skus')
    .select(`
      *,
      formulations:formulation_id(name, version),
      unit_economics(*)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================================================
// COMPETITORS
// ============================================================================

export async function getAllCompetitors() {
  const { data, error } = await supabase
    .from('competitors')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as Competitor[];
}

export async function getCompetitorProducts(competitorId: number) {
  const { data, error } = await supabase
    .from('competitor_products')
    .select('*')
    .eq('competitor_id', competitorId)
    .order('last_seen_date', { ascending: false });

  if (error) throw error;
  return data;
}

// ============================================================================
// DASHBOARD STATS
// ============================================================================

export async function getDashboardStats(): Promise<DashboardStats> {
  // Get all suppliers and count by country
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('location_country');

  const suppliersByCountry: Record<string, number> = {};
  suppliers?.forEach((s) => {
    if (s.location_country) {
      suppliersByCountry[s.location_country] =
        (suppliersByCountry[s.location_country] || 0) + 1;
    }
  });

  // Get ingredient count
  const { count: ingredientCount } = await supabase
    .from('ingredients')
    .select('id', { count: 'exact', head: true });

  // Get formulation count
  const { count: formulationCount } = await supabase
    .from('formulations')
    .select('id', { count: 'exact', head: true });

  // Get active SKU count
  const { count: skuCount } = await supabase
    .from('skus')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  // Get competitor count
  const { count: competitorCount } = await supabase
    .from('competitors')
    .select('id', { count: 'exact', head: true });

  // Get average COGS
  const { data: economics } = await supabase
    .from('unit_economics')
    .select('total_cogs, gross_margin_percent')
    .limit(100);

  const avgCogs =
    economics && economics.length > 0
      ? economics.reduce((acc, e) => acc + (e.total_cogs || 0), 0) /
        economics.length
      : 0;

  const avgMargin =
    economics && economics.length > 0
      ? economics.reduce((acc, e) => acc + (e.gross_margin_percent || 0), 0) /
        economics.length
      : 0;

  return {
    total_suppliers: suppliers?.length || 0,
    suppliers_by_country: suppliersByCountry,
    total_ingredients: ingredientCount || 0,
    total_formulations: formulationCount || 0,
    active_skus: skuCount || 0,
    average_cogs: Math.round(avgCogs * 100) / 100,
    average_margin: Math.round(avgMargin * 100) / 100,
    competitors_tracked: competitorCount || 0,
    recent_research_count: 0, // TODO: implement
  };
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export function subscribeToSuppliers(callback: (payload: any) => void) {
  return supabase
    .channel('suppliers')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'suppliers',
      },
      callback
    )
    .subscribe();
}

export function subscribeToFormulations(callback: (payload: any) => void) {
  return supabase
    .channel('formulations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'formulations',
      },
      callback
    )
    .subscribe();
}
