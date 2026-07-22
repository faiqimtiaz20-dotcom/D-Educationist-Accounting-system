import { useState } from 'react'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useDataStore } from '@/store/data-store'
import type { SubAgent } from '@/types'
import { Pencil, Trash2, Users } from 'lucide-react'
import { toast } from 'sonner'

type SubAgentForm = Omit<SubAgent, 'id'>

const emptyForm: SubAgentForm = {
  name: '',
  ntn: '',
  email: '',
  contact: '',
  accountTitle: '',
  iban: '',
  accountNo: '',
}

export default function SubAgentsPage() {
  const subAgents = useDataStore((s) => s.subAgents)
  const addSubAgent = useDataStore((s) => s.addSubAgent)
  const updateSubAgent = useDataStore((s) => s.updateSubAgent)
  const deleteSubAgent = useDataStore((s) => s.deleteSubAgent)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<SubAgentForm>(emptyForm)

  const openAdd = () => {
    setEditingId(null)
    setForm({ ...emptyForm })
    setSheetOpen(true)
  }

  const openEdit = (agent: SubAgent) => {
    setEditingId(agent.id)
    setForm({
      name: agent.name,
      ntn: agent.ntn,
      email: agent.email,
      contact: agent.contact,
      accountTitle: agent.accountTitle,
      iban: agent.iban,
      accountNo: agent.accountNo,
    })
    setSheetOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('Sub-agent name is required')
      return
    }

    if (editingId) {
      updateSubAgent(editingId, form)
      toast.success('Sub-agent updated')
    } else {
      addSubAgent(form)
      toast.success('Sub-agent added')
    }
    setSheetOpen(false)
  }

  const handleDelete = (agent: SubAgent) => {
    if (!confirm(`Delete sub-agent ${agent.name}?`)) return
    const ok = deleteSubAgent(agent.id)
    if (ok) toast.success('Sub-agent deleted')
    else toast.error('Cannot delete — sub-agent is linked to students or commissions')
  }

  const columns: Column<SubAgent>[] = [
    { key: 'name', header: 'Sub-Agent Name', cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'ntn', header: 'NTN', cell: (r) => r.ntn },
    { key: 'email', header: 'Email', cell: (r) => r.email },
    { key: 'contact', header: 'Contact', cell: (r) => r.contact },
    { key: 'accountTitle', header: 'A/c Title', cell: (r) => r.accountTitle },
    { key: 'iban', header: 'IBAN', cell: (r) => <span className="font-mono text-xs">{r.iban}</span> },
    { key: 'accountNo', header: 'Account No.', cell: (r) => r.accountNo },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      cell: (r) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => openEdit(r)} title="Edit">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(r)} title="Delete">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Sub-Agent Master"
        subtitle={`${subAgents.length} sub-agents registered`}
        actionLabel="Add Sub-Agent"
        onAction={openAdd}
      >
        <Users className="h-5 w-5 text-muted-foreground" />
      </PageHeader>

      <DataTable
        data={subAgents}
        columns={columns}
        searchPlaceholder="Search by name, NTN, email..."
        searchFilter={(row, q) =>
          row.name.toLowerCase().includes(q) ||
          row.ntn.includes(q) ||
          row.email.toLowerCase().includes(q) ||
          row.contact.includes(q)
        }
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Sub-Agent' : 'Add Sub-Agent'}</SheetTitle>
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
            <Button className="w-full" onClick={handleSave}>
              {editingId ? 'Save Changes' : 'Add Sub-Agent'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
