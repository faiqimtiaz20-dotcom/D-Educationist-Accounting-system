import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  selectedBranchId: string
  darkMode: boolean
  sidebarCollapsed: boolean
  setSelectedBranchId: (id: string) => void
  toggleDarkMode: () => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedBranchId: 'all',
      darkMode: false,
      sidebarCollapsed: false,
      setSelectedBranchId: (id) => set({ selectedBranchId: id }),
      toggleDarkMode: () =>
        set((s) => {
          const next = !s.darkMode
          document.documentElement.classList.toggle('dark', next)
          return { darkMode: next }
        }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'saa-app-store', partialize: (s) => ({ darkMode: s.darkMode, sidebarCollapsed: s.sidebarCollapsed }) }
  )
)

interface ApprovalState {
  approvals: { id: string; status: 'Approved' | 'Rejected' }[]
  updateApproval: (id: string, status: 'Approved' | 'Rejected') => void
}

export const useApprovalStore = create<ApprovalState>((set) => ({
  approvals: [],
  updateApproval: (id, status) =>
    set((s) => ({
      approvals: [...s.approvals.filter((a) => a.id !== id), { id, status }],
    })),
}))
