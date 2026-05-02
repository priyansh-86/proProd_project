'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Home, AlertCircle } from 'lucide-react'
import { ReorderLevelInfo } from '@/components/reorder-level-info'

export default function RawMaterials() {
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    current_stock: '0',
    reorder_level: '0',
    supplier: '',
    cost_per_unit: '0',
  })

  useEffect(() => {
    loadMaterials()
  }, [])

  async function loadMaterials() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('raw_materials').select('*').order('name')
      if (error) throw error
      setMaterials(data || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Please enter material name')
      return
    }

    try {
      const supabase = createClient()
      if (editId) {
        const { error } = await supabase
          .from('raw_materials')
          .update({
            name: formData.name,
            unit: formData.unit,
            current_stock: parseFloat(formData.current_stock),
            reorder_level: parseFloat(formData.reorder_level),
            supplier: formData.supplier,
            cost_per_unit: parseFloat(formData.cost_per_unit),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('raw_materials').insert({
          name: formData.name,
          unit: formData.unit,
          current_stock: parseFloat(formData.current_stock),
          reorder_level: parseFloat(formData.reorder_level),
          supplier: formData.supplier,
          cost_per_unit: parseFloat(formData.cost_per_unit),
        })
        if (error) throw error
      }
      setFormData({ name: '', unit: 'kg', current_stock: '0', reorder_level: '0', supplier: '', cost_per_unit: '0' })
      setEditId(null)
      setShowForm(false)
      loadMaterials()
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to save material')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure?')) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from('raw_materials').delete().eq('id', id)
      if (error) throw error
      loadMaterials()
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to delete')
    }
  }

  function handleEdit(material: any) {
    setFormData({
      name: material.name,
      unit: material.unit,
      current_stock: material.current_stock.toString(),
      reorder_level: material.reorder_level.toString(),
      supplier: material.supplier || '',
      cost_per_unit: material.cost_per_unit?.toString() || '0',
    })
    setEditId(material.id)
    setShowForm(true)
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Raw Materials</h2>
              <p className="text-gray-600 mt-2">Manage inventory and track stock levels</p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm)
                setEditId(null)
                setFormData({ name: '', unit: 'kg', current_stock: '0', reorder_level: '0', supplier: '', cost_per_unit: '0' })
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Add Material
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Sodium Sulfate"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option>kg</option>
                    <option>liters</option>
                    <option>pieces</option>
                    <option>boxes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Current Stock</label>
                  <input
                    type="number"
                    value={formData.current_stock}
                    onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-900">Reorder Level</label>
                    <ReorderLevelInfo />
                  </div>
                  <input
                    type="number"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Cost per Unit</label>
                  <input
                    type="number"
                    value={formData.cost_per_unit}
                    onChange={(e) => setFormData({ ...formData, cost_per_unit: e.target.value })}
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Supplier name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                  {editId ? 'Update' : 'Add'} Material
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditId(null)
                    setFormData({ name: '', unit: 'kg', current_stock: '0', reorder_level: '0', supplier: '', cost_per_unit: '0' })
                  }}
                  className="bg-gray-300 text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : materials.length === 0 ? (
            <div className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 p-8 text-center text-gray-600">
              No materials added. Click "Add Material" to get started.
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Unit</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Stock</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Reorder</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Cost/Unit</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Supplier</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {materials.map((mat) => {
                    const isCritical = mat.current_stock <= mat.reorder_level
                    return (
                      <tr key={mat.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{mat.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{mat.unit}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{mat.current_stock.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{mat.reorder_level.toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm font-medium text-blue-600">₹{parseFloat(mat.cost_per_unit || 0).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {isCritical ? (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <span className="text-xs font-semibold text-red-600">Low Stock</span>
                              </>
                            ) : (
                              <span className="text-xs font-semibold text-green-600">OK</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{mat.supplier || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(mat)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(mat.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
