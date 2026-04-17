import type { CSSProperties } from 'react'

export interface ColorPickerInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  readonly?: boolean
}

const PRESET_COLORS = [
  '#4DB6AC', '#42A5F5', '#FF7043', '#AB47BC', '#FFA726',
  '#EC407A', '#7CB342', '#5C6BC0', '#26A69A', '#EF5350',
]

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
  } as CSSProperties,
  title: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
  } as CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 8,
    marginBottom: 14,
  } as CSSProperties,
  swatch: (color: string, selected: boolean): CSSProperties => ({
    width: '100%',
    aspectRatio: '1',
    borderRadius: 10,
    background: color,
    cursor: 'pointer',
    border: 'none',
    outline: selected ? `3px solid ${color}` : 'none',
    outlineOffset: 2,
    boxShadow: selected ? `0 2px 8px ${color}66` : '0 1px 3px rgba(0,0,0,0.1)',
    transition: 'all 0.15s ease',
  }),
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    background: '#fff',
    borderRadius: 8,
    padding: '6px 10px',
    border: '1px solid #e5e7eb',
  } as CSSProperties,
  miniSwatch: (color: string): CSSProperties => ({
    width: 28,
    height: 28,
    borderRadius: 6,
    background: color || '#fff',
    border: '1px solid #d1d5db',
    flexShrink: 0,
    cursor: 'pointer',
    position: 'relative',
  }),
  hiddenColorInput: {
    position: 'absolute' as const,
    inset: 0,
    opacity: 0,
    cursor: 'pointer',
    width: '100%',
    height: '100%',
  } as CSSProperties,
  textInput: {
    border: 'none',
    outline: 'none',
    fontSize: 14,
    color: '#374151',
    fontFamily: 'monospace',
    flex: 1,
    background: 'transparent',
  } as CSSProperties,
}

export function ColorPickerInput({ label, value, onChange, readonly }: ColorPickerInputProps) {
  const currentColor = value || ''
  const normalizedCurrent = currentColor.toUpperCase()

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <span style={styles.icon}>🎨</span>
        <span style={styles.title}>{label}</span>
      </div>

      <div style={styles.grid}>
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            style={styles.swatch(color, normalizedCurrent === color.toUpperCase())}
            onClick={() => !readonly && onChange(color)}
            title={color}
          />
        ))}
      </div>

      <div style={styles.inputRow}>
        <div style={{ position: 'relative' as const, ...styles.miniSwatch(currentColor) }}>
          {!readonly && (
            <input
              type="color"
              value={currentColor || '#000000'}
              onChange={(e) => onChange(e.target.value.toUpperCase())}
              style={styles.hiddenColorInput}
              title="Pick custom color"
            />
          )}
        </div>
        <input
          style={styles.textInput}
          value={currentColor}
          readOnly={readonly}
          placeholder="#000000"
          onChange={(e) => {
            const v = e.target.value
            if (v === '' || /^#[0-9A-Fa-f]{0,6}$/.test(v)) {
              onChange(v.toUpperCase())
            }
          }}
        />
      </div>
    </div>
  )
}
