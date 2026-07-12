import { useLocation, Navigate } from 'react-router-dom'
import { useRoutePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'
import { useEffect, useRef } from 'react'

interface RouteGuardProps {
  children: React.ReactNode
}

export function RouteGuard({ children }: RouteGuardProps) {
  const location = useLocation()
  const { canView } = useRoutePermission(location.pathname)
  const notified = useRef(false)

  useEffect(() => {
    if (!canView && !notified.current) {
      notified.current = true
      toast.error('You do not have permission to access this module')
    }
    if (canView) notified.current = false
  }, [canView, location.pathname])

  if (!canView) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
