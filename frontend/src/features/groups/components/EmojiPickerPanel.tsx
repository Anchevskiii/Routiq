import React from 'react'

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏', '✈️', '🌍']

interface Props {
  onSelect: (emoji: string) => void
}

export const EmojiPickerPanel: React.FC<Props> = ({ onSelect }) => (
  <div className="grid grid-cols-5 gap-1 bg-white dark:bg-[#1a1830] border border-gray-100 dark:border-white/[0.08] rounded-2xl shadow-lg p-2">
    {EMOJIS.map(e => (
      <button
        key={e}
        type="button"
        onClick={() => onSelect(e)}
        className="w-8 h-8 flex items-center justify-center rounded-xl text-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
      >
        {e}
      </button>
    ))}
  </div>
)
