'use client'

import { useState } from 'react'
import { useDocuments } from '@/hooks/use-documents'
import { AddContentDialog } from '@/components/dashboard/add-content-dialog'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2 } from 'lucide-react'

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-yellow-400',
  processing: 'text-cyan-400',
  ready: 'text-lime-400',
  error: 'text-red-400',
}

export default function ContentPage() {
  const { docs, loading, refresh, remove } = useDocuments()
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Content</h1>
        <Button onClick={() => setOpen(true)} className="bg-[#65fe08] text-black hover:bg-[#4fcc00]">
          Add content
        </Button>
      </div>
      <AddContentDialog open={open} onClose={() => setOpen(false)} onSuccess={() => { setOpen(false); refresh() }} />
      <div className="rounded-lg border border-zinc-800 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Title</TableHead>
              <TableHead className="text-zinc-400 hidden md:table-cell">Type</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400 hidden md:table-cell">Added</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {docs.map(doc => (
              <TableRow key={doc.id} className="border-zinc-800 hover:bg-zinc-900">
                <TableCell className="font-medium text-white">{doc.title}</TableCell>
                <TableCell className="capitalize text-zinc-400 hidden md:table-cell">{doc.sourceType}</TableCell>
                <TableCell>
                  <span className={`text-sm font-medium capitalize ${STATUS_COLOR[doc.status] ?? 'text-zinc-400'}`}>
                    {doc.status}
                  </span>
                </TableCell>
                <TableCell className="text-zinc-400 hidden md:table-cell">{new Date(doc.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => remove(doc.id)} className="text-zinc-400 hover:text-red-400">
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!loading && docs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-zinc-500 py-12">
                  No documents yet. Add your first piece of content.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
