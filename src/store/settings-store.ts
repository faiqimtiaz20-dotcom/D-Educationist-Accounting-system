import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Currency } from '@/types'

interface SettingsState {
  whtRatePercent: number
  enabledCurrencies: Currency[]
  fiscalPeriodLockedUntil: string | null
  setWhtRatePercent: (rate: number) => void
  setEnabledCurrencies: (currencies: Currency[]) => void
  setFiscalPeriodLockedUntil: (date: string | null) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      whtRatePercent: 1,
      enabledCurrencies: ['PKR', 'GBP', 'USD', 'CAD', 'AUD', 'EUR'],
      fiscalPeriodLockedUntil: '2026-06-30',
      setWhtRatePercent: (rate) => set({ whtRatePercent: rate }),
      setEnabledCurrencies: (currencies) => set({ enabledCurrencies: currencies }),
      setFiscalPeriodLockedUntil: (date) => set({ fiscalPeriodLockedUntil: date }),
    }),
    { name: 'saa-settings-store' }
  )
)

export function getWhtRate(): number {
  return useSettingsStore.getState().whtRatePercent / 100
}

export function isDateLocked(date: string): boolean {
  const lockedUntil = useSettingsStore.getState().fiscalPeriodLockedUntil
  if (!lockedUntil) return false
  return date <= lockedUntil
}
