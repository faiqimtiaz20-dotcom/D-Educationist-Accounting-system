import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { MetricCard } from '@/components/shared/MetricCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { formatCurrency } from '@/lib/calculations'
import { useDataStore } from '@/store/data-store'
import type { Expense, LedgerEntry } from '@/types'
import { useMemo, useState } from 'react'

function buildVendorLedger(vendorExpenses: Expense[]): LedgerEntry[] {
  const entries: Omit<LedgerEntry, 'balance'>[] = vendorExpenses.map((e) => ({
    id: e.id,
    date: e.date,
    description: `${e.category} — ${e.approvalStatus}`,
    debit: e.approvalStatus !== 'Approved' ? e.total : 0,
    credit: e.approvalStatus === 'Approved' ? e.total : 0,
    reference: e.id.toUpperCase(),
  }))
  entries.sort((a, b) => a.date.localeCompare(b.date))
  let balance = 0
  return entries.map((e) => {
    balance += e.debit - e.credit
    return { ...e, balance }
  })
}

export default function VendorLedgerPage() {
  const expenses = useDataStore((s) => s.expenses)
  const branchFiltered = useBranchFilter(expenses)
  const vendors = useMemo(() => [...new Set(branchFiltered.map((e) => e.vendor))].sort(), [branchFiltered])
  const [vendor, setVendor] = useState(vendors[0] ?? '')

  const vendorExpenses = useMemo(
    () => branchFiltered.filter((e) => e.vendor === vendor),
    [branchFiltered, vendor]
  )

  const ledger = useMemo(() => buildVendorLedger(vendorExpenses), [vendorExpenses])
  const totalBills = vendorExpenses.reduce((s, e) => s + e.total, 0)
  const totalPaid = vendorExpenses.filter((e) => e.approvalStatus === 'Approved').reduce((s, e) => s + e.total, 0)
  const outstanding = ledger.length ? ledger[ledger.length - 1].balance : 0

  const columns: Column<LedgerEntry & { status?: string }>[] = useMemo(() => [
    { key: 'date', header: 'Date', cell: (r) => r.date },
    { key: 'reference', header: 'Ref', cell: (r) => <span className="font-mono text-sm">{r.reference}</span> },
    { key: 'description', header: 'Description', cell: (r) => r.description },
    { key: 'debit', header: 'Bill (Debit)', className: 'text-right font-mono', cell: (r) => r.debit > 0 ? formatCurrency(r.debit) : '—' },
    { key: 'credit', header: 'Paid (Credit)', className: 'text-right font-mono', cell: (r) => r.credit > 0 ? formatCurrency(r.credit) : '—' },
    { key: 'balance', header: 'Balance', className: 'text-right font-mono font-medium', cell: (r) => formatCurrency(r.balance) },
  ], [])

  return (
    <div>
      <PageHeader title="Vendor Ledger" subtitle="Bills, payments, and outstanding balance per vendor" />

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="space-y-2">
            <Label>Select Vendor</Label>
            <Select value={vendor} onValueChange={setVendor}>
              <SelectTrigger><SelectValue placeholder="Choose a vendor" /></SelectTrigger>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {vendor && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <MetricCard title="Total Bills" value={formatCurrency(totalBills)} accent="blue" />
          <MetricCard title="Total Paid" value={formatCurrency(totalPaid)} accent="green" />
          <MetricCard title="Outstanding" value={formatCurrency(outstanding)} accent="orange" />
        </div>
      )}

      {ledger.length === 0 ? (
        <EmptyState title="No vendor transactions" description="No expenses recorded for this vendor." />
      ) : (
        <DataTable
          data={ledger}
          columns={columns}
          searchPlaceholder="Search vendor ledger..."
          searchFilter={(row, q) => row.description.toLowerCase().includes(q)}
          filters={[
            { key: 'type', label: 'Entry Type', type: 'select', options: [{ label: 'Bill (Debit)', value: 'debit' }, { label: 'Paid (Credit)', value: 'credit' }], accessor: (r) => (r.debit > 0 ? 'debit' : 'credit') },
            { key: 'date', label: 'Date', type: 'dateRange', accessor: (r) => r.date },
            { key: 'amount', label: 'Amount', type: 'numberRange', accessor: (r) => (r.debit > 0 ? r.debit : r.credit) },
          ]}
          newestFirst={false}
          pageSize={15}
        />
      )}
    </div>
  )
}
