import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '@/lib/db'
import { calculateStatus } from '@/lib/expiry'
import { DashboardCard } from '@/components/DashboardCard'
import { useUIStore } from '@/stores/uiStore'

export function DashboardScreen() {
  const navigate = useNavigate()
  const clearAllFilters = useUIStore((s) => s.clearAllFilters)
  const toggleStatus = useUIStore((s) => s.toggleStatus)

  // Single useLiveQuery pass — compute all 4 metrics from active medicines.
  // NOTE on Pitfall 3: calculateStatus IS called inside useLiveQuery here intentionally.
  // The dashboard only updates when DB data changes, not on timer ticks (Pattern 9 approximation).
  // Trade-off: a medicine that crosses the expiry boundary mid-session won't update until the
  // user adds/edits another record. Acceptable for the household daily-driver use case.
  // Trade-off for DoS (T-02-06): full table scan at each DB change; stays ~10ms at target
  // household scale (< 1,000 medicines per RESEARCH.md A1 assumption).
  const stats = useLiveQuery(async () => {
    const all = await db.medicines
      .toCollection()
      .filter((m) => m.deletedAt === null)
      .toArray()

    const now = new Date()
    const today = now.toISOString().slice(0, 10)
    const in30 = new Date(now.getTime() + 30 * 86_400_000).toISOString().slice(0, 10)

    let expired = 0
    let expiringSoon = 0
    let exceededOpenPeriod = 0

    for (const m of all) {
      const status = calculateStatus(m, now)
      if (status === 'Expired') expired++
      // Expiring Soon: not yet expired by date, expiry within 30 days, no manual status override
      if (
        m.manualStatus === null &&
        m.expiryDate &&
        m.expiryDate > today &&
        m.expiryDate <= in30
      ) {
        expiringSoon++
      }
      // Exceeded Open Period: calculateStatus reports Expired but expiry date is still in the future
      // This means the PAO window caused the expiry (Pattern 9 approximation)
      if (status === 'Expired' && m.expiryDate && m.expiryDate > today) {
        exceededOpenPeriod++
      }
    }

    return { total: all.length, expired, expiringSoon, exceededOpenPeriod }
  }, [])

  if (!stats) return <div className="p-4">Loading...</div>

  const handleExpiredTap = () => {
    clearAllFilters()
    toggleStatus('Expired')
    void navigate('/medicines')
  }

  const handleExpiringSoonTap = () => {
    clearAllFilters()
    // Advisory metric only — expiring soon is not a calculateStatus output
    void navigate('/medicines')
  }

  const handleExceededOpenPeriodTap = () => {
    clearAllFilters()
    toggleStatus('Expired')
    void navigate('/medicines')
  }

  return (
    <div>
      <h1 className="text-xl font-semibold p-4">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 p-4">
        <DashboardCard
          label="Total Medicines"
          count={stats.total}
          colorClass="bg-white border-gray-200 text-gray-900"
          interactive={false}
        />
        <DashboardCard
          label="Expired"
          count={stats.expired}
          colorClass="bg-red-50 border-red-200 text-red-700"
          onTap={handleExpiredTap}
        />
        <DashboardCard
          label="Expiring Soon (30 days)"
          count={stats.expiringSoon}
          colorClass="bg-amber-50 border-amber-200 text-amber-700"
          onTap={handleExpiringSoonTap}
        />
        <DashboardCard
          label="Exceeded Open Period"
          count={stats.exceededOpenPeriod}
          colorClass="bg-orange-50 border-orange-200 text-orange-700"
          onTap={handleExceededOpenPeriodTap}
        />
      </div>
    </div>
  )
}
