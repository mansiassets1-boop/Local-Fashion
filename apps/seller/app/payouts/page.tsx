'use client'

import { useQuery } from '@tanstack/react-query'
import {
  Wallet,
  Clock,
  CheckCircle2,
  Download,
  Info,
  TrendingDown,
} from 'lucide-react'
import { format } from 'date-fns'
import DashboardLayout from '@/components/DashboardLayout'
import AuthGuard from '@/components/AuthGuard'
import api from '@/lib/api'

interface CurrentCycle {
  period_start: string
  period_end: string
  gross_revenue: number
  platform_fee: number
  platform_fee_pct: number
  net_earnings: number
  orders_count: number
  status: 'pending' | 'processing' | 'paid'
}

interface Payout {
  id: string
  period_start: string
  period_end: string
  gross_revenue: number
  platform_fee: number
  net_earnings: number
  status: 'paid' | 'processing' | 'failed'
  transfer_date?: string
  utr_number?: string
}

const STATUS_STYLES = {
  paid: 'bg-emerald-100 text-emerald-700',
  processing: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
}

export default function PayoutsPage() {
  const { data: currentCycle, isLoading: cycleLoading } = useQuery<CurrentCycle>({
    queryKey: ['payout-current'],
    queryFn: () => api.get('/sellers/payouts/current').then((r) => r.data),
  })

  const { data: history, isLoading: historyLoading } = useQuery<{ payouts: Payout[] }>({
    queryKey: ['payout-history'],
    queryFn: () => api.get('/sellers/payouts/history').then((r) => r.data),
  })

  const payouts = history?.payouts || []

  const downloadStatement = (payoutId: string) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/sellers/payouts/${payoutId}/statement`, '_blank')
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Payouts</h1>

        {/* Current Cycle */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-orange-500" />
            <h2 className="text-base font-semibold text-gray-900">Current Payout Cycle</h2>
            {currentCycle && (
              <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[currentCycle.status]}`}>
                {currentCycle.status}
              </span>
            )}
          </div>

          {cycleLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-5 bg-gray-200 rounded w-1/3" />
              <div className="h-12 bg-gray-200 rounded" />
            </div>
          ) : currentCycle ? (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {format(new Date(currentCycle.period_start), 'dd MMM')} —{' '}
                {format(new Date(currentCycle.period_end), 'dd MMM yyyy')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Gross Revenue</p>
                  <p className="text-xl font-bold text-gray-900">
                    ₹{currentCycle.gross_revenue.toLocaleString('en-IN')}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{currentCycle.orders_count} orders</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <p className="text-xs text-red-500 mb-1 flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Platform Fee ({currentCycle.platform_fee_pct}%)
                  </p>
                  <p className="text-xl font-bold text-red-700">
                    -₹{currentCycle.platform_fee.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-4">
                  <p className="text-xs text-emerald-600 mb-1 flex items-center gap-1">
                    <Wallet className="h-3 w-3" />
                    Your Earnings
                  </p>
                  <p className="text-xl font-bold text-emerald-700">
                    ₹{currentCycle.net_earnings.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Fee explanation */}
              <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
                <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Platform fee of {currentCycle.platform_fee_pct}% is deducted from each order's value.
                  This covers payment processing, delivery support, and platform maintenance.
                  Payouts are processed every 7 days (Mon–Sun cycle), transferred by Wednesday.
                </p>
              </div>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No active payout cycle</p>
          )}
        </div>

        {/* History */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Payout History</h2>
          </div>

          {historyLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
            </div>
          ) : payouts.length === 0 ? (
            <div className="p-12 text-center">
              <Wallet className="h-12 w-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No payout history yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    {['Period', 'Gross', 'Platform Fee', 'Net Earnings', 'Status', 'Transfer Date', ''].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5 text-sm text-gray-900">
                        {format(new Date(payout.period_start), 'dd MMM')} —{' '}
                        {format(new Date(payout.period_end), 'dd MMM yyyy')}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                        ₹{payout.gross_revenue.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-red-600">
                        -₹{payout.platform_fee.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-emerald-700">
                        ₹{payout.net_earnings.toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[payout.status]}`}
                        >
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500">
                        {payout.transfer_date
                          ? format(new Date(payout.transfer_date), 'dd MMM yyyy')
                          : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        {payout.status === 'paid' && (
                          <button
                            onClick={() => downloadStatement(payout.id)}
                            className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            <Download className="h-3.5 w-3.5" />
                            Statement
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
