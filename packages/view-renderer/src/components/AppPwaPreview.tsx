import { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef, type CSSProperties } from 'react'
import { useViewRenderer } from '../context/ViewRendererContext'
import type { AppTypeKey, TenantConfig } from '../types'

// ── Playground message protocol ──

interface PlaygroundConfigPatch {
  type: 'playground:config_patch'
  version: number
  payload: TenantConfig
}

interface PlaygroundNavigate {
  type: 'playground:navigate'
  route: string
}

interface PlaygroundPing {
  type: 'playground:ping'
}

type PlaygroundOutgoingMessage = PlaygroundConfigPatch | PlaygroundNavigate | PlaygroundPing

interface PlaygroundReady {
  type: 'playground:ready'
}

interface PlaygroundConfigApplied {
  type: 'playground:config_applied'
  version: number
}

interface PlaygroundError {
  type: 'playground:error'
  message: string
}

interface PlaygroundPong {
  type: 'playground:pong'
}

type PlaygroundIncomingMessage =
  | PlaygroundReady
  | PlaygroundConfigApplied
  | PlaygroundError
  | PlaygroundPong

// ── Status tracking ──

export type PwaStatus = 'loading' | 'ready' | 'applying' | 'error'

export interface AppPwaPreviewHandle {
  /** Manually send current draftMap config to the PWA iframe */
  sendConfig: () => void
  /** Reload the iframe (resets status to loading) */
  reload: () => void
}

export interface AppPwaPreviewProps {
  /** Base URL of the Flutter PWA (e.g. "http://localhost:8080") */
  pwaUrl: string
  /** Which config key from the draftMap to send (default: first key) */
  appTypeKey?: AppTypeKey
  /** Auth token for the PWA to use for API calls during playground mode */
  token?: string
  /** Additional CSS class for the container */
  className?: string
  /** Additional inline styles for the iframe */
  style?: CSSProperties
  /** Called when PWA status changes */
  onStatusChange?: (status: PwaStatus) => void
  /** Called when an error is received from the PWA */
  onError?: (message: string) => void
  /** Navigate PWA to this route when it changes (requires PWA to be ready) */
  route?: string
  /** When true, config is only sent via ref.sendConfig(), not on every draftMap change */
  manualMode?: boolean
}

export const AppPwaPreview = forwardRef<AppPwaPreviewHandle, AppPwaPreviewProps>(function AppPwaPreview({
  pwaUrl,
  appTypeKey,
  token,
  className,
  style,
  onStatusChange,
  onError,
  route,
  manualMode,
}, ref) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const versionRef = useRef(0)
  const [status, setStatus] = useState<PwaStatus>('loading')
  const isReadyRef = useRef(false)

  const { draftMap } = useViewRenderer()

  // Compute the iframe src with playground query params
  const [iframeKey, setIframeKey] = useState(0)
  const iframeSrc = buildIframeSrc(pwaUrl, token)

  // Update status and notify parent
  const updateStatus = useCallback(
    (newStatus: PwaStatus) => {
      setStatus(newStatus)
      onStatusChange?.(newStatus)
    },
    [onStatusChange],
  )

  // Send a message to the PWA iframe
  const sendMessage = useCallback(
    (message: PlaygroundOutgoingMessage) => {
      const iframe = iframeRef.current
      if (!iframe?.contentWindow) return
      iframe.contentWindow.postMessage(JSON.stringify(message), new URL(pwaUrl).origin)
    },
    [pwaUrl],
  )

  // Push current draftMap config into the iframe
  const sendConfig = useCallback(() => {
    if (!isReadyRef.current || !draftMap) return

    const key = appTypeKey ?? Object.keys(draftMap)[0]
    if (!key || !draftMap[key]) return

    versionRef.current += 1
    updateStatus('applying')

    sendMessage({
      type: 'playground:config_patch',
      version: versionRef.current,
      payload: draftMap[key],
    })
  }, [draftMap, appTypeKey, sendMessage, updateStatus])

  // Reload the iframe by bumping the key (forces remount)
  const reload = useCallback(() => {
    isReadyRef.current = false
    versionRef.current = 0
    updateStatus('loading')
    setIframeKey((k) => k + 1)
  }, [updateStatus])

  // Expose sendConfig and reload to parent via ref
  useImperativeHandle(ref, () => ({ sendConfig, reload }), [sendConfig, reload])

  // Listen for messages from the PWA
  useEffect(() => {
    const expectedOrigin = new URL(pwaUrl).origin

    function handleMessage(event: MessageEvent) {
      if (event.origin !== expectedOrigin) return

      let parsed: PlaygroundIncomingMessage
      try {
        parsed = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
      } catch {
        return // Not a JSON message — ignore
      }

      if (!parsed?.type?.startsWith('playground:')) return

      switch (parsed.type) {
        case 'playground:ready':
          isReadyRef.current = true
          updateStatus('ready')
          break
        case 'playground:config_applied':
          updateStatus('ready')
          break
        case 'playground:error':
          updateStatus('error')
          onError?.((parsed as PlaygroundError).message)
          break
        case 'playground:pong':
          // Health check response — no action needed
          break
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [pwaUrl, updateStatus, onError])

  // Auto-send config on draftMap change (only in non-manual mode)
  useEffect(() => {
    if (manualMode) return
    sendConfig()
  }, [draftMap, manualMode, sendConfig])

  // Fallback: if PWA never sends playground:ready, mark ready when iframe loads
  const handleIframeLoad = useCallback(() => {
    // Give the PWA a short window to send playground:ready via postMessage.
    // If it doesn't, treat the iframe load event as "ready".
    setTimeout(() => {
      if (!isReadyRef.current) {
        isReadyRef.current = true
        updateStatus('ready')
      }
    }, 1500)
  }, [updateStatus])

  // Navigate PWA when route prop changes
  useEffect(() => {
    if (!isReadyRef.current || !route) return
    sendMessage({ type: 'playground:navigate', route })
  }, [route, sendMessage])

  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <iframe
        key={iframeKey}
        ref={iframeRef}
        src={iframeSrc}
        onLoad={handleIframeLoad}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '8px',
          ...style,
        }}
        title="App Preview"
        allow="clipboard-write"
      />
      {status === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: 'rgba(255,255,255,0.8)',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#666',
          }}
        >
          <span>Loading app preview...</span>
          <button
            onClick={reload}
            style={{
              fontSize: 12,
              padding: '5px 16px',
              background: '#0d9488',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Retry
          </button>
        </div>
      )}
    </div>
  )
})

// ── Public imperative API via ref (optional) ──

export function useAppPwaPreviewActions(iframeRef: React.RefObject<HTMLIFrameElement | null>, pwaUrl: string) {
  const navigate = useCallback(
    (route: string) => {
      const iframe = iframeRef.current
      if (!iframe?.contentWindow) return
      const msg: PlaygroundNavigate = { type: 'playground:navigate', route }
      iframe.contentWindow.postMessage(JSON.stringify(msg), new URL(pwaUrl).origin)
    },
    [iframeRef, pwaUrl],
  )

  const ping = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    const msg: PlaygroundPing = { type: 'playground:ping' }
    iframe.contentWindow.postMessage(JSON.stringify(msg), new URL(pwaUrl).origin)
  }, [iframeRef, pwaUrl])

  return { navigate, ping }
}

// ── Helpers ──

function buildIframeSrc(pwaUrl: string, token?: string): string {
  const url = new URL(pwaUrl)
  url.searchParams.set('playground', 'true')
  url.searchParams.set('origin', window.location.origin)
  if (token) url.searchParams.set('token', token)
  return url.toString()
}
