'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, Boxes, Package, Factory, Truck, FileText, Home, Upload } from 'lucide-react'
import { SystemStatus } from '@/components/system-status'
import { ThemeToggle } from '@/components/theme-toggle'
import { ProductionInsights } from '@/components/production-insights'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/raw-materials', label: 'Raw Materials', icon: Boxes },
  { href: '/products', label: 'Products & Batches', icon: Package },
  { href: '/production', label: 'Production', icon: Factory },
  { href: '/dispatch', label: 'Dispatch', icon: Truck },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/import', label: 'Import Tally', icon: Upload },
]

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRawMaterials: 0,
    totalProducts: 0,
    totalBatches: 0,
    lowStockItems: 0,
  })
  const [lastEntry, setLastEntry] = useState({
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

      const [
        { data: materials },
        { data: products },
        { data: batches },
        { data: production },
        { data: dispatch },
      ] = await Promise.all([
        supabase.from('raw_materials').select('id'),
        supabase.from('products').select('id'),
        supabase.from('batches').select('id'),
        supabase.from('daily_production').select('*').order('production_date', { ascending: false }).limit(1),
        supabase.from('dispatch_records').select('*').order('dispatch_date', { ascending: false }).limit(1),
      ])

      const materialCount = materials?.length || 0
      const productCount = products?.length || 0
      const batchCount = batches?.length || 0

      const { data: lowStock } = await supabase
        .from('raw_materials')
        .select('id')
        .lte('current_stock', 10)

      // Get batch details for last production
      let lastBatchCode = '-'
      let lastBatchQty = 0
      let lastBatchDate = '-'
      if (production && production.length > 0) {
        const prod = production[0]
        const batchData = batches?.find((b: any) => b.id === prod.batch_id)
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
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white/80 backdrop-blur-md p-6">
        <div className="space-y-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-blue-600">ProProd</h1>
            <p className="text-sm text-gray-600">Production System</p>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = item.href === '/'
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">DARKDESIRE</h2>
                <p className="text-gray-600 mt-2">Advanced Manufacturing Production Management</p>
              </div>
              <ThemeToggle />
            </div>

            {/* Stats Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-4">Loading data...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  {
                    title: 'Raw Materials',
                    value: stats.totalRawMaterials,
                    color: 'bg-blue-100 text-blue-600',
                  },
                  {
                    title: 'Products',
                    value: stats.totalProducts,
                    color: 'bg-green-100 text-green-600',
                  },
                  {
                    title: 'Batches',
                    value: stats.totalBatches,
                    color: 'bg-purple-100 text-purple-600',
                  },
                  {
                    title: 'Low Stock Items',
                    value: stats.lowStockItems,
                    color: 'bg-red-100 text-red-600',
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg border border-gray-200 p-6 backdrop-blur-md bg-white/80"
                  >
                    <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                    <p className={`text-3xl font-bold mt-2 ${stat.color}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Production Insights */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Production Analytics</h3>
              <ProductionInsights />
            </div>

            {/* System Status */}
            <SystemStatus />

            {/* Last Entry Details */}
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-gray-200 rounded-lg p-8 mb-8 backdrop-blur-md bg-white/80">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Last Entry Details</h3>
                <span className="text-xs text-gray-500">Synced: {lastEntry.lastSynced}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    label: 'Last Batch',
                    value: lastEntry.lastBatch,
                    subtext: `${lastEntry.lastBatchQty} KG - ${lastEntry.lastBatchDate}`,
                    color: 'border-l-4 border-blue-600',
                  },
                  {
                    label: 'Last Dispatched',
                    value: `${lastEntry.lastDispatched} KG`,
                    subtext: `${lastEntry.lastDispatchCustomer} - ${lastEntry.lastDispatchedDate}`,
                    color: 'border-l-4 border-green-600',
                  },
                  {
                    label: 'Production Status',
                    value: lastEntry.lastBatch !== '-' ? 'Active' : 'No Data',
                    subtext: lastEntry.lastBatchDate !== '-' ? lastEntry.lastBatchDate : 'Add production record',
                    color: 'border-l-4 border-purple-600',
                  },
                  {
                    label: 'Low Stock Alert',
                    value: stats.lowStockItems,
                    subtext: 'materials need reordering',
                    color: 'border-l-4 border-red-600',
                  },
                ].map((item, i) => (
                  <div key={i} className={`bg-white rounded-lg p-4 ${item.color}`}>
                    <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                    <p className="text-lg font-bold text-gray-900 mt-2">{item.value}</p>
                    <p className="text-xs text-gray-600 mt-1">{item.subtext}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6 backdrop-blur-md bg-white/80">
                <h3 className="font-bold text-gray-900 mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Raw Materials</span>
                    <span className="font-semibold text-blue-600">{stats.totalRawMaterials}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Batches</span>
                    <span className="font-semibold text-green-600">{stats.totalBatches}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Products</span>
                    <span className="font-semibold text-purple-600">{stats.totalProducts}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-6 backdrop-blur-md bg-white/80">
                <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/production" className="block text-blue-600 hover:text-blue-700 text-sm font-medium">
                    ➜ Add Daily Production
                  </Link>
                  <Link href="/dispatch" className="block text-blue-600 hover:text-blue-700 text-sm font-medium">
                    ➜ Log Dispatch
                  </Link>
                  <Link href="/raw-materials" className="block text-blue-600 hover:text-blue-700 text-sm font-medium">
                    ➜ Manage Materials
                  </Link>
                  <Link href="/reports" className="block text-blue-600 hover:text-blue-700 text-sm font-medium">
                    ➜ View Reports
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
