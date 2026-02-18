import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useVisualGameLoop } from '../../../hooks/useVisualGameLoop'
import { GameCanvas, useGameDimensions } from '../../common/GameCanvas'
import { CountdownOverlay } from '../../common/CountdownOverlay'
import { ContinuePrompt } from '../../common/ContinuePrompt'
import { StimulusDisplay } from './StimulusDisplay'
import { CentralResponse } from './CentralResponse'
import { LocationResponse } from './LocationResponse'
import { FeedbackDisplay } from './FeedbackDisplay'
import { randomPick, randomIndices } from '../../../utils/random'
import { Eye } from 'lucide-react'

const CENTRAL_TYPES = ['car', 'truck']
const POSITION_COUNT = 8

function GameArea() {
  const { size } = useGameDimensions()
  const {
    phase,
    trials,
    stimulus,
    currentTrial,
    difficultyParams,
    handleCentralResponse,
    handlePeripheralResponse,
  } = useVisualGameLoop({
    gameType: 'divided-attention',
    generateStimulus: useCallback((_, distractorCount: number) => {
      const centralType = randomPick(CENTRAL_TYPES)
      const peripheralPosition = Math.floor(Math.random() * POSITION_COUNT)

      // Pick distractor positions (excluding the target position)
      const availablePositions = Array.from({ length: POSITION_COUNT }, (_, i) => i)
        .filter((i) => i !== peripheralPosition)
      const distractorPositions = randomIndices(availablePositions.length, distractorCount)
        .map((idx) => availablePositions[idx])

      return { centralType, peripheralPosition, distractorPositions }
    }, []),
  })

  return (
    <>
      {/* Stimulus area */}
      {stimulus && (
        <StimulusDisplay
          centralType={stimulus.centralType}
          peripheralPosition={stimulus.peripheralPosition}
          distractorPositions={stimulus.distractorPositions}
          showStimulus={phase === 'stimulus'}
          difficultyParams={difficultyParams}
        />
      )}

      {/* Response: peripheral location tap zones */}
      {phase === 'response-peripheral' && (
        <LocationResponse
          onSelect={handlePeripheralResponse}
          containerSize={size}
          peripheralDistance={difficultyParams.peripheralDistance}
        />
      )}

      {/* Feedback */}
      {phase === 'feedback' && trials.length > 0 && (
        <FeedbackDisplay trial={trials[trials.length - 1]} />
      )}

      {/* Central response buttons at bottom of canvas */}
      {phase === 'response-central' && (
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <p className="text-center text-sm text-gray-500 mb-2">What was the central object?</p>
          <CentralResponse onSelect={handleCentralResponse} />
        </div>
      )}

      {/* Trial counter */}
      {phase !== 'idle' && phase !== 'end' && (
        <div className="absolute top-2 right-3 text-xs text-gray-400">
          Trial {currentTrial + (phase === 'feedback' ? 0 : 1)}
        </div>
      )}
    </>
  )
}

export function DividedAttentionGame() {
  const { t } = useTranslation()

  const {
    phase,
    trials,
    currentTrial,
    beginGame,
    countdownComplete,
    handleContinue,
    handleEnd,
    resetGame,
  } = useVisualGameLoop({
    gameType: 'divided-attention',
    generateStimulus: useCallback((_, distractorCount: number) => {
      const centralType = randomPick(CENTRAL_TYPES)
      const peripheralPosition = Math.floor(Math.random() * POSITION_COUNT)
      const availablePositions = Array.from({ length: POSITION_COUNT }, (_, i) => i)
        .filter((i) => i !== peripheralPosition)
      const distractorPositions = randomIndices(availablePositions.length, distractorCount)
        .map((idx) => availablePositions[idx])
      return { centralType, peripheralPosition, distractorPositions }
    }, []),
  })

  if (phase === 'idle') {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <Eye size={48} className="mx-auto text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('games.dividedAttention.name')}</h2>
        <p className="text-gray-500 mb-6">{t('games.dividedAttention.description')}</p>
        <div className="glass rounded-xl p-4 text-sm text-gray-600 mb-6 text-left space-y-2">
          <p>A symbol will flash in the center while a target appears at the periphery.</p>
          <p>1. Identify the central object (Car or Truck)</p>
          <p>2. Tap where the peripheral target appeared</p>
          <p>The display gets faster as you improve!</p>
        </div>
        <button
          onClick={() => beginGame()}
          className="px-8 py-3 bg-black/75 backdrop-blur-sm text-white rounded-xl font-semibold hover:scale-[1.02] transition-transform"
        >
          {t('common.startGame')}
        </button>
      </div>
    )
  }

  if (phase === 'end') {
    const accuracy = trials.length > 0
      ? trials.filter((t) => t.correct).length / trials.length
      : 0

    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h2 className="text-2xl font-bold mb-4">{t('stats.sessionComplete')}</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="glass rounded-xl p-4">
            <div className="text-3xl font-bold">{trials.length}</div>
            <div className="text-sm text-gray-500">{t('stats.trials')}</div>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="text-3xl font-bold">{Math.round(accuracy * 100)}%</div>
            <div className="text-sm text-gray-500">{t('stats.accuracy')}</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => resetGame()}
            className="px-6 py-2.5 glass rounded-xl font-medium hover:bg-white/50 transition-all"
          >
            {t('common.playAgain')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <GameCanvas>
        <GameArea />
        {phase === 'countdown' && (
          <CountdownOverlay onComplete={countdownComplete} />
        )}
        {phase === 'continue-prompt' && (
          <ContinuePrompt
            trialCount={currentTrial}
            accuracy={
              trials.length > 0
                ? trials.filter((t) => t.correct).length / trials.length
                : 0
            }
            onContinue={handleContinue}
            onEnd={handleEnd}
          />
        )}
      </GameCanvas>
    </div>
  )
}
