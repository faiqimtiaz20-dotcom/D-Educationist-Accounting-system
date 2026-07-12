import { DataTable, type Column } from '@/components/shared/DataTable'
import { EmptyState } from '@/components/shared/EmptyState'
import { MetricCard } from '@/components/shared/MetricCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { buildStudentLedger } from '@/lib/metrics'
import { formatCurrency } from '@/lib/calculations'
import { useDataStore } from '@/store/data-store'
import type { LedgerEntry } from '@/types'
import { useMemo, useState } from 'react'

export default function StudentLedgerPage() {
  const students = useDataStore((s) => s.students)
  const invoices = useDataStore((s) => s.invoices)
  const receivables = useDataStore((s) => s.receivables)
  const branchStudents = useBranchFilter(students)

  const [studentId, setStudentId] = useState(branchStudents[0]?.id ?? '')

  const student = students.find((s) => s.id === studentId)
  const ledger = useMemo(
    () => (studentId ? buildStudentLedger(studentId, invoices, receivables) : []),
    [studentId, invoices, receivables]
  )

  const outstanding = ledger.length ? ledger[ledger.length - 1].balance : 0
  const totalInvoiced = ledger.reduce((s, e) => s + e.debit, 0)
  const totalReceived = ledger.reduce((s, e) => s + e.credit, 0)

  const columns: Column<LedgerEntry>[] = useMemo(() => [
    { key: 'date', header: 'Date', cell: (r) => r.date },
    { key: 'reference', header: 'Reference', cell: (r) => <span className="font-mono text-sm">{r.reference}</span> },
    { key: 'description', header: 'Description', cell: (r) => r.description },
    { key: 'debit', header: 'Debit', className: 'text-right font-mono', cell: (r) => r.debit > 0 ? formatCurrency(r.debit, student?.currency) : '—' },
    { key: 'credit', header: 'Credit', className: 'text-right font-mono', cell: (r) => r.credit > 0 ? formatCurrency(r.credit, student?.currency) : '—' },
    { key: 'balance', header: 'Balance', className: 'text-right font-mono font-medium', cell: (r) => formatCurrency(r.balance, student?.currency) },
  ], [student?.currency])

  return (
    <div>
      <PageHeader title="Student Ledger" subtitle="Invoices, payments, and outstanding balance per student" />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label>Select Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue placeholder="Choose a student" /></SelectTrigger>
              <SelectContent>
                {branchStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.studentId} — {s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {student && (
            <div className="text-sm text-muted-foreground">
              <p>{student.university} · {student.country}</p>
              <p>Status: {student.applicationStatus}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {student && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <MetricCard title="Total Invoiced" value={formatCurrency(totalInvoiced, student.currency)} accent="blue" />
          <MetricCard title="Total Received" value={formatCurrency(totalReceived, student.currency)} accent="green" />
          <MetricCard title="Outstanding" value={formatCurrency(outstanding, student.currency)} accent="orange" />
        </div>
      )}

      {ledger.length === 0 ? (
        <EmptyState title="No ledger entries" description="This student has no invoices or payments yet." />
      ) : (
        <DataTable
          data={ledger}
          columns={columns}
          searchPlaceholder="Search ledger..."
          searchFilter={(row, q) => row.description.toLowerCase().includes(q) || row.reference.toLowerCase().includes(q)}
          filters={[
            { key: 'type', label: 'Entry Type', type: 'select', options: [{ label: 'Debit', value: 'debit' }, { label: 'Credit', value: 'credit' }], accessor: (r) => (r.debit > 0 ? 'debit' : 'credit') },
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
