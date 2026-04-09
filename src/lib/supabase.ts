import { createClient } from '@supabase/supabase-js';
import * as Types from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (typeof window !== 'undefined') {
  if (supabaseUrl) console.log('✓ Supabase URL set');
  else console.error('✗ Supabase URL missing');
  
  if (supabaseAnonKey) console.log('✓ Supabase Key set');
  else console.error('✗ Supabase Key missing');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// ============================================
// INGREDIENTS
// ============================================

export async function getAllIngredients(): Promise<Types.Ingredient[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching ingredients:', error);
    return [];
  }
  return data || [];
}

export async function getIngredientsByCategory(
  categoryId: number
): Promise<Types.Ingredient[]> {
  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('category_id', categoryId)
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching ingredients by category:', error);
    return [];
  }
  return data || [];
}

export async function getIngredientCategories(): Promise<Types.IngredientCategory[]> {
  const { data, error } = await supabase
    .from('ingredient_categories')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching ingredient categories:', error);
    return [];
  }
  return data || [];
}

// ============================================
// SUPPLIERS
// ============================================

export async function getAllSuppliers(): Promise<Types.Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('priority', { ascending: true })
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
  return data || [];
}

export async function getSuppliersByCategory(
  categoryId: number
): Promise<Types.Supplier[]> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('category_id', categoryId)
    .order('priority', { ascending: true });
  
  if (error) {
    console.error('Error fetching suppliers by category:', error);
    return [];
  }
  return data || [];
}

export async function getSupplierById(id: number): Promise<Types.Supplier | null> {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching supplier:', error);
    return null;
  }
  return data;
}

export async function getSupplierCategories(): Promise<Types.SupplierCategory[]> {
  const { data, error } = await supabase
    .from('supplier_categories')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching supplier categories:', error);
    return [];
  }
  return data || [];
}

// ============================================
// FORMULATIONS
// ============================================

export async function getAllFormulations(): Promise<Types.Formulation[]> {
  const { data, error } = await supabase
    .from('formulations')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching formulations:', error);
    return [];
  }
  return data || [];
}

export async function getFormulationById(id: number): Promise<Types.Formulation | null> {
  const { data, error } = await supabase
    .from('formulations')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching formulation:', error);
    return null;
  }
  return data;
}

export async function getFormulationIngredients(
  formulationId: number
): Promise<Types.FormulationIngredient[]> {
  const { data, error } = await supabase
    .from('formulation_ingredients')
    .select('*')
    .eq('formulation_id', formulationId)
    .order('order_priority', { ascending: true });
  
  if (error) {
    console.error('Error fetching formulation ingredients:', error);
    return [];
  }
  return data || [];
}

// ============================================
// SKUS
// ============================================

export async function getAllSKUs(): Promise<Types.SKU[]> {
  const { data, error } = await supabase
    .from('skus')
    .select('*')
    .order('sku_code', { ascending: true });
  
  if (error) {
    console.error('Error fetching SKUs:', error);
    return [];
  }
  return data || [];
}

export async function getAllProductSKUs(): Promise<Types.ProductSKU[]> {
  const { data, error } = await supabase
    .from('product_skus')
    .select('*')
    .order('product_name', { ascending: true });
  
  if (error) {
    console.error('Error fetching product SKUs:', error);
    return [];
  }
  return data || [];
}

export async function getSKUById(id: number): Promise<Types.SKU | null> {
  const { data, error } = await supabase
    .from('skus')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching SKU:', error);
    return null;
  }
  return data;
}

// ============================================
// UNIT ECONOMICS
// ============================================

export async function getSKUUnitEconomics(
  skuId: number
): Promise<Types.SKUUnitEconomics | null> {
  const { data, error } = await supabase
    .from('sku_unit_economics')
    .select('*')
    .eq('sku_id', skuId)
    .single();
  
  if (error) {
    console.error('Error fetching SKU unit economics:', error);
    return null;
  }
  return data;
}

export async function getAllSKUUnitEconomics(): Promise<Types.SKUUnitEconomics[]> {
  const { data, error } = await supabase
    .from('sku_unit_economics')
    .select('*')
    .order('sku_id', { ascending: true });
  
  if (error) {
    console.error('Error fetching SKU unit economics:', error);
    return [];
  }
  return data || [];
}

// ============================================
// PACKAGING
// ============================================

export async function getAllPackagingTypes(): Promise<Types.PackagingType[]> {
  const { data, error } = await supabase
    .from('packaging_types')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Error fetching packaging types:', error);
    return [];
  }
  return data || [];
}

// ============================================
// SUPPLIER QUOTES & BENCHMARKS
// ============================================

export async function getSupplierIngredientQuotes(
  ingredientId: number
): Promise<Types.SupplierIngredientQuote[]> {
  const { data, error } = await supabase
    .from('supplier_ingredient_quotes')
    .select('*')
    .eq('ingredient_id', ingredientId)
    .order('cost_per_unit', { ascending: true });
  
  if (error) {
    console.error('Error fetching supplier quotes:', error);
    return [];
  }
  return data || [];
}

export async function getSupplierBenchmarks(
  ingredientId: number
): Promise<Types.SupplierBenchmark[]> {
  const { data, error } = await supabase
    .from('supplier_benchmarks')
    .select('*')
    .eq('ingredient_id', ingredientId)
    .order('overall_score', { ascending: false });
  
  if (error) {
    console.error('Error fetching supplier benchmarks:', error);
    return [];
  }
  return data || [];
}

// ============================================
// COST ANALYSIS
// ============================================

export async function getCostAnalysis(skuId: number): Promise<Types.CostAnalysis[]> {
  const { data, error } = await supabase
    .from('cost_analysis')
    .select('*')
    .eq('sku_id', skuId);
  
  if (error) {
    console.error('Error fetching cost analysis:', error);
    return [];
  }
  return data || [];
}

export async function getOperationalCosts(): Promise<Types.OperationalCost[]> {
  const { data, error } = await supabase
    .from('operational_costs')
    .select('*')
    .order('cost_type', { ascending: true });
  
  if (error) {
    console.error('Error fetching operational costs:', error);
    return [];
  }
  return data || [];
}

// ============================================
// COMPETITOR SENTIMENT
// ============================================

export async function getAllCompetitorSentiment(): Promise<Types.CompetitorSentiment[]> {
  const { data, error } = await supabase
    .from('competitor_sentiment')
    .select('*')
    .order('review_date', { ascending: false });
  
  if (error) {
    console.error('Error fetching competitor sentiment:', error);
    return [];
  }
  return data || [];
}

// ============================================
// DASHBOARD SUMMARY
// ============================================

export async function getDashboardSummary(): Promise<Types.DashboardSummary> {
  try {
    const [suppliers, ingredients, formulations, skus, economics] = await Promise.all([
      supabase.from('suppliers').select('id', { count: 'exact' }),
      supabase.from('ingredients').select('id', { count: 'exact' }),
      supabase.from('formulations').select('id', { count: 'exact' }),
      supabase.from('skus').select('id', { count: 'exact' }),
      supabase.from('sku_unit_economics').select('total_cogs_eur'),
    ]);

    const supplier_count = suppliers.count || 0;
    const ingredient_count = ingredients.count || 0;
    const formulation_count = formulations.count || 0;
    const sku_count = skus.count || 0;

    const cogs_values = (economics.data || [])
      .filter(e => e.total_cogs_eur !== null)
      .map(e => parseFloat(e.total_cogs_eur));
    
    const avg_cogs = cogs_values.length > 0
      ? cogs_values.reduce((a, b) => a + b, 0) / cogs_values.length
      : 0;

    return {
      total_suppliers: supplier_count,
      total_ingredients: ingredient_count,
      active_formulations: formulation_count,
      total_skus: sku_count,
      average_cogs_eur: parseFloat(avg_cogs.toFixed(2)),
    };
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return {
      total_suppliers: 0,
      total_ingredients: 0,
      active_formulations: 0,
      total_skus: 0,
      average_cogs_eur: 0,
    };
  }
}
