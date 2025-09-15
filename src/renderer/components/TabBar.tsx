import React, { useEffect, useRef } from 'react'
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
  const tabBarRef = useRef<HTMLDivElement>(null)
  const activeTabRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll active tab into view when it changes
    if (activeTabRef.current && tabBarRef.current) {
      const tabBar = tabBarRef.current
      const activeTab = activeTabRef.current
      
      const tabBarRect = tabBar.getBoundingClientRect()
      const activeTabRect = activeTab.getBoundingClientRect()
      
      // Check if tab is fully visible
      const isFullyVisible = 
        activeTabRect.left >= tabBarRect.left && 
        activeTabRect.right <= tabBarRect.right
      
      if (!isFullyVisible) {
        // Scroll the tab into view
        activeTab.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' })
      }
    }
  }, [activeTabId])

  if (tabs.length === 0) return null

  return (
    <div className="tab-bar" ref={tabBarRef}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          ref={tab.id === activeTabId ? activeTabRef : null}
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