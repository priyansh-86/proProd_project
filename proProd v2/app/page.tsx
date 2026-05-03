'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  BarChart3, Boxes, Package, Factory, Truck, FileText, 
  Home, Upload, Download, Calendar, AlertTriangle, 
  TrendingUp, RefreshCw 
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { format } from 'date-fns'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/raw-materials', label: 'Raw Materials', icon: Boxes },
  { href: '/products', label: 'Products & Batches', icon: Package },
  { href: '/production', label: 'Production', icon: Factory },
  { href: '/dispatch', label: 'Dispatch', icon: Truck },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/export', label: 'Export Sheet', icon: Download },
  { href: '/import', label: 'Import Data', icon: Upload },
]

interface Stats {
  totalRawMaterials: number
  totalProducts: number
  totalBatches: number
  lowStockItems: number
  todayProduction: number
  todayDispatched: number
  weekProduction: number
  weekDispatched: number
}

interface LastEntry {
  lastSynced: string
  lastBatch: string
  lastBatchQty: number
  lastBatchDate: string
  lastDispatched: number
  lastDispatchedDate: string
  lastDispatchCustomer: string
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalRawMaterials: 0,
    totalProducts: 0,
    totalBatches: 0,
    lowStockItems: 0,
    todayProduction: 0,
    todayDispatched: 0,
    weekProduction: 0,
    weekDispatched: 0,
  })
  const [lastEntry, setLastEntry] = useState<LastEntry>({
    lastSynced: '',
    lastBatch: '',
    lastBatchQty: 0,
    lastBatchDate: '',
    lastDispatched: 0,
    lastDispatchedDate: '',
    lastDispatchCustomer: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setLastEntry((prev) => ({
      ...prev,
      lastSynced: new Date().toLocaleString('en-IN'),
    }))
  }, [])

  useEffect(() => {
    if (mounted) {
      loadStats()
    }
  }, [mounted])

  async function loadStats() {
    try {
      const supabase = createClient()
      const today = format(new Date(), 'yyyy-MM-dd')
      const weekStart = format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

      const [
        { data: materials },
        { data: products },
        { data: batches },
        { data: production },
        { data: dispatch },
        { data: todayProd },
        { data: todayDisp },
        { data: weekProd },
        { data: weekDisp },
        { data: lowStock },
      ] = await Promise.all([
        supabase.from('raw_materials').select('id'),
        supabase.from('products').select('id'),
        supabase.from('batches').select('id, batch_code'),
        supabase.from('daily_production').select('*').order('production_date', { ascending: false }).limit(1),
        supabase.from('dispatch_records').select('*').order('dispatch_date', { ascending: false }).limit(1),
        supabase.from('daily_production').select('quantity_produced').eq('production_date', today),
        supabase.from('dispatch_records').select('quantity_dispatched').eq('dispatch_date', today),
        supabase.from('daily_production').select('quantity_produced').gte('production_date', weekStart),
        supabase.from('dispatch_records').select('quantity_dispatched').gte('dispatch_date', weekStart),
        supabase.from('raw_materials').select('id').lte('current_stock', 10),
      ])

      const materialCount = materials?.length || 0
      const productCount = products?.length || 0
      const batchCount = batches?.length || 0

      // Calculate today's production
      const todayProductionTotal = (todayProd || []).reduce((sum, p) => sum + (p.quantity_produced || 0), 0)
      const todayDispatchTotal = (todayDisp || []).reduce((sum, d) => sum + (d.quantity_dispatched || 0), 0)
      const weekProductionTotal = (weekProd || []).reduce((sum, p) => sum + (p.quantity_produced || 0), 0)
      const weekDispatchTotal = (weekDisp || []).reduce((sum, d) => sum + (d.quantity_dispatched || 0), 0)

      // Get batch details for last production
      let lastBatchCode = '-'
      let lastBatchQty = 0
      let lastBatchDate = '-'
      if (production && production.length > 0) {
        const prod = production[0]
        const batchData = batches?.find((b: { id: string; batch_code: string }) => b.id === prod.batch_id)
        lastBatchCode = batchData?.batch_code || '-'
        lastBatchQty = prod.quantity_produced || 0
        lastBatchDate = prod.production_date || '-'
      }

      // Get last dispatch details
      let lastDispatchedQty = 0
      let lastDispatchDate = '-'
      let lastDispatchCustomer = '-'
      if (dispatch && dispatch.length > 0) {
        const disp = dispatch[0]
        lastDispatchedQty = disp.quantity_dispatched || 0
        lastDispatchDate = disp.dispatch_date || '-'
        lastDispatchCustomer = disp.customer_name || '-'
      }

      setStats({
        totalRawMaterials: materialCount,
        totalProducts: productCount,
        totalBatches: batchCount,
        lowStockItems: lowStock?.length || 0,
        todayProduction: todayProductionTotal,
        todayDispatched: todayDispatchTotal,
        weekProduction: weekProductionTotal,
        weekDispatched: weekDispatchTotal,
      })

      setLastEntry({
        lastSynced: new Date().toLocaleString('en-IN'),
        lastBatch: lastBatchCode,
        lastBatchQty: lastBatchQty,
        lastBatchDate: lastBatchDate,
        lastDispatched: lastDispatchedQty,
        lastDispatchedDate: lastDispatchDate,
        lastDispatchCustomer: lastDispatchCustomer,
      })
    } catch (err) {
      console.error('Error loading stats:', err)
      setError('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 backdrop-blur-xl">
        <div className="flex flex-col h-full p-6">
          <div className="space-y-1 mb-8">
            <h1 className="text-2xl font-bold text-gradient">ProProd</h1>
            <p className="text-sm text-muted-foreground">Production System</p>
          </div>

          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = item.href === '/'
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              v2.0 - Production Management
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold text-gradient">DARKDESIRE</h2>
                <p className="text-muted-foreground mt-2">Advanced Manufacturing Production Management</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={loadStats}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  title="Refresh data"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <ThemeToggle />
              </div>
            </div>

            {/* Stats Grid */}
            {loading ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground mt-4">Loading data...</p>
              </div>
            ) : error ? (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-destructive">
                {error}
              </div>
            ) : (
              <>
                {/* Primary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Raw Materials</p>
                        <p className="text-3xl font-bold text-foreground mt-1">{stats.totalRawMaterials}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Boxes className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </div>
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Products</p>
                        <p className="text-3xl font-bold text-foreground mt-1">{stats.totalProducts}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-accent/10">
                        <Package className="w-6 h-6 text-accent" />
                      </div>
                    </div>
                  </div>
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Batches</p>
                        <p className="text-3xl font-bold text-foreground mt-1">{stats.totalBatches}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-success/10">
                        <Factory className="w-6 h-6 text-success" />
                      </div>
                    </div>
                  </div>
                  <div className="glass-card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Low Stock Items</p>
                        <p className="text-3xl font-bold text-destructive mt-1">{stats.lowStockItems}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-destructive/10">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's Performance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Today&apos;s Production</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Produced</p>
                        <p className="text-2xl font-bold text-primary">{stats.todayProduction.toFixed(2)} kg</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dispatched</p>
                        <p className="text-2xl font-bold text-accent">{stats.todayDispatched.toFixed(2)} kg</p>
                      </div>
                    </div>
                  </div>
                  <div className="glass-card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-success" />
                      <h3 className="font-semibold text-foreground">This Week</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Produced</p>
                        <p className="text-2xl font-bold text-primary">{stats.weekProduction.toFixed(2)} kg</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Dispatched</p>
                        <p className="text-2xl font-bold text-accent">{stats.weekDispatched.toFixed(2)} kg</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Last Entry Details */}
                <div className="glass-card p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-foreground">Last Entry Details</h3>
                    <span className="text-xs text-muted-foreground">Synced: {lastEntry.lastSynced}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-primary">
                      <p className="text-xs text-muted-foreground font-medium">Last Batch</p>
                      <p className="text-lg font-bold text-foreground mt-2">{lastEntry.lastBatch}</p>
                      <p className="text-xs text-muted-foreground mt-1">{lastEntry.lastBatchQty} KG - {lastEntry.lastBatchDate}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-accent">
                      <p className="text-xs text-muted-foreground font-medium">Last Dispatched</p>
                      <p className="text-lg font-bold text-foreground mt-2">{lastEntry.lastDispatched} KG</p>
                      <p className="text-xs text-muted-foreground mt-1">{lastEntry.lastDispatchCustomer} - {lastEntry.lastDispatchedDate}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-success">
                      <p className="text-xs text-muted-foreground font-medium">Production Status</p>
                      <p className="text-lg font-bold text-foreground mt-2">{lastEntry.lastBatch !== '-' ? 'Active' : 'No Data'}</p>
                      <p className="text-xs text-muted-foreground mt-1">{lastEntry.lastBatchDate !== '-' ? lastEntry.lastBatchDate : 'Add production record'}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-destructive">
                      <p className="text-xs text-muted-foreground font-medium">Low Stock Alert</p>
                      <p className="text-lg font-bold text-destructive mt-2">{stats.lowStockItems}</p>
                      <p className="text-xs text-muted-foreground mt-1">materials need reordering</p>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link href="/production" className="glass-card p-6 hover:shadow-lg transition-shadow group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Factory className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Add Production</h3>
                        <p className="text-sm text-muted-foreground">Record daily production</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/dispatch" className="glass-card p-6 hover:shadow-lg transition-shadow group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                        <Truck className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Log Dispatch</h3>
                        <p className="text-sm text-muted-foreground">Track outgoing shipments</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/export" className="glass-card p-6 hover:shadow-lg transition-shadow group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-success/10 group-hover:bg-success/20 transition-colors">
                        <Download className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Export A3 Sheet</h3>
                        <p className="text-sm text-muted-foreground">Download production sheet PDF</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/raw-materials" className="glass-card p-6 hover:shadow-lg transition-shadow group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-warning/10 group-hover:bg-warning/20 transition-colors">
                        <Boxes className="w-6 h-6 text-warning" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Manage Materials</h3>
                        <p className="text-sm text-muted-foreground">Update inventory levels</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/products" className="glass-card p-6 hover:shadow-lg transition-shadow group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Products & Batches</h3>
                        <p className="text-sm text-muted-foreground">Configure BOM</p>
                      </div>
                    </div>
                  </Link>
                  <Link href="/reports" className="glass-card p-6 hover:shadow-lg transition-shadow group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                        <BarChart3 className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">View Reports</h3>
                        <p className="text-sm text-muted-foreground">Analytics & insights</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
