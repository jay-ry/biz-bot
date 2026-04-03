'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10">
            <svg
              className="h-7 w-7 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>
        </div>

        <h2 className="mb-2 text-lg font-semibold text-white">
          Page failed to load
        </h2>

        {error.message && (
          <p className="mb-6 text-sm text-zinc-400">{error.message}</p>
        )}

        {!error.message && (
          <p className="mb-6 text-sm text-zinc-400">
            An unexpected error occurred in this section. You can try again or
            navigate to another page.
          </p>
        )}

        {error.digest && (
          <p className="mb-6 font-mono text-xs text-zinc-600">
            Error ID: {error.digest}
          </p>
        )}

        <button
          onClick={unstable_retry}
          className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900"
          style={{ backgroundColor: '#65fe08', '--tw-ring-color': '#65fe08' } as React.CSSProperties}
        >
          Try again
        </button>
      </div>
    </div>
  )
}
