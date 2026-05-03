'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Download, Home, Calendar, ChevronLeft, ChevronRight,
  Factory, Truck, Package, BarChart3, RefreshCw
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { 
  format, startOfDay, endOfDay, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, addDays, subDays, addWeeks, 
  subWeeks, addMonths, subMonths, eachDayOfInterval, 
  parseISO
} from 'date-fns'
import * as XLSX from 'xlsx'

type ViewMode = 'daily' | 'weekly' | 'monthly'

interface RawMaterial {
  id: string
  name: string
  unit: string
  current_stock: number
}

interface Product {
  id: string
  name: string
  type: string
}

interface Batch {
  id: string
  batch_code: string
  product_id: string
  quantity_per_batch: number
}

interface DailyProduction {
  id: string
  batch_id: string
  production_date: string
  quantity_produced: number | null
  quantity_calculated: number | null
  notes: string | null
}

interface DispatchRecord {
  id: string
  product_id: string
  batch_id: string | null
  quantity_dispatched: number
  customer_name: string
  dispatch_date: string
}

interface BOMItem {
  id: string
  batch_id: string
  raw_material_id: string
  quantity_required: number
}

interface DaySummary {
  date: string
  batchCount: number
  totalProduced: number
  totalDispatched: number
  batches: string[]
}

export default function Reports() {
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('daily')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'overview' | 'stock-journal' | 'batch-details'>('overview')
  
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [production, setProduction] = useState<DailyProduction[]>([])
  const [dispatch, setDispatch] = useState<DispatchRecord[]>([])
  const [bom, setBom] = useState<BOMItem[]>([])
  const [daySummaries, setDaySummaries] = useState<DaySummary[]>([])

  useEffect(() => {
    loadData()
  }, [viewMode, selectedDate])

  function getDateRange(): { start: string; end: string; label: string } {
    switch (viewMode) {
      case 'daily':
        return {
          start: format(startOfDay(selectedDate), 'yyyy-MM-dd'),
          end: format(endOfDay(selectedDate), 'yyyy-MM-dd'),
          label: format(selectedDate, 'EEEE, dd MMMM yyyy')
        }
      case 'weekly':
        return {
          start: format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          label: `Week of ${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd MMM')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'dd MMM yyyy')}`
        }
      case 'monthly':
        return {
          start: format(startOfMonth(selectedDate), 'yyyy-MM-dd'),
          end: format(endOfMonth(selectedDate), 'yyyy-MM-dd'),
          label: format(selectedDate, 'MMMM yyyy')
        }
      default:
        return {
          start: format(startOfDay(selectedDate), 'yyyy-MM-dd'),
          end: format(endOfDay(selectedDate), 'yyyy-MM-dd'),
          label: format(selectedDate, 'dd MMM yyyy')
        }
    }
  }

  function navigatePrev() {
    switch (viewMode) {
      case 'daily': setSelectedDate(subDays(selectedDate, 1)); break
      case 'weekly': setSelectedDate(subWeeks(selectedDate, 1)); break
      case 'monthly': setSelectedDate(subMonths(selectedDate, 1)); break
    }
  }

  function navigateNext() {
    switch (viewMode) {
      case 'daily': setSelectedDate(addDays(selectedDate, 1)); break
      case 'weekly': setSelectedDate(addWeeks(selectedDate, 1)); break
      case 'monthly': setSelectedDate(addMonths(selectedDate, 1)); break
    }
  }

  async function loadData() {
    try {
      setLoading(true)
      const supabase = createClient()
      const { start, end } = getDateRange()

      const [
        { data: materials },
        { data: prods },
        { data: bats },
        { data: prodRecords },
        { data: dispRecords },
        { data: bomData },
      ] = await Promise.all([
        supabase.from('raw_materials').select('*').order('name'),
        supabase.from('products').select('*'),
        supabase.from('batches').select('*'),
        supabase.from('daily_production').select('*')
          .gte('production_date', start)
          .lte('production_date', end)
          .order('production_date', { ascending: true }),
        supabase.from('dispatch_records').select('*')
          .gte('dispatch_date', start)
          .lte('dispatch_date', end)
          .order('dispatch_date', { ascending: true }),
        supabase.from('bom').select('*'),
      ])

      setRawMaterials(materials || [])
      setProducts(prods || [])
      setBatches(bats || [])
      setProduction(prodRecords || [])
      setDispatch(dispRecords || [])
      setBom(bomData || [])
      
      if (viewMode !== 'daily') {
        const startDate = parseISO(start)
        const endDate = parseISO(end)
        const days = eachDayOfInterval({ start: startDate, end: endDate })
        
        const summaries = days.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd')
          const dayProduction = (prodRecords || []).filter(p => p.production_date === dayStr)
          const dayDispatch = (dispRecords || []).filter(d => d.dispatch_date === dayStr)
          
          return {
            date: dayStr,
            batchCount: dayProduction.length,
            totalProduced: dayProduction.reduce((sum, p) => sum + (p.quantity_produced || 0), 0),
            totalDispatched: dayDispatch.reduce((sum, d) => sum + d.quantity_dispatched, 0),
            batches: dayProduction.map(p => {
              const batch = (bats || []).find(b => b.id === p.batch_id)
              return batch?.batch_code || 'N/A'
            })
          }
        })
        setDaySummaries(summaries)
      }
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  function getBatchCode(batchId: string): string {
    return batches.find(b => b.id === batchId)?.batch_code || 'N/A'
  }

  function getProductName(productId: string): string {
    return products.find(p => p.id === productId)?.name || 'N/A'
  }

  function getMaterialName(materialId: string): string {
    return rawMaterials.find(m => m.id === materialId)?.name || 'Unknown'
  }

  function calculateMaterialConsumption(): Record<string, { opening: number; consumed: number; inward: number; closing: number }> {
    const consumption: Record<string, { opening: number; consumed: number; inward: number; closing: number }> = {}
    
    rawMaterials.forEach(mat => {
      consumption[mat.id] = { opening: mat.current_stock, consumed: 0, inward: 0, closing: mat.current_stock }
    })
    
    production.forEach(prod => {
      const batch = batches.find(b => b.id === prod.batch_id)
      const batchBom = bom.filter(b => b.batch_id === prod.batch_id)
      const qtyProduced = prod.quantity_produced || 0
      
      if (batch && qtyProduced > 0 && batch.quantity_per_batch > 0) {
        const numBatches = qtyProduced / batch.quantity_per_batch
        batchBom.forEach(item => {
          if (consumption[item.raw_material_id]) {
            const consumed = item.quantity_required * numBatches
            consumption[item.raw_material_id].consumed += consumed
            consumption[item.raw_material_id].closing -= consumed
          }
        })
      }
    })
    
    return consumption
  }

  function calculateSummary() {
    const totalProduced = production.reduce((sum, p) => sum + (p.quantity_produced || 0), 0)
    const totalDispatched = dispatch.reduce((sum, d) => sum + d.quantity_dispatched, 0)
    const totalBatches = new Set(production.map(p => p.batch_id)).size
    return { totalProduced, totalDispatched, totalBatches }
  }

  async function exportToExcel() {
    try {
      const { start, label } = getDateRange()
      const summary = calculateSummary()
      const materialConsumption = calculateMaterialConsumption()
      
      const wb = XLSX.utils.book_new()

      const summaryData = [
        ['PRODUCTION REPORT - ' + label.toUpperCase()],
        ['Generated', format(new Date(), 'dd MMM yyyy HH:mm')],
        [],
        ['SUMMARY'],
        ['Total Batches', summary.totalBatches],
        ['Total Produced (kg)', summary.totalProduced.toFixed(2)],
        ['Total Dispatched (kg)', summary.totalDispatched.toFixed(2)],
        ['Balance (kg)', (summary.totalProduced - summary.totalDispatched).toFixed(2)],
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary')

      const prodData: (string | number)[][] = [['Date', 'Batch Code', 'Product', 'Qty Produced', 'Notes']]
      production.forEach(p => {
        const batch = batches.find(b => b.id === p.batch_id)
        const product = batch ? products.find(pr => pr.id === batch.product_id) : null
        prodData.push([p.production_date, getBatchCode(p.batch_id), product?.name || 'N/A', (p.quantity_produced || 0).toFixed(2), p.notes || '-'])
      })
      const prodSheet = XLSX.utils.aoa_to_sheet(prodData)
      XLSX.utils.book_append_sheet(wb, prodSheet, 'Production')

      const stockData: (string | number)[][] = [['Material', 'Unit', 'Opening', 'Inward', 'Consumed', 'Closing']]
      rawMaterials.forEach(mat => {
        const c = materialConsumption[mat.id]
        stockData.push([mat.name, mat.unit, c.opening.toFixed(2), c.inward.toFixed(2), c.consumed.toFixed(2), c.closing.toFixed(2)])
      })
      const stockSheet = XLSX.utils.aoa_to_sheet(stockData)
      XLSX.utils.book_append_sheet(wb, stockSheet, 'Stock Journal')

      const filename = `Report_${viewMode}_${format(parseISO(start), 'dd-MMM-yyyy')}.xlsx`
      XLSX.writeFile(wb, filename)
    } catch (err) {
      console.error('Error exporting:', err)
      alert('Failed to export')
    }
  }

  const { label } = getDateRange()
  const summary = calculateSummary()
  const materialConsumption = calculateMaterialConsumption()

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
              <Home className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span className="font-semibold">Reports</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Production Reports</h1>
          <p className="text-muted-foreground mt-2">View daily, weekly, and monthly production records</p>
        </div>

        <div className="glass-card p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              {(['daily', 'weekly', 'monthly'] as ViewMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === mode ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={navigatePrev} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg min-w-[250px] justify-center">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{label}</span>
              </div>
              <button onClick={navigateNext} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
              <button onClick={() => setSelectedDate(new Date())} className="px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors">
                Today
              </button>
            </div>

            <div className="flex-1" />

            <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 transition-colors">
              <Download className="w-4 h-4" />
              Export Excel
            </button>
            <Link href="/production-sheet" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <Download className="w-4 h-4" />
              A3 Sheet (Optimized)
            </Link>
            <Link href="/export" className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 transition-colors">
              <Download className="w-4 h-4" />
              Legacy A3 PDF
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10"><Factory className="w-5 h-5 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Batches</p>
                <p className="text-2xl font-bold text-foreground">{summary.totalBatches}</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10"><Package className="w-5 h-5 text-accent" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Produced</p>
                <p className="text-2xl font-bold text-foreground">{summary.totalProduced.toFixed(2)} kg</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10"><Truck className="w-5 h-5 text-success" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Dispatched</p>
                <p className="text-2xl font-bold text-foreground">{summary.totalDispatched.toFixed(2)} kg</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10"><BarChart3 className="w-5 h-5 text-warning" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Balance</p>
                <p className="text-2xl font-bold text-foreground">{(summary.totalProduced - summary.totalDispatched).toFixed(2)} kg</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mb-4 border-b border-border">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'stock-journal', label: 'Stock Journal', icon: Package },
            { id: 'batch-details', label: 'Batch Details', icon: Factory },
          ].map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-all ${
                  activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground mt-4">Loading data...</p>
          </div>
        ) : (
          <div className="glass-card p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {viewMode !== 'daily' && (
                  <div>
                    <h3 className="font-semibold mb-4 text-foreground">Day-by-Day Summary</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-primary text-primary-foreground">
                            <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                            <th className="px-4 py-2 text-center text-sm font-semibold">Batches</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold">Produced (kg)</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold">Dispatched (kg)</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold">Batch Codes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {daySummaries.map((day, i) => (
                            <tr key={day.date} className={i % 2 === 0 ? 'bg-muted/30' : 'bg-background'}>
                              <td className="px-4 py-2 text-sm font-medium">{format(parseISO(day.date), 'EEE, dd MMM')}</td>
                              <td className="px-4 py-2 text-sm text-center">{day.batchCount}</td>
                              <td className="px-4 py-2 text-sm text-right text-primary font-medium">{day.totalProduced.toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm text-right text-accent">{day.totalDispatched.toFixed(2)}</td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">{day.batches.length > 0 ? day.batches.join(', ') : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-muted font-semibold">
                            <td className="px-4 py-2 text-sm">Total</td>
                            <td className="px-4 py-2 text-sm text-center">{summary.totalBatches}</td>
                            <td className="px-4 py-2 text-sm text-right text-primary">{summary.totalProduced.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-right text-accent">{summary.totalDispatched.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm">-</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-4 text-foreground">Production Records</h3>
                  {production.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No production records for this period</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-primary text-primary-foreground">
                            <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold">Batch</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold">Product</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold">Qty Produced</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {production.map((p, i) => {
                            const batch = batches.find(b => b.id === p.batch_id)
                            const product = batch ? products.find(pr => pr.id === batch.product_id) : null
                            return (
                              <tr key={p.id} className={i % 2 === 0 ? 'bg-muted/30' : 'bg-background'}>
                                <td className="px-4 py-2 text-sm">{p.production_date}</td>
                                <td className="px-4 py-2 text-sm font-medium">{getBatchCode(p.batch_id)}</td>
                                <td className="px-4 py-2 text-sm">{product?.name || 'N/A'}</td>
                                <td className="px-4 py-2 text-sm text-right font-medium text-primary">{(p.quantity_produced || 0).toFixed(2)} kg</td>
                                <td className="px-4 py-2 text-sm text-muted-foreground">{p.notes || '-'}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold mb-4 text-foreground">Dispatch Records</h3>
                  {dispatch.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No dispatch records for this period</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-accent text-accent-foreground">
                            <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold">Batch</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold">Product</th>
                            <th className="px-4 py-2 text-right text-sm font-semibold">Qty Dispatched</th>
                            <th className="px-4 py-2 text-left text-sm font-semibold">Customer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dispatch.map((d, i) => (
                            <tr key={d.id} className={i % 2 === 0 ? 'bg-muted/30' : 'bg-background'}>
                              <td className="px-4 py-2 text-sm">{d.dispatch_date}</td>
                              <td className="px-4 py-2 text-sm font-medium">{d.batch_id ? getBatchCode(d.batch_id) : 'N/A'}</td>
                              <td className="px-4 py-2 text-sm">{getProductName(d.product_id)}</td>
                              <td className="px-4 py-2 text-sm text-right font-medium text-accent">{d.quantity_dispatched.toFixed(2)} kg</td>
                              <td className="px-4 py-2 text-sm">{d.customer_name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'stock-journal' && (
              <div>
                <h3 className="font-semibold mb-4 text-foreground">Raw Material Stock Journal</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-primary text-primary-foreground">
                        <th className="px-4 py-2 text-left text-sm font-semibold">Material</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold">Unit</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Opening</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Inward</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Consumed</th>
                        <th className="px-4 py-2 text-right text-sm font-semibold">Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rawMaterials.map((mat, i) => {
                        const c = materialConsumption[mat.id] || { opening: 0, consumed: 0, inward: 0, closing: 0 }
                        return (
                          <tr key={mat.id} className={i % 2 === 0 ? 'bg-muted/30' : 'bg-background'}>
                            <td className="px-4 py-2 text-sm font-medium">{mat.name}</td>
                            <td className="px-4 py-2 text-sm">{mat.unit}</td>
                            <td className="px-4 py-2 text-sm text-right">{c.opening.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-right text-success">{c.inward.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-right text-destructive">{c.consumed.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-right font-semibold">{c.closing.toFixed(2)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'batch-details' && (
              <div className="space-y-6">
                <h3 className="font-semibold text-foreground">Batch-wise Material Consumption</h3>
                {production.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No batch production records for this period</p>
                ) : (
                  [...new Set(production.map(p => p.batch_id))].map(batchId => {
                    const batch = batches.find(b => b.id === batchId)
                    const batchProduction = production.filter(p => p.batch_id === batchId)
                    const totalProduced = batchProduction.reduce((sum, p) => sum + (p.quantity_produced || 0), 0)
                    const batchBom = bom.filter(b => b.batch_id === batchId)
                    const product = batch ? products.find(p => p.id === batch.product_id) : null
                    
                    return (
                      <div key={batchId} className="border border-border rounded-lg overflow-hidden">
                        <div className="p-4 bg-muted/50 border-b border-border">
                          <h4 className="font-semibold text-foreground">Batch: {batch?.batch_code || 'N/A'}</h4>
                          <p className="text-sm text-muted-foreground">{product?.name} | Total Produced: {totalProduced.toFixed(2)} kg</p>
                        </div>
                        {batchBom.length === 0 ? (
                          <div className="p-4 text-muted-foreground text-sm">No BOM configured for this batch</div>
                        ) : (
                          <table className="w-full">
                            <thead>
                              <tr className="bg-muted/30">
                                <th className="px-4 py-2 text-left text-sm font-medium">Material</th>
                                <th className="px-4 py-2 text-left text-sm font-medium">Unit</th>
                                <th className="px-4 py-2 text-right text-sm font-medium">Qty/Batch</th>
                                <th className="px-4 py-2 text-right text-sm font-medium">Total Used</th>
                              </tr>
                            </thead>
                            <tbody>
                              {batchBom.map((item, i) => {
                                const numBatches = batch && batch.quantity_per_batch > 0 ? totalProduced / batch.quantity_per_batch : 0
                                const totalUsed = item.quantity_required * numBatches
                                const material = rawMaterials.find(m => m.id === item.raw_material_id)
                                return (
                                  <tr key={item.id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                    <td className="px-4 py-2 text-sm">{getMaterialName(item.raw_material_id)}</td>
                                    <td className="px-4 py-2 text-sm">{material?.unit || 'kg'}</td>
                                    <td className="px-4 py-2 text-sm text-right">{item.quantity_required.toFixed(2)}</td>
                                    <td className="px-4 py-2 text-sm text-right font-medium text-primary">{totalUsed.toFixed(2)}</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
