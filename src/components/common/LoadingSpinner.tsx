interface LoadingSpinnerProps {
  message?: string
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20" role="status" aria-live="polite">
      <div className="w-12 h-12 rounded-full border-3 border-ink border-t-sun animate-spin mb-4" aria-hidden="true" />
      {message && <p className="text-ink-2 font-bold text-sm">{message}</p>}
    </div>
  )
}
