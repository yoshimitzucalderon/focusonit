'use client'

import { useState, KeyboardEvent, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Calendar, Sparkles, CalendarPlus, Type, FileText, Clock, Flag, Tag, Bell, X, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseNaturalDate, containsNaturalDate } from '@/lib/utils/parseNaturalDate'
import { DatePicker } from './DatePicker'
import VoiceTaskButton from './VoiceTaskButton'
import { getLocalTimestamp, parseDateString, toDateOnlyString, getTimezoneOffset } from '@/lib/utils/timezone'
import { motion, AnimatePresence } from 'framer-motion'

interface TaskInputProps {
  userId: string
}

export default function TaskInput({ userId }: TaskInputProps) {
  const [title, setTitle] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [naturalDateSuggestion, setNaturalDateSuggestion] = useState<string | null>(null)
  const [voiceCreatedAt, setVoiceCreatedAt] = useState<string | null>(null) // Para guardar createdAt de voz
  const [priority, setPriority] = useState<'alta' | 'media' | 'baja' | null>(null)
  const [timeEstimate, setTimeEstimate] = useState<number | null>(null)
  const [tags, setTags] = useState<string>('')
  const [reminder, setReminder] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // Detectar fechas en lenguaje natural mientras escribe
  useEffect(() => {
    const naturalDateText = containsNaturalDate(title)
    setNaturalDateSuggestion(naturalDateText)
  }, [title])

  // Crear tarea rápida (solo título)
  const createQuickTask = async () => {
    if (!title.trim()) return

    setLoading(true)
    try {
      // Intentar parsear fecha natural del título
      let parsedDate: Date | null = null
      const naturalDateText = containsNaturalDate(title)
      if (naturalDateText) {
        parsedDate = parseNaturalDate(naturalDateText)
      }

      // Obtener la última posición para el usuario
      const { data: lastTask } = (await supabase
        .from('tasks')
        .select('position')
        .eq('user_id', userId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()) as { data: { position: number } | null }

      const nextPosition = (lastTask?.position ?? -1) + 1

      // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
      const { error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: title.trim(),
        due_date: parsedDate ? toDateOnlyString(parsedDate) : null,
        created_at: getLocalTimestamp(),
        timezone_offset: getTimezoneOffset(),
        position: nextPosition,
      })

      if (error) throw error

      setTitle('')
      setNaturalDateSuggestion(null)
      toast.success(parsedDate ? `Tarea creada para ${format(parsedDate, 'dd/MM/yyyy')}` : 'Tarea creada')

      // Mantener focus en el input
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (error: any) {
      toast.error('Error al crear tarea')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // Crear tarea completa (con descripción y fecha)
  const createFullTask = async () => {
    if (!title.trim()) return

    setLoading(true)
    try {
      // Obtener la última posición para el usuario
      const { data: lastTask } = (await supabase
        .from('tasks')
        .select('position')
        .eq('user_id', userId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()) as { data: { position: number } | null }

      const nextPosition = (lastTask?.position ?? -1) + 1

      // @ts-ignore - Temporary bypass due to type inference issue with @supabase/ssr
      const { error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim() || null,
        due_date: dueDate ? toDateOnlyString(dueDate) : null,
        // Usar createdAt de voz si existe, sino generar nuevo con hora local
        created_at: voiceCreatedAt || getLocalTimestamp(),
        timezone_offset: getTimezoneOffset(),
        position: nextPosition,
      })

      if (error) throw error

      setTitle('')
      setDescription('')
      setDueDate(null)
      setPriority(null)
      setTimeEstimate(null)
      setTags('')
      setReminder(false)
      setShowModal(false)
      setShowAdvanced(false)
      setNaturalDateSuggestion(null)
      setVoiceCreatedAt(null) // Limpiar
      toast.success('Tarea creada')

      // Mantener focus en el input
      setTimeout(() => inputRef.current?.focus(), 100)
    } catch (error: any) {
      toast.error('Error al crear tarea')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Enter: crear tarea rápida
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()
      createQuickTask()
    }
    // Shift+Enter: abrir modal con detalles
    else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      setShowModal(true)
    }
    // Cmd/Ctrl+D: crear con fecha de hoy
    else if (e.key === 'd' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      setDueDate(new Date())
      setShowModal(true)
    }
  }

  return (
    <>
      {/* Input Rápido */}
      <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-2 relative">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="¿Qué necesitas hacer?"
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white transition-all disabled:opacity-50"
              />
              {/* Indicador de carga con skeleton */}
              {loading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 backdrop-blur-[1px] rounded-lg flex items-center px-4">
                  <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
                    <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">Creando...</span>
                  </div>
                </div>
              )}
            </div>
            <VoiceTaskButton
              onProcessedTask={(task) => {
                console.log('📥 Tarea recibida desde voz:', task)
                setTitle(task.title)
                if (task.description) setDescription(task.description)

                // Parsear fecha correctamente (n8n envía "YYYY-MM-DD")
                if (task.dueDate) {
                  const parsedDate = parseDateString(task.dueDate)
                  console.log('📅 Fecha parseada desde voz:', task.dueDate, '→', parsedDate.getDate(), 'de', parsedDate.getMonth() + 1)
                  setDueDate(parsedDate)
                }

                // Guardar el createdAt de n8n (ya en hora del Pacífico)
                if (task.createdAt) {
                  console.log('🕐 CreatedAt desde n8n:', task.createdAt)
                  setVoiceCreatedAt(task.createdAt)
                }

                setShowModal(true)
              }}
            />
            <button
              onClick={() => setShowModal(true)}
              disabled={loading}
              className="p-3 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg transition-all disabled:opacity-50"
              title="Agregar con detalles (Shift+Enter)"
            >
              <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Sugerencia de fecha natural */}
          {naturalDateSuggestion && !loading && (
            <div className="mt-2 flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
              <Sparkles className="w-3 h-3" />
              <span>
                Se detectó &ldquo;{naturalDateSuggestion}&rdquo; - se asignará automáticamente al crear
              </span>
            </div>
          )}

          {/* Shortcuts visibles */}
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded border border-gray-300 dark:border-gray-600">Enter</kbd>
              crear
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded border border-gray-300 dark:border-gray-600">Shift+Enter</kbd>
              detalles
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded border border-gray-300 dark:border-gray-600">Cmd+D</kbd>
              fecha hoy
            </span>
            <span className="text-gray-400 dark:text-gray-500">|</span>
            <span className="italic">Prueba: &ldquo;mañana&rdquo;, &ldquo;lunes&rdquo;, &ldquo;en 3 días&rdquo;</span>
          </div>
        </div>
      </div>

      {/* Modal para tarea completa */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            >
              {/* Header con gradiente */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3 pr-8">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <CalendarPlus className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Nueva tarea
                    </h3>
                    <p className="text-blue-100 text-sm">Agrega una tarea a tu día</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowModal(false)
                    setDescription('')
                    setDueDate(null)
                    setPriority(null)
                    setTimeEstimate(null)
                    setTags('')
                    setReminder(false)
                    setShowAdvanced(false)
                  }}
                  disabled={loading}
                  className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <X className="text-white" size={18} />
                </motion.button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                {/* Título */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Título *
                  </label>
                  <div className="relative">
                    <Type className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full pl-11 pr-10 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-all outline-none"
                      placeholder="¿Qué necesitas hacer?"
                      autoFocus
                    />
                    {!title.trim() && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400" size={18} />
                    )}
                  </div>
                </div>

                {/* Descripción */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Descripción
                    <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(opcional)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={18} />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-all resize-none outline-none"
                      placeholder="Notas, contexto, detalles..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Grid: Fecha y Tiempo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Fecha */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Fecha de vencimiento
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none z-10" size={18} />
                      <DatePicker
                        value={dueDate}
                        onChange={(date) => setDueDate(date)}
                        placeholder="Seleccionar fecha"
                        buttonClassName="w-full pl-11 justify-start border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 px-4 py-3 rounded-xl transition-all"
                      />
                    </div>
                  </div>

                  {/* Tiempo estimado */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                      Duración
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-10" size={18} />
                      <select
                        value={timeEstimate || ''}
                        onChange={(e) => setTimeEstimate(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full pl-11 pr-9 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-all appearance-none bg-white dark:bg-slate-700 outline-none"
                      >
                        <option value="">Sin estimar</option>
                        <option value="15">15 min</option>
                        <option value="25">25 min 🍅</option>
                        <option value="30">30 min</option>
                        <option value="50">50 min 🍅🍅</option>
                        <option value="60">1 hora</option>
                        <option value="90">1.5 horas</option>
                        <option value="120">2 horas</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>

                {/* Prioridad */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Prioridad
                  </label>
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPriority(priority === 'alta' ? null : 'alta')}
                      type="button"
                      className={`flex-1 py-2.5 px-3 rounded-xl border-2 font-medium text-sm transition-all ${
                        priority === 'alta'
                          ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-300 shadow-sm'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-red-300 dark:hover:border-red-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Flag className="inline mr-1.5" size={16} />
                      Alta
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPriority(priority === 'media' ? null : 'media')}
                      type="button"
                      className={`flex-1 py-2.5 px-3 rounded-xl border-2 font-medium text-sm transition-all ${
                        priority === 'media'
                          ? 'bg-yellow-50 border-yellow-500 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-500 dark:text-yellow-300 shadow-sm'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-yellow-300 dark:hover:border-yellow-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Flag className="inline mr-1.5" size={16} />
                      Media
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setPriority(priority === 'baja' ? null : 'baja')}
                      type="button"
                      className={`flex-1 py-2.5 px-3 rounded-xl border-2 font-medium text-sm transition-all ${
                        priority === 'baja'
                          ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:border-green-500 dark:text-green-300 shadow-sm'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-green-300 dark:hover:border-green-700 hover:bg-gray-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Flag className="inline mr-1.5" size={16} />
                      Baja
                    </motion.button>
                  </div>
                </div>

                {/* Opciones avanzadas (colapsable) */}
                <div className="border-t-2 border-gray-100 dark:border-gray-700 pt-4">
                  <motion.button
                    whileHover={{ x: 4 }}
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    Opciones avanzadas
                  </motion.button>

                  <AnimatePresence>
                    {showAdvanced && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 mt-4 overflow-hidden"
                      >
                        {/* Etiquetas */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                            Etiquetas
                          </label>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                            <input
                              type="text"
                              value={tags}
                              onChange={(e) => setTags(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-all"
                              placeholder="trabajo, urgente, reunión (separadas por coma)"
                            />
                          </div>
                        </div>

                        {/* Recordatorio */}
                        <div>
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={reminder}
                                onChange={(e) => setReminder(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 rounded-full peer-checked:bg-blue-600 transition-colors"></div>
                              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Bell className="text-gray-400 dark:text-gray-500 group-hover:text-blue-500 transition-colors" size={18} />
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                Activar recordatorio
                              </span>
                            </div>
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowModal(false)
                    setDescription('')
                    setDueDate(null)
                    setPriority(null)
                    setTimeEstimate(null)
                    setTags('')
                    setReminder(false)
                    setShowAdvanced(false)
                  }}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                  type="button"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={createFullTask}
                  disabled={loading || !title.trim()}
                  className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  type="button"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Crear tarea
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}