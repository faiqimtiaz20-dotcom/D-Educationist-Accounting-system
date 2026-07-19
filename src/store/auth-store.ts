import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_PERMISSION_MATRIX, mergePermissionMatrix, type PermissionLevel, type PermissionMatrixRow } from '@/lib/permissions'
import { verifyPassword } from '@/lib/auth-credentials'
import { logAudit } from '@/lib/audit'
import { useDataStore } from '@/store/data-store'
import { useAppStore } from '@/store/app-store'
import { canViewAllBranches } from '@/lib/permissions'
import type { UserRole } from '@/types'

interface AuthState {
  isAuthenticated: boolean
  currentUserId: string | null
  loginAt: string | null
  rememberedEmail: string
  permissionMatrix: PermissionMatrixRow[]

  login: (email: string, password: string, remember?: boolean) => { success: boolean; error?: string }
  logout: () => void
  setRememberedEmail: (email: string) => void
  setCurrentUserId: (id: string) => void
  updatePermission: (rowId: string, role: UserRole, level: PermissionLevel) => void
  resetPermissionMatrix: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentUserId: null,
      loginAt: null,
      rememberedEmail: '',
      permissionMatrix: DEFAULT_PERMISSION_MATRIX,

      login: (email, password, remember = false) => {
        const normalized = email.trim().toLowerCase()
        if (!normalized || !password) {
          return { success: false, error: 'Email and password are required' }
        }

        const user = useDataStore.getState().users.find(
          (u) => u.email.toLowerCase() === normalized
        )

        if (!user || !verifyPassword(normalized, password)) {
          logAudit({
            module: 'Auth',
            action: 'Failed login attempt',
            details: normalized,
          })
          return { success: false, error: 'Invalid email or password' }
        }

        const loginAt = new Date().toISOString()
        set({
          isAuthenticated: true,
          currentUserId: user.id,
          loginAt,
          rememberedEmail: remember ? normalized : get().rememberedEmail,
        })

        // Super Admin always starts on "All Branches"; others lock to their branch
        if (canViewAllBranches(user.role)) {
          useAppStore.getState().setSelectedBranchId('all')
        } else {
          useAppStore.getState().setSelectedBranchId(user.branchId)
        }

        logAudit({
          module: 'Auth',
          action: 'User signed in',
          entityId: user.id,
          details: `${user.name} (${user.role})`,
        })

        return { success: true }
      },

      logout: () => {
        const userId = get().currentUserId
        if (userId) {
          logAudit({ module: 'Auth', action: 'User signed out', entityId: userId })
        }
        set({
          isAuthenticated: false,
          currentUserId: null,
          loginAt: null,
        })
      },

      setRememberedEmail: (email) => set({ rememberedEmail: email }),

      setCurrentUserId: (id) => set({ currentUserId: id }),

      updatePermission: (rowId, role, level) =>
        set((s) => ({
          permissionMatrix: s.permissionMatrix.map((row) =>
            row.id === rowId
              ? { ...row, permissions: { ...row.permissions, [role]: level } }
              : row
          ),
        })),

      resetPermissionMatrix: () => set({ permissionMatrix: DEFAULT_PERMISSION_MATRIX }),
    }),
    {
      name: 'saa-auth-store',
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        currentUserId: s.currentUserId,
        loginAt: s.loginAt,
        rememberedEmail: s.rememberedEmail,
        permissionMatrix: s.permissionMatrix,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AuthState>
        return {
          ...current,
          ...p,
          isAuthenticated: p.isAuthenticated ?? false,
          currentUserId: p.isAuthenticated ? (p.currentUserId ?? null) : null,
          permissionMatrix: mergePermissionMatrix(
            p.permissionMatrix ?? DEFAULT_PERMISSION_MATRIX
          ),
        }
      },
    }
  )
)
