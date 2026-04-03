'use client'

import { useState } from 'react'
import { useOrg } from '@/hooks/use-org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'

export default function EmbedPage() {
  const { org, loading, error, refresh } = useOrg()
  const [copied, setCopied] = useState(false)

  const snippet = org
    ? `<script src="https://YOUR_DOMAIN/widget/launcher.js?token=${org.publicToken}" defer></script>`
    : ''

  async function handleCopy() {
    if (!snippet) return
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silently ignore
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white">Embed</h1>
        <div className="text-zinc-400 text-sm">Loading embed code…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">Embed</h1>
        <p className="text-red-400 text-sm">{error}</p>
        <Button variant="outline" onClick={refresh}>Try again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-semibold text-white">Embed</h1>

      <Card className="bg-zinc-950 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Widget snippet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-400 text-sm">
            Paste this script tag into the{' '}
            <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded text-xs font-mono">
              &lt;head&gt;
            </code>{' '}
            or just before{' '}
            <code className="text-zinc-300 bg-zinc-800 px-1 py-0.5 rounded text-xs font-mono">
              &lt;/body&gt;
            </code>{' '}
            of any HTML page where you want the widget to appear.
          </p>

          <div className="relative">
            <pre
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-4 text-sm font-mono text-zinc-200 overflow-x-auto whitespace-pre select-text pr-14"
              aria-label="Embed script snippet"
            >
              {snippet}
            </pre>

            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleCopy}
              aria-label={copied ? 'Copied' : 'Copy snippet to clipboard'}
              className="absolute top-2 right-2 text-zinc-400 hover:text-white hover:bg-zinc-700"
            >
              {copied ? (
                <Check className="h-4 w-4 text-[#65fe08]" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>

          <p className="text-zinc-500 text-xs">
            Replace{' '}
            <span className="text-zinc-300 font-mono">YOUR_DOMAIN</span> with
            the domain where your widget is hosted.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
