import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Papa from 'papaparse'

interface ExportData {
  tasks: any[]
  sessions: any[]
  period: string
  stats: {
    totalHours?: number
    totalMinutes?: number
    totalSessions?: number
    completedTasks?: number
    currentStreak?: number
  }
}

// 1. EXPORTAR PDF
export async function generatePDF(data: ExportData) {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  let yPosition = margin

  // Header
  pdf.setFontSize(24)
  pdf.setTextColor(59, 130, 246) // Azul
  pdf.text('FocusOnIt - Reporte de Estadísticas', margin, yPosition)
  yPosition += 10

  pdf.setFontSize(12)
  pdf.setTextColor(100, 100, 100)
  pdf.text(`Período: ${data.period}`, margin, yPosition)
  pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth - margin - 60, yPosition)
  yPosition += 15

  // Sección: Resumen
  pdf.setFontSize(16)
  pdf.setTextColor(0, 0, 0)
  pdf.text('📊 Resumen General', margin, yPosition)
  yPosition += 8

  pdf.setFontSize(11)
  pdf.setTextColor(50, 50, 50)

  const summaryData = [
    [`Tiempo total:`, `${data.stats.totalHours || 0}h ${data.stats.totalMinutes || 0}m`],
    [`Sesiones iniciadas:`, `${data.stats.totalSessions || 0}`],
    [`Tareas completadas:`, `${data.stats.completedTasks || 0}`],
    [`Racha actual:`, `${data.stats.currentStreak || 0} días`]
  ]

  summaryData.forEach(([label, value]) => {
    pdf.text(label, margin + 5, yPosition)
    pdf.text(value, margin + 60, yPosition)
    yPosition += 6
  })

  yPosition += 10

  // Sección: Top Tareas
  if (yPosition > pageHeight - 50) {
    pdf.addPage()
    yPosition = margin
  }

  pdf.setFontSize(16)
  pdf.setTextColor(0, 0, 0)
  pdf.text('🏆 Top 10 Tareas', margin, yPosition)
  yPosition += 8

  pdf.setFontSize(10)
  data.tasks.slice(0, 10).forEach((task: any, index: number) => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage()
      yPosition = margin
    }

    pdf.text(`${index + 1}. ${task.title}`, margin + 5, yPosition)
    pdf.text(`${task.sessions || 0} sesiones | ${task.totalTime || '0m'}`, pageWidth - margin - 50, yPosition)
    yPosition += 6
  })

  // Descargar
  pdf.save(`focusonit-stats-${new Date().getTime()}.pdf`)
}

// 2. EXPORTAR CSV
export function generateCSV(data: ExportData) {
  const csvData = data.sessions.map((session: any) => ({
    'ID Sesión': session.id,
    'Tarea': session.taskTitle || session.title || 'Sin título',
    'Fecha': new Date(session.startTime || session.created_at).toLocaleDateString('es-ES'),
    'Hora Inicio': new Date(session.startTime || session.created_at).toLocaleTimeString('es-ES'),
    'Hora Fin': session.endTime ? new Date(session.endTime).toLocaleTimeString('es-ES') : '-',
    'Duración (min)': session.duration || Math.floor((session.duration_seconds || 0) / 60),
    'Estado': session.status || (session.is_completed ? 'completada' : 'en-progreso'),
    'Pomodoros': session.pomodoros || 0
  }))

  const csv = Papa.unparse(csvData)

  // Descargar
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `focusonit-sessions-${new Date().getTime()}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 3. EXPORTAR IMAGEN
export async function generateImage(containerId: string = 'stats-container') {
  const element = document.getElementById(containerId)

  if (!element) {
    throw new Error('Contenedor de estadísticas no encontrado')
  }

  // Configurar para mejor calidad
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false
  })

  // Convertir a imagen
  canvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `focusonit-stats-${new Date().getTime()}.png`
      link.click()
      URL.revokeObjectURL(url)
    }
  })
}
