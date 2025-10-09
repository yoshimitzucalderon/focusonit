'use client'

import { useState, useEffect, useRef } from 'react'
import { Task } from '@/types/database.types'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { format, addDays, subDays, isToday as isTodayFn } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import MobileTaskBlock from './MobileTaskBlock'
import UnscheduledTasksMobile from './UnscheduledTasksMobile'

interface MobileCalendarViewProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  scheduledTasks: Task[]
  unscheduledTasks: Task[]
  onEditTask: (task: Task) => void
  onAddTask: () => void
  onToggleComplete?: (taskId: string) => void
  onUpdateTaskTime?: (taskId: string, newTimes: { start_time: string, end_time: string }) => Promise<void>
}

export default function MobileCalendarView({
  selectedDate,
  onDateChange,
  scheduledTasks,
  unscheduledTasks,
  onEditTask,
  onAddTask,
  onToggleComplete,
  onUpdateTaskTime
}: MobileCalendarViewProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const calendarRef = useRef<HTMLDivElement>(null)

  // Actualizar hora actual cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  // Scroll al horario actual o las 8am
  useEffect(() => {
    if (calendarRef.current && isTodayFn(selectedDate)) {
      const currentHour = new Date().getHours()
      const scrollToHour = currentHour > 6 ? currentHour - 1 : 7
      const scrollPosition = scrollToHour * 64 // 64px por hora
      calendarRef.current.scrollTop = scrollPosition
    } else if (calendarRef.current) {
      calendarRef.current.scrollTop = 7 * 64 // 8am
    }
  }, [selectedDate])

  // Generar horas (7am a 11pm para vista móvil compacta)
  const hours = Array.from({ length: 17 }, (_, i) => i + 7)

  // Navegar entre días
  const goToPreviousDay = () => onDateChange(subDays(selectedDate, 1))
  const goToNextDay = () => onDateChange(addDays(selectedDate, 1))
  const goToToday = () => onDateChange(new Date())

  // Calcular posición de la tarea
  const getTaskPosition = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const startInMinutes = startHour * 60 + startMinute
    const endInMinutes = endHour * 60 + endMinute
    const durationInMinutes = endInMinutes - startInMinutes

    // Ajustar al horario de inicio (7am = 0px)
    const adjustedStartMinutes = startInMinutes - (7 * 60)
    const top = Math.max(0, adjustedStartMinutes * (64 / 60)) // 64px por hora
    const height = durationInMinutes * (64 / 60)

    return { top, height }
  }

  // Detectar tareas que se solapan en el tiempo
  const getSimultaneousTasks = (task: Task): Task[] => {
    if (!task.start_time || !task.end_time) return []

    const [taskStartHour, taskStartMin] = task.start_time.split(':').map(Number)
    const [taskEndHour, taskEndMin] = task.end_time.split(':').map(Number)
    const taskStart = taskStartHour * 60 + taskStartMin
    const taskEnd = taskEndHour * 60 + taskEndMin

    return scheduledTasks.filter(otherTask => {
      if (otherTask.id === task.id) return true // Incluir la tarea misma
      if (!otherTask.start_time || !otherTask.end_time) return false

      const [otherStartHour, otherStartMin] = otherTask.start_time.split(':').map(Number)
      const [otherEndHour, otherEndMin] = otherTask.end_time.split(':').map(Number)
      const otherStart = otherStartHour * 60 + otherStartMin
      const otherEnd = otherEndHour * 60 + otherEndMin

      // Detectar solapamiento
      return taskStart < otherEnd && taskEnd > otherStart
    })
  }

  // Calcular layout (ancho y posición) para tareas simultáneas
  const calculateTaskLayout = (task: Task) => {
    const simultaneousTasks = getSimultaneousTasks(task)

    if (simultaneousTasks.length <= 1) {
      return { width: '100%', left: '0%', zIndex: 1 }
    }

    // Ordenar por hora de inicio para asignar columnas
    const sortedTasks = [...simultaneousTasks].sort((a, b) => {
      const aStart = a.start_time?.split(':').map(Number)[0] || 0
      const bStart = b.start_time?.split(':').map(Number)[0] || 0
      return aStart - bStart
    })

    const totalTasks = sortedTasks.length
    const taskIndex = sortedTasks.findIndex(t => t.id === task.id)

    // Calcular ancho y posición con pequeño margen para visual
    const widthPercentage = (100 / totalTasks) - 1
    const leftPercentage = (100 / totalTasks) * taskIndex

    console.log(`📊 Layout para "${task.title}": ${totalTasks} tareas simultáneas, columna ${taskIndex + 1}/${totalTasks}`)

    return {
      width: `${widthPercentage}%`,
      left: `${leftPercentage}%`,
      zIndex: taskIndex + 1
    }
  }

  // Renderizar línea de hora actual
  const renderCurrentTimeLine = () => {
    if (!isTodayFn(selectedDate)) return null

    const now = currentTime
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    // Solo mostrar si está en el rango visible (7am-11pm)
    if (currentHour < 7 || currentHour >= 23) return null

    const totalMinutes = (currentHour - 7) * 60 + currentMinute
    const top = totalMinutes * (64 / 60)

    return (
      <div
        className="absolute left-0 right-0 z-20 pointer-events-none"
        style={{ top: `${top}px` }}
      >
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-red-500 shadow-lg" />
          <div className="flex-1 h-0.5 bg-red-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 pb-32">

      {/* HEADER COMPACTO */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
              FocusOnIt
            </h1>
          </div>
        </div>

        {/* FECHA Y NAVEGACIÓN */}
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {scheduledTasks.length} {scheduledTasks.length === 1 ? 'tarea programada' : 'tareas programadas'}
            </p>
          </div>

          <div className="flex gap-1">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goToPreviousDay}
              className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </motion.button>

            {!isTodayFn(selectedDate) && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={goToToday}
                className="px-3 py-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-semibold text-sm active:bg-primary-200 dark:active:bg-primary-800/50 transition-colors"
              >
                Hoy
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={goToNextDay}
              className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* CALENDARIO */}
      <div
        ref={calendarRef}
        className="flex-1 overflow-y-auto overflow-x-hidden px-3"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="relative" style={{ height: `${hours.length * 64}px` }}>
          {/* Grid de horas */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="relative h-16 border-b border-gray-200 dark:border-gray-700"
            >
              {/* Etiqueta de hora */}
              <span className="absolute -left-1 top-0 -translate-y-1/2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded">
                {hour.toString().padStart(2, '0')}:00
              </span>
            </div>
          ))}

          {/* Tareas programadas */}
          <div className="absolute left-12 right-0 top-0 bottom-0">
            {scheduledTasks.map((task) => {
              if (!task.start_time || !task.end_time) return null
              const { top, height } = getTaskPosition(task.start_time, task.end_time)
              const { width, left, zIndex } = calculateTaskLayout(task)

              // Solo mostrar si está en el rango visible
              const [startHour] = task.start_time.split(':').map(Number)
              if (startHour < 7 || startHour >= 23) return null

              return (
                <MobileTaskBlock
                  key={task.id}
                  task={task}
                  top={top}
                  height={height}
                  width={width}
                  left={left}
                  zIndex={zIndex}
                  onTap={() => onEditTask(task)}
                  onUpdateTime={onUpdateTaskTime}
                />
              )
            })}
          </div>

          {/* Línea de hora actual */}
          {renderCurrentTimeLine()}
        </div>
      </div>

      {/* FAB - BOTÓN FLOTANTE PARA AGREGAR */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onAddTask}
        className="
          fixed bottom-24 right-4 z-40
          w-14 h-14 bg-gradient-to-r from-primary-600 to-purple-600
          text-white rounded-full shadow-2xl
          flex items-center justify-center
          active:shadow-lg
          transition-shadow
        "
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      {/* BOTTOM SHEET - TAREAS SIN PROGRAMAR */}
      <UnscheduledTasksMobile
        tasks={unscheduledTasks}
        onScheduleTask={onEditTask}
        onToggleComplete={onToggleComplete}
      />
    </div>
  )
}
