import { useState, useEffect, useCallback, type CSSProperties, type ReactNode } from 'react'

export interface PhoneMockupProps {
  children: ReactNode
  /** Fixed pixel width (ignored when responsive=true) */
  width?: number
  /** Fixed pixel height (ignored when responsive=true) */
  height?: number
  /** When true, auto-sizes to maxHeightVh using real phone aspect ratio */
  responsive?: boolean
  /** Viewport-height percentage for responsive mode (default 80) */
  maxHeightVh?: number
  /** Screen aspect ratio as width/height (default 9/19.5 — modern smartphone) */
  aspectRatio?: number
  className?: string
}

const BEZEL = 12
const NOTCH_WIDTH_RATIO = 0.32 // notch as fraction of outer width
const NOTCH_HEIGHT = 24
const HOME_HEIGHT = 4
const CHROME_HEIGHT = BEZEL * 2 + NOTCH_HEIGHT + HOME_HEIGHT + 8

/** Default modern smartphone aspect ratio (9:19.5 ≈ iPhone 14/15) */
const DEFAULT_ASPECT = 9 / 19.5

function usePhoneDimensions(
  responsive: boolean,
  maxHeightVh: number,
  aspectRatio: number,
  fixedW: number,
  fixedH: number,
) {
  const compute = useCallback(() => {
    if (!responsive) return { screenW: fixedW, screenH: fixedH }
    const maxPx = (window.innerHeight * maxHeightVh) / 100
    const screenH = maxPx - CHROME_HEIGHT
    const screenW = Math.round(screenH * aspectRatio)
    return { screenW, screenH: Math.round(screenH) }
  }, [responsive, maxHeightVh, aspectRatio, fixedW, fixedH])

  const [dims, setDims] = useState(compute)

  useEffect(() => {
    if (!responsive) return
    const update = () => setDims(compute())
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [responsive, compute])

  return dims
}

export function PhoneMockup({
  children,
  width = 375,
  height = 720,
  responsive = false,
  maxHeightVh = 80,
  aspectRatio = DEFAULT_ASPECT,
  className,
}: PhoneMockupProps) {
  const { screenW, screenH } = usePhoneDimensions(responsive, maxHeightVh, aspectRatio, width, height)

  const outerWidth = screenW + BEZEL * 2
  const outerHeight = screenH + CHROME_HEIGHT
  const notchWidth = Math.round(outerWidth * NOTCH_WIDTH_RATIO)

  return (
    <div className={className} style={outer(outerWidth, outerHeight)}>
      {/* Notch */}
      <div style={notchStyle(notchWidth)} />
      {/* Screen */}
      <div style={screen(screenW, screenH)}>
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

const notchStyle = (w: number): CSSProperties => ({
  width: w,
  height: NOTCH_HEIGHT,
  background: '#1a1a1a',
  borderRadius: '0 0 16px 16px',
  marginBottom: 0,
  zIndex: 1,
  position: 'relative',
  top: -1,
})

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
