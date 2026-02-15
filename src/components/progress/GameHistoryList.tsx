import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { GameSession } from '../../types/game'

interface GameHistoryListProps {
  sessions: GameSession[]
}

export function GameHistoryList({ sessions }: GameHistoryListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {sessions.map((session) => {
        const date = session.startedAt?.toDate?.()
          ? session.startedAt.toDate().toLocaleDateString()
          : 'Unknown date'
        const isExpanded = expandedId === session.id

        return (
          <div key={session.id} className="border rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : session.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500">{date}</span>
                <span className="font-medium">{session.totalTrials} trials</span>
                <span className={`font-bold ${
                  session.accuracy >= 0.8 ? 'text-green-600' :
                  session.accuracy >= 0.5 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {Math.round(session.accuracy * 100)}%
                </span>
                <span className="text-gray-400">
                  Level {session.finalDifficulty}
                </span>
              </div>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t bg-gray-50">
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                  <div>
                    <span className="text-gray-500">Avg Response Time: </span>
                    <span className="font-medium">{Math.round(session.averageResponseTimeMs)}ms</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Performance: </span>
                    <span className="font-medium">{session.performanceRating}/100</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Correct: </span>
                    <span className="font-medium">{session.correctTrials}/{session.totalTrials}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
