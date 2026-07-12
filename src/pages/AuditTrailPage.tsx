import { DataTable, type Column } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { getUserName } from '@/data/users'
import { useAuditStore } from '@/store/audit-store'
import type { AuditLog } from '@/types'
import { useMemo } from 'react'

export default function AuditTrailPage() {
  const logs = useAuditStore((s) => s.logs)

  const moduleOptions = useMemo(
    () => [...new Set(logs.map((l) => l.module))].sort().map((m) => ({ label: m, value: m })),
    [logs]
  )
  const userOptions = useMemo(
    () => [...new Set(logs.map((l) => l.userId))].map((id) => ({ label: getUserName(id), value: id })),
    [logs]
  )

  const columns: Column<AuditLog>[] = useMemo(() => [
    { key: 'timestamp', header: 'Timestamp', cell: (r) => <span className="font-mono text-sm">{r.timestamp}</span> },
    { key: 'user', header: 'User', cell: (r) => getUserName(r.userId) },
    { key: 'module', header: 'Module', cell: (r) => r.module },
    { key: 'action', header: 'Action', cell: (r) => r.action },
    { key: 'entity', header: 'Entity', cell: (r) => r.entityId ? <span className="font-mono text-xs">{r.entityId}</span> : '—' },
    { key: 'ip', header: 'IP Address', cell: (r) => <span className="font-mono text-sm">{r.ip}</span> },
  ], [])

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        subtitle="Immutable activity log — who, when, what, and IP address"
      />
      <DataTable
        data={logs}
        columns={columns}
        searchPlaceholder="Search audit log..."
        searchFilter={(row, q) =>
          row.action.toLowerCase().includes(q) ||
          row.module.toLowerCase().includes(q) ||
          getUserName(row.userId).toLowerCase().includes(q) ||
          row.ip.includes(q) ||
          (row.entityId?.toLowerCase().includes(q) ?? false)
        }
        filters={[
          { key: 'module', label: 'Module', type: 'select', options: moduleOptions, accessor: (r) => r.module },
          { key: 'user', label: 'User', type: 'select', options: userOptions, accessor: (r) => r.userId },
          { key: 'timestamp', label: 'Date', type: 'dateRange', accessor: (r) => r.timestamp },
        ]}
        newestFirst={false}
        pageSize={15}
      />
    </div>
  )
}
