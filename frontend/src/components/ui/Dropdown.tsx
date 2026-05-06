import React, { useState } from 'react'

export interface DropdownItem {
  id: string
  label: React.ReactNode
  onClick: () => void
  danger?: boolean
}

export interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, items }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="dropdown">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <ul className="dropdown-menu">
          {items.map((item) => (
            <li
              key={item.id}
              onClick={() => {
                item.onClick()
                setIsOpen(false)
              }}
              className={item.danger ? 'text-danger' : ''}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
