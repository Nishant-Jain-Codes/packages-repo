import { useEffect, useRef, useState, useCallback, useMemo, useImperativeHandle, forwardRef, type CSSProperties } from 'react'
import { useViewRenderer } from '../context/ViewRendererContext'
import type { AppTypeKey, TenantConfig, PreviewConfig } from '../types'

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

interface PlaygroundAction {
  type: 'playground:action'
  action: string
  payload: Record<string, unknown>
}

interface PlaygroundPing {
  type: 'playground:ping'
}

type PlaygroundOutgoingMessage = PlaygroundConfigPatch | PlaygroundNavigate | PlaygroundAction | PlaygroundPing

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
  /**
   * When true (default), loads PWA in playground mode with config patching via postMessage.
   * When false, loads PWA normally — useful for standalone preview with autologin.
   */
  playground?: boolean
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
  playground = true,
}, ref) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const versionRef = useRef(0)
  const [status, setStatus] = useState<PwaStatus>('loading')
  const isReadyRef = useRef(false)

  const { draftMap, currentNodeMeta } = useViewRenderer()

  // Compute the iframe src — playground mode adds query params, non-playground uses autologin token only
  const [iframeKey, setIframeKey] = useState(0)
  const iframeSrc = playground ? buildIframeSrc(pwaUrl, token) : buildAutoLoginSrc(pwaUrl, token)

  // Update status and notify parent
  const updateStatus = useCallback(
    (newStatus: PwaStatus) => {
      setStatus(newStatus)
      onStatusChange?.(newStatus)
    },
    [onStatusChange],
  )

  // Resolve origin — handles both absolute URLs and relative paths (e.g. "/pwa" via proxy)
  const targetOrigin = useMemo(() => {
    try {
      return new URL(pwaUrl).origin
    } catch {
      return window.location.origin
    }
  }, [pwaUrl])

  // Send a message to the PWA iframe
  const sendMessage = useCallback(
    (message: PlaygroundOutgoingMessage) => {
      const iframe = iframeRef.current
      if (!iframe?.contentWindow) return
      iframe.contentWindow.postMessage(JSON.stringify(message), targetOrigin)
    },
    [targetOrigin],
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
    function handleMessage(event: MessageEvent) {
      if (event.origin !== targetOrigin) return

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
  }, [targetOrigin, updateStatus, onError])

  // Auto-send config on draftMap change (only in playground + non-manual mode)
  useEffect(() => {
    if (!playground || manualMode) return
    sendConfig()
  }, [draftMap, playground, manualMode, sendConfig])

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

  // Derive preview config from the active node (context-driven navigation)
  const nodePreview: PreviewConfig | undefined = currentNodeMeta?.preview?.type === 'pwa'
    ? currentNodeMeta.preview
    : undefined

  // Resolve effective route/action: explicit prop wins, then node preview config
  const effectiveRoute = route ?? nodePreview?.route
  const effectiveAction = nodePreview?.action
  const effectiveScreen = nodePreview?.screen
  const effectiveParams = nodePreview?.params

  // Navigate or send action to PWA when the active node changes.
  // activeNodeId is included as a dependency so the effect re-fires even when
  // two nodes share the same preview config (e.g. multiple tabs → screen: "home").
  const activeNodeId = currentNodeMeta?.node_id
  useEffect(() => {
    if (!isReadyRef.current) return

    // Action-based navigation (stateful screens like outlet_detail)
    if (effectiveAction && effectiveScreen) {
      sendMessage({
        type: 'playground:action',
        action: effectiveAction,
        payload: { screen: effectiveScreen, ...(effectiveParams ?? {}) },
      })
      return
    }

    // Simple route navigation (stateless screens like /home)
    if (effectiveRoute) {
      sendMessage({ type: 'playground:navigate', route: effectiveRoute })
    }
  }, [activeNodeId, effectiveRoute, effectiveAction, effectiveScreen, effectiveParams, sendMessage])

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
          <style>{`
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
          `}</style>
          <div style={{ width: '80%', maxWidth: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              height: 40, width: '100%', borderRadius: 6,
              background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite ease-in-out',
            }} />
            <div style={{
              height: 16, width: '80%', borderRadius: 4,
              background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite ease-in-out',
            }} />
            <div style={{
              height: 16, width: '60%', borderRadius: 4,
              background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite ease-in-out',
            }} />
            <div style={{
              height: 16, width: '70%', borderRadius: 4,
              background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)',
              backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite ease-in-out',
            }} />
          </div>
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

  const action = useCallback(
    (actionName: string, payload: Record<string, unknown> = {}) => {
      const iframe = iframeRef.current
      if (!iframe?.contentWindow) return
      const msg: PlaygroundAction = { type: 'playground:action', action: actionName, payload }
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

  return { navigate, action, ping }
}

// ── Helpers ──

/** Playground mode: full config-patching via postMessage */
function buildIframeSrc(pwaUrl: string, token?: string): string {
  const url = new URL(pwaUrl, window.location.origin)
  url.searchParams.set('playground', 'true')
  url.searchParams.set('origin', window.location.origin)
  if (token) url.searchParams.set('token', token)
  return url.toString()
}

/** Non-playground autologin: loads PWA normally, passing token for auto-authentication */
function buildAutoLoginSrc(pwaUrl: string, token?: string): string {
  const url = new URL(pwaUrl, window.location.origin)
  if (token) url.searchParams.set('token', token)
  return url.toString()
}
