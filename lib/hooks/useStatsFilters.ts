import { useState, useMemo } from 'react'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns'

export type TimePeriod = 'today' | 'week' | 'month' | 'year' | 'custom'

export interface DateRange {
  start: Date
  end: Date
}

export interface StatsFilter {
  period: TimePeriod
  dateRange: DateRange
  previousPeriodRange: DateRange
}

export function useStatsFilters() {
  const [period, setPeriod] = useState<TimePeriod>('week')
  const [customRange, setCustomRange] = useState<DateRange>({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date())
  })

  const filter = useMemo<StatsFilter>(() => {
    const now = new Date()
    let dateRange: DateRange
    let previousPeriodRange: DateRange

    switch (period) {
      case 'today':
        dateRange = {
          start: startOfDay(now),
          end: endOfDay(now)
        }
        previousPeriodRange = {
          start: startOfDay(subDays(now, 1)),
          end: endOfDay(subDays(now, 1))
        }
        break

      case 'week':
        dateRange = {
          start: startOfWeek(now, { weekStartsOn: 1 }), // Lunes
          end: endOfWeek(now, { weekStartsOn: 1 })
        }
        previousPeriodRange = {
          start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
          end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
        }
        break

      case 'month':
        dateRange = {
          start: startOfMonth(now),
          end: endOfMonth(now)
        }
        previousPeriodRange = {
          start: startOfMonth(subMonths(now, 1)),
          end: endOfMonth(subMonths(now, 1))
        }
        break

      case 'year':
        dateRange = {
          start: startOfYear(now),
          end: endOfYear(now)
        }
        previousPeriodRange = {
          start: startOfYear(subYears(now, 1)),
          end: endOfYear(subYears(now, 1))
        }
        break

      case 'custom':
        dateRange = customRange
        const daysDiff = Math.ceil((customRange.end.getTime() - customRange.start.getTime()) / (1000 * 60 * 60 * 24))
        previousPeriodRange = {
          start: subDays(customRange.start, daysDiff),
          end: subDays(customRange.end, daysDiff)
        }
        break

      default:
        dateRange = {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 })
        }
        previousPeriodRange = {
          start: startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }),
          end: endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
        }
    }

    return {
      period,
      dateRange,
      previousPeriodRange
    }
  }, [period, customRange])

  return {
    filter,
    setPeriod,
    setCustomRange
  }
}
