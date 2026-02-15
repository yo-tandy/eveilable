import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Trial } from '../../types/game'

interface ResponseTimeChartProps {
  trials: Trial[]
}

interface DotProps {
  cx?: number
  cy?: number
  payload?: { correct: boolean }
}

function CustomDot({ cx, cy, payload }: DotProps) {
  if (cx == null || cy == null || !payload) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={payload.correct ? '#22c55e' : '#ef4444'}
      stroke="none"
    />
  )
}

export function ResponseTimeChart({ trials }: ResponseTimeChartProps) {
  const data = trials.map((t, i) => ({
    trial: i + 1,
    time: Math.round(t.responseTimeMs),
    correct: t.correct,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <XAxis dataKey="trial" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} unit="ms" />
        <Tooltip
          formatter={(value) => [`${value}ms`, 'Response Time']}
          labelFormatter={(label) => `Trial ${label}`}
        />
        <Line
          type="monotone"
          dataKey="time"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={<CustomDot />}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
