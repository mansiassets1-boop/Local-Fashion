'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { clsx } from 'clsx'

interface SLATimerProps {
  deadline: string
  compact?: boolean
}

export default function SLATimer({ deadline, compact = false }: SLATimerProps) {
  const [remaining, setRemaining] = useState<number>(0)

  useEffect(() => {
    const calc = () => {
      const diff = new Date(deadline).getTime() - Date.now()
      setRemaining(Math.max(0, diff))
    }
    calc()
    const interval = setInterval(calc, 1000)
    return () => clearInterval(interval)
  }, [deadline])

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  const isUrgent = minutes < 5
  const isExpired = remaining === 0

  if (compact) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold',
          isExpired
            ? 'bg-red-600 text-white'
            : isUrgent
            ? 'bg-red-100 text-red-700 sla-urgent'
            : 'bg-orange-100 text-orange-700'
        )}
      >
        <Clock className="h-3 w-3" />
        {isExpired ? 'EXPIRED' : `${minutes}:${seconds.toString().padStart(2, '0')}`}
      </span>
    )
  }

  return (
    <div
      className={clsx(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        isExpired
          ? 'bg-red-600 text-white'
          : isUrgent
          ? 'bg-red-50 border border-red-200 sla-urgent'
          : 'bg-orange-50 border border-orange-200'
      )}
    >
      <Clock className={clsx('h-4 w-4', isExpired || isUrgent ? 'text-red-600' : 'text-orange-600')} />
      <div>
        <p className={clsx('text-xs', isExpired || isUrgent ? 'text-red-500' : 'text-orange-500')}>
          SLA Deadline
        </p>
        <p
          className={clsx(
            'text-lg font-bold font-mono',
            isExpired ? 'text-white' : isUrgent ? 'text-red-700' : 'text-orange-700'
          )}
        >
          {isExpired ? 'EXPIRED' : `${minutes}:${seconds.toString().padStart(2, '0')}`}
        </p>
      </div>
    </div>
  )
}
