import React from 'react'
import { X, FileText, Sparkles } from 'lucide-react'

export interface Tab {
  id: string
  title: string
  path: string
  isWhatsNew?: boolean
  hasChanges?: boolean
}

interface TabBarProps {
  tabs: Tab[]
  activeTabId: string
  onSelectTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onSelectTab, onCloseTab }) => {
  if (tabs.length === 0) return null

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.id === activeTabId ? 'active' : ''}`}
          onClick={() => onSelectTab(tab.id)}
        >
          <div className="tab-content">
            {tab.isWhatsNew ? <Sparkles size={14} /> : <FileText size={14} />}
            <span className="tab-title">
              {tab.title}
              {tab.hasChanges && <span className="unsaved-indicator">•</span>}
            </span>
          </div>
          <button
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation()
              onCloseTab(tab.id)
            }}
            title="Close tab"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default TabBar