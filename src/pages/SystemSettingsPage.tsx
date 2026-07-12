import { PageHeader } from '@/components/shared/PageHeader'
import { RowActions } from '@/components/shared/RowActions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useDataStore } from '@/store/data-store'
import { useSettingsStore } from '@/store/settings-store'
import { logAudit } from '@/lib/audit'
import type { Currency, University } from '@/types'
import { GraduationCap, Plus, Settings } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

const ALL_CURRENCIES: Currency[] = ['PKR', 'GBP', 'USD', 'CAD', 'AUD', 'EUR']
const COUNTRIES = ['UK', 'USA', 'Canada', 'Australia', 'Germany', 'Ireland', 'New Zealand']

const emptyUniversity = (): Omit<University, 'id'> => ({
  name: '',
  country: 'UK',
  defaultCommissionRate: 15,
  currency: 'GBP',
})

export function SystemSettingsPage() {
  const universities = useDataStore((s) => s.universities)
  const addUniversity = useDataStore((s) => s.addUniversity)
  const updateUniversity = useDataStore((s) => s.updateUniversity)
  const deleteUniversity = useDataStore((s) => s.deleteUniversity)

  const whtRatePercent = useSettingsStore((s) => s.whtRatePercent)
  const enabledCurrencies = useSettingsStore((s) => s.enabledCurrencies)
  const fiscalPeriodLockedUntil = useSettingsStore((s) => s.fiscalPeriodLockedUntil)
  const setWhtRatePercent = useSettingsStore((s) => s.setWhtRatePercent)
  const setEnabledCurrencies = useSettingsStore((s) => s.setEnabledCurrencies)
  const setFiscalPeriodLockedUntil = useSettingsStore((s) => s.setFiscalPeriodLockedUntil)

  const [whtRate, setWhtRate] = useState(String(whtRatePercent))
  const [uniDialogOpen, setUniDialogOpen] = useState(false)
  const [isEditUni, setIsEditUni] = useState(false)
  const [editUniId, setEditUniId] = useState<string | null>(null)
  const [uniForm, setUniForm] = useState(emptyUniversity())

  const toggleCurrency = (currency: Currency) => {
    setEnabledCurrencies(
      enabledCurrencies.includes(currency)
        ? (currency === 'PKR' || enabledCurrencies.length <= 1 ? enabledCurrencies : enabledCurrencies.filter((c) => c !== currency))
        : [...enabledCurrencies, currency]
    )
  }

  const openAddUniversity = () => {
    setIsEditUni(false)
    setEditUniId(null)
    setUniForm(emptyUniversity())
    setUniDialogOpen(true)
  }

  const openEditUniversity = (uni: University) => {
    setIsEditUni(true)
    setEditUniId(uni.id)
    setUniForm({
      name: uni.name,
      country: uni.country,
      defaultCommissionRate: uni.defaultCommissionRate,
      currency: uni.currency,
    })
    setUniDialogOpen(true)
  }

  const handleDeleteUniversity = (uni: University) => {
    if (!confirm(`Remove ${uni.name} from registered universities?`)) return
    deleteUniversity(uni.id)
    toast.success('University removed')
  }

  const handleSaveUniversity = () => {
    if (!uniForm.name.trim()) {
      toast.error('University name is required')
      return
    }
    if (isEditUni && editUniId) {
      updateUniversity(editUniId, uniForm)
      toast.success('University updated')
    } else {
      addUniversity(uniForm)
      toast.success('University registered')
    }
    setUniDialogOpen(false)
  }

  const handleSave = () => {
    const rate = Number(whtRate)
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      toast.error('Invalid WHT rate')
      return
    }
    setWhtRatePercent(rate)
    logAudit({ module: 'Settings', action: 'Updated system settings', details: `WHT ${rate}%` })
    toast.success('Settings saved', {
      description: `WHT ${rate}%, ${enabledCurrencies.length} currencies, fiscal lock through ${fiscalPeriodLockedUntil ?? 'none'}.`,
    })
  }

  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" subtitle="Universities, commission rates, tax defaults, and currencies">
        <Button onClick={handleSave}>Save Changes</Button>
      </PageHeader>

      <Tabs defaultValue="universities">
        <TabsList>
          <TabsTrigger value="universities" className="gap-2"><GraduationCap className="h-4 w-4" /> Registered Universities</TabsTrigger>
          <TabsTrigger value="general" className="gap-2"><Settings className="h-4 w-4" /> General Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="universities" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Registered Universities</CardTitle>
                <CardDescription>Manage universities with country and default commission rates — used when creating invoices</CardDescription>
              </div>
              <Button onClick={openAddUniversity}><Plus className="mr-1 h-4 w-4" /> Register University</Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>University Name</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Commission Rate</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {universities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                          No universities registered yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      universities.map((uni) => (
                        <TableRow key={uni.id}>
                          <TableCell className="font-medium">{uni.name}</TableCell>
                          <TableCell><Badge variant="outline">{uni.country}</Badge></TableCell>
                          <TableCell>{uni.currency}</TableCell>
                          <TableCell className="text-right font-medium">{uni.defaultCommissionRate}%</TableCell>
                          <TableCell>
                            <RowActions onEdit={() => openEditUniversity(uni)} onDelete={() => handleDeleteUniversity(uni)} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">WHT Rate</CardTitle>
                <CardDescription>Default withholding tax on commission receivable and sub-agent payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex max-w-xs items-end gap-3">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="wht-rate">Rate (%)</Label>
                    <Input id="wht-rate" type="number" min="0" max="100" step="0.1" value={whtRate} onChange={(e) => setWhtRate(e.target.value)} />
                  </div>
                  <p className="pb-2 text-sm text-muted-foreground">Applied at 1% per FBR rules</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Enabled Currencies</CardTitle>
                <CardDescription>PKR is always required; toggle foreign currencies for transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {ALL_CURRENCIES.map((currency) => {
                    const active = enabledCurrencies.includes(currency)
                    const locked = currency === 'PKR'
                    return (
                      <button key={currency} type="button" disabled={locked} onClick={() => toggleCurrency(currency)} className="disabled:cursor-not-allowed">
                        <Badge variant={active ? 'default' : 'outline'} className="cursor-pointer px-3 py-1">{currency}</Badge>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Fiscal Period Lock</CardTitle>
                <CardDescription>Transactions on or before this date cannot be created or edited</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-w-xs space-y-2">
                  <Label htmlFor="fiscal-lock">Locked through</Label>
                  <Input
                    id="fiscal-lock"
                    type="date"
                    value={fiscalPeriodLockedUntil ?? ''}
                    onChange={(e) => setFiscalPeriodLockedUntil(e.target.value || null)}
                  />
                  <p className="text-xs text-muted-foreground">Set to empty to unlock all periods (Super Admin only).</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Commission Rate Options</CardTitle>
              <CardDescription>Available commission rate dropdown values when creating invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[10, 12.5, 15, 17.5, 20, 22.5].map((rate) => (
                  <Badge key={rate} variant="secondary" className="px-3 py-1">{rate}%</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={uniDialogOpen} onOpenChange={setUniDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditUni ? 'Edit University' : 'Register University'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>University Name</Label>
              <Input value={uniForm.name} onChange={(e) => setUniForm({ ...uniForm, name: e.target.value })} placeholder="e.g. University of Manchester" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={uniForm.country} onValueChange={(v) => setUniForm({ ...uniForm, country: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select value={uniForm.currency} onValueChange={(v) => setUniForm({ ...uniForm, currency: v as Currency })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['GBP', 'USD', 'CAD', 'AUD', 'EUR'] as const).map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Default Commission Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={uniForm.defaultCommissionRate}
                  onChange={(e) => setUniForm({ ...uniForm, defaultCommissionRate: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUniDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveUniversity}>{isEditUni ? 'Save Changes' : 'Register'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
