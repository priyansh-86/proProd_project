'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Home, ChevronDown } from 'lucide-react'

export default function Products() {
  const [tab, setTab] = useState<'products' | 'batches'>('products')
  const [products, setProducts] = useState<any[]>([])
  const [batches, setBatches] = useState<any[]>([])
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showProductForm, setShowProductForm] = useState(false)
  const [showBatchForm, setShowBatchForm] = useState(false)
  const [expandedBatch, setExpandedBatch] = useState<string | null>(null)
  const [selectedBatchForBOM, setSelectedBatchForBOM] = useState<string | null>(null)
  const [bomItems, setBomItems] = useState<any[]>([])

  const [productForm, setProductForm] = useState({ name: '', type: 'powder', description: '' })
  const [batchForm, setBatchForm] = useState({ batch_code: '', product_id: '', quantity_per_batch: '', bom: [] as any[] })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const supabase = createClient()
      const [{ data: prods }, { data: bats }, { data: mats }, { data: bom }] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('batches').select('*').order('batch_code'),
        supabase.from('raw_materials').select('*').order('name'),
        supabase.from('bom').select('*'),
      ])

      setProducts(prods || [])
      setBatches(bats || [])
      setMaterials(mats || [])
      setBomItems(bom || [])
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault()
    if (!productForm.name.trim()) {
      alert('Enter product name')
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.from('products').insert({ ...productForm })
      if (error) throw error
      setProductForm({ name: '', type: 'powder', description: '' })
      setShowProductForm(false)
      loadData()
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to add product')
    }
  }

  async function handleAddBatch(e: React.FormEvent) {
    e.preventDefault()
    if (!batchForm.batch_code.trim() || !batchForm.product_id || !batchForm.quantity_per_batch) {
      alert('Fill all required fields')
      return
    }

    try {
      const supabase = createClient()
      const { data: batchData, error: batchError } = await supabase
        .from('batches')
        .insert({
          batch_code: batchForm.batch_code,
          product_id: batchForm.product_id,
          quantity_per_batch: parseFloat(batchForm.quantity_per_batch),
        })
        .select()

      if (batchError) throw batchError

      if (batchForm.bom.length > 0 && batchData) {
        const bomInserts = batchForm.bom.map((item) => ({
          batch_id: batchData[0].id,
          raw_material_id: item.material_id,
          quantity_required: parseFloat(item.quantity),
        }))

        const { error: bomError } = await supabase.from('bom').insert(bomInserts)
        if (bomError) throw bomError
      }

      setBatchForm({ batch_code: '', product_id: '', quantity_per_batch: '', bom: [] })
      setShowBatchForm(false)
      loadData()
    } catch (err) {
      console.error('Error:', err)
      alert('Failed to add batch')
    }
  }

  async function handleDelete(table: string, id: string) {
    if (!confirm('Are you sure?')) return
    try {
      const supabase = createClient()
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      loadData()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const getProductName = (productId: string) => products.find((p) => p.id === productId)?.name || '-'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="p-4 border-b border-gray-200 bg-white/80 backdrop-blur">
        <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
          <Home className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Products & Batches</h2>

          <div className="flex gap-4 mb-8 border-b border-gray-200">
            <button
              onClick={() => setTab('products')}
              className={`px-4 py-2 font-medium border-b-2 ${tab === 'products' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}
            >
              Products
            </button>
            <button
              onClick={() => setTab('batches')}
              className={`px-4 py-2 font-medium border-b-2 ${tab === 'batches' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'}`}
            >
              Batches & BOM
            </button>
          </div>

          {tab === 'products' && (
            <div>
              <button
                onClick={() => setShowProductForm(!showProductForm)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-6"
              >
                <Plus className="w-4 h-4" /> Add Product
              </button>

              {showProductForm && (
                <form onSubmit={handleAddProduct} className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="e.g., Detergent Powder"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Type</label>
                      <select
                        value={productForm.type}
                        onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option>powder</option>
                        <option>liquid</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-900 mb-1">Description</label>
                      <textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        placeholder="Description"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                      Add Product
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowProductForm(false)}
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
              ) : products.length === 0 ? (
                <div className="bg-white/80 backdrop-blur rounded-lg p-8 text-center text-gray-600">
                  No products yet. Click "Add Product" to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {products.map((prod) => (
                    <div key={prod.id} className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-gray-900">{prod.name}</h3>
                          <p className="text-xs text-gray-600">{prod.type}</p>
                        </div>
                        <button
                          onClick={() => handleDelete('products', prod.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600">{prod.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'batches' && (
            <div>
              <button
                onClick={() => setShowBatchForm(!showBatchForm)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-6"
              >
                <Plus className="w-4 h-4" /> Add Batch
              </button>

              {showBatchForm && (
                <form onSubmit={handleAddBatch} className="bg-white/80 backdrop-blur rounded-lg border border-gray-200 p-6 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Batch Code</label>
                      <input
                        type="text"
                        value={batchForm.batch_code}
                        onChange={(e) => setBatchForm({ ...batchForm, batch_code: e.target.value })}
                        placeholder="e.g., BATCH001"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-1">Product</label>
                      <select
                        value={batchForm.product_id}
                        onChange={(e) => setBatchForm({ ...batchForm, product_id: e.target.value })}
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
                      <label className="block text-sm font-medium text-gray-900 mb-1">Quantity per Batch</label>
                      <input
                        type="number"
                        value={batchForm.quantity_per_batch}
                        onChange={(e) => setBatchForm({ ...batchForm, quantity_per_batch: e.target.value })}
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Bill of Materials (BOM)</h4>
                    {batchForm.bom.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-3 gap-2 mb-2">
                        <select
                          value={item.material_id}
                          onChange={(e) => {
                            const newBom = [...batchForm.bom]
                            newBom[idx].material_id = e.target.value
                            setBatchForm({ ...batchForm, bom: newBom })
                          }}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">Select Material</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newBom = [...batchForm.bom]
                            newBom[idx].quantity = e.target.value
                            setBatchForm({ ...batchForm, bom: newBom })
                          }}
                          placeholder="Qty"
                          step="0.01"
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newBom = batchForm.bom.filter((_, i) => i !== idx)
                            setBatchForm({ ...batchForm, bom: newBom })
                          }}
                          className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setBatchForm({ ...batchForm, bom: [...batchForm.bom, { material_id: '', quantity: '' }] })}
                      className="text-blue-600 text-sm font-medium mt-2"
                    >
                      + Add Material to BOM
                    </button>
                  </div>

                  <div className="flex gap-4">
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                      Add Batch
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBatchForm(false)
                        setBatchForm({ batch_code: '', product_id: '', quantity_per_batch: '', bom: [] })
                      }}
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
              ) : batches.length === 0 ? (
                <div className="bg-white/80 backdrop-blur rounded-lg p-8 text-center text-gray-600">
                  No batches yet. Click "Add Batch" to create one.
                </div>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch) => {
                    const batchBom = bomItems.filter((b) => b.batch_id === batch.id)
                    return (
                      <div key={batch.id} className="bg-white/80 backdrop-blur rounded-lg border border-gray-200">
                        <button
                          onClick={() => setExpandedBatch(expandedBatch === batch.id ? null : batch.id)}
                          className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50"
                        >
                          <div className="text-left">
                            <h3 className="font-bold text-gray-900">{batch.batch_code}</h3>
                            <p className="text-sm text-gray-600">{getProductName(batch.product_id)} - {batch.quantity_per_batch} units</p>
                          </div>
                          <ChevronDown className={`w-5 h-5 transition ${expandedBatch === batch.id ? 'rotate-180' : ''}`} />
                        </button>

                        {expandedBatch === batch.id && (
                          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                            <h4 className="font-medium text-gray-900 mb-3">Bill of Materials</h4>
                            {batchBom.length === 0 ? (
                              <p className="text-sm text-gray-600">No materials assigned</p>
                            ) : (
                              <div className="space-y-2">
                                {batchBom.map((item) => {
                                  const matName = materials.find((m) => m.id === item.raw_material_id)?.name
                                  return (
                                    <div key={item.id} className="flex justify-between text-sm text-gray-600">
                                      <span>{matName}</span>
                                      <span>{item.quantity_required}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            <button
                              onClick={() => handleDelete('batches', batch.id)}
                              className="mt-4 text-red-600 hover:text-red-700 text-sm font-medium"
                            >
                              Delete Batch
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
