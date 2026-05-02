'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Home, FileText, Download, Calendar, Printer, 
  CheckSquare, Square, ChevronDown, ChevronUp,
  Filter, RefreshCw
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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

interface StockJournalEntry {
  id: string
  raw_material_id: string
  transaction_date: string
  transaction_type: string
  quantity: number
  opening_stock: number
  closing_stock: number
}

type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'custom'

export default function ExportPage() {
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange>('today')
  const [customStartDate, setCustomStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  
  // Data states
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [production, setProduction] = useState<DailyProduction[]>([])
  const [dispatch, setDispatch] = useState<DispatchRecord[]>([])
  const [bom, setBom] = useState<BOMItem[]>([])
  const [stockJournal, setStockJournal] = useState<StockJournalEntry[]>([])
  
  // Selection states
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set())
  const [selectAll, setSelectAll] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadData()
  }, [dateRange, customStartDate, customEndDate])

  function getDateRange(): { start: string; end: string } {
    const today = new Date()
    
    switch (dateRange) {
      case 'today':
        return {
          start: format(startOfDay(today), 'yyyy-MM-dd'),
          end: format(endOfDay(today), 'yyyy-MM-dd')
        }
      case 'yesterday':
        const yesterday = subDays(today, 1)
        return {
          start: format(startOfDay(yesterday), 'yyyy-MM-dd'),
          end: format(endOfDay(yesterday), 'yyyy-MM-dd')
        }
      case 'week':
        return {
          start: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          end: format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
        }
      case 'month':
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd')
        }
      case 'custom':
        return { start: customStartDate, end: customEndDate }
      default:
        return {
          start: format(startOfDay(today), 'yyyy-MM-dd'),
          end: format(endOfDay(today), 'yyyy-MM-dd')
        }
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
        { data: journalData }
      ] = await Promise.all([
        supabase.from('raw_materials').select('*').order('name'),
        supabase.from('products').select('*'),
        supabase.from('batches').select('*'),
        supabase.from('daily_production').select('*')
          .gte('production_date', start)
          .lte('production_date', end)
          .order('production_date', { ascending: false }),
        supabase.from('dispatch_records').select('*')
          .gte('dispatch_date', start)
          .lte('dispatch_date', end)
          .order('dispatch_date', { ascending: false }),
        supabase.from('bom').select('*'),
        supabase.from('raw_material_stock_journal').select('*')
          .gte('transaction_date', start)
          .lte('transaction_date', end)
          .order('transaction_date', { ascending: false })
      ])

      setRawMaterials(materials || [])
      setProducts(prods || [])
      setBatches(bats || [])
      setProduction(prodRecords || [])
      setDispatch(dispRecords || [])
      setBom(bomData || [])
      setStockJournal(journalData || [])
      
      // Select all batches by default
      const allBatchIds = new Set((prodRecords || []).map(p => p.batch_id))
      setSelectedBatches(allBatchIds)
      setSelectAll(true)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  function toggleBatchSelection(batchId: string) {
    const newSelection = new Set(selectedBatches)
    if (newSelection.has(batchId)) {
      newSelection.delete(batchId)
    } else {
      newSelection.add(batchId)
    }
    setSelectedBatches(newSelection)
    setSelectAll(newSelection.size === production.length)
  }

  function toggleSelectAll() {
    if (selectAll) {
      setSelectedBatches(new Set())
    } else {
      setSelectedBatches(new Set(production.map(p => p.batch_id)))
    }
    setSelectAll(!selectAll)
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

  function getMaterialUnit(materialId: string): string {
    return rawMaterials.find(m => m.id === materialId)?.unit || 'kg'
  }

  // Calculate raw material consumption based on production and BOM
  function calculateMaterialConsumption(): Record<string, { opening: number; consumed: number; inward: number; closing: number }> {
    const consumption: Record<string, { opening: number; consumed: number; inward: number; closing: number }> = {}
    
    // Initialize with current stock as opening
    rawMaterials.forEach(mat => {
      consumption[mat.id] = {
        opening: mat.current_stock,
        consumed: 0,
        inward: 0,
        closing: mat.current_stock
      }
    })
    
    // Calculate consumption from selected production records
    const selectedProduction = production.filter(p => selectedBatches.has(p.batch_id))
    
    selectedProduction.forEach(prod => {
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
    
    // Add inward from stock journal
    stockJournal.forEach(entry => {
      if (entry.transaction_type === 'inward' && consumption[entry.raw_material_id]) {
        consumption[entry.raw_material_id].inward += entry.quantity
        consumption[entry.raw_material_id].closing += entry.quantity
      }
    })
    
    return consumption
  }

  // Calculate total production and dispatch quantities
  function calculateSummary() {
    const selectedProduction = production.filter(p => selectedBatches.has(p.batch_id))
    const selectedDispatch = dispatch.filter(d => d.batch_id && selectedBatches.has(d.batch_id))
    
    const totalProduced = selectedProduction.reduce((sum, p) => sum + (p.quantity_produced || 0), 0)
    const totalDispatched = selectedDispatch.reduce((sum, d) => sum + d.quantity_dispatched, 0)
    const totalBatches = new Set(selectedProduction.map(p => p.batch_id)).size
    
    return { totalProduced, totalDispatched, totalBatches }
  }

  async function exportToPDF() {
    setExporting(true)
    try {
      const { start, end } = getDateRange()
      const materialConsumption = calculateMaterialConsumption()
      const summary = calculateSummary()
      const selectedProduction = production.filter(p => selectedBatches.has(p.batch_id))
      const selectedDispatch = dispatch.filter(d => d.batch_id && selectedBatches.has(d.batch_id))

      // Create A3 landscape PDF
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a3'
      })

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 15
      let yPos = margin

      // Helper function for headers
      const addSectionHeader = (text: string) => {
        if (yPos > pageHeight - 40) {
          doc.addPage()
          yPos = margin
        }
        doc.setFillColor(37, 99, 235)
        doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text(text, margin + 5, yPos + 7)
        doc.setTextColor(0, 0, 0)
        yPos += 15
      }

      // Title Section
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, pageWidth, 35, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(24)
      doc.setFont('helvetica', 'bold')
      doc.text('DARKDESIRE - PRODUCTION SHEET', pageWidth / 2, 15, { align: 'center' })
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text(`Period: ${format(new Date(start), 'dd MMM yyyy')} to ${format(new Date(end), 'dd MMM yyyy')}`, pageWidth / 2, 25, { align: 'center' })
      doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, pageWidth / 2, 31, { align: 'center' })
      
      doc.setTextColor(0, 0, 0)
      yPos = 45

      // Summary Section
      addSectionHeader('PRODUCTION SUMMARY')
      
      autoTable(doc, {
        startY: yPos,
        head: [['Total Batches', 'Total Produced (kg)', 'Total Dispatched (kg)', 'Balance (kg)']],
        body: [[
          summary.totalBatches.toString(),
          summary.totalProduced.toFixed(2),
          summary.totalDispatched.toFixed(2),
          (summary.totalProduced - summary.totalDispatched).toFixed(2)
        ]],
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 11, cellPadding: 4 },
        margin: { left: margin, right: margin }
      })
      
      yPos = (doc as any).lastAutoTable.finalY + 10

      // Production Details
      addSectionHeader('PRODUCTION DETAILS')
      
      const productionData = selectedProduction.map(p => {
        const batch = batches.find(b => b.id === p.batch_id)
        const product = batch ? products.find(pr => pr.id === batch.product_id) : null
        return [
          p.production_date,
          getBatchCode(p.batch_id),
          product?.name || 'N/A',
          (p.quantity_produced || 0).toFixed(2),
          (p.quantity_calculated || 0).toFixed(2),
          p.notes || '-'
        ]
      })

      if (productionData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Batch Code', 'Product', 'Qty Produced (kg)', 'Qty Calculated (kg)', 'Notes']],
          body: productionData,
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 3 },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { left: margin, right: margin }
        })
        yPos = (doc as any).lastAutoTable.finalY + 10
      } else {
        doc.setFontSize(10)
        doc.text('No production records for selected period', margin, yPos)
        yPos += 10
      }

      // Raw Material Stock Journal
      if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = margin
      }
      
      addSectionHeader('RAW MATERIAL STOCK JOURNAL')
      
      const materialData = rawMaterials.map(mat => {
        const consumption = materialConsumption[mat.id] || { opening: 0, consumed: 0, inward: 0, closing: 0 }
        return [
          mat.name,
          mat.unit,
          consumption.opening.toFixed(2),
          consumption.inward.toFixed(2),
          consumption.consumed.toFixed(2),
          consumption.closing.toFixed(2)
        ]
      })

      autoTable(doc, {
        startY: yPos,
        head: [['Raw Material', 'Unit', 'Opening Stock', 'Inward', 'Consumed', 'Closing Stock']],
        body: materialData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 50 },
          2: { halign: 'right' },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right' }
        }
      })
      yPos = (doc as any).lastAutoTable.finalY + 10

      // Dispatch Details
      if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = margin
      }
      
      addSectionHeader('DISPATCH RECORDS')
      
      const dispatchData = selectedDispatch.map(d => [
        d.dispatch_date,
        d.batch_id ? getBatchCode(d.batch_id) : 'N/A',
        getProductName(d.product_id),
        d.quantity_dispatched.toFixed(2),
        d.customer_name
      ])

      if (dispatchData.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Batch Code', 'Product', 'Qty Dispatched (kg)', 'Customer']],
          body: dispatchData,
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 3 },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { left: margin, right: margin }
        })
        yPos = (doc as any).lastAutoTable.finalY + 10
      } else {
        doc.setFontSize(10)
        doc.text('No dispatch records for selected period', margin, yPos)
        yPos += 10
      }

      // BOM Details for each batch (detailed breakdown)
      if (yPos > pageHeight - 60) {
        doc.addPage()
        yPos = margin
      }
      
      addSectionHeader('BATCH-WISE RAW MATERIAL CONSUMPTION')
      
      const uniqueBatches = [...new Set(selectedProduction.map(p => p.batch_id))]
      
      for (const batchId of uniqueBatches) {
        const batch = batches.find(b => b.id === batchId)
        const batchProduction = selectedProduction.filter(p => p.batch_id === batchId)
        const totalProduced = batchProduction.reduce((sum, p) => sum + (p.quantity_produced || 0), 0)
        const batchBom = bom.filter(b => b.batch_id === batchId)
        
        if (batch && batchBom.length > 0) {
          if (yPos > pageHeight - 40) {
            doc.addPage()
            yPos = margin
          }
          
          doc.setFontSize(10)
          doc.setFont('helvetica', 'bold')
          doc.text(`Batch: ${batch.batch_code} | Total Produced: ${totalProduced.toFixed(2)} kg`, margin, yPos)
          yPos += 5
          
          const numBatches = batch.quantity_per_batch > 0 ? totalProduced / batch.quantity_per_batch : 0
          
          const bomData = batchBom.map(item => {
            const totalUsed = item.quantity_required * numBatches
            return [
              getMaterialName(item.raw_material_id),
              getMaterialUnit(item.raw_material_id),
              item.quantity_required.toFixed(2),
              totalUsed.toFixed(2)
            ]
          })
          
          autoTable(doc, {
            startY: yPos,
            head: [['Material', 'Unit', 'Qty per Batch', 'Total Used']],
            body: bomData,
            theme: 'grid',
            headStyles: { fillColor: [100, 116, 139], textColor: 255, fontStyle: 'bold', fontSize: 8 },
            styles: { fontSize: 8, cellPadding: 2 },
            margin: { left: margin, right: margin },
            tableWidth: 'wrap'
          })
          yPos = (doc as any).lastAutoTable.finalY + 8
        }
      }

      // Footer on each page
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(
          `Page ${i} of ${totalPages} | DARKDESIRE Production Management System`,
          pageWidth / 2,
          pageHeight - 8,
          { align: 'center' }
        )
      }

      // Save the PDF
      const filename = `Production_Sheet_${format(new Date(start), 'dd-MMM-yyyy')}_to_${format(new Date(end), 'dd-MMM-yyyy')}.pdf`
      doc.save(filename)
    } catch (err) {
      console.error('Error exporting PDF:', err)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const summary = calculateSummary()
  const materialConsumption = calculateMaterialConsumption()
  const { start, end } = getDateRange()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
              <Home className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <span className="text-muted-foreground">/</span>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-semibold">Production Sheet Export</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Production Sheet Export</h1>
          <p className="text-muted-foreground mt-2">Export detailed production reports in A3 PDF format for printing</p>
        </div>

        {/* Controls */}
        <div className="glass-card p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                className="px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                />
              </div>
            )}

            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <div className="flex-1" />

            <button
              onClick={exportToPDF}
              disabled={exporting || loading || selectedBatches.size === 0}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {exporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Export A3 PDF
                </>
              )}
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>

          {/* Batch Selection Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border animate-fade-in">
              <div className="flex items-center gap-4 mb-3">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  {selectAll ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  {selectAll ? 'Deselect All' : 'Select All'}
                </button>
                <span className="text-sm text-muted-foreground">
                  {selectedBatches.size} of {production.length} batches selected
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {production.map(p => (
                  <button
                    key={p.id}
                    onClick={() => toggleBatchSelection(p.batch_id)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selectedBatches.has(p.batch_id)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-input hover:bg-muted'
                    }`}
                  >
                    {getBatchCode(p.batch_id)} - {p.production_date}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Total Batches</p>
            <p className="text-2xl font-bold text-foreground">{summary.totalBatches}</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Total Produced</p>
            <p className="text-2xl font-bold text-primary">{summary.totalProduced.toFixed(2)} kg</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Total Dispatched</p>
            <p className="text-2xl font-bold text-accent">{summary.totalDispatched.toFixed(2)} kg</p>
          </div>
          <div className="glass-card p-4">
            <p className="text-sm text-muted-foreground">Balance</p>
            <p className="text-2xl font-bold text-success">{(summary.totalProduced - summary.totalDispatched).toFixed(2)} kg</p>
          </div>
        </div>

        {/* Preview Section */}
        <div ref={printRef} className="glass-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Export Preview
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Period: {format(new Date(start), 'dd MMM yyyy')} to {format(new Date(end), 'dd MMM yyyy')}
          </p>

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground mt-4">Loading data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Production Table */}
              <div>
                <h3 className="font-semibold mb-2 text-foreground">Production Records</h3>
                {production.filter(p => selectedBatches.has(p.batch_id)).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No production records for selected period</p>
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
                        {production.filter(p => selectedBatches.has(p.batch_id)).map((p, i) => {
                          const batch = batches.find(b => b.id === p.batch_id)
                          const product = batch ? products.find(pr => pr.id === batch.product_id) : null
                          return (
                            <tr key={p.id} className={i % 2 === 0 ? 'bg-muted/30' : 'bg-background'}>
                              <td className="px-4 py-2 text-sm">{p.production_date}</td>
                              <td className="px-4 py-2 text-sm font-medium">{getBatchCode(p.batch_id)}</td>
                              <td className="px-4 py-2 text-sm">{product?.name || 'N/A'}</td>
                              <td className="px-4 py-2 text-sm text-right">{(p.quantity_produced || 0).toFixed(2)} kg</td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">{p.notes || '-'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Raw Material Consumption */}
              <div>
                <h3 className="font-semibold mb-2 text-foreground">Raw Material Stock Journal</h3>
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
                        const consumption = materialConsumption[mat.id] || { opening: 0, consumed: 0, inward: 0, closing: 0 }
                        return (
                          <tr key={mat.id} className={i % 2 === 0 ? 'bg-muted/30' : 'bg-background'}>
                            <td className="px-4 py-2 text-sm font-medium">{mat.name}</td>
                            <td className="px-4 py-2 text-sm">{mat.unit}</td>
                            <td className="px-4 py-2 text-sm text-right">{consumption.opening.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-right text-success">{consumption.inward.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-right text-destructive">{consumption.consumed.toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm text-right font-medium">{consumption.closing.toFixed(2)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dispatch Records */}
              <div>
                <h3 className="font-semibold mb-2 text-foreground">Dispatch Records</h3>
                {dispatch.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No dispatch records for selected period</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-primary text-primary-foreground">
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
                            <td className="px-4 py-2 text-sm text-right">{d.quantity_dispatched.toFixed(2)} kg</td>
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
        </div>
      </main>
    </div>
  )
}
