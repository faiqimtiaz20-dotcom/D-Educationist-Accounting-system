import { DataTable, type Column } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { RowActions } from '@/components/shared/RowActions'
import { StatusPill } from '@/components/shared/StatusPill'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { getSubAgent, subAgents, users } from '@/data'
import { useCurrentUser } from '@/hooks/useAuth'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { formatCurrency } from '@/lib/calculations'
import { canViewAllBranches } from '@/lib/permissions'
import { getUserName } from '@/lib/org'
import { branchFilterOptions, currencyFilterOptions } from '@/lib/filter-options'
import { useDataStore } from '@/store/data-store'
import type { ApplicationStatus, Student } from '@/types'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

const statuses: ApplicationStatus[] = ['Applied', 'Offer', 'Visa', 'Enrolled', 'Deferred', 'Withdrawn']

const emptyStudent = (branchId = 'khi'): Omit<Student, 'id'> => ({
  studentId: `STU-2026-${String(Math.floor(Math.random() * 900) + 100)}`,
  name: '',
  cnicPassport: '',
  contact: '',
  email: '',
  branchId,
  consultantId: users.find((u) => u.role === 'Counsellor')?.id ?? 'u5',
  country: 'UK',
  university: '',
  course: '',
  intake: 'Sep-2026',
  group: 'G1',
  applicationStatus: 'Applied',
  tuitionFee: 0,
  scholarship: 0,
  expectedCommissionRate: 15,
  currency: 'GBP',
})

export default function MasterSheetPage() {
  const currentUser = useCurrentUser()
  const storeBranches = useDataStore((s) => s.branches)
  const students = useDataStore((s) => s.students)
  const universities = useDataStore((s) => s.universities)
  const addStudent = useDataStore((s) => s.addStudent)
  const updateStudent = useDataStore((s) => s.updateStudent)
  const deleteStudent = useDataStore((s) => s.deleteStudent)

  const branchStudents = useBranchFilter(students)
  const [activeStatus, setActiveStatus] = useState('all')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [isNew, setIsNew] = useState(false)
  const [form, setForm] = useState<Student | Omit<Student, 'id'>>(emptyStudent())

  const isSuperAdmin = currentUser ? canViewAllBranches(currentUser.role) : false
  const isCounsellor = currentUser?.role === 'Counsellor'
  const branchSubAgents = subAgents.filter((a) => a.branchId === form.branchId)
  const branchOptions = storeBranches.filter((b) => !b.isHeadOffice)

  const filtered = useMemo(() => {
    if (activeStatus === 'all') return branchStudents
    return branchStudents.filter((s) => s.applicationStatus === activeStatus)
  }, [branchStudents, activeStatus])

  const statusPills = useMemo(() => {
    const counts = statuses.reduce(
      (acc, status) => {
        acc[status] = branchStudents.filter((s) => s.applicationStatus === status).length
        return acc
      },
      {} as Record<string, number>
    )
    return [
      { label: 'All', value: 'all', count: branchStudents.length },
      ...statuses.map((status) => ({ label: status, value: status, count: counts[status] })),
    ]
  }, [branchStudents])

  const toOptions = (values: string[]) =>
    [...new Set(values.filter(Boolean))].sort().map((v) => ({ label: v, value: v }))
  const countryFilterOptions = useMemo(() => toOptions(branchStudents.map((s) => s.country)), [branchStudents])
  const universityFilterOptions = useMemo(() => toOptions(branchStudents.map((s) => s.university)), [branchStudents])
  const intakeFilterOptions = useMemo(() => toOptions(branchStudents.map((s) => s.intake)), [branchStudents])

  const openAdd = () => {
    setIsNew(true)
    const base = emptyStudent(isSuperAdmin ? 'khi' : (currentUser?.branchId ?? 'khi'))
    setForm(isCounsellor && currentUser ? { ...base, consultantId: currentUser.id } : base)
    setSheetOpen(true)
  }

  const openEdit = (student: Student) => {
    setIsNew(false)
    setForm({ ...student })
    setSheetOpen(true)
  }

  const handleDelete = (student: Student) => {
    if (!confirm(`Delete student ${student.name}?`)) return
    deleteStudent(student.id)
    toast.success('Student deleted')
  }

  const updateField = <K extends keyof Student>(key: K, value: Student[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const loadUniversity = (universityName: string) => {
    const uni = universities.find((u) => u.name === universityName)
    if (!uni) return
    setForm((prev) => ({
      ...prev,
      university: uni.name,
      country: uni.country,
      currency: uni.currency,
      expectedCommissionRate: uni.defaultCommissionRate,
    }))
  }

  const universityOptions = useMemo(() => {
    const names = universities.map((u) => u.name)
    if (form.university && !names.includes(form.university)) {
      return [form.university, ...names]
    }
    return names
  }, [universities, form.university])

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Student name is required')
      return
    }
    if (!form.university) {
      toast.error('Please select a university')
      return
    }
    if (isNew) {
      const payload = {
        ...(form as Omit<Student, 'id'>),
        branchId: isSuperAdmin ? form.branchId : (currentUser?.branchId ?? form.branchId),
      }
      addStudent(payload)
      toast.success('Student added successfully')
    } else if ('id' in form) {
      updateStudent(form.id, form)
      toast.success('Student updated successfully')
    }
    setSheetOpen(false)
  }

  const columns: Column<Student>[] = [
    { key: 'studentId', header: 'Student ID', cell: (row) => <span className="font-medium">{row.studentId}</span> },
    { key: 'name', header: 'Name', cell: (row) => row.name },
    { key: 'branch', header: 'Branch', cell: (row) => storeBranches.find((b) => b.id === row.branchId)?.name ?? row.branchId },
    { key: 'country', header: 'Country', cell: (row) => row.country },
    { key: 'university', header: 'University', cell: (row) => row.university },
    { key: 'course', header: 'Course', cell: (row) => row.course },
    { key: 'intake', header: 'Intake', cell: (row) => row.intake },
    { key: 'status', header: 'Status', cell: (row) => <StatusPill status={row.applicationStatus} /> },
    ...(isCounsellor
      ? []
      : [{
          key: 'commission',
          header: 'Expected Commission',
          cell: (row: Student) =>
            formatCurrency(
              (row.tuitionFee - row.scholarship) * (row.expectedCommissionRate / 100),
              row.currency
            ),
        }]),
    {
      key: 'actions',
      header: 'Actions',
      cell: (row) => <RowActions onEdit={() => openEdit(row)} onDelete={() => handleDelete(row)} />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Master Sheet"
        subtitle="Student records — single source of truth for invoices and receivables"
        actionLabel="Add Student"
        onAction={openAdd}
      />

      <DataTable
        data={filtered}
        columns={columns}
        pageSize={25}
        searchPlaceholder="Search students, universities, courses..."
        searchFilter={(row, query) =>
          row.name.toLowerCase().includes(query) ||
          row.studentId.toLowerCase().includes(query) ||
          row.university.toLowerCase().includes(query) ||
          row.course.toLowerCase().includes(query)
        }
        statusPills={statusPills}
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        filters={[
          { key: 'branch', label: 'Branch', type: 'select', options: branchFilterOptions, accessor: (r) => r.branchId },
          { key: 'country', label: 'Country', type: 'select', options: countryFilterOptions, accessor: (r) => r.country },
          { key: 'university', label: 'University', type: 'select', options: universityFilterOptions, accessor: (r) => r.university },
          { key: 'intake', label: 'Intake', type: 'select', options: intakeFilterOptions, accessor: (r) => r.intake },
          { key: 'currency', label: 'Currency', type: 'select', options: currencyFilterOptions, accessor: (r) => r.currency },
          { key: 'tuitionFee', label: 'Tuition Fee', type: 'numberRange', accessor: (r) => r.tuitionFee },
        ]}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{isNew ? 'Add Student' : (form as Student).name || 'Student Details'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input
                  value={'studentId' in form ? form.studentId : ''}
                  onChange={(e) => updateField('studentId', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Student Name</Label>
                <Input value={form.name} onChange={(e) => updateField('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>CNIC / Passport</Label>
                <Input value={form.cnicPassport} onChange={(e) => updateField('cnicPassport', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Contact No.</Label>
                <Input value={form.contact} onChange={(e) => updateField('contact', e.target.value)} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => updateField('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                {isSuperAdmin ? (
                  <Select
                    value={form.branchId}
                    onValueChange={(v) => setForm((prev) => ({ ...prev, branchId: v, subAgentId: undefined }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {branchOptions.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={storeBranches.find((b) => b.id === form.branchId)?.name ?? ''}
                    readOnly
                    className="bg-muted/50"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label>Consultant</Label>
                {isCounsellor ? (
                  <Input value={getUserName(form.consultantId)} readOnly className="bg-muted/50" />
                ) : (
                  <Select value={form.consultantId} onValueChange={(v) => updateField('consultantId', v)}>
                    <SelectTrigger><SelectValue>{getUserName(form.consultantId)}</SelectValue></SelectTrigger>
                    <SelectContent>
                      {users.filter((u) => u.role === 'Counsellor').map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>University</Label>
                <Select value={form.university || undefined} onValueChange={loadUniversity}>
                  <SelectTrigger><SelectValue placeholder="Select registered university" /></SelectTrigger>
                  <SelectContent>
                    {universityOptions.map((name) => {
                      const uni = universities.find((u) => u.name === name)
                      return (
                        <SelectItem key={name} value={name}>
                          {name}{uni ? ` (${uni.country})` : ''}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                {universities.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No universities registered. Add them in Settings → Registered Universities.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={form.country} readOnly className="bg-muted/50" />
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Input value={form.course} onChange={(e) => updateField('course', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Intake</Label>
                <Input value={form.intake} onChange={(e) => updateField('intake', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Group</Label>
                <Input value={form.group} onChange={(e) => updateField('group', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Application Status</Label>
                <Select
                  value={form.applicationStatus}
                  onValueChange={(v) => updateField('applicationStatus', v as ApplicationStatus)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sub-Agent</Label>
                <Select
                  value={form.subAgentId ?? 'none'}
                  onValueChange={(v) => updateField('subAgentId', v === 'none' ? undefined : v)}
                >
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {branchSubAgents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tuition Fee</Label>
                <Input type="number" value={form.tuitionFee} onChange={(e) => updateField('tuitionFee', Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Scholarship</Label>
                <Input type="number" value={form.scholarship} onChange={(e) => updateField('scholarship', Number(e.target.value))} />
              </div>
              {!isCounsellor && (
                <div className="space-y-2">
                  <Label>Expected Commission %</Label>
                  <Input type="number" value={form.expectedCommissionRate} readOnly className="bg-muted/50" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input value={form.currency} readOnly className="bg-muted/50" />
              </div>
            </div>
            {form.subAgentId && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                Sub-Agent: {getSubAgent(form.subAgentId)?.name}
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." rows={3} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{isNew ? 'Add Student' : 'Save Changes'}</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
