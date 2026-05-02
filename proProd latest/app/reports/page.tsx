'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Download, Home } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'stock-journal' | 'batch-production'>('stock-journal')
  const [startDate, setStartDate] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  const [stockJournal, setStockJournal] = useState<any[]>([])
  const [batchProduction, setBatchProduction] = useState<any[]>([])
  const [allMaterials, setAllMaterials] = useState<any[]>([])
  const [allBatches, setAllBatches] = useState<any[]>([])
  const [bomData, setBomData] = useState<Record<string, any[]>>({})

  useEffect(() => {
    loadReportData()
  }, [startDate, endDate])

  async function loadReportData() {
    try {
      setLoading(true)
      const supabase = createClient()

      // Load all base data
      const [
        { data: materials },
        { data: batches },
        { data: production },
        { data: dispatch },
        { data: bom },
      ] = await Promise.all([
        supabase.from('raw_materials').select('*'),
        supabase.from('batches').select('*'),
        supabase.from('daily_production').select('*').gte('production_date', startDate).lte('production_date', endDate),
        supabase.from('dispatch_records').select('*').gte('dispatch_date', startDate).lte('dispatch_date', endDate),
        supabase.from('bom').select('*'),
      ])

      setAllMaterials(materials || [])
      setAllBatches(batches || [])

      // Build BOM lookup
      const bomMap: Record<string, any[]> = {}
      if (bom) {
        bom.forEach((item) => {
          if (!bomMap[item.batch_id]) bomMap[item.batch_id] = []
          bomMap[item.batch_id].push(item)
        })
      }
      setBomData(bomMap)

      // Calculate Stock Journal (Raw Materials Movement)
      const stockData: Record<string, any> = {}
      materials?.forEach((mat) => {
        stockData[mat.id] = {
          ...mat,
          openingStock: mat.current_stock,
          consumed: 0,
          closingStock: mat.current_stock,
        }
      })

      // Calculate consumption from BOM based on production
      // Example: If Soda is 25kg per 200kg batch (batch.quantity_per_batch)
      // And we produce 600kg (3 batches), we consume 25 * 3 = 75kg
      production?.forEach((prod) => {
        const batch = batches?.find((b: any) => b.id === prod.batch_id)
        const batchBom = bomMap[prod.batch_id] || []
        const qtyProduced = prod.quantity_produced || 0
        
        if (batch && qtyProduced > 0) {
          // Number of batches produced = qtyProduced / batch.quantity_per_batch
          const numBatches = qtyProduced / batch.quantity_per_batch
          
          batchBom.forEach((item) => {
            if (stockData[item.raw_material_id]) {
              // consumption = qty_per_batch * number_of_batches
              const consumed = item.quantity_required * numBatches
              stockData[item.raw_material_id].consumed += consumed
              stockData[item.raw_material_id].closingStock -= consumed
            }
          })
        }
      })

      setStockJournal(Object.values(stockData))

      // Build Batch Production Details
      const batchDetails = (production || []).map((prod) => {
        const batch = batches?.find((b) => b.id === prod.batch_id)
        const bom_items = bomMap[prod.batch_id] || []
        return {
          ...prod,
          batch,
          bomItems: bom_items,
          qtyProduced: prod.quantity_produced || 0,
        }
      })

      setBatchProduction(batchDetails)
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function exportToExcel() {
    try {
      const wb = XLSX.utils.book_new()

      if (activeTab === 'stock-journal') {
        // Stock Journal Sheet
        const stockData = [
          ['STOCK JOURNAL REPORT'],
          ['Period', `${startDate} to ${endDate}`],
          [],
          ['Material Name', 'Unit', 'Opening Stock', 'Consumed', 'Closing Stock'],
        ]

        stockJournal.forEach((item) => {
          stockData.push([
            item.name,
            item.unit,
            item.openingStock.toFixed(2),
            item.consumed.toFixed(2),
            item.closingStock.toFixed(2),
          ])
        })

        const sheet = XLSX.utils.aoa_to_sheet(stockData)
        sheet['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
        XLSX.utils.book_append_sheet(wb, sheet, 'Stock Journal')
      } else {
        // Batch Production Details Sheet
        const prodData = [
          ['BATCH PRODUCTION REPORT'],
          ['Period', `${startDate} to ${endDate}`],
          [],
        ]

        batchProduction.forEach((prod) => {
          prodData.push([])
          prodData.push([`Batch: ${prod.batch?.batch_code || 'N/A'}`])
          prodData.push([`Date: ${prod.production_date}`])
          prodData.push([`Quantity Produced: ${prod.qtyProduced}`])
          prodData.push([`Notes: ${prod.notes || '-'}`])
          prodData.push([])
          prodData.push(['Material Name', 'Unit', 'Qty Required Per Batch', 'Total Used', 'Cost per Unit', 'Total Cost'])

          prod.bomItems.forEach((item: any) => {
            const material = allMaterials.find((m) => m.id === item.raw_material_id)
            const totalUsed = item.quantity_required * prod.qtyProduced
            prodData.push([
              material?.name || 'Unknown',
              material?.unit || '-',
              item.quantity_required.toFixed(2),
              totalUsed.toFixed(2),
              '-',
              '-',
            ])
          })
        })

        const sheet = XLSX.utils.aoa_to_sheet(prodData)
        sheet['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
        XLSX.utils.book_append_sheet(wb, sheet, 'Production Details')
      }

      XLSX.writeFile(wb, `Report_${startDate}_to_${endDate}.xlsx`)
    } catch (err) {
      console.error('Error exporting:', err)
      alert('Failed to export')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <Home className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Production & Stock Reports</h2>

          <div className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={exportToExcel}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  <Download className="w-4 h-4" /> Export Excel
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('stock-journal')}
              className={`px-4 py-3 font-medium border-b-2 transition-all ${
                activeTab === 'stock-journal'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Stock Journal (Raw Materials)
            </button>
            <button
              onClick={() => setActiveTab('batch-production')}
              className={`px-4 py-3 font-medium border-b-2 transition-all ${
                activeTab === 'batch-production'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Batch Production Details
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : activeTab === 'stock-journal' ? (
            <div className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 overflow-hidden">
              {stockJournal.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                  No data for selected period
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Material Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unit</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Opening Stock</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Consumed</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Closing Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {stockJournal.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{item.unit}</td>
                        <td className="px-6 py-4 text-right text-sm text-gray-600">{item.openingStock.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-sm text-red-600 font-medium">{item.consumed.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-blue-600">{item.closingStock.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {batchProduction.length === 0 ? (
                <div className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 p-8 text-center text-gray-600">
                  No production records for selected period
                </div>
              ) : (
                batchProduction.map((prod) => (
                  <div key={prod.id} className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <h3 className="font-bold text-gray-900">
                        Batch: {prod.batch?.batch_code || 'N/A'} | Date: {prod.production_date} | Qty: {prod.qtyProduced}
                      </h3>
                    </div>
                    {prod.bomItems.length === 0 ? (
                      <div className="p-6 text-center text-gray-600">
                        No BOM details for this batch
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-blue-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Material Name</th>
                            <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unit</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Qty per Batch</th>
                            <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">Total Used</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {prod.bomItems.map((item: any) => {
                            const material = allMaterials.find((m) => m.id === item.raw_material_id)
                            const totalUsed = item.quantity_required * prod.qtyProduced
                            return (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{material?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">{material?.unit || '-'}</td>
                                <td className="px-6 py-4 text-right text-sm text-gray-600">
                                  {item.quantity_required.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-right text-sm font-semibold text-blue-600">
                                  {totalUsed.toFixed(2)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
