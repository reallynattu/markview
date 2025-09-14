import React from 'react'

interface LoadingSkeletonProps {
  lines?: number
  type?: 'markdown' | 'code' | 'mixed'
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  lines = 10, 
  type = 'mixed' 
}) => {
  const generateLine = (index: number) => {
    const baseWidth = 60 + Math.random() * 30
    const isHeading = type === 'mixed' && index % 7 === 0
    const isCode = type === 'code' || (type === 'mixed' && index % 5 === 3)
    
    return (
      <div
        key={index}
        className={`skeleton-line ${isHeading ? 'skeleton-heading' : ''} ${isCode ? 'skeleton-code' : ''}`}
        style={{ 
          width: `${isHeading ? 40 + Math.random() * 20 : baseWidth}%`,
          animationDelay: `${index * 0.05}s`
        }}
      />
    )
  }
  
  return (
    <div className="loading-skeleton">
      {Array.from({ length: lines }, (_, i) => generateLine(i))}
    </div>
  )
}

export default LoadingSkeleton