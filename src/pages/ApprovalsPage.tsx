import { DataTable, type Column } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusPill } from '@/components/shared/StatusPill'
import { Button } from '@/components/ui/button'
import { getBranchName } from '@/data'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { useCurrentUser } from '@/hooks/useAuth'
import { useModulePermission } from '@/hooks/usePermission'
import { formatCurrency } from '@/lib/calculations'
import { branchFilterOptions } from '@/lib/filter-options'
import { useDataStore } from '@/store/data-store'
import type { Approval, ApprovalStatus } from '@/types'
import { Check, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

export default function ApprovalsPage() {
  const approvals = useDataStore((s) => s.approvals)
  const processApproval = useDataStore((s) => s.processApproval)
  const user = useCurrentUser()
  const { canApprove } = useModulePermission('Approvals')
  const [statusFilter, setStatusFilter] = useState('Pending')

  const branchFiltered = useBranchFilter(approvals)
  const filtered = useMemo(() => {
    if (statusFilter === 'all') return branchFiltered
    return branchFiltered.filter((a) => a.status === statusFilter)
  }, [branchFiltered, statusFilter])

  const handleAction = (id: string, status: 'Approved' | 'Rejected') => {
    if (!user || !canApprove) {
      toast.error('You do not have approval authority')
      return
    }
    const approval = approvals.find((a) => a.id === id)
    if (approval?.requestedById === user.id) {
      toast.error('Segregation of duties: you cannot approve your own request')
      return
    }
    const ok = processApproval(id, status, user.id)
    if (ok) toast.success(`Request ${status.toLowerCase()}`)
    else toast.error('Unable to process approval')
  }

  const columns: Column<Approval>[] = useMemo(() => [
    { key: 'type', header: 'Type', cell: (r) => r.type },
    { key: 'title', header: 'Title', cell: (r) => r.title },
    { key: 'amount', header: 'Amount', className: 'text-right font-mono', cell: (r) => formatCurrency(r.amount) },
    { key: 'requestedBy', header: 'Requested By', cell: (r) => r.requestedBy },
    { key: 'date', header: 'Date', cell: (r) => r.date },
    { key: 'branch', header: 'Branch', cell: (r) => getBranchName(r.branchId) },
    { key: 'status', header: 'Status', cell: (r) => <StatusPill status={r.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      cell: (r) =>
        r.status === 'Pending' && canApprove ? (
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-8 text-emerald-600" onClick={() => handleAction(r.id, 'Approved')}>
              <Check className="mr-1 h-3.5 w-3.5" /> Approve
            </Button>
            <Button size="sm" variant="outline" className="h-8 text-destructive" onClick={() => handleAction(r.id, 'Rejected')}>
              <X className="mr-1 h-3.5 w-3.5" /> Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
  ], [canApprove])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: branchFiltered.length }
    for (const s of ['Pending', 'Approved', 'Rejected'] as ApprovalStatus[]) {
      counts[s] = branchFiltered.filter((a) => a.status === s).length
    }
    return counts
  }, [branchFiltered])

  return (
    <div>
      <PageHeader title="Approvals" subtitle="Expense, payment, journal, and refund approval queue" />
      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search approvals..."
        searchFilter={(row, q) =>
          row.title.toLowerCase().includes(q) ||
          row.type.toLowerCase().includes(q) ||
          row.requestedBy.toLowerCase().includes(q)
        }
        filters={[
          { key: 'branch', label: 'Branch', type: 'select', options: branchFilterOptions, accessor: (r) => r.branchId },
          { key: 'type', label: 'Type', type: 'select', options: ['Expense', 'Sub-Agent Payout', 'Journal', 'Refund', 'Reimbursement', 'Payroll'].map((t) => ({ label: t, value: t })), accessor: (r) => r.type },
          { key: 'date', label: 'Date', type: 'dateRange', accessor: (r) => r.date },
          { key: 'amount', label: 'Amount', type: 'numberRange', accessor: (r) => r.amount },
        ]}
        statusPills={[
          { label: 'All', count: statusCounts.all, value: 'all' },
          { label: 'Pending', count: statusCounts.Pending, value: 'Pending' },
          { label: 'Approved', count: statusCounts.Approved, value: 'Approved' },
          { label: 'Rejected', count: statusCounts.Rejected, value: 'Rejected' },
        ]}
        activeStatus={statusFilter}
        onStatusChange={setStatusFilter}
      />
    </div>
  )
}
