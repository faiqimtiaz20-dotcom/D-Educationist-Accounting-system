import { DataTable, type Column } from '@/components/shared/DataTable'
import { MetricCard } from '@/components/shared/MetricCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { taxRecords } from '@/data'
import { getBranchName } from '@/data/branches'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { formatCurrency } from '@/lib/calculations'
import { branchFilterOptions } from '@/lib/filter-options'
import type { TaxRecord } from '@/types'
import { FileCheck, Receipt, Scale, Wallet } from 'lucide-react'
import { useMemo } from 'react'

export default function TaxCompliancePage() {
  const filtered = useBranchFilter(taxRecords)

  const summary = useMemo(() => {
    const currentPeriod = 'Jul 2026'
    const periodRecords = filtered.filter((r) => r.period === currentPeriod)
    const sum = (type: TaxRecord['type']) =>
      periodRecords.filter((r) => r.type === type).reduce((s, r) => s + r.amount, 0)

    return {
      whtReceivable: sum('WHT Receivable'),
      whtPayable: sum('WHT Payable'),
      gstInput: sum('GST Input'),
      gstOutput: sum('GST Output'),
      srbSst: sum('SRB-SST'),
      salaryTax: sum('Salary Tax'),
      totalLiability: sum('WHT Payable') + sum('GST Output') + sum('SRB-SST') + sum('Salary Tax'),
      totalReceivable: sum('WHT Receivable') + sum('GST Input'),
    }
  }, [filtered])

  const periodOptions = useMemo(
    () => [...new Set(filtered.map((r) => r.period))].map((p) => ({ label: p, value: p })),
    [filtered]
  )

  const columns: Column<TaxRecord>[] = useMemo(() => [
    { key: 'type', header: 'Tax Type', cell: (r) => r.type },
    { key: 'period', header: 'Period', cell: (r) => r.period },
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
        title="Tax Compliance"
        subtitle="Unified tax dashboard — WHT, GST, SRB-SST, and salary tax"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="WHT Receivable (Jul)" value={formatCurrency(summary.whtReceivable)} icon={Receipt} accent="green" />
        <MetricCard title="WHT Payable (Jul)" value={formatCurrency(summary.whtPayable)} icon={Wallet} accent="orange" />
        <MetricCard title="GST Net (Jul)" value={formatCurrency(summary.gstOutput - summary.gstInput)} icon={Scale} accent="blue" />
        <MetricCard title="Total Tax Liability" value={formatCurrency(summary.totalLiability)} icon={FileCheck} accent="purple" />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <MetricCard title="GST Input" value={formatCurrency(summary.gstInput)} accent="blue" />
        <MetricCard title="GST Output" value={formatCurrency(summary.gstOutput)} accent="orange" />
        <MetricCard title="SRB-SST + Salary Tax" value={formatCurrency(summary.srbSst + summary.salaryTax)} accent="yellow" />
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search tax records..."
        searchFilter={(row, q) =>
          row.type.toLowerCase().includes(q) ||
          row.period.toLowerCase().includes(q)
        }
        filters={[
          { key: 'branch', label: 'Branch', type: 'select', options: branchFilterOptions, accessor: (r) => r.branchId },
          { key: 'type', label: 'Tax Type', type: 'select', options: ['WHT Receivable', 'WHT Payable', 'GST Input', 'GST Output', 'SRB-SST', 'Salary Tax'].map((t) => ({ label: t, value: t })), accessor: (r) => r.type },
          { key: 'period', label: 'Period', type: 'select', options: periodOptions, accessor: (r) => r.period },
          { key: 'amount', label: 'Amount', type: 'numberRange', accessor: (r) => r.amount },
        ]}
      />
    </div>
  )
}
