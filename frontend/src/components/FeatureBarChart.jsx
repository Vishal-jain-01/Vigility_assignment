import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg shadow-xl">
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-blue-400 text-sm mt-0.5">
          {payload[0].value} {payload[0].value === 1 ? 'click' : 'clicks'}
        </p>
      </div>
    )
  }
  return null
}

export default function FeatureBarChart({ data, selectedFeature, onBarClick }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        No feature data available
      </div>
    )
  }

  const handleClick = (chartData) => {
    if (chartData && chartData.activePayload && chartData.activePayload.length > 0) {
      onBarClick(chartData.activePayload[0].payload.feature)
    }
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 10, left: -10, bottom: 65 }}
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
        <XAxis
          dataKey="feature"
          stroke="#6B7280"
          tick={{ fill: '#9CA3AF', fontSize: 11 }}
          angle={-35}
          textAnchor="end"
          interval={0}
          tickLine={false}
        />
        <YAxis
          stroke="#6B7280"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
        <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={60}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={selectedFeature === entry.feature ? '#3B82F6' : '#1D4ED8'}
              opacity={selectedFeature && selectedFeature !== entry.feature ? 0.5 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
