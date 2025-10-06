'use client'

import { useState, useEffect } from 'react'
import { PomodoroSettings } from '@/types/database.types'
import { getPomodoroSettings } from '@/lib/supabase/pomodoroSettingsQueries'

export function usePomodoroSettings(userId: string | undefined) {
  const [settings, setSettings] = useState<PomodoroSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return

    const loadSettings = async () => {
      try {
        const data = await getPomodoroSettings(userId)
        setSettings(data)
      } catch (error) {
        console.error('Error loading pomodoro settings:', error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [userId])

  return { settings, loading }
}
