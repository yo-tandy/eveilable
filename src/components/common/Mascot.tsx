interface MascotProps {
  className?: string
  /** Bobbing idle animation. Off when the user prefers reduced motion (handled in CSS). */
  animate?: boolean
}

/** The Eveilable brain: a hand-drawn sticker character used on the home and auth pages. */
export function Mascot({ className = '', animate = true }: MascotProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      stroke="#1b1a2e"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`${animate ? 'mascot-bob' : ''} ${className}`}
    >
      <path
        d="M100 30c-22 0-38 14-38 34-16 0-26 12-26 26 0 10 6 18 14 22-4 8-2 20 8 26 4 12 16 20 30 18 4 6 10 8 12 8s8-2 12-8c14 2 26-6 30-18 10-6 12-18 8-26 8-4 14-12 14-22 0-14-10-26-26-26 0-20-16-34-38-34z"
        fill="#ff9ab5"
      />
      <path d="M100 30v134M70 70c10 4 16 12 14 24M130 70c-10 4-16 12-14 24M60 120c10 0 18 6 20 14M140 120c-10 0-18 6-20 14" />
      <ellipse cx="82" cy="98" rx="10" ry="12" fill="#fff" />
      <ellipse cx="118" cy="98" rx="10" ry="12" fill="#fff" />
      <circle cx="85" cy="100" r="4.5" fill="#1b1a2e" />
      <circle cx="121" cy="100" r="4.5" fill="#1b1a2e" />
      <path d="M88 128c6 8 18 8 24 0" />
      <path d="M148 40l6-12M156 50l12-4M140 34l1-14" stroke="#ffc531" strokeWidth="5" />
    </svg>
  )
}
