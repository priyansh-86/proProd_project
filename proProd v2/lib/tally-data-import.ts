// Tally ERP 9 Stock Journal Data from 2026-04-25 to 2026-05-02
// Period: 23-29 April 2026 Production Sheet

export const tallyStockJournalData = [
  { name: 'Salt', unit: 'kg', opening_stock: 5000.00, consumed: 130.00, closing_stock: 4870.00, cost_per_unit: 0 },
  { name: 'No.5 Liquid', unit: 'kg', opening_stock: 220.00, consumed: 7.00, closing_stock: 213.00, cost_per_unit: 0 },
  { name: 'Soda', unit: 'kg', opening_stock: 900.00, consumed: 25.00, closing_stock: 875.00, cost_per_unit: 0 },
  { name: 'No.1 Liquid', unit: 'kg', opening_stock: 61.00, consumed: 7.00, closing_stock: 54.00, cost_per_unit: 0 },
  { name: 'Dolomite', unit: 'kg', opening_stock: 1000.00, consumed: 30.00, closing_stock: 970.00, cost_per_unit: 0 },
  { name: 'Diphenyl Oxide (NLP)', unit: 'kg', opening_stock: 10.00, consumed: 0.10, closing_stock: 9.90, cost_per_unit: 0 },
  { name: 'Orange Speckles', unit: 'kg', opening_stock: 300.00, consumed: 1.50, closing_stock: 298.50, cost_per_unit: 0 },
  { name: 'Green Speckles', unit: 'kg', opening_stock: 300.00, consumed: 1.50, closing_stock: 298.50, cost_per_unit: 0 },
  { name: 'Blue Speckles', unit: 'kg', opening_stock: 300.00, consumed: 1.50, closing_stock: 298.50, cost_per_unit: 0 },
  { name: 'Bag 25 kg Packing', unit: 'boxes', opening_stock: 1000.00, consumed: 8.00, closing_stock: 992.00, cost_per_unit: 0 },
  { name: 'Multi Mogra (Perfume)', unit: 'kg', opening_stock: 30.00, consumed: 0.20, closing_stock: 29.80, cost_per_unit: 0 },
]

export const tallyBatchData = [
  {
    batch_code: 'BATCH-2026-04-25-MPL-001',
    product_name: 'MPL',
    product_type: 'Detergent Powder',
    quantity_per_batch: 200, // KG - as per your Tally export
    bom: [
      { material: 'Salt', qty: 130 },
      { material: 'Soda', qty: 25 },
      { material: 'Dolomite', qty: 30 },
      { material: 'Diphenyl Oxide (NLP)', qty: 0.1 },
      { material: 'Blue Speckles', qty: 1.5 },
      { material: 'Orange Speckles', qty: 1.5 },
      { material: 'Green Speckles', qty: 1.5 },
      { material: 'Multi Mogra (Perfume)', qty: 0.2 },
      { material: 'Bag 25 kg Packing', qty: 8 },
    ],
  },
]

export const tallyProductionData = [
  {
    date: '2026-04-25',
    batch_code: 'BATCH-2026-04-25-MPL-001',
    quantity_produced: 200,
    notes: 'Initial production batch',
  },
]

export const tallyDispatchData = [
  {
    date: '2026-04-27',
    customer: 'Distributor A',
    product: 'MPL',
    quantity: 100,
    notes: 'Regular weekly dispatch',
  },
]
