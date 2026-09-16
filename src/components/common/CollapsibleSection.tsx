import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  /** Secondary text shown next to the title, e.g. a word count. */
  hint?: string
  defaultOpen?: boolean
  children: ReactNode
}

/** A glass card whose body is hidden behind a toggle, closed by default. */
export function CollapsibleSection({ title, hint, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="glass rounded-2xl">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/30 rounded-2xl transition-colors"
      >
        <span className="font-bold flex-1">{title}</span>
        {hint && <span className="text-sm text-gray-500">{hint}</span>}
        {open
          ? <ChevronUp size={18} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
          : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" aria-hidden="true" />
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
