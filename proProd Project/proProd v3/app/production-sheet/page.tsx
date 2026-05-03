'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Home, Printer, Download } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import batchData from '@/lib/batch-data.json'

interface PageLayout {
  id: 'single-batch' | 'single-day' | 'custom'
  label: string
  description: string
}

const pageLayouts: PageLayout[] = [
  {
    id: 'single-batch',
    label: 'One Batch Per Page',
    description: 'Each batch fits on a single A3 page'
  },
  {
    id: 'single-day',
    label: 'One Day Per Page',
    description: 'All production, inward, outward & dispatch for a day on one page'
  },
  {
    id: 'custom',
    label: 'Custom Pages',
    description: 'Choose how many pages to fit data on'
  }
]

export default function ProductionSheet() {
  const [selectedLayout, setSelectedLayout] = useState<'single-batch' | 'single-day' | 'custom'>('single-batch')
  const [customPages, setCustomPages] = useState('2')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [batches, setBatches] = useState<any[]>([])
  const [production, setProduction] = useState<any[]>([])
  const [dispatch, setDispatch] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [selectedDate])

  async function loadData() {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const [{ data: bats }, { data: prod }, { data: disp }] = await Promise.all([
        supabase.from('batches').select('*').order('batch_code'),
        supabase.from('daily_production').select('*').eq('production_date', selectedDate),
        supabase.from('dispatch_records').select('*').eq('dispatch_date', selectedDate)
      ])
      
      setBatches(bats || [])
      setProduction(prod || [])
      setDispatch(disp || [])
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  const getBatchDetails = (batchId: string) => {
    return batches.find(b => b.id === batchId)
  }

  const sampleBatch = batchData.batches[0]

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur no-print">
        <div className="p-6 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4">
            <Home className="w-4 h-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Production Sheet A3 Export</h1>
          <p className="text-muted-foreground mt-1">Optimized printing for A3 paper size</p>
        </div>
      </header>

      <main className="no-print p-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Page Layout</h2>
            <div className="space-y-3">
              {pageLayouts.map(layout => (
                <label key={layout.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="layout"
                    value={layout.id}
                    checked={selectedLayout === layout.id}
                    onChange={(e) => setSelectedLayout(e.target.value as typeof selectedLayout)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{layout.label}</p>
                    <p className="text-sm text-muted-foreground">{layout.description}</p>
                  </div>
                </label>
              ))}
            </div>

            {selectedLayout === 'custom' && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <label className="block text-sm font-medium text-foreground mb-2">Number of Pages</label>
                <select
                  value={customPages}
                  onChange={(e) => setCustomPages(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="1">1 Page</option>
                  <option value="2">2 Pages</option>
                  <option value="3">3 Pages</option>
                  <option value="4">4 Pages</option>
                  <option value="5">5 Pages</option>
                </select>
              </div>
            )}
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Date Selection</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Production Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print / Save as PDF
              </button>
              <button
                onClick={() => window.location.href = `/production-sheet?print=1&layout=${selectedLayout}&date=${selectedDate}`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
          <p>Preview will be generated based on selected layout. Use Ctrl+P (Cmd+P) or the Print button to export as PDF with A3 page size.</p>
        </div>
      </main>

      {/* PRINT VIEW */}
      <div className="print:block hidden">
        {selectedLayout === 'single-batch' && (
          <div className="space-y-0">
            {batchData.batches.map((batch, idx) => (
              <div key={idx} className="page-break p-8 min-h-screen" style={{ pageBreakAfter: 'always' }}>
                <ProductionBatchSheet batch={batch} />
              </div>
            ))}
          </div>
        )}

        {selectedLayout === 'single-day' && (
          <div className="page-break p-8 min-h-screen" style={{ pageBreakAfter: 'always' }}>
            <ProductionDaySheet date={selectedDate} />
          </div>
        )}

        {selectedLayout === 'custom' && (
          <div className="space-y-0">
            {Array.from({ length: parseInt(customPages) }).map((_, idx) => (
              <div key={idx} className="page-break p-8 min-h-screen" style={{ pageBreakAfter: 'always' }}>
                <CustomPageLayout pageNum={idx + 1} totalPages={parseInt(customPages)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @media print {
          @page {
            size: A3 landscape;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>
    </div>
  )
}

function ProductionBatchSheet({ batch }: any) {
  const dateStr = batch.date || new Date().toISOString().split('T')[0]
  
  return (
    <div className="print:text-black print:bg-white">
      <div className="border-b-2 border-black pb-3 mb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-2xl font-bold">{batch.name}</h1>
            <p className="text-sm text-gray-600">{batch.vch}</p>
          </div>
          <div className="text-right">
            <p className="text-sm"><strong>Date:</strong> {dateStr}</p>
            <p className="text-sm"><strong>Generated:</strong> {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-bold mb-3 border-b pb-2">Raw Materials & Components</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black px-3 py-2 text-left font-bold">S.No</th>
              <th className="border border-black px-3 py-2 text-left font-bold">Material / Component</th>
              <th className="border border-black px-3 py-2 text-center font-bold">Unit</th>
              <th className="border border-black px-3 py-2 text-right font-bold">Qty Required</th>
              <th className="border border-black px-3 py-2 text-right font-bold">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {batch.materials.map((mat: any, idx: number) => (
              <tr key={idx}>
                <td className="border border-black px-3 py-2">{idx + 1}</td>
                <td className="border border-black px-3 py-2">{mat.name}</td>
                <td className="border border-black px-3 py-2 text-center">{mat.unit}</td>
                <td className="border border-black px-3 py-2 text-right font-semibold">{mat.qty.toFixed(3)}</td>
                <td className="border border-black px-3 py-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-3 gap-6 mt-8">
        <div className="p-4 border border-black">
          <p className="text-xs font-bold mb-8">Prepared By</p>
          <p className="h-12 border-t border-black mt-8"></p>
          <p className="text-xs text-center">Signature</p>
        </div>
        <div className="p-4 border border-black">
          <p className="text-xs font-bold mb-8">Verified By</p>
          <p className="h-12 border-t border-black mt-8"></p>
          <p className="text-xs text-center">Signature</p>
        </div>
        <div className="p-4 border border-black">
          <p className="text-xs font-bold mb-8">Approved By</p>
          <p className="h-12 border-t border-black mt-8"></p>
          <p className="text-xs text-center">Signature</p>
        </div>
      </div>
    </div>
  )
}

function ProductionDaySheet({ date }: any) {
  return (
    <div className="print:text-black print:bg-white">
      <div className="border-b-2 border-black pb-3 mb-4">
        <h1 className="text-2xl font-bold">Daily Production Report</h1>
        <p className="text-sm text-gray-600">DARKDESIRE Production Management System</p>
        <div className="flex justify-between items-end mt-2">
          <p className="text-sm"><strong>Date:</strong> {format(parseISO(date), 'EEEE, dd MMMM yyyy')}</p>
          <p className="text-sm"><strong>Generated:</strong> {format(new Date(), 'dd MMM yyyy HH:mm')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 border border-black bg-gray-100">
          <p className="text-xs font-bold">Production Summary</p>
          <p className="text-sm mt-2">Total Batches: <span className="font-bold">__________</span></p>
          <p className="text-sm">Total Produced: <span className="font-bold">__________ kg</span></p>
        </div>
        <div className="p-3 border border-black bg-gray-100">
          <p className="text-xs font-bold">Dispatch Summary</p>
          <p className="text-sm mt-2">Total Orders: <span className="font-bold">__________</span></p>
          <p className="text-sm">Total Dispatched: <span className="font-bold">__________ kg</span></p>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-3 border-b pb-2">Production Records</h2>
      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-black px-2 py-2 text-left font-bold">Batch Code</th>
            <th className="border border-black px-2 py-2 text-left font-bold">Product</th>
            <th className="border border-black px-2 py-2 text-right font-bold">Qty (kg)</th>
            <th className="border border-black px-2 py-2 text-left font-bold">Notes</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4].map(i => (
            <tr key={i}>
              <td className="border border-black px-2 py-1 h-5"></td>
              <td className="border border-black px-2 py-1"></td>
              <td className="border border-black px-2 py-1 text-right"></td>
              <td className="border border-black px-2 py-1"></td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-lg font-bold mb-3 border-b pb-2">Inward / Outward Records</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-black px-2 py-2 text-left font-bold">Type</th>
            <th className="border border-black px-2 py-2 text-left font-bold">Item</th>
            <th className="border border-black px-2 py-2 text-center font-bold">Qty</th>
            <th className="border border-black px-2 py-2 text-left font-bold">Ref/Details</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4].map(i => (
            <tr key={i}>
              <td className="border border-black px-2 py-1 h-5"></td>
              <td className="border border-black px-2 py-1"></td>
              <td className="border border-black px-2 py-1 text-center"></td>
              <td className="border border-black px-2 py-1"></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="p-4 border border-black">
          <p className="text-xs font-bold mb-8">Prepared By</p>
          <p className="h-12 border-t border-black mt-8"></p>
          <p className="text-xs text-center">Signature</p>
        </div>
        <div className="p-4 border border-black">
          <p className="text-xs font-bold mb-8">Approved By</p>
          <p className="h-12 border-t border-black mt-8"></p>
          <p className="text-xs text-center">Signature</p>
        </div>
      </div>
    </div>
  )
}

function CustomPageLayout({ pageNum, totalPages }: any) {
  return (
    <div className="print:text-black print:bg-white">
      <div className="border-b-2 border-black pb-2 mb-4">
        <h1 className="text-xl font-bold">Production & Dispatch Report</h1>
        <p className="text-xs">DARKDESIRE Production Management | Page {pageNum} of {totalPages}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <table className="text-xs w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black px-2 py-1 text-left font-bold">Batch Code</th>
              <th className="border border-black px-2 py-1 text-right font-bold">Qty</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <tr key={i}>
                <td className="border border-black px-2 py-1 h-4"></td>
                <td className="border border-black px-2 py-1 h-4 text-right"></td>
              </tr>
            ))}
          </tbody>
        </table>
        <table className="text-xs w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black px-2 py-1 text-left font-bold">Customer</th>
              <th className="border border-black px-2 py-1 text-right font-bold">Qty</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <tr key={i}>
                <td className="border border-black px-2 py-1 h-4"></td>
                <td className="border border-black px-2 py-1 h-4 text-right"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="text-xs font-bold border-b mb-2">Raw Material Stock</h3>
      <table className="text-xs w-full">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-black px-2 py-1 text-left font-bold">Material</th>
            <th className="border border-black px-2 py-1 text-right font-bold">Opening</th>
            <th className="border border-black px-2 py-1 text-right font-bold">Consumed</th>
            <th className="border border-black px-2 py-1 text-right font-bold">Closing</th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <tr key={i}>
              <td className="border border-black px-2 py-1 h-4"></td>
              <td className="border border-black px-2 py-1 h-4 text-right"></td>
              <td className="border border-black px-2 py-1 h-4 text-right"></td>
              <td className="border border-black px-2 py-1 h-4 text-right"></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="grid grid-cols-3 gap-4 mt-8 text-xs">
        <div className="p-2 border border-black">
          <p className="font-bold mb-6">Prepared</p>
          <p className="border-t border-black pt-4 h-8"></p>
        </div>
        <div className="p-2 border border-black">
          <p className="font-bold mb-6">Verified</p>
          <p className="border-t border-black pt-4 h-8"></p>
        </div>
        <div className="p-2 border border-black">
          <p className="font-bold mb-6">Approved</p>
          <p className="border-t border-black pt-4 h-8"></p>
        </div>
      </div>
    </div>
  )
}
