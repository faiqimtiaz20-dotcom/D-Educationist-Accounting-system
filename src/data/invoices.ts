import type { Invoice } from '@/types'

export const invoices: Invoice[] = [
  { id: 'inv1', invoiceNo: 'INV-KHI-2026-001', studentId: 's1', branchId: 'khi', invoiceDate: '2026-03-15', poNumber: 'PO-UM-4521', tuitionFee: 22000, scholarship: 2000, commissionRate: 15, currency: 'GBP', bonus: 500, status: 'Fully Received' },
  { id: 'inv2', invoiceNo: 'INV-LHR-2026-002', studentId: 's2', branchId: 'lhr', invoiceDate: '2026-03-20', tuitionFee: 45000, scholarship: 5000, commissionRate: 12.5, currency: 'USD', bonus: 0, status: 'Sent' },
  { id: 'inv3', invoiceNo: 'INV-ISB-2026-003', studentId: 's3', branchId: 'isb', invoiceDate: '2026-04-01', tuitionFee: 38000, scholarship: 3000, commissionRate: 17.5, currency: 'CAD', bonus: 200, status: 'Partially Received' },
  { id: 'inv4', invoiceNo: 'INV-KHI-2026-004', studentId: 's5', branchId: 'khi', invoiceDate: '2026-04-10', tuitionFee: 18500, scholarship: 1500, commissionRate: 15, currency: 'GBP', bonus: 0, status: 'Fully Received' },
  { id: 'inv5', invoiceNo: 'INV-LHR-2026-005', studentId: 's6', branchId: 'lhr', invoiceDate: '2026-04-15', tuitionFee: 52000, scholarship: 8000, commissionRate: 10, currency: 'USD', bonus: 1000, status: 'Draft' },
  { id: 'inv6', invoiceNo: 'INV-MUL-2026-006', studentId: 's8', branchId: 'khi', invoiceDate: '2026-04-20', tuitionFee: 35000, scholarship: 4000, commissionRate: 12.5, currency: 'CAD', bonus: 0, status: 'Sent' },
  { id: 'inv7', invoiceNo: 'INV-KHI-2026-007', studentId: 's11', branchId: 'khi', invoiceDate: '2026-05-01', tuitionFee: 48000, scholarship: 6000, commissionRate: 12.5, currency: 'USD', bonus: 300, status: 'Partially Received' },
  { id: 'inv8', invoiceNo: 'INV-LHR-2026-008', studentId: 's14', branchId: 'lhr', invoiceDate: '2026-05-05', tuitionFee: 39000, scholarship: 3000, commissionRate: 17.5, currency: 'AUD', bonus: 0, status: 'Fully Received' },
  { id: 'inv9', invoiceNo: 'INV-ISB-2026-009', studentId: 's15', branchId: 'isb', invoiceDate: '2026-05-10', tuitionFee: 50000, scholarship: 7000, commissionRate: 10, currency: 'USD', bonus: 0, status: 'Sent' },
  { id: 'inv10', invoiceNo: 'INV-MUL-2026-010', studentId: 's17', branchId: 'mul', invoiceDate: '2026-05-15', tuitionFee: 28000, scholarship: 2000, commissionRate: 15, currency: 'CAD', bonus: 150, status: 'Closed' },
  { id: 'inv11', invoiceNo: 'INV-FSD-2026-011', studentId: 's19', branchId: 'lhr', invoiceDate: '2026-05-20', tuitionFee: 46000, scholarship: 4000, commissionRate: 12.5, currency: 'USD', bonus: 0, status: 'Fully Received' },
  { id: 'inv12', invoiceNo: 'INV-KHI-2026-012', studentId: 's20', branchId: 'khi', invoiceDate: '2026-06-01', tuitionFee: 23000, scholarship: 2500, commissionRate: 15, currency: 'GBP', bonus: 0, status: 'Draft' },
  { id: 'inv13', invoiceNo: 'INV-ISB-2026-013', studentId: 's21', branchId: 'isb', invoiceDate: '2026-06-05', tuitionFee: 40000, scholarship: 5000, commissionRate: 17.5, currency: 'CAD', bonus: 400, status: 'Sent' },
  { id: 'inv14', invoiceNo: 'INV-FSD-2026-014', studentId: 's23', branchId: 'fsd', invoiceDate: '2026-06-10', tuitionFee: 44000, scholarship: 5000, commissionRate: 12.5, currency: 'USD', bonus: 0, status: 'Partially Received' },
  { id: 'inv15', invoiceNo: 'INV-LHR-2026-015', studentId: 's16', branchId: 'lhr', invoiceDate: '2026-06-15', tuitionFee: 26000, scholarship: 3000, commissionRate: 12.5, currency: 'GBP', bonus: 0, status: 'Sent' },
  { id: 'inv16', invoiceNo: 'INV-KHI-2026-016', studentId: 's25', branchId: 'khi', invoiceDate: '2026-06-20', tuitionFee: 36000, scholarship: 4000, commissionRate: 20, currency: 'CAD', bonus: 250, status: 'Draft' },
  { id: 'inv17', invoiceNo: 'INV-MUL-2026-017', studentId: 's12', branchId: 'mul', invoiceDate: '2026-06-25', tuitionFee: 55000, scholarship: 10000, commissionRate: 20, currency: 'CAD', bonus: 0, status: 'Sent' },
  { id: 'inv18', invoiceNo: 'INV-ISB-2026-018', studentId: 's9', branchId: 'isb', invoiceDate: '2026-07-01', tuitionFee: 42000, scholarship: 2000, commissionRate: 17.5, currency: 'AUD', bonus: 600, status: 'Partially Received' },
]

export const getInvoice = (id: string) => invoices.find((i) => i.id === id)
