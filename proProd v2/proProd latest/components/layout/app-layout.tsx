'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Package,
  Boxes,
  Factory,
  Truck,
  FileText,
  Settings,
  Home,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/raw-materials', label: 'Raw Materials', icon: Boxes },
  { href: '/products', label: 'Products & Batches', icon: Package },
  { href: '/production', label: 'Daily Production', icon: Factory },
  { href: '/dispatch', label: 'Dispatch Records', icon: Truck },
  { href: '/reports', label: 'Reports', icon: FileText },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Sidebar */}
      <aside className="w-64 glass-secondary border-r">
        <div className="p-6 space-y-8">
          {/* Logo/Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              ProProd
            </h1>
            <p className="text-sm text-muted-foreground">
              Production Management
            </p>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href === '/' && pathname === '/')
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'glass-secondary bg-blue-500/20 text-blue-600 dark:text-blue-400'
                      : 'text-muted-foreground hover:bg-white/30 dark:hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6 p-4 glass rounded-lg">
          <p className="text-xs text-muted-foreground text-center">
            v1.0 • Production System
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
