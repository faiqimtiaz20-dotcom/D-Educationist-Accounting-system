import { DataTable, type Column } from '@/components/shared/DataTable'
import { MetricCard } from '@/components/shared/MetricCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusPill } from '@/components/shared/StatusPill'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/hooks/useAuth'
import { useDataStore } from '@/store/data-store'
import type { Student } from '@/types'
import { Award, FileSpreadsheet, FileText, GraduationCap, Printer, Users } from 'lucide-react'
import { useMemo } from 'react'
import { toast } from 'sonner'

export default function CounsellorReports() {
  const user = useCurrentUser()
  const students = useDataStore((s) => s.students)

  const myStudents = useMemo(
    () => students.filter((s) => s.consultantId === user?.id),
    [students, user?.id]
  )

  const offers = myStudents.filter((s) => s.applicationStatus === 'Offer').length
  const enrolled = myStudents.filter((s) => s.applicationStatus === 'Enrolled').length

  const toOptions = (values: string[]) =>
    [...new Set(values)].filter(Boolean).map((v) => ({ label: v, value: v }))

  const handleExport = (format: 'PDF' | 'Excel' | 'CSV') => {
    toast.success(`${format} export started`, {
      description: 'My Students Report will download shortly.',
    })
  }

  const columns: Column<Student>[] = [
    { key: 'studentId', header: 'Student ID', cell: (r) => <span className="font-mono text-xs">{r.studentId}</span> },
    { key: 'name', header: 'Student', cell: (r) => r.name },
    { key: 'country', header: 'Country', cell: (r) => r.country },
    { key: 'university', header: 'University', cell: (r) => r.university },
    { key: 'course', header: 'Course', cell: (r) => r.course },
    { key: 'intake', header: 'Intake', cell: (r) => r.intake },
    { key: 'status', header: 'Status', cell: (r) => <StatusPill status={r.applicationStatus} /> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Students Report"
        subtitle="Application pipeline and destinations for your students"
      >
        <Button variant="outline" size="sm" onClick={() => handleExport('PDF')}>
          <FileText className="mr-1.5 h-4 w-4" /> PDF
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExport('Excel')}>
          <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleExport('CSV')}>
          <Printer className="mr-1.5 h-4 w-4" /> CSV
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Total Students" value={myStudents.length} icon={Users} accent="blue" />
        <MetricCard title="Offers Received" value={offers} icon={Award} accent="purple" />
        <MetricCard title="Enrolled" value={enrolled} icon={GraduationCap} accent="green" />
      </div>

      <DataTable
        data={myStudents}
        columns={columns}
        searchPlaceholder="Search by student, university, or course..."
        searchFilter={(row, q) =>
          row.name.toLowerCase().includes(q) ||
          row.studentId.toLowerCase().includes(q) ||
          row.university.toLowerCase().includes(q) ||
          row.course.toLowerCase().includes(q)
        }
        filters={[
          { key: 'status', label: 'Application Status', type: 'select', options: toOptions(myStudents.map((s) => s.applicationStatus)), accessor: (r) => r.applicationStatus },
          { key: 'country', label: 'Country', type: 'select', options: toOptions(myStudents.map((s) => s.country)), accessor: (r) => r.country },
          { key: 'university', label: 'University', type: 'select', options: toOptions(myStudents.map((s) => s.university)), accessor: (r) => r.university },
          { key: 'intake', label: 'Intake', type: 'select', options: toOptions(myStudents.map((s) => s.intake)), accessor: (r) => r.intake },
        ]}
      />
    </div>
  )
}
