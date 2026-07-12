import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCurrentUser } from '@/hooks/useAuth'
import { canViewAllBranches } from '@/lib/permissions'
import { useAuthStore } from '@/store/auth-store'
import { useAppStore } from '@/store/app-store'
import { useDataStore } from '@/store/data-store'
import { Bell, LogOut, Menu, Moon, Search, Sun } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface HeaderProps {
  onOpenSearch: () => void
}

export function Header({ onOpenSearch }: HeaderProps) {
  const navigate = useNavigate()
  const user = useCurrentUser()
  const logout = useAuthStore((s) => s.logout)
  const branches = useDataStore((s) => s.branches)
  const { selectedBranchId, setSelectedBranchId, darkMode, toggleDarkMode, toggleSidebar } = useAppStore()

  const isSuperAdmin = user ? canViewAllBranches(user.role) : false

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        onOpenSearch()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpenSearch])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="relative hidden flex-1 max-w-md md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search students, invoices, reports..."
          className="pl-9 bg-muted/50 cursor-pointer"
          readOnly
          onClick={onOpenSearch}
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          Ctrl+K
        </kbd>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {isSuperAdmin ? (
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger className="w-[160px] hidden sm:flex">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="outline" className="hidden sm:flex">
            {branches.find((b) => b.id === user?.branchId)?.name ?? 'Branch'}
          </Badge>
        )}
        <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white">3</span>
        </Button>
        <div className="flex items-center gap-2 border-l pl-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{user?.name?.charAt(0) ?? 'U'}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-medium leading-none">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.role}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
