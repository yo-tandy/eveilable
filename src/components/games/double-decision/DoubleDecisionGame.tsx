import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useVisualGameLoop } from '../../../hooks/useVisualGameLoop'
import { GameCanvas, useGameDimensions } from '../../common/GameCanvas'
import { CountdownOverlay } from '../../common/CountdownOverlay'
import { ContinuePrompt } from '../../common/ContinuePrompt'
import { RoadScene } from './RoadScene'
import { DirectionResponse } from './DirectionResponse'
import { LocationResponse } from '../divided-attention/LocationResponse'
import { FeedbackDisplay } from '../divided-attention/FeedbackDisplay'
import { randomPick, randomIndices } from '../../../utils/random'
import { Car } from 'lucide-react'

const DIRECTIONS = ['left', 'right']
const POSITION_COUNT = 8

function GameArea() {
  const { t } = useTranslation()
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
    gameType: 'double-decision',
    generateStimulus: useCallback((_, distractorCount: number) => {
      const centralType = randomPick(DIRECTIONS) // 'left' or 'right'
      const peripheralPosition = Math.floor(Math.random() * POSITION_COUNT)
      const availablePositions = Array.from({ length: POSITION_COUNT }, (_, i) => i)
        .filter((i) => i !== peripheralPosition)
      const distractorPositions = randomIndices(availablePositions.length, distractorCount)
        .map((idx) => availablePositions[idx])
      return { centralType, peripheralPosition, distractorPositions }
    }, []),
  })

  return (
    <>
      {stimulus && (
        <RoadScene
          direction={stimulus.centralType}
          signPosition={stimulus.peripheralPosition}
          distractorPositions={stimulus.distractorPositions}
          showStimulus={phase === 'stimulus'}
          difficultyParams={difficultyParams}
        />
      )}

      {phase === 'response-peripheral' && (
        <LocationResponse
          onSelect={handlePeripheralResponse}
          containerSize={size}
          peripheralDistance={difficultyParams.peripheralDistance}
        />
      )}

      {phase === 'feedback' && trials.length > 0 && (
        <FeedbackDisplay trial={trials[trials.length - 1]} />
      )}

      {/* Direction response buttons at bottom of canvas */}
      {phase === 'response-central' && (
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <p className="text-center text-sm text-ink-2 mb-2">{t('games.doubleDecision.whichDirection')}</p>
          <DirectionResponse onSelect={handleCentralResponse} />
        </div>
      )}

      {phase !== 'idle' && phase !== 'end' && (
        <div className="absolute top-2 right-3 text-xs text-ink-2">
          {t('common.trial')} {currentTrial + (phase === 'feedback' ? 0 : 1)}
        </div>
      )}
    </>
  )
}

export function DoubleDecisionGame() {
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
    gameType: 'double-decision',
    generateStimulus: useCallback((_, distractorCount: number) => {
      const centralType = randomPick(DIRECTIONS)
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
        <div className="art art-attention w-20 h-20 mx-auto mb-4 -rotate-3"><Car size={40} strokeWidth={2.4} aria-hidden="true" /></div>
        <h2 className="display text-[30px] leading-tight mb-2">{t('games.doubleDecision.name')}</h2>
        <p className="text-ink-2 font-bold mb-6">{t('games.doubleDecision.description')}</p>
        <div className="sticker-flat p-5 text-[15px] text-ink-2 font-bold mb-6 text-left space-y-2">
          <p>{t('games.doubleDecision.instructions1')}</p>
          <p>{t('games.doubleDecision.instructions2')}</p>
          <p>{t('games.doubleDecision.instructions3')}</p>
          <p>{t('games.doubleDecision.instructions4')}</p>
        </div>
        <button
          onClick={() => beginGame()}
          className="btn btn-sun"
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
        <div className="flex items-center justify-center gap-3 mb-6"><h2 className="display text-[36px]">{t('stats.niceOne')}</h2><span className="tag tag-sun">{t('stats.sessionComplete')}</span></div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="sticker-sm p-4">
            <div className="display text-3xl leading-none">{trials.length}</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-ink-2 mt-1">{t('stats.trials')}</div>
          </div>
          <div className="sticker-sm p-4">
            <div className="display text-3xl leading-none">{Math.round(accuracy * 100)}%</div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-ink-2 mt-1">{t('stats.accuracy')}</div>
          </div>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => resetGame()}
            className="btn btn-blue"
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
