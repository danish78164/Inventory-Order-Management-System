import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Menu,
  X,
  Boxes,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
]

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-100 shadow-sm flex flex-col transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm">
            <Boxes className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-800 leading-tight text-base">StockFlow</p>
            <p className="text-xs text-slate-400 leading-tight">Inventory System</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'nav-active'
                    : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                }`
              }
            >
              <Icon className="w-4.5 h-4.5 w-5 h-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">v1.0.0 · Production</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-4 sm:px-8 py-4 flex items-center gap-4 shadow-sm">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-800 capitalize">
              {location.pathname === '/'
                ? 'Dashboard'
                : location.pathname.split('/')[1]}
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block">
              Manage your inventory, customers, and orders
            </p>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
