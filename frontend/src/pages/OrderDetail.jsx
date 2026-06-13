import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Package, Calendar, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { getOrder, deleteOrder } from '../utils/api'
import { Button, Card, Badge, Spinner, ErrorAlert, ConfirmDialog } from '../components/UI'

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right">{value || '—'}</span>
    </div>
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getOrder(id)
      .then(r => setOrder(r.data))
      .catch(() => setError('Order not found'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteOrder(id)
      toast.success(`Order #${id} cancelled`)
      navigate('/orders')
    } catch {
      toast.error('Failed to cancel order')
      setDeleting(false)
    }
  }

  if (loading) return <Spinner />
  if (error) return <ErrorAlert message={error} />

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Order #{order.id}</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {order.created_at ? new Date(order.created_at).toLocaleString() : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge color={order.status === 'pending' ? 'yellow' : 'green'} >
            {order.status}
          </Badge>
          <Button variant="danger" size="sm" onClick={() => setConfirm(true)}>
            Cancel Order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Customer */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-700">Customer</h3>
          </div>
          <InfoRow label="Name"  value={order.customer?.full_name} />
          <InfoRow label="Email" value={order.customer?.email} />
          <InfoRow label="Phone" value={order.customer?.phone} />
        </Card>

        {/* Order Info */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-indigo-500" />
            <h3 className="text-sm font-semibold text-slate-700">Order Details</h3>
          </div>
          <InfoRow label="Order ID" value={`#${order.id}`} />
          <InfoRow label="Status" value={order.status} />
          <InfoRow label="Notes" value={order.notes} />
          <InfoRow
            label="Total"
            value={<span className="text-indigo-700 font-bold text-base">₹{order.total_amount.toFixed(2)}</span>}
          />
        </Card>
      </div>

      {/* Items */}
      <Card>
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-50">
          <Package className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-slate-700">Order Items</h3>
          <span className="text-xs text-slate-400">({order.items?.length})</span>
        </div>
        <div className="divide-y divide-slate-50">
          {order.items?.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{item.product?.name}</p>
                <p className="text-xs text-slate-400">SKU: {item.product?.sku}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600">
                  {item.quantity} × ₹{item.unit_price.toFixed(2)}
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  ₹{(item.quantity * item.unit_price).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center px-5 py-4 bg-indigo-50 rounded-b-xl">
          <span className="text-sm font-semibold text-slate-700">Order Total</span>
          <span className="text-xl font-bold text-indigo-700">₹{order.total_amount.toFixed(2)}</span>
        </div>
      </Card>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Cancel Order"
        description={`Cancel Order #${order.id}? Stock for all items will be restored.`}
      />
    </div>
  )
}
