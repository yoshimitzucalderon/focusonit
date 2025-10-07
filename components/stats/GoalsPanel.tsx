'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Settings } from 'lucide-react'

interface Goal {
  id: string
  icon: string
  title: string
  description: string
  current: number
  target: number
  unit: string
  percentage: number
  status: 'pending' | 'in-progress' | 'completed'
  color: string
}

interface GoalsPanelProps {
  sessions: any[]
  tasks: any[]
  periodFilter: 'today' | 'week' | 'month' | 'year'
}

// Targets configurables (pueden venir de settings en el futuro)
const DEFAULT_TARGETS = {
  weeklyHours: 20,
  monthlyHours: 80,
  weeklyTasks: 15,
  monthlyTasks: 60,
  streakDays: 7
}

export function GoalsPanel({ sessions, tasks, periodFilter }: GoalsPanelProps) {
  const goals = useMemo(() =>
    calculateGoals(sessions, tasks, periodFilter),
    [sessions, tasks, periodFilter]
  )

  const periodLabel = periodFilter === 'week' ? 'Semanales' :
                      periodFilter === 'month' ? 'Mensuales' :
                      'del Período'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Objetivos {periodLabel}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Progreso hacia tus metas
            </p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors" title="Configurar objetivos">
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Lista de objetivos */}
      <div className="space-y-6">
        {goals.map((goal, index) => (
          <GoalItem key={goal.id} goal={goal} index={index} />
        ))}
      </div>

      {/* Footer */}
      <button className="w-full mt-6 py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition font-medium text-sm flex items-center justify-center gap-2">
        <Settings className="w-4 h-4" />
        Configurar objetivos
      </button>
    </motion.div>
  )
}

// Sub-componente para cada objetivo
function GoalItem({ goal, index }: { goal: Goal; index: number }) {
  const isCompleted = goal.status === 'completed'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6 + index * 0.1 }}
    >
      {/* Header del objetivo */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{goal.icon}</span>
            <h3 className="font-semibold text-gray-900 dark:text-white">{goal.title}</h3>
            {isCompleted && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                className="text-lg"
              >
                🎉
              </motion.span>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{goal.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: goal.color }}>
            {goal.percentage}%
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="relative mt-3">
        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(goal.percentage, 100)}%` }}
            transition={{ duration: 1, delay: 0.7 + index * 0.1 }}
            className="h-4 rounded-full flex items-center justify-end px-2"
            style={{
              backgroundColor: goal.color
            }}
          >
            {goal.percentage > 20 && (
              <span className="text-xs font-bold text-white">
                {goal.percentage}%
              </span>
            )}
          </motion.div>
        </div>

        {/* Texto debajo */}
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {goal.current} / {goal.target} {goal.unit}
          </span>
          {isCompleted ? (
            <span className="text-sm font-semibold text-green-600 dark:text-green-400">
              ¡Logrado!
            </span>
          ) : (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Faltan {(goal.target - goal.current).toFixed(1)} {goal.unit}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Función de cálculo de objetivos
function calculateGoals(
  sessions: any[],
  tasks: any[],
  period: string
): Goal[] {
  // Calcular totales actuales
  const totalMinutes = sessions.reduce((sum, s) => sum + Math.floor(s.duration / 60), 0)
  const totalHours = parseFloat((totalMinutes / 60).toFixed(1))

  const completedTasks = tasks.filter(t => t.completed_at).length

  const currentStreak = calculateStreak(sessions)

  // Determinar targets según el período
  const hoursTarget = period === 'week' ? DEFAULT_TARGETS.weeklyHours :
                      period === 'month' ? DEFAULT_TARGETS.monthlyHours :
                      DEFAULT_TARGETS.weeklyHours

  const tasksTarget = period === 'week' ? DEFAULT_TARGETS.weeklyTasks :
                      period === 'month' ? DEFAULT_TARGETS.monthlyTasks :
                      DEFAULT_TARGETS.weeklyTasks

  // Construir array de objetivos
  return [
    {
      id: 'hours',
      icon: '⏱️',
      title: period === 'week' ? 'Horas semanales' : period === 'month' ? 'Horas mensuales' : 'Horas del período',
      description: 'Tiempo de trabajo objetivo',
      current: totalHours,
      target: hoursTarget,
      unit: 'horas',
      percentage: Math.round((totalHours / hoursTarget) * 100),
      status: totalHours >= hoursTarget ? 'completed' : totalHours > 0 ? 'in-progress' : 'pending',
      color: '#3B82F6'
    },
    {
      id: 'tasks',
      icon: '✅',
      title: period === 'week' ? 'Tareas completadas' : period === 'month' ? 'Tareas mensuales' : 'Tareas del período',
      description: 'Meta de productividad',
      current: completedTasks,
      target: tasksTarget,
      unit: 'tareas',
      percentage: Math.round((completedTasks / tasksTarget) * 100),
      status: completedTasks >= tasksTarget ? 'completed' : completedTasks > 0 ? 'in-progress' : 'pending',
      color: '#10B981'
    },
    {
      id: 'streak',
      icon: '🔥',
      title: 'Racha de días',
      description: 'Días consecutivos trabajando',
      current: currentStreak,
      target: DEFAULT_TARGETS.streakDays,
      unit: 'días',
      percentage: Math.round((currentStreak / DEFAULT_TARGETS.streakDays) * 100),
      status: currentStreak >= DEFAULT_TARGETS.streakDays ? 'completed' : currentStreak > 0 ? 'in-progress' : 'pending',
      color: '#F59E0B'
    }
  ]
}

// Calcular racha de días consecutivos
function calculateStreak(sessions: any[]): number {
  if (sessions.length === 0) return 0

  // Ordenar sesiones por fecha (más reciente primero)
  const sortedSessions = [...sessions].sort((a, b) =>
    new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
  )

  // Agrupar por día
  const dayMap = new Map<string, boolean>()
  sortedSessions.forEach(session => {
    const day = new Date(session.started_at).toISOString().split('T')[0]
    dayMap.set(day, true)
  })

  // Contar días consecutivos desde hoy
  let streak = 0
  let currentDate = new Date()

  // Ajustar a medianoche
  currentDate.setHours(0, 0, 0, 0)

  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0]
    if (!dayMap.has(dateStr)) break
    streak++
    currentDate.setDate(currentDate.getDate() - 1)
  }

  return streak
}
