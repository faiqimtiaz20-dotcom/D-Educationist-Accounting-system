import { DataTable, type Column } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { Badge } from '@/components/ui/badge'
import { contraEntries } from '@/data'
import { getBranchName } from '@/data/branches'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { formatCurrency } from '@/lib/calculations'
import { branchFilterOptions } from '@/lib/filter-options'
import type { ContraEntry } from '@/types'
import { useMemo } from 'react'

const typeVariant: Record<ContraEntry['type'], 'default' | 'secondary' | 'outline'> = {
  'Cash-Bank': 'default',
  'Bank-Bank': 'secondary',
  'Cash-Cash': 'outline',
}

export default function ContraEntriesPage() {
  const filtered = useBranchFilter(contraEntries)

  const columns: Column<ContraEntry>[] = useMemo(() => [
    { key: 'date', header: 'Date', cell: (r) => r.date },
    {
      key: 'type',
      header: 'Type',
      cell: (r) => <Badge variant={typeVariant[r.type]}>{r.type}</Badge>,
    },
    { key: 'from', header: 'From Account', cell: (r) => r.fromAccount },
    { key: 'to', header: 'To Account', cell: (r) => r.toAccount },
    {
      key: 'amount',
      header: 'Amount',
      className: 'text-right font-mono',
      cell: (r) => formatCurrency(r.amount),
    },
    { key: 'branch', header: 'Branch', cell: (r) => getBranchName(r.branchId) },
  ], [])

  return (
    <div>
      <PageHeader
        title="Contra Entries"
        subtitle="Cash↔Bank, Bank↔Bank, and Cash↔Cash transfers"
      />
      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search contra entries..."
        searchFilter={(row, q) =>
          row.fromAccount.toLowerCase().includes(q) ||
          row.toAccount.toLowerCase().includes(q) ||
          row.type.toLowerCase().includes(q)
        }
        filters={[
          { key: 'branch', label: 'Branch', type: 'select', options: branchFilterOptions, accessor: (r) => r.branchId },
          { key: 'type', label: 'Type', type: 'select', options: ['Cash-Bank', 'Bank-Bank', 'Cash-Cash'].map((t) => ({ label: t, value: t })), accessor: (r) => r.type },
          { key: 'date', label: 'Date', type: 'dateRange', accessor: (r) => r.date },
          { key: 'amount', label: 'Amount', type: 'numberRange', accessor: (r) => r.amount },
        ]}
      />
    </div>
  )
}
