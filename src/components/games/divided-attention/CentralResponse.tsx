import { Car, Truck } from 'lucide-react'

interface CentralResponseProps {
  onSelect: (answer: string) => void
}

const OPTIONS = [
  { key: 'car', label: 'Car', icon: Car },
  { key: 'truck', label: 'Truck', icon: Truck },
] as const

export function CentralResponse({ onSelect }: CentralResponseProps) {
  return (
    <div className="flex gap-4 justify-center">
      {OPTIONS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className="flex flex-col items-center gap-2 px-8 py-4 rounded-xl border-2 border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition-colors min-w-[100px]"
        >
          <Icon size={32} className="text-gray-700" />
          <span className="text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  )
}
