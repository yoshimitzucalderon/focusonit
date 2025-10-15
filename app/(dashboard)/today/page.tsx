'use client'

import { useMemo, useState, useEffect } from 'react'
import { useTasks } from '@/lib/hooks/useTasks'
import { useAuth } from '@/lib/hooks/useAuth'
import TaskList from '@/components/TaskList'
import { startOfDay, endOfDay, isPast, isToday } from 'date-fns'
import { Eye, EyeOff, AlertTriangle, ArrowRight, Edit3, Clock, Calendar } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { SelectionProvider, useSelection } from '@/context/SelectionContext'
import { BulkActionsBar } from '@/components/BulkActionsBar'
import { parseDateString, toDateOnlyString, getLocalTimestamp, getTimezoneOffset } from '@/lib/utils/timezone'
import { FAB } from '@/components/FAB'
import EditTaskModal from '@/components/EditTaskModal'
import AddTaskModal from '@/components/AddTaskModal'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import { Task } from '@/types/database.types'

const HIDE_COMPLETED_KEY = 'focusOnIt_hideCompleted'

function TodayPageContent() {
  const { user } = useAuth()
  const { tasks, loading, setTasks } = useTasks()

  // Cargar el estado inicial desde localStorage
  const [hideCompleted, setHideCompleted] = useState(() => {
    if (typeof window === 'undefined') return false
    const saved = localStorage.getItem(HIDE_COMPLETED_KEY)
    return saved !== null ? JSON.parse(saved) : false
  })
  const [movingAll, setMovingAll] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addModalMode, setAddModalMode] = useState<'text' | 'voice'>('text')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const supabase = createClient()
  const { selectedIds, clearSelection } = useSelection()

  // Guardar el estado en localStorage cada vez que cambie
  useEffect(() => {
    localStorage.setItem(HIDE_COMPLETED_KEY, JSON.stringify(hideCompleted))
  }, [hideCompleted])

  // Separar tareas atrasadas y de hoy
  const { overdueTasks, todayTasks } = useMemo(() => {
    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)

    const overdue: typeof tasks = []
    const today: typeof tasks = []

    tasks.forEach((task) => {
      if (hideCompleted && task.completed) return

      if (!task.due_date) {
        // Tareas sin fecha van a "hoy"
        today.push(task)
        return
      }

      const taskDate = parseDateString(task.due_date)

      // Tareas atrasadas (pasadas, no completadas, y no son de hoy)
      if (isPast(taskDate) && !isToday(taskDate) && !task.completed) {
        overdue.push(task)
      }
      // Tareas de hoy
      else if (taskDate >= todayStart && taskDate <= todayEnd) {
        today.push(task)
      }
    })

    return { overdueTasks: overdue, todayTasks: today }
  }, [tasks, hideCompleted])

  const pendingCount = todayTasks.filter((t) => !t.completed).length
  const overdueCount = overdueTasks.length

  // Mover todas las tareas atrasadas a hoy
  const moveAllToToday = async () => {
    if (overdueTasks.length === 0) return

    setMovingAll(true)
    const today = new Date()

    try {
      const updates = overdueTasks.map((task) =>
        supabase
          .from('tasks')
          // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
          .update({
            due_date: toDateOnlyString(today),
            updated_at: getLocalTimestamp(),
            timezone_offset: getTimezoneOffset()
          })
          .eq('id', task.id)
      )

      await Promise.all(updates)

      toast.success(`${overdueTasks.length} tareas movidas a hoy`)
    } catch (error) {
      toast.error('Error al mover tareas')
      console.error(error)
    } finally {
      setMovingAll(false)
    }
  }

  // Acciones masivas
  const handleBulkComplete = async () => {
    const confirmed = window.confirm(
      `¿Marcar ${selectedIds.size} tarea(s) como completada(s)?`
    )

    if (!confirmed) return

    // Mostrar indicador inmediatamente
    const toastId = toast.loading(`Completando ${selectedIds.size} tarea(s)...`)

    try {
      const updates = Array.from(selectedIds).map((taskId) =>
        supabase
          .from('tasks')
          // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
          .update({
            completed: true,
            completed_at: getLocalTimestamp(),
            updated_at: getLocalTimestamp(),
            timezone_offset: getTimezoneOffset()
          })
          .eq('id', taskId)
      )

      await Promise.all(updates)

      clearSelection()
      toast.success(`${selectedIds.size} tarea(s) completada(s)`, { id: toastId })
    } catch (error) {
      toast.error('Error al completar tareas', { id: toastId })
      console.error(error)
    }
  }

  const handleBulkDelete = async () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)

    // ✅ Actualización optimista: eliminar del estado inmediatamente
    const tasksToDelete = Array.from(selectedIds)
    setTasks(prevTasks => prevTasks.filter(task => !tasksToDelete.includes(task.id)))

    try {
      const deletes = tasksToDelete.map((taskId) =>
        supabase.from('tasks').delete().eq('id', taskId)
      )

      await Promise.all(deletes)

      clearSelection()
      setShowDeleteModal(false)
      toast.success(`${tasksToDelete.length} tarea(s) eliminada(s)`)
    } catch (error) {
      // Revertir cambios en caso de error
      toast.error('Error al eliminar tareas')
      console.error(error)
      // Recargar las tareas para restaurar el estado correcto
      window.location.reload()
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkEdit = () => {
    const taskId = Array.from(selectedIds)[0]
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      setEditingTask(task)
      setShowEditModal(true)
    }
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setShowEditModal(true)
  }

  // ✅ Función para actualizar la tarea en el estado local inmediatamente
  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    )
  }

  // ✅ Función para agregar nueva tarea al estado inmediatamente
  const handleTaskCreated = (newTask: Task) => {
    console.log('🐛 DEBUG [TodayPage] ===== handleTaskCreated EJECUTADO =====')
    console.log('🐛 DEBUG [TodayPage] Nueva tarea recibida:', newTask)
    console.log('🐛 DEBUG [TodayPage] ID:', newTask.id)
    console.log('🐛 DEBUG [TodayPage] Título:', newTask.title)
    console.log('🐛 DEBUG [TodayPage] Fecha:', newTask.due_date)
    console.log('🐛 DEBUG [TodayPage] tasks actual (antes):', tasks)
    console.log('🐛 DEBUG [TodayPage] tasks.length (antes):', tasks.length)
    console.log('🐛 DEBUG [TodayPage] setTasks existe?', !!setTasks)
    console.log('🐛 DEBUG [TodayPage] tipo de setTasks:', typeof setTasks)

    setTasks(prevTasks => {
      console.log('🐛 DEBUG [TodayPage] Dentro de setTasks - prevTasks:', prevTasks)
      console.log('🐛 DEBUG [TodayPage] Dentro de setTasks - prevTasks.length:', prevTasks.length)

      const newState = [newTask, ...prevTasks]

      console.log('🐛 DEBUG [TodayPage] Dentro de setTasks - newState:', newState)
      console.log('🐛 DEBUG [TodayPage] Dentro de setTasks - newState.length:', newState.length)
      console.log('🐛 DEBUG [TodayPage] Dentro de setTasks - Primera tarea:', newState[0])

      return newState
    })

    // Verificar después de un momento
    setTimeout(() => {
      console.log('🐛 DEBUG [TodayPage] tasks después de 100ms:', tasks)
      console.log('🐛 DEBUG [TodayPage] tasks.length después de 100ms:', tasks.length)
    }, 100)

    console.log('🐛 DEBUG [TodayPage] ===== handleTaskCreated TERMINADO =====')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hoy</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {pendingCount} {pendingCount === 1 ? 'tarea pendiente' : 'tareas pendientes'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle para ocultar completadas */}
            <button
              onClick={() => setHideCompleted(!hideCompleted)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-all"
            >
              {hideCompleted ? (
                <>
                  <EyeOff className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                  <span className="hidden sm:inline">Mostrar completadas</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                  <span className="hidden sm:inline">Ocultar completadas</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sección de Tareas Atrasadas - Diseño Mejorado */}
        {overdueCount > 0 && (
          <div className="relative bg-gradient-to-br from-red-50 via-orange-50 to-white dark:from-red-950/20 dark:via-orange-950/10 dark:to-slate-900 border-2 border-red-200 dark:border-red-800 rounded-xl p-6 shadow-lg animate-in fade-in duration-300">
            {/* Header con iconos duales */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-4">
                {/* Icono dual: Reloj + Advertencia */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Contenido principal */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-red-900 dark:text-red-200">
                      Tareas Vencidas
                    </h3>
                    {/* Badge numérico prominente con animación */}
                    <span className="relative px-3 py-1.5 text-lg font-bold bg-red-600 text-white rounded-full shadow-lg animate-pulse">
                      {overdueCount}
                      <span className="absolute inset-0 rounded-full bg-red-600 opacity-75 animate-ping" />
                    </span>
                  </div>
                  <p className="text-base font-medium text-red-800 dark:text-red-300">
                    ⚠️ {overdueCount} {overdueCount === 1 ? 'tarea vencida' : 'tareas vencidas'} - Revisa y prioriza ahora
                  </p>
                </div>
              </div>

              {/* Botones de acción mejorados */}
              <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                <button
                  onClick={moveAllToToday}
                  disabled={movingAll}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95"
                >
                  {movingAll ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="hidden sm:inline">Moviendo...</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span className="hidden sm:inline">Mover todas a hoy</span>
                      <span className="sm:hidden">Mover a hoy</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Lista de tareas atrasadas */}
            <div className="space-y-3 overflow-visible animate-in slide-in-from-top-4 duration-500">
              <TaskList
                tasks={overdueTasks}
                emptyMessage=""
                onEditTask={handleEditTask}
              />
            </div>
          </div>
        )}

        {/* Sección de Tareas de Hoy */}
        <div>
          {overdueCount > 0 && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Tareas de Hoy
            </h3>
          )}
          <TaskList
            tasks={todayTasks}
            emptyMessage={overdueCount > 0 ? 'No hay tareas programadas para hoy' : '¡Todo listo! No hay tareas pendientes para hoy'}
            onEditTask={handleEditTask}
          />
        </div>
      </div>

      {/* Barra de acciones masivas */}
      <BulkActionsBar
        onBulkComplete={handleBulkComplete}
        onBulkDelete={handleBulkDelete}
        onBulkEdit={handleBulkEdit}
      />

      {/* Modal de edición */}
      <EditTaskModal
        task={editingTask}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingTask(null)
          clearSelection()
        }}
        onTaskUpdated={handleTaskUpdated}
      />

      {/* Modal para agregar tarea */}
      {user && (
        <AddTaskModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          userId={user.id}
          mode={addModalMode}
          onTaskCreated={handleTaskCreated}
        />
      )}

      {/* FAB Speed Dial para agregar tareas */}
      <FAB
        onTextInput={() => {
          setAddModalMode('text')
          setShowAddModal(true)
        }}
        onVoiceInput={() => {
          setAddModalMode('voice')
          setShowAddModal(true)
        }}
      />

      {/* Modal de confirmación de eliminación */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => !isDeleting && setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        tasks={tasks.filter(task => selectedIds.has(task.id))}
        isDeleting={isDeleting}
      />
    </>
  )
}

export default function TodayPage() {
  return (
    <SelectionProvider>
      <TodayPageContent />
    </SelectionProvider>
  )
}