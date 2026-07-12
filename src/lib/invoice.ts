import { netCommission } from '@/lib/calculations'
import type { Invoice, Receivable } from '@/types'

export function getInvoiceTotal(invoice: Invoice): number {
  return netCommission(invoice.tuitionFee, invoice.scholarship, invoice.commissionRate) + invoice.bonus
}

export function getInvoicePaid(receivables: Receivable[], invoiceId: string, excludeReceiptId?: string): number {
  return receivables
    .filter((r) => r.invoiceId === invoiceId && r.id !== excludeReceiptId)
    .reduce((sum, r) => sum + r.amountReceived, 0)
}

export function getInvoiceOutstanding(invoice: Invoice, receivables: Receivable[], excludeReceiptId?: string): number {
  const total = getInvoiceTotal(invoice)
  const paid = getInvoicePaid(receivables, invoice.id, excludeReceiptId)
  return Math.max(0, total - paid)
}

export function getInvoiceReceivables(receivables: Receivable[], invoiceId: string): Receivable[] {
  return receivables
    .filter((r) => r.invoiceId === invoiceId)
    .sort((a, b) => b.receiptDate.localeCompare(a.receiptDate))
}
