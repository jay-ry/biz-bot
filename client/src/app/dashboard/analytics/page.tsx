'use client'

import { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { MessageSquare, MessagesSquare, AlertCircle, TrendingDown } from 'lucide-react'
import { useAnalytics } from '@/hooks/use-analytics'
import { type AnalyticsRange } from '@/services/analytics'
import { cn } from '@/lib/utils'

const RANGES: { label: string; value: AnalyticsRange }[] = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
]

export default function AnalyticsPage() {
  const [range, setRange] = useState<AnalyticsRange>('7d')
  const { summary, messagesOverTime, busiestHours, unanswered, loading, error } = useAnalytics(range)

  return (
    <div className="space-y-6">
      {/* Page header + range picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-white">Analytics</h1>
        <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-900 p-1" role="group" aria-label="Time range">
          {RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setRange(value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                range === value
                  ? 'bg-[#65fe08] text-black'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800',
              )}
              aria-pressed={range === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-400" role="alert">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Messages"
          value={loading ? null : (summary?.totalMessages ?? 0)}
          icon={<MessageSquare className="h-5 w-5 text-[#65fe08]" aria-hidden="true" />}
        />
        <StatCard
          label="Total Conversations"
          value={loading ? null : (summary?.totalConversations ?? 0)}
          icon={<MessagesSquare className="h-5 w-5 text-[#6366f1]" aria-hidden="true" />}
        />
        <StatCard
          label="Unanswered Count"
          value={loading ? null : (summary?.unansweredCount ?? 0)}
          icon={<AlertCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />}
        />
        <StatCard
          label="Unanswered Rate"
          value={loading ? null : formatRate(summary?.unansweredRate ?? 0)}
          icon={<TrendingDown className="h-5 w-5 text-red-400" aria-hidden="true" />}
        />
      </div>

      {/* Messages over time chart */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-4 text-sm font-medium text-zinc-400">Messages Over Time</h2>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center text-zinc-600 text-sm">
            Loading...
          </div>
        ) : messagesOverTime.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-zinc-600 text-sm">
            No data for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={messagesOverTime} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#71717a', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                cursor={{ stroke: '#3f3f46' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Busiest hours chart */}
      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="mb-1 text-sm font-medium text-zinc-400">Busiest Hours</h2>
        <p className="mb-4 text-xs text-zinc-600">Always last 30 days</p>
        {loading ? (
          <div className="flex h-[300px] items-center justify-center text-zinc-600 text-sm">
            Loading...
          </div>
        ) : busiestHours.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-zinc-600 text-sm">
            No data available.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={busiestHours} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: '#71717a', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(h: number) => `${h}:00`}
              />
              <YAxis
                tick={{ fill: '#71717a', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fff' }}
                cursor={{ fill: 'rgba(99,102,241,0.1)' }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Unanswered questions table */}
      <section className="rounded-lg border border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900">
          <h2 className="text-sm font-medium text-zinc-400">Unanswered Questions</h2>
        </div>
        {loading ? (
          <div className="bg-zinc-950 px-6 py-12 text-center text-sm text-zinc-600">Loading...</div>
        ) : unanswered.length === 0 ? (
          <div className="bg-zinc-950 px-6 py-12 text-center text-sm text-zinc-600">
            No unanswered questions.
          </div>
        ) : (
          <table className="w-full bg-zinc-950 text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider whitespace-nowrap hidden md:table-cell">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {unanswered.map((q, i) => (
                <tr
                  key={q.id}
                  className={cn(
                    'border-b border-zinc-800 last:border-0',
                    i % 2 === 0 ? 'bg-zinc-950' : 'bg-zinc-900/40',
                  )}
                >
                  <td className="px-6 py-3 text-white">{q.content}</td>
                  <td className="px-6 py-3 text-zinc-400 whitespace-nowrap hidden md:table-cell">
                    {new Date(q.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

function formatRate(rate: number): string {
  return (rate * 100).toFixed(1) + '%'
}

interface StatCardProps {
  label: string
  value: number | string | null
  icon: React.ReactNode
}

function StatCard({ label, value, icon }: StatCardProps) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 flex items-center gap-4">
      <div className="shrink-0 rounded-full bg-zinc-800 p-2.5">{icon}</div>
      <div className="min-w-0">
        {value === null ? (
          <div className="h-7 w-16 animate-pulse rounded bg-zinc-800 mb-1" />
        ) : (
          <p className="text-2xl font-bold text-white leading-tight">{value}</p>
        )}
        <p className="text-xs text-zinc-400 truncate">{label}</p>
      </div>
    </div>
  )
}
