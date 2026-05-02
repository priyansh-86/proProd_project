'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Home, Trash2 } from 'lucide-react'

export default function Production() {
  const [records, setRecords] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    batch_id: '',
    production_date: new Date().toISOString().split('T')[0],
    quantity_produced: '',
    quantity_calculated: '',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const supabase = createClient()
      const [{ data: prod }, { data: bats }] = await Promise.all([
        supabase.from('daily_production').select('*').order('production_date', { ascending: false }),
        supabase.from('batches').select('*').order('batch_code'),
      ])
      setRecords(prod || [])
      setBatches(bats || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.batch_id) {
      alert('Select a batch')
      return
    }

    try {
      const supabase = createClient()
      const insertData: any = {
        batch_id: formData.batch_id,
        production_date: formData.production_date,
        notes: formData.notes,
      }

      if (formData.quantity_produced) {
        insertData.quantity_produced = parseFloat(formData.quantity_produced)
      }
      if (formData.quantity_calculated) {
        insertData.quantity_calculated = parseFloat(formData.quantity_calculated)
      }

      const { error } = await supabase.from('daily_production').insert(insertData)
      if (error) throw error

      setFormData({
        batch_id: '',
        production_date: new Date().toISOString().split('T')[0],
        quantity_produced: '',
        quantity_calculated: '',
        notes: '',
      })
      setShowForm(false)
      loadData()
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to save')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure?')) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from('daily_production').delete().eq('id', id)
      if (error) throw error
      loadData()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const getBatchCode = (batchId: string) => batches.find((b) => b.id === batchId)?.batch_code || '-'

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
              <h2 className="text-3xl font-bold text-gray-900">Daily Production</h2>
              <p className="text-gray-600 mt-2">Track production for each batch</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Add Production
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Batch</label>
                  <select
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Batch</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.batch_code}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Production Date</label>
                  <input
                    type="date"
                    value={formData.production_date}
                    onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Quantity Produced (Manual)</label>
                  <input
                    type="number"
                    value={formData.quantity_produced}
                    onChange={(e) => setFormData({ ...formData, quantity_produced: e.target.value })}
                    placeholder="Optional"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Quantity Calculated</label>
                  <input
                    type="number"
                    value={formData.quantity_calculated}
                    onChange={(e) => setFormData({ ...formData, quantity_calculated: e.target.value })}
                    placeholder="Optional"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows={2}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  Add Record
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 text-gray-900 px-6 py-2 rounded-lg"
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
          ) : records.length === 0 ? (
            <div className="bg-white/80 backdrop-blur rounded-lg p-8 text-center text-gray-600">
              No production records yet. Click "Add Production" to start.
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Batch Code</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Manual Qty</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Calculated Qty</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Notes</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{getBatchCode(rec.batch_id)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{rec.production_date}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{rec.quantity_produced?.toFixed(2) || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{rec.quantity_calculated?.toFixed(2) || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{rec.notes || '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <button onClick={() => handleDelete(rec.id)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
