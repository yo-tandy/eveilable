import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  /** Secondary text shown next to the title, e.g. a word count. */
  hint?: string
  defaultOpen?: boolean
  children: ReactNode
}

/** A sticker-flat card whose body is hidden behind a toggle, closed by default. */
export function CollapsibleSection({ title, hint, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="sticker-sm">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-butter rounded-2xl transition-colors"
      >
        <span className="font-bold flex-1">{title}</span>
        {hint && <span className="text-sm text-ink-2">{hint}</span>}
        {open
          ? <ChevronUp size={18} className="text-ink-3 flex-shrink-0" aria-hidden="true" />
          : <ChevronDown size={18} className="text-ink-3 flex-shrink-0" aria-hidden="true" />
        }
      </button>
      {open && (
        <div className="px-6 pb-6">
          {children}
        </div>
      )}
    </div>
  )
}
