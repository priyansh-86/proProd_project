'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Home, Trash2 } from 'lucide-react'

export default function Dispatch() {
  const [records, setRecords] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    product_id: '',
    batch_id: '',
    quantity_dispatched: '',
    customer_name: '',
    dispatch_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const supabase = createClient()
      const [{ data: disp }, { data: prods }, { data: bats }] = await Promise.all([
        supabase.from('dispatch_records').select('*').order('dispatch_date', { ascending: false }),
        supabase.from('products').select('*').order('name'),
        supabase.from('batches').select('*').order('batch_code'),
      ])
      setRecords(disp || [])
      setProducts(prods || [])
      setBatches(bats || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.product_id || !formData.batch_id || !formData.customer_name || !formData.quantity_dispatched) {
      alert('Fill all required fields')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from('dispatch_records').insert({
        product_id: formData.product_id,
        batch_id: formData.batch_id,
        quantity_dispatched: parseFloat(formData.quantity_dispatched),
        customer_name: formData.customer_name,
        dispatch_date: formData.dispatch_date,
        notes: formData.notes,
      })
      if (error) throw error

      setFormData({
        product_id: '',
        batch_id: '',
        quantity_dispatched: '',
        customer_name: '',
        dispatch_date: new Date().toISOString().split('T')[0],
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
      const { error } = await supabase.from('dispatch_records').delete().eq('id', id)
      if (error) throw error
      loadData()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const getProductName = (prodId: string) => products.find((p) => p.id === prodId)?.name || '-'
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
              <h2 className="text-3xl font-bold text-gray-900">Dispatch Records</h2>
              <p className="text-gray-600 mt-2">Log customer shipments and track dispatch history</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Add Dispatch
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Product</label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <label className="block text-sm font-medium text-gray-900 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="Customer / Distributor"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity_dispatched}
                    onChange={(e) => setFormData({ ...formData, quantity_dispatched: e.target.value })}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Dispatch Date</label>
                  <input
                    type="date"
                    value={formData.dispatch_date}
                    onChange={(e) => setFormData({ ...formData, dispatch_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Notes</label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Optional notes"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  Add Dispatch
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
              No dispatch records yet. Click "Add Dispatch" to start.
            </div>
          ) : (
            <div className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Product</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Batch</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Qty</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Notes</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{rec.dispatch_date}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{getProductName(rec.product_id)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{getBatchCode(rec.batch_id)}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{rec.customer_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{rec.quantity_dispatched.toFixed(2)}</td>
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
