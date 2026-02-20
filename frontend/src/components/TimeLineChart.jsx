import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg shadow-xl">
        <p className="text-gray-300 text-xs mb-0.5">{label}</p>
        <p className="text-emerald-400 text-sm font-medium">
          {payload[0].value} {payload[0].value === 1 ? 'click' : 'clicks'}
        </p>
      </div>
    )
  }
  return null
}

export default function TimeLineChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 text-sm gap-2">
        <span className="text-3xl">📈</span>
        <span>Click a bar on the left to see its time trend</span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis
          dataKey="date"
          stroke="#6B7280"
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          stroke="#6B7280"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="count"
          stroke="#10B981"
          strokeWidth={2.5}
          dot={{ fill: '#10B981', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#34D399', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
