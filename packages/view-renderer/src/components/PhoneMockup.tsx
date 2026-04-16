import type { CSSProperties, ReactNode } from 'react'

export interface PhoneMockupProps {
  children: ReactNode
  width?: number
  height?: number
  className?: string
}

const BEZEL = 12
const NOTCH_WIDTH = 120
const NOTCH_HEIGHT = 24
const HOME_HEIGHT = 4

export function PhoneMockup({ children, width = 375, height = 720, className }: PhoneMockupProps) {
  const outerWidth = width + BEZEL * 2
  const outerHeight = height + BEZEL * 2 + NOTCH_HEIGHT + HOME_HEIGHT + 8

  return (
    <div className={className} style={outer(outerWidth, outerHeight)}>
      {/* Notch */}
      <div style={notch} />
      {/* Screen */}
      <div style={screen(width, height)}>
        {children}
      </div>
      {/* Home indicator */}
      <div style={homeIndicator} />
    </div>
  )
}

const outer = (w: number, h: number): CSSProperties => ({
  width: w,
  height: h,
  flexShrink: 0,
  background: '#1a1a1a',
  borderRadius: 40,
  padding: `${BEZEL}px`,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)',
})

const notch: CSSProperties = {
  width: NOTCH_WIDTH,
  height: NOTCH_HEIGHT,
  background: '#1a1a1a',
  borderRadius: '0 0 16px 16px',
  marginBottom: 0,
  zIndex: 1,
  position: 'relative',
  top: -1,
}

const screen = (w: number, h: number): CSSProperties => ({
  width: w,
  height: h,
  borderRadius: 8,
  overflow: 'hidden',
  background: '#fff',
  flex: 1,
})

const homeIndicator: CSSProperties = {
  width: 120,
  height: HOME_HEIGHT,
  background: '#666',
  borderRadius: 2,
  marginTop: 6,
}
