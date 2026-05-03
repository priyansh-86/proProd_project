'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, AlertTriangle, Zap, Target } from 'lucide-react'

export function ProductionInsights() {
  const [insights, setInsights] = useState({
    totalProduced: 0,
    avgBatchSize: 0,
    materialsCost: 0,
    lowStockCount: 0,
    mostUsedMaterial: '',
    productionTrend: 'stable',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsights()
  }, [])

  async function loadInsights() {
    try {
      const supabase = createClient()

      // Get production data
      const { data: production } = await supabase
        .from('daily_production')
        .select('quantity_produced')

      const { data: materials } = await supabase
        .from('raw_materials')
        .select('current_stock, cost_per_unit, reorder_level')

      const { data: bom } = await supabase
        .from('batch_bom')
        .select('quantity_required, raw_material_id')
        .limit(100)

      const totalProduced = production?.reduce((sum, p) => sum + (p.quantity_produced || 0), 0) || 0
      const avgBatchSize = production && production.length > 0 ? totalProduced / production.length : 0
      const materialsCost = materials?.reduce((sum, m) => sum + (m.current_stock * (m.cost_per_unit || 0)), 0) || 0
      const lowStockCount = materials?.filter(m => m.current_stock < m.reorder_level).length || 0

      setInsights({
        totalProduced: Math.round(totalProduced),
        avgBatchSize: Math.round(avgBatchSize * 100) / 100,
        materialsCost: Math.round(materialsCost),
        lowStockCount,
        mostUsedMaterial: 'SALT',
        productionTrend: lowStockCount > 3 ? 'warning' : 'stable',
      })
    } catch (err) {
      console.error('Error loading insights:', err)
    } finally {
      setLoading(false)
    }
  }

  const insightCards = [
    {
      title: 'Total Produced',
      value: `${insights.totalProduced} KGS`,
      icon: TrendingUp,
      color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600',
    },
    {
      title: 'Avg Batch Size',
      value: `${insights.avgBatchSize} KGS`,
      icon: Target,
      color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600',
    },
    {
      title: 'Inventory Value',
      value: `₹${(insights.materialsCost / 100000).toFixed(1)}L`,
      icon: Zap,
      color: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-600',
    },
    {
      title: 'Low Stock Alert',
      value: insights.lowStockCount,
      icon: AlertTriangle,
      color: insights.lowStockCount > 0 
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600'
        : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-600',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {insightCards.map((card, i) => {
        const Icon = card.icon
        return (
          <div
            key={i}
            className={`rounded-lg border p-4 ${card.color}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
                <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{card.value}</p>
              </div>
              <Icon className="w-8 h-8 opacity-80" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
