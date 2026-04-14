import { useRef, useState, type CSSProperties, type DragEvent } from 'react'
import type { ConfigFieldValidation } from '../types'

export interface ImageUploadInputProps {
  label: string
  description?: string
  value: string
  onChange: (value: string) => void
  validation?: ConfigFieldValidation
  readonly?: boolean
}

const styles = {
  card: {
    background: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
  } as CSSProperties,
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  } as CSSProperties,
  icon: {
    fontSize: 18,
    color: '#0d9488',
  } as CSSProperties,
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
  } as CSSProperties,
  dropzone: (dragging: boolean): CSSProperties => ({
    border: `2px dashed ${dragging ? '#0d9488' : '#d1d5db'}`,
    borderRadius: 12,
    padding: '32px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    cursor: 'pointer',
    background: dragging ? 'rgba(13, 148, 136, 0.04)' : '#fff',
    transition: 'all 0.15s ease',
  }),
  uploadIcon: {
    color: '#9ca3af',
    fontSize: 24,
  } as CSSProperties,
  uploadText: {
    fontSize: 14,
    color: '#6b7280',
  } as CSSProperties,
  hintText: {
    fontSize: 12,
    color: '#9ca3af',
  } as CSSProperties,
  preview: {
    width: '100%',
    borderRadius: 8,
    marginBottom: 10,
    maxHeight: 120,
    objectFit: 'contain' as const,
    background: '#fff',
    border: '1px solid #e5e7eb',
  } as CSSProperties,
  urlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  } as CSSProperties,
  urlLabel: {
    fontSize: 11,
    color: '#6b7280',
    flexShrink: 0,
  } as CSSProperties,
  urlInput: {
    flex: 1,
    fontSize: 12,
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    padding: '4px 8px',
    outline: 'none',
    color: '#374151',
    fontFamily: 'monospace',
  } as CSSProperties,
  clearBtn: {
    fontSize: 11,
    background: 'none',
    border: '1px solid #e5e7eb',
    borderRadius: 4,
    padding: '3px 8px',
    cursor: 'pointer',
    color: '#ef4444',
  } as CSSProperties,
}

function UploadArrowIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

export function ImageUploadInput({ label, description, value, onChange, validation, readonly }: ImageUploadInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const acceptedTypes = validation?.accepted_types ?? ['png', 'svg', 'jpg', 'jpeg']
  const maxSizeMb = validation?.max_size_mb ?? 5
  const acceptStr = acceptedTypes.map((t) => `.${t}`).join(',')
  const hintText = description || `${acceptedTypes.map((t) => t.toUpperCase()).join(', ')} up to ${maxSizeMb}MB`

  const handleFile = (file: File) => {
    if (readonly) return
    // Validate type
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!acceptedTypes.includes(ext)) return
    // Validate size
    if (file.size > maxSizeMb * 1024 * 1024) return

    // Convert to data URL for preview. In production this would upload to blob storage.
    const reader = new FileReader()
    reader.onload = () => {
      onChange(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const hasValue = Boolean(value)

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.icon}>
          <UploadArrowIcon />
        </span>
        <span style={styles.title}>{label}</span>
      </div>

      {hasValue && (
        <img src={value} alt={label} style={styles.preview} />
      )}

      <div
        style={styles.dropzone(dragging)}
        onClick={() => !readonly && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragging(false)}
      >
        <UploadArrowIcon />
        <span style={styles.uploadText}>
          {hasValue ? 'Click to replace' : 'Click to upload logo'}
        </span>
        <span style={styles.hintText}>{hintText}</span>
        <input
          ref={inputRef}
          type="file"
          accept={acceptStr}
          style={{ display: 'none' }}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
          }}
        />
      </div>

      <div style={styles.urlRow}>
        <span style={styles.urlLabel}>URL / key:</span>
        <input
          style={styles.urlInput}
          value={value ?? ''}
          readOnly={readonly}
          placeholder="blob key or full URL"
          onChange={(e) => onChange(e.target.value)}
        />
        {hasValue && !readonly && (
          <button style={styles.clearBtn} onClick={() => onChange('')}>Clear</button>
        )}
      </div>
    </div>
  )
}
