import { PageHeader } from '@/components/shared/PageHeader'
import { RowActions } from '@/components/shared/RowActions'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useCurrentUser } from '@/hooks/useAuth'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import {
  assignableRolesFor,
  canEditPermissionMatrix,
  canManageUsers,
  USER_ROLES,
  type PermissionLevel,
} from '@/lib/permissions'
import { getBranchName } from '@/lib/org'
import { useAuthStore } from '@/store/auth-store'
import { useDataStore } from '@/store/data-store'
import type { User, UserRole } from '@/types'
import { Check, Minus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

const roleVariants: Record<UserRole, 'default' | 'purple' | 'info' | 'warning' | 'success' | 'secondary'> = {
  'Super Admin': 'default',
  'Branch Manager': 'purple',
  Accountant: 'info',
  Cashier: 'warning',
  Counsellor: 'success',
  'Read Only': 'secondary',
}

const PERMISSION_LEVELS: PermissionLevel[] = ['full', 'read', 'limited', 'none']

const emptyUser = (branchId: string): Omit<User, 'id'> => ({
  name: '',
  email: '',
  role: 'Accountant',
  branchId,
})

function PermissionCell({ level }: { level: PermissionLevel }) {
  if (level === 'full') return <Check className="mx-auto h-4 w-4 text-emerald-600" />
  if (level === 'read' || level === 'limited')
    return <span className="text-xs font-medium text-amber-600">{level}</span>
  return <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
}

export function UsersSettingsPage() {
  const currentUser = useCurrentUser()
  const users = useDataStore((s) => s.users)
  const branches = useDataStore((s) => s.branches)
  const addUser = useDataStore((s) => s.addUser)
  const updateUser = useDataStore((s) => s.updateUser)
  const deleteUser = useDataStore((s) => s.deleteUser)
  const permissionMatrix = useAuthStore((s) => s.permissionMatrix)
  const updatePermission = useAuthStore((s) => s.updatePermission)
  const resetPermissionMatrix = useAuthStore((s) => s.resetPermissionMatrix)

  const canManage = currentUser ? canManageUsers(currentUser.role) : false
  const canEditMatrix = currentUser ? canEditPermissionMatrix(currentUser.role) : false

  const visibleUsers = useMemo(() => {
    if (currentUser?.role === 'Super Admin') return users
    if (currentUser?.role === 'Branch Manager') {
      return users.filter((u) => u.branchId === currentUser.branchId && u.role !== 'Super Admin')
    }
    return users.filter((u) => u.id === currentUser?.id)
  }, [users, currentUser])

  const branchFilteredUsers = useBranchFilter(visibleUsers)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyUser(currentUser?.branchId ?? 'khi'))

  const assignableRoles = currentUser ? assignableRolesFor(currentUser.role) : []

  const openAdd = () => {
    setIsEdit(false)
    setEditId(null)
    setForm(emptyUser(currentUser?.branchId ?? 'khi'))
    setDialogOpen(true)
  }

  const openEdit = (u: User) => {
    if (u.role === 'Super Admin' && currentUser?.role !== 'Super Admin') return
    setIsEdit(true)
    setEditId(u.id)
    setForm({ name: u.name, email: u.email, role: u.role, branchId: u.branchId })
    setDialogOpen(true)
  }

  const handleDelete = (u: User) => {
    if (u.id === currentUser?.id) {
      toast.error('You cannot delete your own account')
      return
    }
    if (u.role === 'Super Admin') {
      toast.error('Super Admin cannot be deleted')
      return
    }
    if (!confirm(`Delete user ${u.name}?`)) return
    deleteUser(u.id)
    toast.success('User deleted')
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    if (currentUser?.role === 'Branch Manager' && form.branchId !== currentUser.branchId) {
      toast.error('You can only add users to your own branch')
      return
    }
    if (isEdit && editId) {
      updateUser(editId, form)
      toast.success('User updated')
    } else {
      addUser(form)
      toast.success('User added')
    }
    setDialogOpen(false)
  }

  const columns: Column<User>[] = [
    { key: 'name', header: 'Name', cell: (u) => <span className="font-medium">{u.name}</span> },
    { key: 'email', header: 'Email', cell: (u) => u.email },
    { key: 'role', header: 'Role', cell: (u) => <Badge variant={roleVariants[u.role]}>{u.role}</Badge> },
    { key: 'branch', header: 'Branch', cell: (u) => getBranchName(u.branchId) },
    ...(canManage
      ? [{
          key: 'actions',
          header: 'Actions',
          cell: (u: User) =>
            u.role === 'Super Admin' && currentUser?.role !== 'Super Admin' ? null : (
              <RowActions onEdit={() => openEdit(u)} onDelete={() => handleDelete(u)} />
            ),
        }]
      : []),
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users & Roles"
        subtitle={
          currentUser?.role === 'Branch Manager'
            ? 'Manage staff for your branch'
            : 'Staff accounts and permission matrix'
        }
        actionLabel={canManage ? 'Add User' : undefined}
        onAction={canManage ? openAdd : undefined}
      />

      <DataTable
        data={branchFilteredUsers}
        columns={columns}
        searchPlaceholder="Search users..."
        searchFilter={(u, q) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q)
        }
        filters={[
          { key: 'role', label: 'Role', type: 'select', options: USER_ROLES.map((r) => ({ label: r, value: r })), accessor: (u) => u.role },
          { key: 'branch', label: 'Branch', type: 'select', options: branches.map((b) => ({ label: b.name, value: b.id })), accessor: (u) => u.branchId },
        ]}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Role Permission Matrix</CardTitle>
            <CardDescription>
              {canEditMatrix
                ? 'Super Admin can configure module access per role'
                : 'View-only permission overview'}
            </CardDescription>
          </div>
          {canEditMatrix && (
            <Button variant="outline" size="sm" onClick={() => { resetPermissionMatrix(); toast.success('Matrix reset to defaults') }}>
              Reset Defaults
            </Button>
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Module</TableHead>
                {USER_ROLES.map((role) => (
                  <TableHead key={role} className="text-center text-xs">{role}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionMatrix.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.module}</TableCell>
                  {USER_ROLES.map((role) => (
                    <TableCell key={role} className="text-center">
                      {canEditMatrix && role !== 'Super Admin' ? (
                        <Select
                          value={row.permissions[role]}
                          onValueChange={(v) => updatePermission(row.id, role, v as PermissionLevel)}
                        >
                          <SelectTrigger className="h-8 w-[88px] mx-auto text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PERMISSION_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <PermissionCell level={row.permissions[role]} />
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit User' : 'Add User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                {currentUser?.role === 'Super Admin' ? (
                  <Select value={form.branchId} onValueChange={(v) => setForm({ ...form, branchId: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {branches.filter((b) => !b.isHeadOffice).map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={getBranchName(form.branchId)} readOnly className="bg-muted/50" />
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>{isEdit ? 'Save Changes' : 'Add User'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
