import type { CSSProperties } from 'react'
import type { ConfigEditorField } from '../types'
import { ColorPickerInput } from './ColorPickerInput'
import { ImageUploadInput } from './ImageUploadInput'
import { ListSelectionInput } from './ListSelectionInput'
import { ArrayListEditor } from './ArrayListEditor'

export interface FieldRendererProps {
  field: ConfigEditorField
  value: unknown
  onChange: (value: unknown) => void
}

const styles = {
  wrapper: {
    marginBottom: 16,
  } as CSSProperties,
  card: {
    background: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
  } as CSSProperties,
  label: {
    fontSize: 11,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 4,
    display: 'block',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  } as CSSProperties,
  description: {
    fontSize: 11,
    color: '#9ca3af',
    marginBottom: 6,
    lineHeight: '1.4',
  } as CSSProperties,
  input: (readonly?: boolean): CSSProperties => ({
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    outline: 'none',
    background: readonly ? '#f3f4f6' : '#fff',
    color: readonly ? '#6b7280' : '#111827',
    boxSizing: 'border-box',
    cursor: readonly ? 'not-allowed' : undefined,
  }),
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  } as CSSProperties,
  toggle: (on: boolean): CSSProperties => ({
    width: 40,
    height: 22,
    borderRadius: 11,
    background: on ? '#0d9488' : '#d1d5db',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
    flexShrink: 0,
  }),
  toggleKnob: (on: boolean): CSSProperties => ({
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    position: 'absolute',
    top: 2,
    left: on ? 20 : 2,
    transition: 'left 0.15s ease',
    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
  }),
  toggleLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: 500,
  } as CSSProperties,
  select: {
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    outline: 'none',
    background: '#fff',
    color: '#111827',
    boxSizing: 'border-box' as const,
  } as CSSProperties,
}

export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const strValue = value == null ? '' : String(value)

  switch (field.input_type) {
    case 'color_picker':
      return (
        <div style={styles.wrapper}>
          <ColorPickerInput
            label={field.label}
            value={strValue}
            onChange={onChange}
            readonly={field.readonly}
          />
        </div>
      )

    case 'image_upload':
      return (
        <div style={styles.wrapper}>
          <ImageUploadInput
            label={field.label}
            description={field.description}
            value={strValue}
            onChange={(v) => onChange(v)}
            validation={field.validation}
            readonly={field.readonly}
          />
        </div>
      )

    case 'toggle': {
      const boolVal = Boolean(value)
      return (
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <div style={styles.toggleRow}>
              <div
                style={styles.toggle(boolVal)}
                onClick={() => !field.readonly && onChange(!boolVal)}
              >
                <div style={styles.toggleKnob(boolVal)} />
              </div>
              <span style={styles.toggleLabel}>{field.label}</span>
            </div>
            {field.description && <div style={{ ...styles.description, marginTop: 6, marginBottom: 0 }}>{field.description}</div>}
          </div>
        </div>
      )
    }

    case 'number':
      return (
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <label style={styles.label}>{field.label}</label>
            {field.description && <div style={styles.description}>{field.description}</div>}
            <input
              type="number"
              style={styles.input(field.readonly)}
              value={value == null ? '' : Number(value)}
              readOnly={field.readonly}
              min={field.validation?.min}
              max={field.validation?.max}
              onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            />
          </div>
        </div>
      )

    case 'select':
      return (
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <label style={styles.label}>{field.label}</label>
            {field.description && <div style={styles.description}>{field.description}</div>}
            <select
              style={styles.select}
              value={strValue}
              disabled={field.readonly}
              onChange={(e) => onChange(e.target.value)}
            >
              <option value="">— Select —</option>
              {(field.options ?? []).map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      )

    case 'list_selection': {
      const arrValue = Array.isArray(value) ? value : []
      return (
        <div style={styles.wrapper}>
          <ListSelectionInput
            field={field}
            items={arrValue as Record<string, unknown>[]}
            onChange={(newItems) => onChange(newItems)}
          />
        </div>
      )
    }

    case 'list_editor': {
      const arrValue = Array.isArray(value) ? value : []
      return (
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <label style={styles.label}>{field.label}</label>
            {field.description && <div style={styles.description}>{field.description}</div>}
            <ArrayListEditor
              fields={field.item_fields ?? []}
              items={arrValue as Record<string, unknown>[]}
              identityKey={field.identity_key ?? 'type'}
              labelKey={field.label_key}
              subtitleKey={field.subtitle_key}
              toggleKey={field.toggle_key}
              onItemsChange={(newItems) => onChange(newItems)}
            />
          </div>
        </div>
      )
    }

    case 'text':
    default:
      return (
        <div style={styles.wrapper}>
          <div style={styles.card}>
            <label style={styles.label}>{field.label}</label>
            {field.description && <div style={styles.description}>{field.description}</div>}
            <input
              style={styles.input(field.readonly)}
              value={strValue}
              readOnly={field.readonly}
              placeholder={field.description}
              onChange={(e) => onChange(e.target.value || null)}
            />
          </div>
        </div>
      )
  }
}
