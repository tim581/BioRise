// ============================================================================
// CORE TYPES FOR BIORISE OPERATIONS
// ============================================================================

// SUPPLIERS
export interface Supplier {
  id: number;
  name: string;
  category_id: number;
  description: string;
  website?: string;
  email?: string;
  phone?: string;
  location_city: string;
  location_country: string;
  location_region: string;
  quality_grade?: 'A' | 'B' | 'C';
  lead_time_days?: number;
  min_order_quantity?: number;
  payment_terms?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierCategory {
  id: number;
  name: string;
  description?: string;
}

// INGREDIENTS
export interface Ingredient {
  id: number;
  name: string;
  category: 'protein' | 'seed' | 'nut' | 'fruit' | 'superfood' | 'spice' | 'additive';
  unit: 'g' | 'ml' | 'kg' | 'l';
  primary_supplier_id?: number;
  cost_per_unit?: number;
  quality_grade?: string;
  organic_certified?: boolean;
  allergen_info?: string;
  shelf_life_days?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// FORMULATIONS
export interface Formulation {
  id: number;
  name: string;
  version: number;
  status: 'draft' | 'testing' | 'approved' | 'discontinued';
  description?: string;
  yield_per_batch?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FormulationIngredient {
  id: number;
  formulation_id: number;
  ingredient_id: number;
  quantity: number;
  unit: string;
  cost_per_unit?: number;
  total_cost?: number;
  notes?: string;
}

// UNIT ECONOMICS
export interface UnitEconomics {
  id: number;
  sku_id: number;
  raw_material_cost: number;
  blending_cost: number;
  packaging_bag_cost: number;
  packaging_carton_cost: number;
  packaging_pallet_cost: number;
  logistics_cost?: number;
  labor_cost?: number;
  overhead_allocation?: number;
  quality_control_cost?: number;
  total_cogs: number;
  unit_selling_price?: number;
  gross_margin?: number;
  gross_margin_percent?: number;
  created_at: string;
  updated_at: string;
}

// SKUS (PRODUCTS)
export interface SKU {
  id: number;
  name: string;
  formulation_id: number;
  pack_size: string;
  packaging_type: 'bag' | 'carton' | 'bulk';
  units_per_carton?: number;
  status: 'draft' | 'active' | 'discontinued';
  target_price?: number;
  created_at: string;
  updated_at: string;
}

// COMPETITORS
export interface Competitor {
  id: number;
  name: string;
  website?: string;
  description?: string;
  positioning?: string;
  price_range?: string;
  target_market?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitorProduct {
  id: number;
  competitor_id: number;
  product_name: string;
  price: number;
  pack_size: string;
  positioning: string;
  last_seen_date: string;
  notes?: string;
}

// MARKET RESEARCH
export interface MarketResearch {
  id: number;
  topic: string;
  source: 'exa' | 'tavily' | 'manual';
  content: string;
  url?: string;
  key_findings?: string;
  relevance_score?: number;
  created_at: string;
}

// SCENARIOS & WHAT-IF ANALYSIS
export interface UnitEconomicsScenario {
  id: number;
  unit_economics_id: number;
  scenario_name: string;
  description?: string;
  ingredient_cost_change?: number; // percentage
  packaging_change?: number; // percentage
  volume_change?: number; // percentage
  projected_cogs?: number;
  projected_margin?: number;
  notes?: string;
  created_at: string;
}

// DASHBOARD STATS
export interface DashboardStats {
  total_suppliers: number;
  suppliers_by_country: Record<string, number>;
  total_ingredients: number;
  total_formulations: number;
  active_skus: number;
  average_cogs: number;
  average_margin: number;
  competitors_tracked: number;
  recent_research_count: number;
}

// API RESPONSE TYPES
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
