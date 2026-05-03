import { createClient } from '@/lib/supabase/client'

export async function fetchRawMaterials() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('raw_materials')
    .select('*')
    .order('name')
  return { data, error }
}

export async function fetchProducts() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name')
  return { data, error }
}

export async function fetchBatches() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('batches')
    .select('*, product:products(*)')
    .order('batch_code')
  return { data, error }
}

export async function fetchBOM(batchId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bom')
    .select('*, raw_material:raw_materials(*)')
    .eq('batch_id', batchId)
  return { data, error }
}

export async function fetchDailyProduction(date?: string) {
  const supabase = createClient()
  let query = supabase
    .from('daily_production')
    .select('*, batch:batches(*, product:products(*))')
    .order('production_date', { ascending: false })

  if (date) {
    query = query.eq('production_date', date)
  }

  const { data, error } = await query
  return { data, error }
}

export async function fetchDispatchRecords(startDate?: string, endDate?: string) {
  const supabase = createClient()
  let query = supabase
    .from('dispatch_records')
    .select('*, product:products(*), batch:batches(*)')
    .order('dispatch_date', { ascending: false })

  if (startDate) {
    query = query.gte('dispatch_date', startDate)
  }
  if (endDate) {
    query = query.lte('dispatch_date', endDate)
  }

  const { data, error } = await query
  return { data, error }
}

export async function fetchInventoryTransactions(materialId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventory_transactions')
    .select('*')
    .eq('raw_material_id', materialId)
    .order('created_at', { ascending: false })
  return { data, error }
}

export async function updateRawMaterialStock(materialId: string, newStock: number) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('raw_materials')
    .update({ current_stock: newStock, updated_at: new Date().toISOString() })
    .eq('id', materialId)
  return { data, error }
}

export async function addInventoryTransaction(
  materialId: string,
  transactionType: string,
  quantity: number,
  batchId?: string,
  notes?: string
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('inventory_transactions')
    .insert({
      raw_material_id: materialId,
      batch_id: batchId,
      transaction_type: transactionType,
      quantity,
      notes,
    })
  return { data, error }
}
