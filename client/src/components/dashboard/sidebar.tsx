'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings, Code } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Customize', href: '/dashboard/customize', icon: Settings },
  { label: 'Embed', href: '/dashboard/embed', icon: Code },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 w-full" aria-label="Dashboard navigation">
      {NAV_ITEMS.map((item) => {
        const isActive =
          item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-[#65fe08]/10 text-[#65fe08]'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
            )}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
