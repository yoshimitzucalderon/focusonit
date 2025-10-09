'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { format, addDays, subDays, isToday as isTodayFn, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import CalendarTaskBlock from './CalendarTaskBlock'
import UnscheduledTasks from './UnscheduledTasks'
import TimeScheduleModal from './TimeScheduleModal'
import CalendarDropZone from './CalendarDropZone'

interface CalendarViewProps {
  userId: string
}

export default function CalendarView({ userId }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [scheduledTasks, setScheduledTasks] = useState<Task[]>([])
  const [unscheduledTasks, setUnscheduledTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  // Configurar sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  // Generar array de horas (00:00 a 23:00)
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Obtener hora actual para la línea indicadora
  const [currentTime, setCurrentTime] = useState(new Date())
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000) // Update every minute
    return () => clearInterval(timer)
  }, [])

  // Cargar tareas
  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd')

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .or(`due_date.eq.${dateString},due_date.is.null`)
        .order('start_time', { ascending: true, nullsFirst: false })

      if (error) throw error

      const allTasks: Task[] = (data as Task[]) || []

      // Separar tareas programadas vs sin programar
      const scheduled = allTasks.filter(task =>
        task.due_date === dateString &&
        !task.is_all_day &&
        task.start_time &&
        task.end_time
      )

      const unscheduled = allTasks.filter(task =>
        (task.due_date === dateString && task.is_all_day) ||
        task.due_date === null ||
        !task.start_time ||
        !task.end_time
      )

      setScheduledTasks(scheduled)
      setUnscheduledTasks(unscheduled)
      setTasks(allTasks)
    } catch (error) {
      console.error('Error loading tasks:', error)
      toast.error('Error al cargar tareas')
    } finally {
      setLoading(false)
    }
  }, [selectedDate, userId, supabase])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // Navegar entre días
  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1))
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1))
  const goToToday = () => setSelectedDate(new Date())

  // Calcular posición de la tarea en el grid (en píxeles)
  const getTaskPosition = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':').map(Number)
    const [endHour, endMinute] = endTime.split(':').map(Number)

    const startInMinutes = startHour * 60 + startMinute
    const endInMinutes = endHour * 60 + endMinute
    const durationInMinutes = endInMinutes - startInMinutes

    // Cada hora = 60px, entonces cada minuto = 1px
    const top = startInMinutes
    const height = durationInMinutes

    return { top, height }
  }

  // Handler cuando comienza el drag
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string

    // Check if it's a scheduled task (ID format: "scheduled-{taskId}")
    let task: Task | undefined
    if (taskId.startsWith('scheduled-')) {
      const actualTaskId = taskId.replace('scheduled-', '')
      task = scheduledTasks.find(t => t.id === actualTaskId)
    } else {
      task = unscheduledTasks.find(t => t.id === taskId)
    }

    if (task) {
      setActiveTask(task)
    }
  }

  // Handler cuando termina el drag
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const taskId = active.id as string

    // Check if it's a scheduled task (ID format: "scheduled-{taskId}")
    let task: Task | undefined
    if (taskId.startsWith('scheduled-')) {
      const actualTaskId = taskId.replace('scheduled-', '')
      task = scheduledTasks.find(t => t.id === actualTaskId)
    } else {
      task = unscheduledTasks.find(t => t.id === taskId)
    }

    if (!task) return

    // El over.id tiene el formato "hour-X" donde X es la hora
    const hourMatch = (over.id as string).match(/hour-(\d+)/)
    if (!hourMatch) return

    const hour = parseInt(hourMatch[1])
    await scheduleTask(task, hour)
  }

  // Función para programar una tarea en un horario específico
  const scheduleTask = async (task: Task, hour: number, minute: number = 0) => {
    try {
      const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`
      const dateString = format(selectedDate, 'yyyy-MM-dd')

      const { error } = await supabase
        .from('tasks')
        // @ts-ignore - Temporary fix for Supabase type inference issue with new columns
        .update({
          start_time: startTime,
          end_time: endTime,
          is_all_day: false,
          due_date: dateString,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id)

      if (error) throw error

      toast.success('Tarea programada')
      loadTasks()
    } catch (error) {
      console.error('Error scheduling task:', error)
      toast.error('Error al programar tarea')
    }
  }

  // Renderizar línea de hora actual
  const renderCurrentTimeLine = () => {
    if (!isTodayFn(selectedDate)) return null

    const now = currentTime
    const minutes = now.getHours() * 60 + now.getMinutes()
    const top = minutes

    return (
      <div
        className="absolute left-0 right-0 z-20 pointer-events-none"
        style={{ top: `${top}px` }}
      >
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <div className="flex-1 h-0.5 bg-red-500" />
        </div>
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
    <div className="h-full flex flex-col">
      {/* Header con navegación de fechas */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <CalendarIcon className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {scheduledTasks.length} tareas programadas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToPreviousDay}
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              <ChevronLeft size={20} className="text-gray-700 dark:text-gray-300" />
            </motion.button>

            {!isTodayFn(selectedDate) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToToday}
                className="px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                Hoy
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={goToNextDay}
              className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              <ChevronRight size={20} className="text-gray-700 dark:text-gray-300" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Layout principal: Tareas sin programar + Calendario */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Tareas sin programar (sidebar) */}
        <UnscheduledTasks
          tasks={unscheduledTasks}
          onRefresh={loadTasks}
        />

        {/* Vista de calendario */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div
            ref={calendarRef}
            className="h-full overflow-y-auto overflow-x-hidden"
            style={{ scrollBehavior: 'smooth' }}
          >
            <div className="relative" style={{ height: '1440px' }}> {/* 24 horas * 60px */}
              {/* Grid de horas con drop zones */}
              {hours.map((hour) => (
                <CalendarDropZone key={hour} hour={hour} />
              ))}

              {/* Tareas programadas */}
              <div className="absolute left-16 right-0 top-0 bottom-0">
                {scheduledTasks.map((task) => {
                  if (!task.start_time || !task.end_time) return null
                  const { top, height } = getTaskPosition(task.start_time, task.end_time)

                  return (
                    <CalendarTaskBlock
                      key={task.id}
                      task={task}
                      top={top}
                      height={height}
                      onEdit={() => setEditingTask(task)}
                      onUpdate={loadTasks}
                    />
                  )
                })}
              </div>

              {/* Línea de hora actual */}
              {renderCurrentTimeLine()}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de edición de horarios */}
      {editingTask && (
        <TimeScheduleModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={loadTasks}
        />
      )}

      {/* Drag overlay - muestra una copia de la tarea mientras se arrastra */}
      <DragOverlay>
        {activeTask ? (
          <div className="bg-blue-100 dark:bg-blue-900/30 border-l-4 border-blue-500 rounded-lg px-3 py-2 shadow-lg opacity-90">
            <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
              {activeTask.title}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </div>
    </DndContext>
  )
}
