'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const EMOJI_OPTIONS = [
  '📋', '🚿', '🛁', '🍳', '🪟', '🚪', '🔌', '💡',
  '🎨', '🔨', '🧱', '📐', '🛠', '⚡', '🪜', '📦',
  '🚧', '🏗', '🧰', '🏠', '🚽', '🛋', '🌡', '🧯',
]

interface Props {
  name: string
  defaultValue?: string
  label?: string
}

export function EmojiPicker({ name, defaultValue = '📋', label = 'Icona' }: Props) {
  const initial = EMOJI_OPTIONS.includes(defaultValue) ? defaultValue : '📋'
  const [value, setValue] = useState(initial)

  return (
    <div>
      <label className="block text-body font-medium text-ink mb-1.5">{label}</label>
      <input type="hidden" name={name} value={value} />
      {/* auto-fill, not a fixed column count: at 44px per swatch, eight columns
          plus gaps needed 394px inside a 324px card and spilled off the screen.
          The track sizes itself to whatever fits. */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-1.5">
        {EMOJI_OPTIONS.map((emoji) => {
          const selected = emoji === value
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => setValue(emoji)}
              className={cn(
                'tap-target flex items-center justify-center rounded-control border text-title transition-colors duration-state',
                selected
                  ? 'border-action bg-action-surface ring-2 ring-action'
                  : 'border-line bg-surface hover:border-line-strong hover:bg-surface-raised',
              )}
              aria-pressed={selected}
              aria-label={`Icona ${emoji}`}
            >
              {emoji}
            </button>
          )
        })}
      </div>
    </div>
  )
}
