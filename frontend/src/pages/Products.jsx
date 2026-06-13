import React, { useEffect, useState } from 'react'
import { Package, Plus, Pencil, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../utils/api'
import {
  Button, Card, Badge, Modal, Input, EmptyState, Spinner, ErrorAlert, ConfirmDialog
} from '../components/UI'

function ProductForm({ initial, onSubmit, onClose, loading }) {
  const [form, setForm] = useState(
    initial || { name: '', sku: '', price: '', quantity: '', category: '', description: '' }
  )
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    if (form.price === '' || isNaN(Number(form.price)) || Number(form.price) < 0) e.price = 'Valid price required'
    if (form.quantity === '' || isNaN(Number(form.quantity)) || Number(form.quantity) < 0) e.quantity = 'Valid quantity required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handle(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setErrors(er => ({ ...er, [e.target.name]: undefined }))
  }

  function submit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({ ...form, price: Number(form.price), quantity: Number(form.quantity) })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Product Name" name="name" value={form.name} onChange={handle} error={errors.name} required />
        <Input label="SKU / Code"   name="sku"  value={form.sku}  onChange={handle} error={errors.sku}  required disabled={!!initial} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Price (₹)" name="price"    type="number" step="0.01" min="0" value={form.price}    onChange={handle} error={errors.price}    required />
        <Input label="Quantity"  name="quantity"  type="number" min="0"     value={form.quantity}  onChange={handle} error={errors.quantity}  required />
      </div>
      <Input label="Category" name="category" value={form.category} onChange={handle} placeholder="e.g. Electronics" />
      <Input label="Description" name="description" value={form.description} onChange={handle} placeholder="Optional notes about this product" />
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>{initial ? 'Save Changes' : 'Add Product'}</Button>
      </div>
    </form>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [search, setSearch]     = useState('')
  const [modal, setModal]       = useState(null) // null | 'add' | {product}
  const [saving, setSaving]     = useState(false)
  const [confirm, setConfirm]   = useState(null) // null | product

  function load() {
    setLoading(true)
    getProducts()
      .then(r => setProducts(r.data))
      .catch(() => setError('Failed to load products'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleSave(data) {
    setSaving(true)
    try {
      if (modal?.id) {
        await updateProduct(modal.id, data)
        toast.success('Product updated')
      } else {
        await createProduct(data)
        toast.success('Product added')
      }
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      await deleteProduct(confirm.id)
      toast.success(`"${confirm.name}" deleted`)
      setConfirm(null)
      load()
    } catch {
      toast.error('Failed to delete product')
    } finally {
      setSaving(false)
    }
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Spinner />
  if (error)   return <ErrorAlert message={error} />

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Search by name, SKU, or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setModal('add')} className="shrink-0">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      {/* Table */}
      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description={search ? 'Try a different search term.' : 'Get started by adding your first product.'}
            action={!search && <Button onClick={() => setModal('add')}><Plus className="w-4 h-4" /> Add Product</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">SKU</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Price</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr key={p.id} className="table-row-hover">
                    <td className="px-6 py-3">
                      <p className="font-medium text-slate-800">{p.name}</p>
                      {p.description && <p className="text-xs text-slate-400 truncate max-w-xs">{p.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{p.sku}</code>
                    </td>
                    <td className="px-4 py-3">
                      {p.category ? <Badge color="indigo">{p.category}</Badge> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-700">₹{Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge color={p.quantity === 0 ? 'red' : p.quantity <= 5 ? 'yellow' : 'green'}>
                        {p.quantity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal(p)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirm(p)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add / Edit Modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal?.id ? `Edit "${modal.name}"` : 'Add New Product'}
      >
        {modal && (
          <ProductForm
            initial={modal !== 'add' ? modal : null}
            onSubmit={handleSave}
            onClose={() => setModal(null)}
            loading={saving}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={saving}
        title="Delete Product"
        description={`Are you sure you want to delete "${confirm?.name}"? This action cannot be undone.`}
      />
    </>
  )
}
