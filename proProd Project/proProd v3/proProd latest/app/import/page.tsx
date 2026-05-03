'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Home, Upload, Download, Package } from 'lucide-react'
import * as XLSX from 'xlsx'
import { batchDataImport } from '@/lib/batch-data-import'

export default function ImportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [preview, setPreview] = useState<any[]>([])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      setMessage(null)
      const reader = new FileReader()

      reader.onload = async (event) => {
        try {
          const data = event.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          if (jsonData.length === 0) {
            setMessage({ type: 'error', text: 'Excel file is empty' })
            setLoading(false)
            return
          }

          // Parse Tally format: Date | Particulars | Vch Type | Vch No | Inwards | Outwards
          const materialsMap = new Map<string, { unit: string; quantity: number }>()
          
          jsonData.forEach((row: any) => {
            // Get the particulars (material name) from various possible column names
            const particulars = row['Particulars'] || row['particulars'] || ''
            const inwards = parseFloat(row['Inwards'] || row['inwards'] || 0)
            const outwards = parseFloat(row['Outwards'] || row['outwards'] || 0)

            // Extract quantity and unit from particulars (e.g., "SALT 210.000 KGS" -> name, qty, unit)
            if (particulars && typeof particulars === 'string') {
              const material = particulars.trim()
              
              // Check if this row has inwards quantity (raw material consumption)
              if (inwards > 0 && material) {
                // Extract unit from the particulars field if it contains it
                const unitMatch = material.match(/(KGS|KG|LTR|LITERS|LITER|PCS|PIECES|BOXES?|NO\.?)$/i)
                const unit = unitMatch ? unitMatch[1].toUpperCase().replace(/\.$/, '') : 'KGS'
                
                // Store the material and its quantity
                if (!materialsMap.has(material)) {
                  materialsMap.set(material, { unit, quantity: inwards })
                } else {
                  const existing = materialsMap.get(material)!
                  existing.quantity += inwards
                }
              }
            }
          })

          // Show preview
          const previewData = Array.from(materialsMap.entries()).slice(0, 5).map(([name, data]) => ({
            'Material Name': name,
            'Unit': data.unit,
            'Quantity': data.quantity,
          }))
          setPreview(previewData)

          if (materialsMap.size === 0) {
            setMessage({ type: 'error', text: 'No valid materials found in file. Check Tally export format.' })
            setLoading(false)
            return
          }

          // Import to Supabase
          const supabase = createClient()
          const materialsToImport: any[] = []

          materialsMap.forEach((data, materialName) => {
            // Clean up material name (remove quantity and unit suffix)
            let cleanName = materialName
            const cleanMatch = materialName.match(/^(.*?)\s+[\d.]+\s+(KGS?|LTR|LITERS?|PCS|PIECES|BOXES?|NO\.?)$/i)
            if (cleanMatch) {
              cleanName = cleanMatch[1].trim()
            }

            materialsToImport.push({
              name: cleanName,
              unit: data.unit,
              current_stock: data.quantity,
              reorder_level: 0,
              supplier: 'Imported from Tally ERP 9',
            })
          })

          // Insert into database
          const { error } = await supabase.from('raw_materials').insert(materialsToImport)

          if (error) {
            throw error
          }

          setMessage({
            type: 'success',
            text: `Successfully imported ${materialsToImport.length} raw materials from Tally ERP 9 Stock Journal!`,
          })
          setPreview([])
          if (fileInputRef.current) fileInputRef.current.value = ''
        } catch (err) {
          console.error('Error:', err)
          setMessage({
            type: 'error',
            text: 'Failed to import data. Ensure your file is Tally ERP 9 Stock Journal export.',
          })
        }
      }

      reader.readAsBinaryString(file)
    } finally {
      setLoading(false)
    }
  }

  async function importBatchData() {
    try {
      setLoading(true)
      setMessage(null)
      const supabase = createClient()

      // Get all products or create them
      const productNames = [...new Set(batchDataImport.map(b => b.product))]
      const productMap = new Map()

      for (const productName of productNames) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('name', productName)
          .limit(1)

        if (existing && existing.length > 0) {
          productMap.set(productName, existing[0].id)
        } else {
          const batchInfo = batchDataImport.find(b => b.product === productName)
          const { data: newProduct, error: prodError } = await supabase
            .from('products')
            .insert({
              name: productName,
              type: batchInfo?.type || 'Powder',
              description: batchInfo?.description || `Batch for ${productName}`,
            })
            .select()
          
          if (newProduct && newProduct.length > 0) {
            productMap.set(productName, newProduct[0].id)
          } else if (prodError) {
            console.error('Product creation error:', prodError)
          }
        }
      }

      // Import batches and their BOM
      let batchCount = 0
      for (const batch of batchDataImport) {
        const productId = productMap.get(batch.product)
        if (!productId) continue

        const { data: newBatch, error: batchError } = await supabase
          .from('batches')
          .insert({
            batch_code: `BATCH-${batch.vch}`,
            product_id: productId,
            quantity_per_batch: batch.quantity_per_batch,
            unit: batch.unit,
            description: `Vch ${batch.vch} - ${batch.date}`,
          })
          .select()

        if (newBatch && newBatch.length > 0 && batch.raw_materials.length > 0) {
          batchCount++
          
          // Get raw materials
          const { data: materials } = await supabase
            .from('raw_materials')
            .select('id, name')

          // Link raw materials to batch (BOM)
          const bomData = batch.raw_materials
            .map(rm => {
              const material = materials?.find(m => 
                m.name.toLowerCase() === rm.name.toLowerCase()
              )
              if (!material) {
                console.log(`Material not found: ${rm.name}`)
                return null
              }
              return {
                batch_id: newBatch[0].id,
                raw_material_id: material.id,
                quantity_required: rm.qty,
              }
            })
            .filter(Boolean)

          if (bomData.length > 0) {
            await supabase.from('batch_bom').insert(bomData)
          }
        }
      }

      setMessage({
        type: 'success',
        text: `Successfully imported ${batchCount} batches with complete BOM data!`,
      })
    } catch (err) {
      console.error('Error:', err)
      setMessage({
        type: 'error',
        text: 'Failed to import batch data. Please try again.',
      })
    } finally {
      setLoading(false)
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
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Import Stock Journal</h2>
          <p className="text-gray-600 mb-8">Import raw materials from Tally ERP 9 Excel export</p>

          <div className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 p-8">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Excel File</h3>
              <p className="text-sm text-gray-600 mb-6">
                Select your Tally ERP 9 Stock Journal export file
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={loading}
                className="hidden"
              />
              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Importing...' : 'Choose File'}
                </button>
                <button
                  onClick={importBatchData}
                  disabled={loading}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  <Package className="w-4 h-4" /> Import Batch Data (8 Batches)
                </button>
              </div>
            </div>

            {message && (
              <div
                className={`mt-6 p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                {message.text}
              </div>
            )}

            {preview.length > 0 && (
              <div className="mt-8">
                <h4 className="font-semibold text-gray-900 mb-4">Preview (First 5 rows)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {Object.keys(preview[0]).map((key) => (
                          <th key={key} className="px-4 py-2 text-left text-gray-900 font-medium">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {preview.map((row, i) => (
                        <tr key={i}>
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-4 py-2 text-gray-600">
                              {String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Tally ERP 9 Stock Journal Export</h4>
              <p className="text-sm text-blue-800 mb-2">
                Export your Stock Journal from Tally ERP 9 with these columns:
              </p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4">
                <li>• <strong>Date</strong> - Transaction date</li>
                <li>• <strong>Particulars</strong> - Material name (e.g., "SALT", "SODA", "GREEN SPECKLES")</li>
                <li>• <strong>Vch Type</strong> - Voucher type</li>
                <li>• <strong>Vch No.</strong> - Voucher number</li>
                <li>• <strong>Inwards</strong> - Quantity received/consumed</li>
                <li>• <strong>Outwards</strong> - Quantity dispatched</li>
              </ul>
              <p className="text-sm text-blue-800 mt-3">
                The import will extract raw materials with their consumed quantities as opening stock.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
