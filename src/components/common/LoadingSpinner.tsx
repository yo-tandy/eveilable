interface LoadingSpinnerProps {
  message?: string
}

export function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-600 border-t-transparent mb-4" />
      {message && <p className="text-gray-500 text-sm">{message}</p>}
    </div>
  )
}
