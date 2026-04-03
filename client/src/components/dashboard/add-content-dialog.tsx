'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ingestText, ingestPdf } from '@/services/ingest'
import { cn } from '@/lib/utils'

const textSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
})

const pdfSchema = z.object({
  title: z.string().min(1, 'Title is required'),
})

type TextFormValues = z.infer<typeof textSchema>
type PdfFormValues = z.infer<typeof pdfSchema>

interface AddContentDialogProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function TextTab({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TextFormValues>({
    resolver: standardSchemaResolver(textSchema),
  })

  async function onSubmit(values: TextFormValues) {
    setError(null)
    try {
      await ingestText(values.title, values.content)
      reset()
      onSuccess()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Something went wrong. Please try again.'
      setError(message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="text-title" className="text-zinc-300">
          Title
        </Label>
        <Input
          id="text-title"
          placeholder="e.g. Business FAQ"
          className={cn(
            'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500',
            errors.title && 'border-red-500'
          )}
          {...register('title')}
        />
        {errors.title && (
          <p className="text-xs text-red-400">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="text-content" className="text-zinc-300">
          Content
        </Label>
        <Textarea
          id="text-content"
          placeholder="Paste your text content here..."
          rows={8}
          className={cn(
            'min-h-40 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500',
            errors.content && 'border-red-500'
          )}
          {...register('content')}
        />
        {errors.content && (
          <p className="text-xs text-red-400">{errors.content.message}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="text-zinc-400 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#65fe08] text-black hover:bg-[#4fcc00] disabled:opacity-50"
        >
          {isSubmitting ? 'Uploading...' : 'Add text'}
        </Button>
      </div>
    </form>
  )
}

function PdfTab({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PdfFormValues>({
    resolver: standardSchemaResolver(pdfSchema),
  })

  async function onSubmit(values: PdfFormValues) {
    if (!file) {
      setFileError('Please select a PDF file')
      return
    }
    setError(null)
    setFileError(null)
    try {
      await ingestPdf(values.title, file)
      reset()
      setFile(null)
      onSuccess()
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Something went wrong. Please try again.'
      setError(message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="pdf-title" className="text-zinc-300">
          Title
        </Label>
        <Input
          id="pdf-title"
          placeholder="e.g. Product Brochure"
          className={cn(
            'bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500',
            errors.title && 'border-red-500'
          )}
          {...register('title')}
        />
        {errors.title && (
          <p className="text-xs text-red-400">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="pdf-file" className="text-zinc-300">
          PDF file
        </Label>
        <input
          id="pdf-file"
          type="file"
          accept="application/pdf"
          onChange={e => {
            setFile(e.target.files?.[0] ?? null)
            setFileError(null)
          }}
          className={cn(
            'w-full rounded-2xl border bg-zinc-800 px-3 py-2 text-sm text-zinc-300',
            'file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-700 file:px-3 file:py-1 file:text-xs file:text-white file:cursor-pointer',
            'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/50',
            fileError ? 'border-red-500' : 'border-zinc-700'
          )}
        />
        {fileError && (
          <p className="text-xs text-red-400">{fileError}</p>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          className="text-zinc-400 hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-[#65fe08] text-black hover:bg-[#4fcc00] disabled:opacity-50"
        >
          {isSubmitting ? 'Uploading...' : 'Upload PDF'}
        </Button>
      </div>
    </form>
  )
}

export function AddContentDialog({ open, onClose, onSuccess }: AddContentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={isOpen => { if (!isOpen) onClose() }}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white">Add content</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="text">
          <TabsList className="bg-zinc-800 w-full">
            <TabsTrigger value="text" className="flex-1 data-active:bg-zinc-700 data-active:text-white text-zinc-400">
              Paste text
            </TabsTrigger>
            <TabsTrigger value="pdf" className="flex-1 data-active:bg-zinc-700 data-active:text-white text-zinc-400">
              Upload PDF
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-4">
            <TextTab onSuccess={onSuccess} onClose={onClose} />
          </TabsContent>

          <TabsContent value="pdf" className="mt-4">
            <PdfTab onSuccess={onSuccess} onClose={onClose} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
