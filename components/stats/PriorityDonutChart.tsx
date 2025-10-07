'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface PriorityData {
  priority: string
  count: number
  percentage: number
  color: string
}

interface PriorityDonutChartProps {
  data: PriorityData[]
}

export function PriorityDonutChart({ data }: PriorityDonutChartProps) {
  const totalTasks = data.reduce((acc, item) => acc + item.count, 0)

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-gray-900 dark:bg-slate-800 border border-gray-700 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-white font-medium">{item.priority}</p>
          <p className="text-blue-400 font-semibold">
            {item.count} tareas ({item.percentage.toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  // Leyenda personalizada
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {entry.value}: {entry.payload.count}
            </span>
          </div>
        ))}
      </div>
    )
  }

  // Si no hay datos, mostrar mensaje
  if (totalTasks === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold dark:text-white mb-4">Tareas por Prioridad</h3>
        <div className="h-[300px] flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-center">
            No hay datos de prioridad disponibles
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold dark:text-white mb-4">Tareas por Prioridad</h3>
      <div className="relative">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="count"
              label={({ percentage }) => `${percentage.toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Centro con total */}
        <div className="absolute top-[40%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold dark:text-white">{totalTasks}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">tareas</p>
        </div>
      </div>
    </div>
  )
}
