import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart, Plus, Trash2, Eye, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { getOrders, createOrder, deleteOrder, getProducts, getCustomers } from '../utils/api'
import {
  Button, Card, Badge, Modal, Select, Input, EmptyState, Spinner, ErrorAlert, ConfirmDialog
} from '../components/UI'

function OrderForm({ onSubmit, onClose, loading }) {
  const [customers, setCustomers] = useState([])
  const [products, setProducts]   = useState([])
  const [customerId, setCustomerId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: 1 }])
  const [errors, setErrors] = useState({})
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCustomers(), getProducts()])
      .then(([c, p]) => { setCustomers(c.data); setProducts(p.data) })
      .finally(() => setDataLoading(false))
  }, [])

  function addItem() {
    setItems(i => [...i, { product_id: '', quantity: 1 }])
  }

  function removeItem(idx) {
    setItems(i => i.filter((_, j) => j !== idx))
  }

  function updateItem(idx, field, value) {
    setItems(i => i.map((item, j) => j === idx ? { ...item, [field]: value } : item))
    setErrors(e => ({ ...e, [`item_${idx}`]: undefined }))
  }

  function validate() {
    const e = {}
    if (!customerId) e.customer = 'Select a customer'
    items.forEach((item, i) => {
      if (!item.product_id) e[`item_${i}`] = 'Select a product'
      if (!item.quantity || item.quantity < 1) e[`item_qty_${i}`] = 'Min 1'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const selectedProductIds = items.map(i => i.product_id)

  const total = items.reduce((sum, item) => {
    const p = products.find(p => String(p.id) === String(item.product_id))
    return sum + (p ? p.price * (item.quantity || 0) : 0)
  }, 0)

  function submit(e) {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      customer_id: Number(customerId),
      notes,
      items: items.map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) }))
    })
  }

  if (dataLoading) return <div className="text-center py-8 text-slate-400 text-sm">Loading…</div>

  return (
    <form onSubmit={submit} className="space-y-5">
      <Select
        label="Customer"
        value={customerId}
        onChange={e => { setCustomerId(e.target.value); setErrors(er => ({ ...er, customer: undefined })) }}
        error={errors.customer}
        required
      >
        <option value="">Select a customer…</option>
        {customers.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>)}
      </Select>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">Order Items <span className="text-red-500">*</span></label>
          <Button type="button" variant="ghost" size="sm" onClick={addItem}>+ Add Item</Button>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => {
            const product = products.find(p => String(p.id) === String(item.product_id))
            return (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1">
                  <Select
                    value={item.product_id}
                    onChange={e => updateItem(idx, 'product_id', e.target.value)}
                    error={errors[`item_${idx}`]}
                  >
                    <option value="">Select product…</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                        {p.name} — ₹{p.price} (stock: {p.quantity})
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    min="1"
                    max={product?.quantity || 9999}
                    value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                    error={errors[`item_qty_${idx}`]}
                  />
                </div>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(idx)} className="mt-2 text-red-400 hover:text-red-600 p-1">✕</button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {total > 0 && (
        <div className="bg-indigo-50 rounded-lg px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-indigo-700 font-medium">Estimated Total</span>
          <span className="text-lg font-bold text-indigo-800">₹{total.toFixed(2)}</span>
        </div>
      )}

      <Input label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Delivery instructions, special requests…" />

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Place Order</Button>
      </div>
    </form>
  )
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)

  function load() {
    setLoading(true)
    getOrders()
      .then(r => setOrders(r.data))
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleSave(data) {
    setSaving(true)
    try {
      await createOrder(data)
      toast.success('Order placed successfully')
      setShowAdd(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to place order')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setSaving(true)
    try {
      await deleteOrder(confirm.id)
      toast.success(`Order #${confirm.id} cancelled`)
      setConfirm(null)
      load()
    } catch {
      toast.error('Failed to cancel order')
    } finally {
      setSaving(false)
    }
  }

  const filtered = orders.filter(o =>
    String(o.id).includes(search) ||
    (o.customer?.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <Spinner />
  if (error) return <ErrorAlert message={error} />

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Search by order ID or customer name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAdd(true)} className="shrink-0">
          <Plus className="w-4 h-4" /> New Order
        </Button>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders yet"
            description={search ? 'No matching orders.' : 'Create your first order to get started.'}
            action={!search && <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> New Order</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Order</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Items</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(o => (
                  <tr key={o.id} className="table-row-hover">
                    <td className="px-6 py-3 font-medium text-indigo-600">#{o.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-800 font-medium">{o.customer?.full_name}</p>
                      <p className="text-xs text-slate-400">{o.customer?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{o.items?.length} item{o.items?.length !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">₹{o.total_amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <Badge color={o.status === 'pending' ? 'yellow' : 'green'}>{o.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Link to={`/orders/${o.id}`}>
                          <button className="p-1.5 rounded-lg hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => setConfirm(o)}
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

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Place New Order">
        <OrderForm onSubmit={handleSave} onClose={() => setShowAdd(false)} loading={saving} />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={saving}
        title="Cancel Order"
        description={`Cancel Order #${confirm?.id}? Stock will be restored automatically.`}
      />
    </>
  )
}
