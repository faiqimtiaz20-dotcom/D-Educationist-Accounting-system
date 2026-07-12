import { PageHeader } from '@/components/shared/PageHeader'
import { RowActions } from '@/components/shared/RowActions'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCurrentUser } from '@/hooks/useAuth'
import { canManageBranches } from '@/lib/permissions'
import { useDataStore } from '@/store/data-store'
import type { Branch } from '@/types'
import { useState } from 'react'
import { toast } from 'sonner'

const emptyBranch = (): Omit<Branch, 'id'> => ({
  name: '',
  code: '',
  city: '',
})

export function BranchesSettingsPage() {
  const user = useCurrentUser()
  const branches = useDataStore((s) => s.branches)
  const addBranch = useDataStore((s) => s.addBranch)
  const updateBranch = useDataStore((s) => s.updateBranch)
  const deleteBranch = useDataStore((s) => s.deleteBranch)

  const canManage = user ? canManageBranches(user.role) : false
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyBranch())

  const openAdd = () => {
    setIsEdit(false)
    setEditId(null)
    setForm(emptyBranch())
    setDialogOpen(true)
  }

  const openEdit = (branch: Branch) => {
    if (branch.isHeadOffice) return
    setIsEdit(true)
    setEditId(branch.id)
    setForm({ name: branch.name, code: branch.code, city: branch.city })
    setDialogOpen(true)
  }

  const handleDelete = (branch: Branch) => {
    if (branch.isHeadOffice) {
      toast.error('Head Office cannot be deleted')
      return
    }
    if (!confirm(`Delete branch ${branch.name}?`)) return
    deleteBranch(branch.id)
    toast.success('Branch deleted')
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error('Name and code are required')
      return
    }
    if (isEdit && editId) {
      updateBranch(editId, form)
      toast.success('Branch updated')
    } else {
      addBranch(form)
      toast.success('Branch added')
    }
    setDialogOpen(false)
  }

  const columns: Column<Branch>[] = [
    { key: 'code', header: 'Code', cell: (b) => <span className="font-mono font-medium">{b.code}</span> },
    { key: 'name', header: 'Branch Name', cell: (b) => b.name },
    { key: 'city', header: 'City', cell: (b) => b.city },
    {
      key: 'type',
      header: 'Type',
      cell: (b) =>
        b.isHeadOffice ? (
          <Badge variant="purple">Head Office</Badge>
        ) : (
          <Badge variant="secondary">Branch</Badge>
        ),
    },
    ...(canManage
      ? [{
          key: 'actions',
          header: 'Actions',
          cell: (b: Branch) =>
            b.isHeadOffice ? null : (
              <RowActions onEdit={() => openEdit(b)} onDelete={() => handleDelete(b)} />
            ),
        }]
      : []),
  ]

  if (!canManage) {
    return (
      <div>
        <PageHeader title="Branches" subtitle="Branch locations (view only)" />
        <DataTable
          data={branches.filter((b) => b.id === user?.branchId || b.isHeadOffice)}
          columns={columns.filter((c) => c.key !== 'actions')}
          searchPlaceholder="Search branches..."
          searchFilter={(b, q) =>
            b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)
          }
          filters={[
            { key: 'type', label: 'Type', type: 'select', options: [{ label: 'Head Office', value: 'ho' }, { label: 'Branch', value: 'branch' }], accessor: (b) => (b.isHeadOffice ? 'ho' : 'branch') },
          ]}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Branches"
        subtitle="Manage branch locations — Super Admin only"
        actionLabel="Add Branch"
        onAction={openAdd}
      />
      <DataTable
        data={branches}
        columns={columns}
        searchPlaceholder="Search branches..."
        searchFilter={(b, q) =>
          b.name.toLowerCase().includes(q) ||
          b.code.toLowerCase().includes(q) ||
          b.city.toLowerCase().includes(q)
        }
        filters={[
          { key: 'city', label: 'City', type: 'select', options: [...new Set(branches.map((b) => b.city))].map((c) => ({ label: c, value: c })), accessor: (b) => b.city },
          { key: 'type', label: 'Type', type: 'select', options: [{ label: 'Head Office', value: 'ho' }, { label: 'Branch', value: 'branch' }], accessor: (b) => (b.isHeadOffice ? 'ho' : 'branch') },
        ]}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Branch' : 'Add Branch'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Branch Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. KHI" />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{isEdit ? 'Save' : 'Add Branch'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
