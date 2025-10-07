'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getDay } from 'date-fns'

interface DayData {
  day: string
  dayName: string
  hours: number
}

interface WeeklyDistributionChartProps {
  data: DayData[]
}

export function WeeklyDistributionChart({ data }: WeeklyDistributionChartProps) {
  // Obtener el día actual (0 = Domingo, 1 = Lunes, etc.)
  const currentDay = getDay(new Date())

  // Reordenar datos para que empiece en Lunes
  const reorderedData = [
    data[1], // Lun
    data[2], // Mar
    data[3], // Mié
    data[4], // Jue
    data[5], // Vie
    data[6], // Sáb
    data[0]  // Dom
  ]

  // Determinar qué barra resaltar (índice en el array reordenado)
  const highlightIndex = currentDay === 0 ? 6 : currentDay - 1

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const hours = Math.floor(payload[0].value)
      const minutes = Math.round((payload[0].value - hours) * 60)
      return (
        <div className="bg-gray-900 dark:bg-slate-800 border border-gray-700 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-white font-medium">{payload[0].payload.day}</p>
          <p className="text-blue-400 font-semibold">
            {hours}h {minutes}m
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold dark:text-white mb-4">Distribución Semanal</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={reorderedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis
            dataKey="day"
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9CA3AF"
            style={{ fontSize: '12px' }}
            label={{ value: 'Horas', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF' } }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
          <Bar dataKey="hours" radius={[8, 8, 0, 0]}>
            {reorderedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === highlightIndex ? '#3B82F6' : '#E5E7EB'}
                className="dark:fill-gray-600"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
