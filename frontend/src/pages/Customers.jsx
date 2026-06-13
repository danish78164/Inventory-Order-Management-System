import React, { useEffect, useState } from 'react'
import { Users, Plus, Trash2, Search, Mail, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { getCustomers, createCustomer, deleteCustomer } from '../utils/api'
import {
  Button, Card, Modal, Input, EmptyState, Spinner, ErrorAlert, ConfirmDialog
} from '../components/UI'

function CustomerForm({ onSubmit, onClose, loading }) {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '' })
  const [errors, setErrors] = useState({})

  function validate() {
    const e = {}
    if (!form.full_name.trim()) e.full_name = 'Name is required'
    if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Valid email is required'
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
    onSubmit(form)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Full Name" name="full_name" value={form.full_name} onChange={handle} error={errors.full_name} required />
      <Input label="Email Address" name="email" type="email" value={form.email} onChange={handle} error={errors.email} required />
      <Input label="Phone Number" name="phone" type="tel" value={form.phone} onChange={handle} placeholder="+91 98765 43210" />
      <Input label="Address" name="address" value={form.address} onChange={handle} placeholder="Street, City, State" />
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" loading={loading}>Add Customer</Button>
      </div>
    </form>
  )
}

function Avatar({ name }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const colors = ['bg-indigo-100 text-indigo-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-pink-100 text-pink-700']
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${color}`}>
      {initials}
    </div>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(null)

  function load() {
    setLoading(true)
    getCustomers()
      .then(r => setCustomers(r.data))
      .catch(() => setError('Failed to load customers'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleSave(data) {
    setSaving(true)
    try {
      await createCustomer(data)
      toast.success('Customer added')
      setShowAdd(false)
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
      await deleteCustomer(confirm.id)
      toast.success(`"${confirm.full_name}" removed`)
      setConfirm(null)
      load()
    } catch {
      toast.error('Failed to delete customer')
    } finally {
      setSaving(false)
    }
  }

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
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
            placeholder="Search by name, email, or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => setShowAdd(true)} className="shrink-0">
          <Plus className="w-4 h-4" /> Add Customer
        </Button>
      </div>

      <Card>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description={search ? 'Try a different search term.' : 'Add your first customer to get started.'}
            action={!search && <Button onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> Add Customer</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Contact</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Address</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Joined</th>
                  <th className="px-4 py-3 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(c => (
                  <tr key={c.id} className="table-row-hover">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.full_name} />
                        <div>
                          <p className="font-medium text-slate-800">{c.full_name}</p>
                          <p className="text-xs text-slate-400">ID #{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1 text-xs text-slate-600">
                          <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                        </span>
                        {c.phone && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">
                      {c.address || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setConfirm(c)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add New Customer">
        <CustomerForm onSubmit={handleSave} onClose={() => setShowAdd(false)} loading={saving} />
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={handleDelete}
        loading={saving}
        title="Remove Customer"
        description={`Are you sure you want to remove "${confirm?.full_name}"? Their order history will also be deleted.`}
      />
    </>
  )
}
