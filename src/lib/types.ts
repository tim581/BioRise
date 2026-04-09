// ============================================
// BIORISE TYPES - MATCHES SUPABASE SCHEMA v2
// ============================================

// INGREDIENTS
export interface Ingredient {
  id: number;
  name: string;
  category_id: number;
  description?: string;
  unit_of_measure: string;
  target_quality_standard?: string;
  shelf_life_days?: number;
  notes?: string;
  created_at?: string;
}

export interface IngredientCategory {
  id: number;
  name: string;
  description?: string;
}

// SUPPLIERS
export interface Supplier {
  id: number;
  name: string;
  category_id: number;
  description?: string;
  location_city?: string;
  location_country?: string;
  priority?: number;
  website?: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  notes?: string;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierCategory {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
}

export interface SupplierIngredientQuote {
  id: number;
  supplier_id: number;
  ingredient_id: number;
  cost_per_unit: number;
  unit_of_measure: string;
  moq_quantity?: number;
  lead_time_days?: number;
  quality_certifications?: string;
  available?: boolean;
  quote_date?: string;
  notes?: string;
  created_at?: string;
}

export interface SupplierBenchmark {
  id: number;
  ingredient_id: number;
  supplier_id: number;
  cost_per_unit_eur?: number;
  cost_rank?: number;
  quality_rank?: number;
  lead_time_rank?: number;
  overall_score?: number;
  notes?: string;
  created_at?: string;
}

// FORMULATIONS
export interface Formulation {
  id: number;
  name: string;
  description?: string;
  version?: number;
  status?: string;
  target_serving_grams?: number;
  target_calories?: number;
  total_dry_weight_grams?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FormulationIngredient {
  id: number;
  formulation_id: number;
  ingredient_id: number;
  quantity_grams: number;
  order_priority?: number;
  notes?: string;
  created_at?: string;
}

export interface FormulationMaterialCost {
  id: number;
  formulation_id: number;
  ingredient_id: number;
  quantity_grams: number;
  supplier_id: number;
  cost_per_gram_eur: number;
  total_material_cost_eur: number;
  quote_date?: string;
  created_at?: string;
}

export interface FormulationProcessingCost {
  id: number;
  formulation_id: number;
  process_type: string;
  cost_per_batch_eur: number;
  cost_per_unit_eur: number;
  supplier_id?: number;
  notes?: string;
  created_at?: string;
}

// SKUS & PRODUCTS
export interface SKU {
  id: number;
  sku_code: string;
  formulation_id: number;
  packaging_id: number;
  name: string;
  description?: string;
  price_eur?: number;
  status?: string;
  launch_date?: string;
  created_at?: string;
}

export interface ProductSKU {
  id: number;
  sku_code: string;
  product_name: string;
  variant?: string;
  bag_count?: number;
  kcal_per_bag?: number;
  target_price?: number;
  currency?: string;
  manufacturing_cost?: number;
  cogs_breakdown?: string;
  packaging_type?: string;
  shelf_life_months?: number;
  certifications?: string[];
  launch_date?: string;
  status?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// PACKAGING
export interface PackagingType {
  id: number;
  name: string;
  description?: string;
  type?: string;
  bag_grams?: number;
  material?: string;
  includes_label?: boolean;
  includes_nutritional_panel?: boolean;
  cost_per_unit_eur?: number;
  supplier_id?: number;
  notes?: string;
  created_at?: string;
}

// CARTONS & PALLETS
export interface MasterCarton {
  id: number;
  carton_code: string;
  sku_id: number;
  units_per_carton: number;
  carton_weight_grams?: number;
  carton_dimensions_cm?: string;
  cost_per_carton_eur?: number;
  created_at?: string;
}

export interface Pallet {
  id: number;
  pallet_code: string;
  carton_id: number;
  cartons_per_pallet: number;
  pallet_weight_kg?: number;
  pallet_height_cm?: number;
  stacking_limit?: number;
  cost_per_pallet_eur?: number;
  created_at?: string;
}

// UNIT ECONOMICS
export interface SKUUnitEconomics {
  id: number;
  sku_id: number;
  raw_material_cost_eur: number;
  blending_cost_eur: number;
  freeze_dry_cost_eur: number;
  quality_check_cost_eur: number;
  packaging_cost_eur: number;
  carton_cost_eur: number;
  total_cogs_eur?: number;
  gross_margin_percent?: number;
  updated_at?: string;
}

export interface PalletUnitEconomics {
  id: number;
  pallet_id: number;
  sku_cost_per_unit_eur: number;
  carton_cost_eur: number;
  pallet_cost_eur: number;
  inbound_logistics_cost_eur?: number;
  cartons_per_pallet: number;
  units_per_carton: number;
  total_cost_per_pallet_eur?: number;
  updated_at?: string;
}

export interface COGSScenario {
  id: number;
  scenario_name: string;
  sku_id: number;
  scenario_cogs_eur?: number;
  variant_notes?: string;
  margin_impact_percent?: number;
  created_at?: string;
}

// COST TRACKING
export interface CostAnalysis {
  id: number;
  sku_id?: number;
  ingredient_name?: string;
  supplier_id?: number;
  cost_per_unit?: number;
  units_per_bag?: number;
  total_cost_per_bag?: number;
  percentage_of_cogs?: number;
  last_updated?: string;
}

export interface OperationalCost {
  id: number;
  cost_type: string;
  monthly_cost_eur?: number;
  allocation_method?: string;
  notes?: string;
  created_at?: string;
}

export interface CostCategory {
  id: number;
  name: string;
  category_type?: string;
  description?: string;
}

// COMPETITOR TRACKING
export interface CompetitorSentiment {
  id: number;
  competitor_id?: number;
  source?: string;
  review_date?: string;
  sentiment?: string;
  rating?: number;
  volume_of_mentions?: number;
  key_themes?: string[];
  raw_data?: string;
  created_at?: string;
}

// DATA VALIDATION
export interface DataValidationLog {
  id: number;
  entity_type: string;
  entity_id?: number;
  validation_check?: string;
  passed?: boolean;
  error_message?: string;
  suggested_fix?: string;
  created_at?: string;
}

// DASHBOARD SUMMARY TYPES
export interface DashboardSummary {
  total_suppliers: number;
  total_ingredients: number;
  active_formulations: number;
  total_skus: number;
  average_cogs_eur: number;
}
