import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { documents } from '@/data'
import { cn } from '@/lib/utils'
import type { Document } from '@/types'
import { FileText, Grid3X3, List, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

const docTypes = ['all', 'Invoice', 'Receipt', 'Bill', 'Contract', 'Agreement'] as const

const typeColors: Record<Document['type'], string> = {
  Invoice: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Receipt: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Bill: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  Contract: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  Agreement: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
}

function DocumentCard({ doc }: { doc: Document }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <FileText className="h-8 w-8 shrink-0 text-muted-foreground" />
          <Badge className={cn('text-xs', typeColors[doc.type])}>{doc.type}</Badge>
        </div>
        <div>
          <p className="truncate text-sm font-medium" title={doc.name}>{doc.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{doc.linkedType} · {doc.linkedId}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{doc.uploadDate}</span>
          <span>{doc.size}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function DocumentRow({ doc }: { doc: Document }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-muted/40">
      <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{doc.name}</p>
        <p className="text-xs text-muted-foreground">{doc.linkedType} · {doc.linkedId}</p>
      </div>
      <Badge className={cn('shrink-0 text-xs', typeColors[doc.type])}>{doc.type}</Badge>
      <span className="hidden shrink-0 text-sm text-muted-foreground sm:block">{doc.uploadDate}</span>
      <span className="shrink-0 text-sm text-muted-foreground">{doc.size}</span>
    </div>
  )
}

export default function DocumentsPage() {
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      const matchesType = typeFilter === 'all' || d.type === typeFilter
      const q = search.toLowerCase()
      const matchesSearch = !q ||
        d.name.toLowerCase().includes(q) ||
        d.linkedType.toLowerCase().includes(q) ||
        d.linkedId.toLowerCase().includes(q)
      return matchesType && matchesSearch
    })
  }, [typeFilter, search])

  return (
    <div>
      <PageHeader title="Documents" subtitle="Invoices, receipts, bills, contracts, and agreements" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {docTypes.map((type) => (
            <Button
              key={type}
              variant={typeFilter === type ? 'default' : 'outline'}
              size="sm"
              className="rounded-full"
              onClick={() => setTypeFilter(type)}
            >
              {type === 'all' ? 'All' : type}
              {type !== 'all' && (
                <span className="ml-1 text-xs opacity-70">
                  ({documents.filter((d) => d.type === type).length})
                </span>
              )}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex rounded-lg border">
            <Button
              variant={view === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-r-none"
              onClick={() => setView('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="rounded-l-none"
              onClick={() => setView('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{filtered.length} document{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted-foreground">No documents match your filters.</p>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  )
}
