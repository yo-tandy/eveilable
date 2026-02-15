import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { RecentSessionSummary } from '../../types/user'

interface TrendChartProps {
  sessions: RecentSessionSummary[]
}

export function TrendChart({ sessions }: TrendChartProps) {
  const data = sessions.map((s, i) => ({
    session: i + 1,
    accuracy: Math.round(s.accuracy * 100),
    rating: s.performanceRating,
    difficulty: s.finalDifficulty,
  }))

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <XAxis dataKey="session" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 12 }} />
        <YAxis yAxisId="right" orientation="right" domain={[1, 20]} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Legend />
        <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#3b82f6"
              name="Accuracy %" strokeWidth={2} dot={{ r: 3 }} />
        <Line yAxisId="left" type="monotone" dataKey="rating" stroke="#22c55e"
              name="Rating" strokeWidth={2} dot={{ r: 3 }} />
        <Line yAxisId="right" type="stepAfter" dataKey="difficulty" stroke="#8b5cf6"
              name="Difficulty" strokeWidth={1} strokeDasharray="4 2" dot={{ r: 2 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
