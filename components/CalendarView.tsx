'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Task } from '@/types/database.types'
import { createClient } from '@/lib/supabase/client'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { format, addDays, subDays, isToday as isTodayFn, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragMoveEvent } from '@dnd-kit/core'
import { normalizeTaskTimes } from '@/lib/utils/timeNormalization'
import { cleanupAllTasks, analyzeTasksOnly } from '@/lib/utils/cleanupTasks'
import CalendarTaskBlock from './CalendarTaskBlock'
import UnscheduledTasks from './UnscheduledTasks'
import TimeScheduleModal from './TimeScheduleModal'
import CalendarDropZone from './CalendarDropZone'
import MobileCalendarView from './MobileCalendarView'
import CalendarDragGuide from './CalendarDragGuide'

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
  const [isMobile, setIsMobile] = useState(false)
  const [dragMouseMinutes, setDragMouseMinutes] = useState<number | null>(null)
  const calendarRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  // Configurar sensores para drag & drop - Balance entre sensibilidad y clics
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Pequeña distancia para distinguir clic de drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 50,
        tolerance: 5,
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

      // NORMALIZAR todas las tareas al cargar
      const allTasks: Task[] = ((data as Task[]) || []).map(task => normalizeTaskTimes(task))

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

  // Detectar dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Detectar tareas que se traslapan y calcular posiciones
  const detectOverlappingTasks = () => {
    const overlaps: Map<string, { width: number, offset: number, count: number }> = new Map()

    scheduledTasks.forEach((task1, index1) => {
      if (!task1.start_time || !task1.end_time) return

      const [start1Hour, start1Min] = task1.start_time.split(':').map(Number)
      const [end1Hour, end1Min] = task1.end_time.split(':').map(Number)
      const start1Minutes = start1Hour * 60 + start1Min
      const end1Minutes = end1Hour * 60 + end1Min

      const overlappingTasks: number[] = []

      scheduledTasks.forEach((task2, index2) => {
        if (index1 === index2 || !task2.start_time || !task2.end_time) return

        const [start2Hour, start2Min] = task2.start_time.split(':').map(Number)
        const [end2Hour, end2Min] = task2.end_time.split(':').map(Number)
        const start2Minutes = start2Hour * 60 + start2Min
        const end2Minutes = end2Hour * 60 + end2Min

        // Verificar si se traslapan (existe intersección)
        if (start1Minutes < end2Minutes && end1Minutes > start2Minutes) {
          overlappingTasks.push(index2)
        }
      })

      if (overlappingTasks.length > 0) {
        // Calcular posición en el grupo de tareas traslapadas
        const totalInGroup = overlappingTasks.length + 1
        let position = 0

        // Contar cuántas tareas del grupo vienen antes de esta
        overlappingTasks.forEach(otherIndex => {
          if (otherIndex < index1) {
            position++
          }
        })

        overlaps.set(task1.id, {
          width: 100 / totalInGroup,
          offset: position * (100 / totalInGroup),
          count: totalInGroup
        })
      }
    })

    return overlaps
  }

  // Handler cuando comienza el drag
  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string
    console.log('🎯 DRAG START - Task ID:', taskId)

    // Check if it's a scheduled task (ID format: "scheduled-{taskId}")
    let task: Task | undefined
    if (taskId.startsWith('scheduled-')) {
      const actualTaskId = taskId.replace('scheduled-', '')
      task = scheduledTasks.find(t => t.id === actualTaskId)
      console.log('📅 Arrastrando tarea PROGRAMADA:', task?.title)
    } else {
      task = unscheduledTasks.find(t => t.id === taskId)
      console.log('📋 Arrastrando tarea SIN PROGRAMAR:', task?.title)
    }

    if (task) {
      setActiveTask(task)
      console.log('✅ Task activa establecida para overlay')
    } else {
      console.warn('⚠️ No se encontró la tarea con ID:', taskId)
    }
  }

  // Handler cuando se mueve el drag - actualizar línea guía
  const handleDragMove = (event: DragMoveEvent) => {
    if (!calendarRef.current) return

    const { activatorEvent, delta } = event

    if (!activatorEvent) return

    const activator = activatorEvent as MouseEvent | TouchEvent | PointerEvent
    let mouseY = 0

    if ('clientY' in activator) {
      mouseY = activator.clientY
    } else if ('touches' in activator && activator.touches.length > 0) {
      mouseY = activator.touches[0].clientY
    }

    if (mouseY === 0) return

    // Calcular posición en minutos
    const calendarRect = calendarRef.current.getBoundingClientRect()
    const scrollTop = calendarRef.current.scrollTop || 0
    const relativeY = mouseY - calendarRect.top + scrollTop

    // Convertir a minutos (1px = 1 minuto)
    const minutes = Math.max(0, Math.min(1439, Math.floor(relativeY)))

    setDragMouseMinutes(minutes)
  }

  // Handler para drop HTML5 nativo
  const handleNativeTaskDrop = async (taskData: any, hour: number, minute: number) => {
    console.log('🎯 HTML5 Task Drop:', { taskData, hour, minute })

    // Buscar la tarea completa en unscheduledTasks o scheduledTasks
    const task = unscheduledTasks.find(t => t.id === taskData.id) ||
                 scheduledTasks.find(t => t.id === taskData.id)

    if (!task) {
      console.error('❌ Tarea no encontrada:', taskData.id)
      toast.error('Error: tarea no encontrada')
      return
    }

    await scheduleTask(task, hour, minute)
  }

  // Handler cuando termina el drag
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setDragMouseMinutes(null) // Limpiar línea guía

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

    // Calcular posición exacta basada en el evento del mouse
    let targetMinutes = 0

    if (calendarRef.current) {
      const calendarContainer = calendarRef.current
      const calendarRect = calendarContainer.getBoundingClientRect()

      // Obtener la posición Y final del mouse
      let mouseY = 0

      // Intentar obtener la posición desde diferentes fuentes del evento
      if (event.activatorEvent) {
        const activator = event.activatorEvent as MouseEvent | TouchEvent | PointerEvent

        if ('clientY' in activator) {
          mouseY = activator.clientY
        } else if ('touches' in activator && activator.touches.length > 0) {
          mouseY = activator.touches[0].clientY
        }
      }

      // Si no tenemos mouseY, usar el over.id como fallback
      if (mouseY === 0) {
        const hourMatch = (over.id as string).match(/hour-(\d+)/)
        if (hourMatch) {
          const hour = parseInt(hourMatch[1])
          targetMinutes = hour * 60
        }
      } else {
        // Calcular posición relativa en el calendario (considerando scroll)
        const scrollTop = calendarContainer.scrollTop || 0
        const relativeY = mouseY - calendarRect.top + scrollTop

        // Convertir posición a minutos (1px = 1 minuto)
        targetMinutes = Math.max(0, Math.min(1439, Math.floor(relativeY)))

        console.log('📍 Cálculo preciso de drop:', {
          mouseY,
          'calendarRect.top': calendarRect.top,
          scrollTop,
          relativeY,
          targetMinutes,
          snapped: Math.round(targetMinutes / 15) * 15
        })
      }

      // Calcular hora y minuto
      const hour = Math.floor(targetMinutes / 60)
      const minute = targetMinutes % 60

      await scheduleTask(task, hour, minute)
    } else {
      // Fallback sin ref: usar solo la hora del drop zone
      const hourMatch = (over.id as string).match(/hour-(\d+)/)
      if (hourMatch) {
        const hour = parseInt(hourMatch[1])
        await scheduleTask(task, hour, 0)
      }
    }
  }

  // Función para programar una tarea en un horario específico
  const scheduleTask = async (task: Task, hour: number, minute: number = 0) => {
    try {
      // Calcular duración original de la tarea (si ya tiene horario)
      let durationInMinutes = 60 // Default: 1 hora para tareas nuevas

      if (task.start_time && task.end_time) {
        // Tarea ya tiene horario - mantener su duración
        const [startHour, startMin] = task.start_time.split(':').map(Number)
        const [endHour, endMin] = task.end_time.split(':').map(Number)
        const originalStartMinutes = startHour * 60 + startMin
        const originalEndMinutes = endHour * 60 + endMin
        durationInMinutes = originalEndMinutes - originalStartMinutes
      }

      // Snap hora a intervalos de 15 minutos
      const startMinutes = hour * 60 + minute
      const snappedStartMinutes = Math.round(startMinutes / 15) * 15

      // Calcular end time manteniendo la duración
      let endMinutes = snappedStartMinutes + durationInMinutes

      // Validar que no exceda 23:59 (1439 minutos)
      if (endMinutes > 1439) {
        endMinutes = 1439
        // Ajustar start time para que quepa
        const adjustedStartMinutes = endMinutes - durationInMinutes
        if (adjustedStartMinutes < 0) {
          // Si la tarea es muy larga, ajustar al máximo posible
          toast('Tarea ajustada para no exceder las 23:59', { icon: '⚠️' })
        }
      }

      const startTime = `${Math.floor(snappedStartMinutes / 60).toString().padStart(2, '0')}:${(snappedStartMinutes % 60).toString().padStart(2, '0')}:00`
      const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}:00`
      const dateString = format(selectedDate, 'yyyy-MM-dd')

      console.log('📅 Programando tarea:', {
        original: { start: task.start_time, end: task.end_time },
        new: { start: startTime, end: endTime },
        duration: `${durationInMinutes} min`
      })

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

      toast.success(`Tarea programada (${Math.round(durationInMinutes / 60 * 10) / 10}h)`)
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

  // Handler para limpiar datos (solo en desarrollo)
  const handleCleanupData = async () => {
    const confirmCleanup = confirm('¿Analizar y limpiar datos de todas las tareas?\n\nEsto normalizará los formatos de tiempo.')

    if (!confirmCleanup) return

    const loadingToast = toast.loading('Analizando tareas...')

    try {
      // Primero analizar
      const analysis = await analyzeTasksOnly(userId)

      console.log('📊 Resultado del análisis:', analysis)

      if (analysis.tasksWithIssues === 0) {
        toast.dismiss(loadingToast)
        toast.success('✅ Todas las tareas tienen formatos correctos')
        return
      }

      // Si hay problemas, preguntar si quiere limpiar
      toast.dismiss(loadingToast)

      const confirmFix = confirm(
        `Se encontraron ${analysis.tasksWithIssues} tareas con problemas.\n\n` +
        `¿Deseas normalizarlas automáticamente?\n\n` +
        `Tareas afectadas:\n${analysis.details.slice(0, 5).map(d => `- ${d.title}`).join('\n')}`
      )

      if (!confirmFix) return

      const cleanupToast = toast.loading('Limpiando datos...')

      // Limpiar
      const result = await cleanupAllTasks(userId)

      toast.dismiss(cleanupToast)

      if (result.tasksUpdated > 0) {
        toast.success(`✅ ${result.tasksUpdated} tareas normalizadas correctamente`)
        await loadTasks() // Recargar
      } else {
        toast.success('✅ No se requirieron cambios')
      }

      if (result.errors.length > 0) {
        console.error('❌ Errores durante limpieza:', result.errors)
        toast.error(`⚠️ ${result.errors.length} errores durante la limpieza`)
      }
    } catch (error) {
      console.error('Error en limpieza:', error)
      toast.dismiss(loadingToast)
      toast.error('Error al limpiar datos')
    }
  }

  // Actualizar tiempos de tarea (para drag & drop móvil)
  const handleUpdateTaskTime = async (taskId: string, newTimes: { start_time: string, end_time: string }) => {
    console.log('💾 Actualizando tarea:', taskId, newTimes)

    try {
      // Actualizar en estado local inmediatamente para UX fluida
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? { ...task, ...newTimes }
            : task
        )
      )

      // Actualizar en base de datos
      const { error } = await supabase
        .from('tasks')
        // @ts-ignore
        .update({
          start_time: newTimes.start_time,
          end_time: newTimes.end_time,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) {
        console.error('❌ Error guardando tarea:', error)
        toast.error('Error al guardar cambios')
        // Recargar datos en caso de error
        loadTasks()
      } else {
        console.log('✅ Tarea guardada en DB')
        toast.success('Horario actualizado', { duration: 1500 })
        // Recargar para asegurar consistencia
        loadTasks()
      }
    } catch (error) {
      console.error('❌ Error actualizando tarea:', error)
      toast.error('Error al actualizar tarea')
      loadTasks()
    }
  }

  // Renderizar vista móvil en pantallas pequeñas
  if (isMobile) {
    return (
      <>
        <MobileCalendarView
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          scheduledTasks={scheduledTasks}
          unscheduledTasks={unscheduledTasks}
          onEditTask={setEditingTask}
          onAddTask={() => {
            // TODO: Implementar modal de agregar tarea
            toast('Funcionalidad en desarrollo', { icon: '🚧' })
          }}
          onUpdateTaskTime={handleUpdateTaskTime}
        />

        {/* Modal de edición compartido */}
        {editingTask && (
          <TimeScheduleModal
            task={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={loadTasks}
          />
        )}
      </>
    )
  }

  // Vista desktop (original)
  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
    <div className="h-full flex flex-col relative">
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
          onScheduleTask={(task) => setEditingTask(task)}
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
                <CalendarDropZone key={hour} hour={hour} onTaskDrop={handleNativeTaskDrop} />
              ))}

              {/* Tareas programadas */}
              <div className="absolute left-16 right-0 top-0 bottom-0">
                {(() => {
                  const overlaps = detectOverlappingTasks()

                  return scheduledTasks.map((task) => {
                    if (!task.start_time || !task.end_time) return null
                    const { top, height } = getTaskPosition(task.start_time, task.end_time)
                    const overlap = overlaps.get(task.id)

                    return (
                      <CalendarTaskBlock
                        key={task.id}
                        task={task}
                        top={top}
                        height={height}
                        onEdit={() => setEditingTask(task)}
                        onUpdate={loadTasks}
                        overlapWidth={overlap?.width}
                        overlapOffset={overlap?.offset}
                        overlapCount={overlap?.count}
                      />
                    )
                  })
                })()}
              </div>

              {/* Línea de hora actual */}
              {renderCurrentTimeLine()}

              {/* Línea guía durante drag & drop */}
              <CalendarDragGuide
                isDragging={activeTask !== null}
                mouseMinutes={dragMouseMinutes}
                calendarRef={calendarRef}
              />
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
      <DragOverlay dropAnimation={{
        duration: 250,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeTask ? (
          <motion.div
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1.05, opacity: 1 }}
            className="bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/40 dark:to-purple-900/40 border-l-4 border-primary-500 rounded-xl px-4 py-3 shadow-2xl cursor-grabbing min-w-[200px]"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <p className="font-bold text-sm text-primary-900 dark:text-primary-100">
                {activeTask.title}
              </p>
            </div>
            {activeTask.start_time && activeTask.end_time && (
              <div className="flex items-center gap-1 text-xs text-primary-700 dark:text-primary-300">
                <Clock className="w-3 h-3" />
                <span>{activeTask.start_time.slice(0, 5)} - {activeTask.end_time.slice(0, 5)}</span>
              </div>
            )}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className="px-2 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full shadow-lg whitespace-nowrap">
                Arrastrando...
              </div>
            </div>
          </motion.div>
        ) : null}
      </DragOverlay>

      {/* Botón de limpieza de datos (solo en desarrollo) */}
      {process.env.NODE_ENV === 'development' && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCleanupData}
          className="fixed bottom-4 left-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 font-medium z-50"
          title="Analizar y normalizar formatos de tiempo"
        >
          <span className="text-lg">🧹</span>
          <span>Limpiar Datos</span>
        </motion.button>
      )}
    </div>
    </DndContext>
  )
}
