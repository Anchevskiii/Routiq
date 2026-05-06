import React, { useState } from 'react'

export interface TabItem {
  id: string
  label: string
  content: React.ReactNode
}

export interface TabsProps {
  items: TabItem[]
  defaultTab?: string
}

export const Tabs: React.FC<TabsProps> = ({ items, defaultTab }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id)

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {items.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="tabs-content">
        {items.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  )
}
