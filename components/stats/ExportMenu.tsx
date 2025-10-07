'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, FileText, FileSpreadsheet, Image as ImageIcon, Loader2 } from 'lucide-react'
import { generatePDF, generateCSV, generateImage } from '@/lib/utils/exportHelpers'

interface ExportMenuProps {
  data: {
    tasks: any[]
    sessions: any[]
    period: string
    stats: any
  }
}

export function ExportMenu({ data }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState<'pdf' | 'csv' | 'image' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleExport = async (type: 'pdf' | 'csv' | 'image') => {
    setIsExporting(true)
    setExportType(type)

    try {
      if (type === 'pdf') {
        await generatePDF(data)
      } else if (type === 'csv') {
        generateCSV(data)
      } else if (type === 'image') {
        await generateImage('stats-container')
      }
    } catch (error) {
      console.error('Error al exportar:', error)
      alert('Error al generar la exportación')
    } finally {
      setIsExporting(false)
      setExportType(null)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Exportando...</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>Exportar</span>
          </>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && !isExporting && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-20">
            <ExportOption
              icon={<FileText className="w-5 h-5" />}
              label="Exportar PDF"
              description="Reporte completo"
              onClick={() => handleExport('pdf')}
              color="text-red-600 dark:text-red-400"
            />

            <ExportOption
              icon={<FileSpreadsheet className="w-5 h-5" />}
              label="Exportar CSV"
              description="Datos raw"
              onClick={() => handleExport('csv')}
              color="text-green-600 dark:text-green-400"
            />

            <ExportOption
              icon={<ImageIcon className="w-5 h-5" />}
              label="Exportar Imagen"
              description="Resumen visual"
              onClick={() => handleExport('image')}
              color="text-purple-600 dark:text-purple-400"
            />
          </div>
        </>
      )}
    </div>
  )
}

// Sub-componente para cada opción
function ExportOption({
  icon,
  label,
  description,
  onClick,
  color
}: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
  color: string
}) {
  return (
    <button
      onClick={onClick}
      className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition text-left flex items-center gap-3 group"
    >
      <div className={`${color} group-hover:scale-110 transition`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900 dark:text-white text-sm">{label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{description}</div>
      </div>
    </button>
  )
}
