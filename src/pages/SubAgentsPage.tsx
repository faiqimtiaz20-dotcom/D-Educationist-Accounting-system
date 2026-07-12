import { useState } from 'react'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { branches, getBranchName, subAgents } from '@/data'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { branchFilterOptions } from '@/lib/filter-options'
import type { SubAgent } from '@/types'
import { Pencil, Users } from 'lucide-react'

const emptyForm: SubAgent = {
  id: '',
  name: '',
  ntn: '',
  email: '',
  contact: '',
  accountTitle: '',
  iban: '',
  accountNo: '',
  branchId: 'khi',
}

export default function SubAgentsPage() {
  const filtered = useBranchFilter(subAgents)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<SubAgent | null>(null)
  const [form, setForm] = useState<SubAgent>(emptyForm)

  const openAdd = () => {
    setEditing(null)
    setForm({ ...emptyForm, id: `sa${Date.now()}` })
    setSheetOpen(true)
  }

  const openEdit = (agent: SubAgent) => {
    setEditing(agent)
    setForm({ ...agent })
    setSheetOpen(true)
  }

  const columns: Column<SubAgent>[] = [
    { key: 'name', header: 'Sub-Agent Name', cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'ntn', header: 'NTN', cell: (r) => r.ntn },
    { key: 'email', header: 'Email', cell: (r) => r.email },
    { key: 'contact', header: 'Contact', cell: (r) => r.contact },
    { key: 'accountTitle', header: 'A/c Title', cell: (r) => r.accountTitle },
    { key: 'iban', header: 'IBAN', cell: (r) => <span className="font-mono text-xs">{r.iban}</span> },
    { key: 'accountNo', header: 'Account No.', cell: (r) => r.accountNo },
    { key: 'branch', header: 'Branch', cell: (r) => getBranchName(r.branchId) },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      cell: (r) => (
        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
          <Pencil className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Sub-Agent Master"
        subtitle={`${filtered.length} sub-agents registered`}
        actionLabel="Add Sub-Agent"
        onAction={openAdd}
      >
        <Users className="h-5 w-5 text-muted-foreground" />
      </PageHeader>

      <DataTable
        data={filtered}
        columns={columns}
        searchPlaceholder="Search by name, NTN, email..."
        searchFilter={(row, q) =>
          row.name.toLowerCase().includes(q) ||
          row.ntn.includes(q) ||
          row.email.toLowerCase().includes(q) ||
          row.contact.includes(q)
        }
        filters={[
          { key: 'branch', label: 'Branch', type: 'select', options: branchFilterOptions, accessor: (r) => r.branchId },
        ]}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editing ? 'Edit Sub-Agent' : 'Add Sub-Agent'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label>Sub-Agent Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>NTN</Label>
              <Input value={form.ntn} onChange={(e) => setForm({ ...form, ntn: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contact No.</Label>
              <Input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Account Title</Label>
              <Input value={form.accountTitle} onChange={(e) => setForm({ ...form, accountTitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>IBAN</Label>
              <Input value={form.iban} onChange={(e) => setForm({ ...form, iban: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Account No.</Label>
              <Input value={form.accountNo} onChange={(e) => setForm({ ...form, accountNo: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Branch</Label>
              <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {branches.filter((b) => !b.isHeadOffice).map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => setSheetOpen(false)}>
              {editing ? 'Save Changes' : 'Add Sub-Agent'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
