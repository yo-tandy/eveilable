import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { Trial } from '../../types/game'

interface DifficultyChartProps {
  trials: Trial[]
}

export function DifficultyChart({ trials }: DifficultyChartProps) {
  const data = trials.map((t, i) => ({
    trial: i + 1,
    level: t.difficultyLevel,
  }))

  return (
    <ResponsiveContainer width="100%" height={150}>
      <AreaChart data={data}>
        <XAxis dataKey="trial" tick={{ fontSize: 12 }} />
        <YAxis domain={[1, 20]} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value) => [`Level ${value}`, 'Difficulty']}
          labelFormatter={(label) => `Trial ${label}`}
        />
        <Area
          type="stepAfter"
          dataKey="level"
          stroke="#8b5cf6"
          fill="#8b5cf6"
          fillOpacity={0.2}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
