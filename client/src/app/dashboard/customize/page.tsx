'use client'

import { useState, useEffect } from 'react'
import { useOrg } from '@/hooks/use-org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function CustomizePage() {
  const { org, loading, error, updateOrg } = useOrg()

  const [botName, setBotName] = useState('')
  const [brandColor, setBrandColor] = useState('#65fe08')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [allowedOriginsText, setAllowedOriginsText] = useState('')

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Populate form once org data loads
  useEffect(() => {
    if (org) {
      setBotName(org.botName ?? '')
      setBrandColor(org.brandColor ?? '#65fe08')
      setSystemPrompt(org.systemPrompt ?? '')
      setAllowedOriginsText((org.allowedOrigins ?? []).join('\n'))
    }
  }, [org])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    const allowedOrigins = allowedOriginsText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)

    try {
      await updateOrg({ botName, brandColor, systemPrompt, allowedOrigins })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'Failed to save settings'
      setSaveError(message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white">Customize</h1>
        <div className="text-zinc-400 text-sm">Loading settings…</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-white">Customize</h1>
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Customize</h1>

      <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
        <Card className="bg-zinc-950 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-white text-lg">Bot settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Bot name */}
            <div className="space-y-1.5">
              <Label htmlFor="bot-name" className="text-zinc-300 text-sm">Bot name</Label>
              <Input
                id="bot-name"
                value={botName}
                onChange={e => setBotName(e.target.value)}
                maxLength={60}
                placeholder="e.g. Aria"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-lime-400/40"
              />
            </div>

            {/* Brand color */}
            <div className="space-y-1.5">
              <Label htmlFor="brand-color" className="text-zinc-300 text-sm">Brand color</Label>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-sm select-none">#</span>
                  <Input
                    id="brand-color"
                    value={brandColor.replace(/^#/, '')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6)
                      setBrandColor(`#${raw}`)
                    }}
                    maxLength={6}
                    placeholder="65fe08"
                    className="pl-7 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-lime-400/40 font-mono"
                  />
                </div>
                {/* Live color swatch */}
                <div
                  className="w-10 h-10 rounded-md border border-zinc-700 shrink-0"
                  style={{ backgroundColor: /^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : undefined }}
                  aria-label={`Color preview: ${brandColor}`}
                />
              </div>
            </div>

            {/* System prompt */}
            <div className="space-y-1.5">
              <Label htmlFor="system-prompt" className="text-zinc-300 text-sm">System prompt</Label>
              <Textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                maxLength={2000}
                rows={5}
                placeholder="You are a helpful assistant for…"
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-lime-400/40 resize-y"
              />
              <p className="text-xs text-zinc-500">
                Custom instructions for how the bot should respond
              </p>
            </div>

            {/* Allowed origins */}
            <div className="space-y-1.5">
              <Label htmlFor="allowed-origins" className="text-zinc-300 text-sm">Allowed origins</Label>
              <Textarea
                id="allowed-origins"
                value={allowedOriginsText}
                onChange={e => setAllowedOriginsText(e.target.value)}
                rows={4}
                placeholder={"https://yoursite.com\nhttps://app.yoursite.com"}
                className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-lime-400/40 resize-y font-mono text-sm"
              />
              <p className="text-xs text-zinc-500">
                Domains that can embed your widget (e.g. https://yoursite.com). Leave blank to allow all.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save feedback */}
        {saveError && (
          <p className="text-sm text-red-400">{saveError}</p>
        )}
        {saveSuccess && (
          <p className="text-sm text-lime-400">Settings saved.</p>
        )}

        <Button
          type="submit"
          disabled={saving}
          className="bg-[#65fe08] text-black hover:bg-[#4fcc00] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </div>
  )
}
