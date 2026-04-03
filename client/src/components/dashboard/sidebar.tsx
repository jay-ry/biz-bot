'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FileText, Palette, BarChart2, Code2, LogOut, X } from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/content', label: 'Content', icon: FileText },
  { href: '/dashboard/customize', label: 'Customize', icon: Palette },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart2 },
  { href: '/dashboard/embed', label: 'Embed', icon: Code2 },
]

interface SidebarProps {
  /** Mobile-only: whether the overlay is open */
  mobileOpen?: boolean
  /** Mobile-only: called when the user dismisses the overlay */
  onMobileClose?: () => void
}

export function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const { logout } = useAuth()

  const inner = (
    <aside className="w-56 shrink-0 bg-zinc-950 flex flex-col py-6 px-3 h-full">
      <div className="px-3 mb-8 flex items-center justify-between">
        <Image src="/bizbot.png" alt="BizBot" width={160} height={52} priority />
        {/* Close button — only rendered inside the mobile overlay */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            aria-label="Close navigation"
            className="lg:hidden p-1 rounded-md text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              pathname === href
                ? 'bg-zinc-800 text-lime-400'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        ))}
      </nav>
      <button
        onClick={logout}
        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors"
      >
        <LogOut size={16} />
        Log out
      </button>
    </aside>
  )

  return (
    <>
      {/* Desktop: always-visible sidebar */}
      <div className="hidden lg:flex border-r border-zinc-800">{inner}</div>

      {/* Mobile: slide-in overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            aria-hidden="true"
            onClick={onMobileClose}
          />
          {/* Panel */}
          <div className="fixed inset-y-0 left-0 z-50 flex lg:hidden border-r border-zinc-800">
            {inner}
          </div>
        </>
      )}
    </>
  )
}
