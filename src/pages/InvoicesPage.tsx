import { DataTable, type Column } from '@/components/shared/DataTable'
import { InvoicePaymentPanel } from '@/components/shared/InvoicePaymentPanel'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusPill } from '@/components/shared/StatusPill'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getBranchName } from '@/data'
import { branchFilterOptions, currencyFilterOptions } from '@/lib/filter-options'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { useCurrentUser } from '@/hooks/useAuth'
import { useModulePermission } from '@/hooks/usePermission'
import { canViewAllBranches } from '@/lib/permissions'
import { formatCurrency, netCommission, netFee } from '@/lib/calculations'
import { invoiceHasPayments, useDataStore } from '@/store/data-store'
import { isDateLocked } from '@/store/settings-store'
import type { Currency, Invoice, InvoiceStatus } from '@/types'
import { Eye, FileText, MoreHorizontal, Pencil, Send, Trash2, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

const COMMISSION_RATES = [10, 12.5, 15, 17.5, 20, 22.5]
const invoiceStatuses: InvoiceStatus[] = ['Draft', 'Sent', 'Partially Received', 'Fully Received', 'Closed']

const formatDate = (iso: string) => {
  const [year, month, day] = iso.split('-')
  if (!year || !month || !day) return iso
  return `${day}/${month}/${year}`
}

const emptyForm = {
  studentId: '',
  branchId: 'khi',
  invoiceDate: new Date().toISOString().slice(0, 10),
  poNumber: '',
  tuitionFee: 0,
  scholarship: 0,
  commissionRate: 15,
  currency: 'GBP' as Currency,
  bonus: 0,
  status: 'Draft' as InvoiceStatus,
}

export default function InvoicesPage() {
  const currentUser = useCurrentUser()
  const isSuperAdmin = currentUser ? canViewAllBranches(currentUser.role) : false
  const { canWrite } = useModulePermission('Invoices & Receivables')
  const invoices = useDataStore((s) => s.invoices)
  const receivables = useDataStore((s) => s.receivables)
  const students = useDataStore((s) => s.students)
  const addInvoice = useDataStore((s) => s.addInvoice)
  const updateInvoice = useDataStore((s) => s.updateInvoice)
  const deleteInvoice = useDataStore((s) => s.deleteInvoice)
  const getInvoiceAmountPaid = useDataStore((s) => s.getInvoiceAmountPaid)

  const getStudent = (id: string) => students.find((s) => s.id === id)

  const branchStudents = useBranchFilter(students)
  const branchInvoices = useBranchFilter(invoices)
  const [activeStatus, setActiveStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null)
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [sendInvoice, setSendInvoice] = useState<Invoice | null>(null)
  const [isResend, setIsResend] = useState(false)
  const [emailForm, setEmailForm] = useState({ to: '', cc: '', subject: '', body: '' })

  const paymentInvoice = paymentInvoiceId
    ? invoices.find((i) => i.id === paymentInvoiceId) ?? null
    : null

  const filtered = useMemo(() => {
    if (activeStatus === 'all') return branchInvoices
    return branchInvoices.filter((i) => i.status === activeStatus)
  }, [branchInvoices, activeStatus])

  const statusPills = useMemo(() => {
    const counts = invoiceStatuses.reduce(
      (acc, status) => {
        acc[status] = branchInvoices.filter((i) => i.status === status).length
        return acc
      },
      {} as Record<string, number>
    )
    return [
      { label: 'All', value: 'all', count: branchInvoices.length },
      ...invoiceStatuses.map((status) => ({ label: status, value: status, count: counts[status] })),
    ]
  }, [branchInvoices])

  const selectedStudent = students.find((s) => s.id === form.studentId)
  const netFeeAmount = netFee(form.tuitionFee, form.scholarship)
  const commissionAmount = netCommission(form.tuitionFee, form.scholarship, form.commissionRate)
  const totalDue = commissionAmount + form.bonus

  const openCreate = () => {
    setIsEdit(false)
    setEditId(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (invoice: Invoice) => {
    setIsEdit(true)
    setEditId(invoice.id)
    setForm({
      studentId: invoice.studentId,
      branchId: invoice.branchId,
      invoiceDate: invoice.invoiceDate,
      poNumber: invoice.poNumber ?? '',
      tuitionFee: invoice.tuitionFee,
      scholarship: invoice.scholarship,
      commissionRate: invoice.commissionRate,
      currency: invoice.currency,
      bonus: invoice.bonus,
      status: invoice.status,
    })
    setDialogOpen(true)
  }

  const prefillEmail = (invoice: Invoice) => {
    const student = getStudent(invoice.studentId)
    const amount = netCommission(invoice.tuitionFee, invoice.scholarship, invoice.commissionRate) + invoice.bonus
    setSendInvoice(invoice)
    setEmailForm({
      to: student?.email ?? '',
      cc: '',
      subject: `Commission Invoice ${invoice.invoiceNo}`,
      body:
        `Dear Sir/Madam,\n\n` +
        `Please find attached commission invoice ${invoice.invoiceNo} dated ${formatDate(invoice.invoiceDate)}` +
        `${student ? ` for ${student.name} (${student.university})` : ''}.\n\n` +
        `Total amount: ${formatCurrency(amount, invoice.currency)}.\n\n` +
        `Kind regards,\nD' Educationist`,
    })
  }

  const openSend = (invoice: Invoice) => {
    if (!canWrite) {
      toast.error('You do not have permission to send invoices')
      return
    }
    if (invoice.status !== 'Draft') {
      toast.error('Only draft invoices can be sent')
      return
    }
    setIsResend(false)
    prefillEmail(invoice)
  }

  const openResend = (invoice: Invoice) => {
    if (!canWrite) {
      toast.error('You do not have permission to send invoices')
      return
    }
    if (invoice.status === 'Draft') {
      toast.error('Draft invoices must be sent first')
      return
    }
    setIsResend(true)
    prefillEmail(invoice)
  }

  const handleSend = () => {
    if (!sendInvoice) return
    if (!canWrite) {
      toast.error('You do not have permission to send invoices')
      return
    }
    if (!emailForm.to.trim()) {
      toast.error('Recipient (To) is required')
      return
    }
    if (isResend) {
      toast.success(`Invoice ${sendInvoice.invoiceNo} resent to ${emailForm.to}`)
      setSendInvoice(null)
      return
    }
    if (isDateLocked(sendInvoice.invoiceDate)) {
      toast.error('This period is locked — cannot post to a closed fiscal period')
      return
    }
    updateInvoice(sendInvoice.id, { status: 'Sent' })
    toast.success(`Invoice ${sendInvoice.invoiceNo} sent to ${emailForm.to}`)
    setSendInvoice(null)
  }

  const handleDelete = (invoice: Invoice) => {
    if (!canWrite) return
    if (!confirm(`Delete invoice ${invoice.invoiceNo}?`)) return
    const ok = deleteInvoice(invoice.id)
    if (ok) toast.success('Invoice deleted')
    else toast.error('Cannot delete invoice with recorded payments')
  }

  const loadStudent = (studentId: string) => {
    const student = students.find((s) => s.id === studentId)
    if (!student) return
    setForm((prev) => ({
      ...prev,
      studentId,
      branchId: student.branchId,
      tuitionFee: student.tuitionFee,
      scholarship: student.scholarship,
      commissionRate: student.expectedCommissionRate,
      currency: student.currency,
    }))
  }

  const handleSave = () => {
    if (!canWrite) {
      toast.error('You do not have permission to modify invoices')
      return
    }
    if (!form.studentId) {
      toast.error('Please select a student')
      return
    }
    if (form.scholarship > form.tuitionFee) {
      toast.error('Scholarship cannot exceed tuition fee')
      return
    }
    if (isDateLocked(form.invoiceDate)) {
      toast.error('This period is locked — cannot post to a closed fiscal period')
      return
    }
    if (isEdit && editId && invoiceHasPayments(receivables, editId)) {
      const existing = invoices.find((i) => i.id === editId)
      if (existing && (
        form.tuitionFee !== existing.tuitionFee ||
        form.scholarship !== existing.scholarship ||
        form.commissionRate !== existing.commissionRate ||
        form.bonus !== existing.bonus
      )) {
        toast.error('Cannot change financial amounts after payments have been recorded')
        return
      }
    }
    if (isEdit && editId) {
      updateInvoice(editId, form)
      toast.success('Invoice updated')
    } else {
      addInvoice({ ...form, status: 'Draft' })
      toast.success('Invoice created as Draft')
    }
    setDialogOpen(false)
  }

  const editingHasPayments = isEdit && editId ? invoiceHasPayments(receivables, editId) : false

  const columns: Column<Invoice>[] = [
    { key: 'date', header: 'Date', cell: (row) => formatDate(row.invoiceDate), sortAccessor: (row) => row.invoiceDate },
    { key: 'invoiceNo', header: 'Invoice No.', cell: (row) => <span className="font-medium">{row.invoiceNo}</span> },
    { key: 'studentId', header: 'Student ID', cell: (row) => getStudent(row.studentId)?.studentId ?? row.studentId },
    { key: 'student', header: 'Student', cell: (row) => getStudent(row.studentId)?.name ?? row.studentId },
    ...(isSuperAdmin
      ? [{ key: 'branch', header: 'Branch', cell: (row: Invoice) => getBranchName(row.branchId) }]
      : []),
    { key: 'university', header: 'University', cell: (row) => getStudent(row.studentId)?.university ?? '—' },
    { key: 'course', header: 'Course', cell: (row) => getStudent(row.studentId)?.course ?? '—' },
    { key: 'tuitionFee', header: 'Tuition Fee', cell: (row) => formatCurrency(row.tuitionFee, row.currency), className: 'text-right' },
    { key: 'scholarship', header: 'Scholarship', cell: (row) => formatCurrency(row.scholarship, row.currency), className: 'text-right' },
    { key: 'currency', header: 'Currency', cell: (row) => row.currency },
    { key: 'commissionRate', header: 'Commission %', cell: (row) => `${row.commissionRate}%`, className: 'text-right' },
    {
      key: 'total',
      header: 'Inv Amount',
      className: 'text-right',
      sortAccessor: (row) => netCommission(row.tuitionFee, row.scholarship, row.commissionRate) + row.bonus,
      cell: (row) => formatCurrency(netCommission(row.tuitionFee, row.scholarship, row.commissionRate) + row.bonus, row.currency),
    },
    {
      key: 'paid',
      header: 'Amount Paid',
      sortAccessor: (row) => getInvoiceAmountPaid(row.id),
      cell: (row) => {
        const paid = getInvoiceAmountPaid(row.id)
        const total = netCommission(row.tuitionFee, row.scholarship, row.commissionRate) + row.bonus
        return (
          <span className={paid >= total ? 'text-emerald-600 font-medium' : paid > 0 ? 'text-amber-600' : ''}>
            {formatCurrency(paid, row.currency)}
          </span>
        )
      },
    },
    {
      key: 'outstanding',
      header: 'Outstanding',
      sortAccessor: (row) => Math.max(0, netCommission(row.tuitionFee, row.scholarship, row.commissionRate) + row.bonus - getInvoiceAmountPaid(row.id)),
      cell: (row) => {
        const paid = getInvoiceAmountPaid(row.id)
        const total = netCommission(row.tuitionFee, row.scholarship, row.commissionRate) + row.bonus
        const out = Math.max(0, total - paid)
        return formatCurrency(out, row.currency)
      },
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusPill status={row.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" title="Actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canWrite && row.status === 'Draft' && (
              <DropdownMenuItem className="text-primary" onClick={() => openSend(row)}>
                <Send /> Send invoice
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => setPreviewInvoice(row)}>
              <Eye /> Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPaymentInvoiceId(row.id)}>
              <Wallet /> Payment history
            </DropdownMenuItem>
            {canWrite && row.status !== 'Draft' && (
              <DropdownMenuItem onClick={() => openResend(row)}>
                <Send /> Resend invoice
              </DropdownMenuItem>
            )}
            {canWrite && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openEdit(row)}>
                  <Pencil /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleDelete(row)}
                >
                  <Trash2 /> Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const previewStudent = previewInvoice ? getStudent(previewInvoice.studentId) : null
  const previewCommission = previewInvoice
    ? netCommission(previewInvoice.tuitionFee, previewInvoice.scholarship, previewInvoice.commissionRate)
    : 0
  const previewPaid = previewInvoice ? getInvoiceAmountPaid(previewInvoice.id) : 0

  return (
    <div>
      <PageHeader
        title="Commission Invoices"
        subtitle="Generate and track university commission invoices"
        actionLabel={canWrite ? 'Create Invoice' : undefined}
        onAction={canWrite ? openCreate : undefined}
      />

      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search invoices, students..."
        searchFilter={(row, query) => {
          const student = getStudent(row.studentId)
          return row.invoiceNo.toLowerCase().includes(query) || (student?.name.toLowerCase().includes(query) ?? false)
        }}
        statusPills={statusPills}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        filters={[
          ...(isSuperAdmin
            ? [{ key: 'branch', label: 'Branch', type: 'select' as const, options: branchFilterOptions, accessor: (r: Invoice) => r.branchId }]
            : []),
          { key: 'currency', label: 'Currency', type: 'select', options: currencyFilterOptions, accessor: (r) => r.currency },
          { key: 'invoiceDate', label: 'Invoice Date', type: 'dateRange', accessor: (r) => r.invoiceDate },
          { key: 'amount', label: 'Invoice Amount', type: 'numberRange', accessor: (r) => netCommission(r.tuitionFee, r.scholarship, r.commissionRate) + r.bonus },
        ]}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Invoice' : 'Create Commission Invoice'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Student (from Master Sheet)</Label>
              <Select value={form.studentId} onValueChange={loadStudent}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {branchStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.studentId} — {s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStudent && (
              <Card className="bg-muted/30">
                <CardContent className="space-y-1 p-4 text-sm">
                  <p><span className="text-muted-foreground">University:</span> {selectedStudent.university}</p>
                  <p><span className="text-muted-foreground">Course:</span> {selectedStudent.course}</p>
                  <p><span className="text-muted-foreground">Intake:</span> {selectedStudent.intake}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Input type="date" value={form.invoiceDate} onChange={(e) => setForm((p) => ({ ...p, invoiceDate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>PO Number</Label>
                <Input value={form.poNumber} onChange={(e) => setForm((p) => ({ ...p, poNumber: e.target.value }))} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label>Tuition Fee</Label>
                <Input type="number" disabled={editingHasPayments} value={form.tuitionFee} onChange={(e) => setForm((p) => ({ ...p, tuitionFee: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Scholarship</Label>
                <Input type="number" disabled={editingHasPayments} value={form.scholarship} onChange={(e) => setForm((p) => ({ ...p, scholarship: Number(e.target.value) }))} />
              </div>
              <div className="space-y-2">
                <Label>Commission Rate</Label>
                <Select disabled={editingHasPayments} value={String(form.commissionRate)} onValueChange={(v) => setForm((p) => ({ ...p, commissionRate: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COMMISSION_RATES.map((rate) => (
                      <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => setForm((p) => ({ ...p, currency: v as Currency }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['GBP', 'USD', 'CAD', 'AUD', 'EUR'] as const).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Bonus / Incentive</Label>
                <Input type="number" disabled={editingHasPayments} value={form.bonus} onChange={(e) => setForm((p) => ({ ...p, bonus: Number(e.target.value) }))} />
              </div>
              {editingHasPayments && (
                <p className="text-xs text-amber-600 sm:col-span-2">Financial fields are locked because payments exist on this invoice.</p>
              )}
              {isEdit && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as InvoiceStatus }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {invoiceStatuses.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="space-y-2 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Fee</span>
                  <span className="font-medium">{formatCurrency(netFeeAmount, form.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Commission ({form.commissionRate}%)</span>
                  <span className="font-medium">{formatCurrency(commissionAmount, form.currency)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 text-base font-bold">
                  <span>Total Invoice Amount</span>
                  <span>{formatCurrency(totalDue, form.currency)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{isEdit ? 'Save Changes' : 'Save as Draft'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewInvoice} onOpenChange={(open) => !open && setPreviewInvoice(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Invoice Preview
            </DialogTitle>
          </DialogHeader>
          {previewInvoice && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="mb-4 border-b pb-4 text-center">
                  <p className="text-lg font-bold">D' Educationist</p>
                  <p className="text-sm text-muted-foreground">Commission Invoice</p>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                  <div><p className="text-muted-foreground">Invoice No.</p><p className="font-medium">{previewInvoice.invoiceNo}</p></div>
                  <div><p className="text-muted-foreground">Date</p><p className="font-medium">{formatDate(previewInvoice.invoiceDate)}</p></div>
                  <div><p className="text-muted-foreground">Status</p><StatusPill status={previewInvoice.status} /></div>
                </div>
                {previewStudent && (
                  <div className="mb-4 space-y-1 rounded bg-muted/40 p-3 text-sm">
                    <p><strong>{previewStudent.name}</strong></p>
                    <p>{previewStudent.university} — {previewStudent.course}</p>
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Total Invoice</span><span>{formatCurrency(previewCommission + previewInvoice.bonus, previewInvoice.currency)}</span></div>
                  <div className="flex justify-between text-emerald-600"><span>Amount Paid</span><span>{formatCurrency(previewPaid, previewInvoice.currency)}</span></div>
                  <div className="flex justify-between font-bold border-t pt-2"><span>Outstanding</span><span>{formatCurrency(Math.max(0, previewCommission + previewInvoice.bonus - previewPaid), previewInvoice.currency)}</span></div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewInvoice(null)}>Close</Button>
                {canWrite && previewInvoice.status === 'Draft' && (
                  <Button
                    variant="outline"
                    onClick={() => { openSend(previewInvoice); setPreviewInvoice(null) }}
                  >
                    <Send className="mr-1.5 h-4 w-4" /> Send Invoice
                  </Button>
                )}
                <Button onClick={() => toast.success('PDF export started')}>Export PDF</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!sendInvoice} onOpenChange={(open) => !open && setSendInvoice(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" /> {isResend ? 'Resend' : 'Send'} Invoice {sendInvoice?.invoiceNo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>To</Label>
              <Input
                type="email"
                value={emailForm.to}
                onChange={(e) => setEmailForm((p) => ({ ...p, to: e.target.value }))}
                placeholder="recipient@university.edu"
              />
            </div>
            <div className="space-y-2">
              <Label>CC</Label>
              <Input
                value={emailForm.cc}
                onChange={(e) => setEmailForm((p) => ({ ...p, cc: e.target.value }))}
                placeholder="Comma-separated emails (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={emailForm.subject}
                onChange={(e) => setEmailForm((p) => ({ ...p, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                rows={8}
                value={emailForm.body}
                onChange={(e) => setEmailForm((p) => ({ ...p, body: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSendInvoice(null)}>Cancel</Button>
              <Button onClick={handleSend}>
                <Send className="mr-1.5 h-4 w-4" /> {isResend ? 'Resend' : 'Send'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={!!paymentInvoiceId} onOpenChange={(open) => !open && setPaymentInvoiceId(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Invoice Payment History</SheetTitle>
          </SheetHeader>
          {paymentInvoice && (
            <div className="mt-6">
              <InvoicePaymentPanel
                invoice={paymentInvoice}
                studentName={getStudent(paymentInvoice.studentId)?.name}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
