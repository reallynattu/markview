import React, { useState, useEffect } from 'react'
import { Activity, BarChart2, Zap } from 'lucide-react'
import { perfMonitor } from '../utils/performance'

const PerformancePanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [debugMode, setDebugMode] = useState(() => {
    return localStorage.getItem('debugMode') === 'true'
  })
  
  // Listen for debug mode changes
  useEffect(() => {
    const handleDebugModeChange = (event: CustomEvent) => {
      setDebugMode(event.detail)
    }
    
    window.addEventListener('debugModeChanged', handleDebugModeChange as EventListener)
    return () => {
      window.removeEventListener('debugModeChanged', handleDebugModeChange as EventListener)
    }
  }, [])
  
  useEffect(() => {
    if (isOpen && debugMode) {
      const summary = perfMonitor.exportMetrics()
      setMetrics(summary)
    }
  }, [isOpen, refreshKey, debugMode])
  
  // Only show if debug mode is enabled
  if (!debugMode) return null
  
  const formatDuration = (ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`
    if (ms < 1000) return `${ms.toFixed(1)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }
  
  const getPerformanceColor = (ms: number) => {
    if (ms < 16) return '#4CAF50' // Green - 60fps
    if (ms < 50) return '#FFA726' // Orange - acceptable
    return '#EF5350' // Red - slow
  }
  
  return (
    <>
      {/* Performance Monitor Button */}
      <button
        className="perf-monitor-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="Performance Monitor"
      >
        <Activity size={20} />
      </button>
      
      {/* Performance Panel */}
      {isOpen && (
        <div className="perf-panel">
          <div className="perf-panel-header">
            <h3>
              <Zap size={16} />
              Performance Monitor
            </h3>
            <button 
              className="perf-refresh"
              onClick={() => setRefreshKey(k => k + 1)}
              title="Refresh metrics"
            >
              <BarChart2 size={16} />
            </button>
          </div>
          
          {metrics && metrics.summary && Object.keys(metrics.summary).length > 0 ? (
            <div className="perf-metrics">
              {Object.entries(metrics.summary).map(([name, stats]: [string, any]) => (
                <div key={name} className="perf-metric">
                  <div className="perf-metric-name">{name}</div>
                  <div className="perf-metric-stats">
                    <div className="perf-stat">
                      <span className="perf-label">Avg:</span>
                      <span 
                        className="perf-value"
                        style={{ color: getPerformanceColor(stats.avg) }}
                      >
                        {formatDuration(stats.avg)}
                      </span>
                    </div>
                    <div className="perf-stat">
                      <span className="perf-label">Min:</span>
                      <span className="perf-value">{formatDuration(stats.min)}</span>
                    </div>
                    <div className="perf-stat">
                      <span className="perf-label">Max:</span>
                      <span className="perf-value">{formatDuration(stats.max)}</span>
                    </div>
                    <div className="perf-stat">
                      <span className="perf-label">Count:</span>
                      <span className="perf-value">{stats.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="perf-empty">
              No performance metrics yet. 
              <br />
              Start using the app to see metrics.
            </div>
          )}
          
          <div className="perf-footer">
            <button 
              className="perf-clear"
              onClick={() => {
                perfMonitor.clear()
                setMetrics(null)
              }}
            >
              Clear Metrics
            </button>
            <div className="perf-legend">
              <span style={{ color: '#4CAF50' }}>● Fast</span>
              <span style={{ color: '#FFA726' }}>● OK</span>
              <span style={{ color: '#EF5350' }}>● Slow</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PerformancePanel