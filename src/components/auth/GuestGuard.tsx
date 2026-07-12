import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth-store'

interface GuestGuardProps {
  children: React.ReactNode
}

export function GuestGuard({ children }: GuestGuardProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
