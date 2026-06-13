import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Users, ShoppingCart, AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react'
import { getDashboardStats } from '../utils/api'
import { Card, Badge, Spinner, ErrorAlert } from '../components/UI'

function StatCard({ icon: Icon, label, value, color, to }) {
  const colors = {
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', ring: 'ring-indigo-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
    amber:   { bg: 'bg-amber-50',  icon: 'text-amber-600',  ring: 'ring-amber-100'  },
  }
  const c = colors[color] || colors.indigo
  return (
    <Link to={to}>
      <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer group">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{value ?? '—'}</p>
          </div>
          <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center ring-1 ${c.ring}`}>
            <Icon className={`w-5 h-5 ${c.icon}`} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1 text-xs text-indigo-600 group-hover:underline">
          <span>View all</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </Card>
    </Link>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getDashboardStats()
      .then(res => setStats(res.data))
      .catch(() => setError('Failed to load dashboard data. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (error) return <ErrorAlert message={error} />

  const { total_products, total_customers, total_orders, low_stock_products, recent_orders } = stats

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard icon={Package}      label="Total Products"  value={total_products}  color="indigo"  to="/products" />
        <StatCard icon={Users}        label="Total Customers" value={total_customers} color="emerald" to="/customers" />
        <StatCard icon={ShoppingCart} label="Total Orders"    value={total_orders}    color="amber"   to="/orders" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <Card>
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-50">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-semibold text-slate-700">Low Stock Alert</h2>
            <Badge color="yellow">{low_stock_products.length}</Badge>
          </div>
          {low_stock_products.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">All products are well-stocked.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {low_stock_products.map(p => (
                <div key={p.id} className="flex items-center justify-between px-6 py-3 table-row-hover">
                  <div>
                    <p className="text-sm font-medium text-slate-700">{p.name}</p>
                    <p className="text-xs text-slate-400">SKU: {p.sku}</p>
                  </div>
                  <Badge color={p.quantity === 0 ? 'red' : 'yellow'}>
                    {p.quantity === 0 ? 'Out of stock' : `${p.quantity} left`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Orders */}
        <Card>
          <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-50">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-semibold text-slate-700">Recent Orders</h2>
          </div>
          {recent_orders.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10">No orders yet.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {recent_orders.map(o => (
                <Link
                  to={`/orders/${o.id}`}
                  key={o.id}
                  className="flex items-center justify-between px-6 py-3 table-row-hover group"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      Order #{o.id}
                    </p>
                    <p className="text-xs text-slate-400">{o.customer?.full_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      ₹{o.total_amount.toFixed(2)}
                    </p>
                    <Badge color={o.status === 'pending' ? 'yellow' : 'green'}>{o.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
