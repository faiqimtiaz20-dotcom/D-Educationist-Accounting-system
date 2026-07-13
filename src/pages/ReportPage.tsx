import { PageHeader } from '@/components/shared/PageHeader'
import { FilterPanel } from '@/components/shared/FilterPanel'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Button } from '@/components/ui/button'
import { reports } from '@/data/dashboard'
import { branches } from '@/data/branches'
import { useCurrentUser } from '@/hooks/useAuth'
import { canViewAllBranches } from '@/lib/permissions'
import { formatCurrency } from '@/lib/calculations'
import { FileSpreadsheet, FileText, Printer } from 'lucide-react'
import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import type { Branch } from '@/types'

interface ReportRow {
  id: string
  label: string
  branch: string
  amount: number
  period: string
}

function resolveReport(reportId?: string) {
  if (!reportId) return undefined
  return (
    reports.find((r) => r.id === reportId) ??
    reports.find((r) => r.path === `/reports/${reportId}`) ??
    reports.find((r) => r.path.endsWith(`/${reportId}`))
  )
}

function buildMockRows(reportId: string, title: string, branchList: Branch[]): ReportRow[] {
  const seed = reportId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return branchList.map((branch, i) => ({
    id: `${reportId}-${branch.id}`,
    label: `${title} — ${branch.code}`,
    branch: branch.name,
    amount: Math.round((seed + i + 1) * 125000 + ((seed * (i + 3)) % 500000)),
    period: 'Jul 2026',
  }))
}

export function ReportPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const report = resolveReport(reportId)
  const user = useCurrentUser()

  const visibleBranches = useMemo(
    () =>
      user && canViewAllBranches(user.role)
        ? branches
        : branches.filter((b) => b.id === user?.branchId),
    [user]
  )

  const rows = useMemo(
    () => (report ? buildMockRows(reportId ?? report.id, report.title, visibleBranches) : []),
    [report, reportId, visibleBranches]
  )

  const columns: Column<ReportRow>[] = [
    { key: 'label', header: 'Description', cell: (r) => r.label },
    { key: 'branch', header: 'Branch', cell: (r) => r.branch },
    { key: 'period', header: 'Period', cell: (r) => r.period },
    {
      key: 'amount',
      header: 'Amount (PKR)',
      cell: (r) => <span className="font-medium tabular-nums">{formatCurrency(r.amount)}</span>,
      className: 'text-right',
    },
  ]

  const handleExport = (format: 'PDF' | 'Excel' | 'CSV') => {
    toast.success(`${format} export started`, {
      description: `${report?.title ?? 'Report'} will download shortly.`,
    })
  }

  if (!report) {
    return (
      <div>
        <PageHeader title="Report not found" backTo="/reports" />
        <p className="text-muted-foreground">No report matches &ldquo;{reportId}&rdquo;.</p>
      </div>
    )
  }

  const total = rows.reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={report.title}
        subtitle={report.description}
        backTo="/reports"
      >
        <Button variant="outline" size="sm" onClick={() => handleExport('PDF')}>
          <FileText className="mr-1.5 h-4 w-4" /> PDF
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExport('Excel')}>
          <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExport('CSV')}>
          <Printer className="mr-1.5 h-4 w-4" /> CSV
        </Button>
      </PageHeader>

      <FilterPanel showCountry={report.category === 'Commission'} showIntake={false} />

      <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-muted-foreground">
          Category: <strong className="text-foreground">{report.category}</strong>
        </span>
        <span>
          Total: <strong className="tabular-nums">{formatCurrency(total)}</strong>
        </span>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        searchPlaceholder="Search report rows..."
        searchFilter={(row, q) =>
          row.label.toLowerCase().includes(q) || row.branch.toLowerCase().includes(q)
        }
        filters={[
          { key: 'branch', label: 'Branch', type: 'select', options: [...new Set(rows.map((r) => r.branch))].map((b) => ({ label: b, value: b })), accessor: (r) => r.branch },
          { key: 'amount', label: 'Amount (PKR)', type: 'numberRange', accessor: (r) => r.amount },
        ]}
      />
    </div>
  )
}
