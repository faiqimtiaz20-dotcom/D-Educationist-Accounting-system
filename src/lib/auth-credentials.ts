/** Demo credentials — replace with server auth in production */
export const DEMO_PASSWORD = 'demo123'

export const DEMO_ACCOUNTS = [
  { email: 'admin@saa.com', password: DEMO_PASSWORD, label: 'Super Admin', hint: 'Full system access' },
  { email: 'ahmed@saa.com', password: DEMO_PASSWORD, label: 'Branch Manager', hint: 'Karachi branch' },
  { email: 'sara@saa.com', password: DEMO_PASSWORD, label: 'Accountant', hint: 'Lahore branch' },
  { email: 'bilal@saa.com', password: DEMO_PASSWORD, label: 'Cashier', hint: 'Islamabad branch' },
  { email: 'fatima@saa.com', password: DEMO_PASSWORD, label: 'Counsellor', hint: 'Student data only' },
] as const

export function verifyPassword(_email: string, password: string): boolean {
  return password === DEMO_PASSWORD
}
