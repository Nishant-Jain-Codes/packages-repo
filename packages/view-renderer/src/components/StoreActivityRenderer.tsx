import type { CSSProperties } from 'react'
import type { ActivityCardItem } from '../derivations/deriveActivityCards'
import type { ActivityFieldTag } from '../types'

export interface StoreActivityRendererProps {
  activities: ActivityCardItem[]
  onToggleActivity?: (activityId: string, enabled: boolean) => void
  onAdvancedSettings?: (activityId: string) => void
}

const FIELD_ICONS: Record<string, string> = {
  camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
  dropdown: 'M6 9l6 6 6-6',
  text: 'M4 7V4h16v3M9 20h6M12 4v16',
  textarea: 'M4 7V4h16v3M9 20h6M12 4v16',
  number: 'M4 7V4h16v3M9 20h6M12 4v16',
  date: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
  checkbox: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  multiselect: 'M6 9l6 6 6-6',
  radio: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
}

const styles = {
  description: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
  } as CSSProperties,
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  } as CSSProperties,
  card: (enabled: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: '18px 20px',
    borderRadius: 12,
    border: enabled ? '1px solid rgba(13, 148, 136, 0.2)' : '1px solid #e5e7eb',
    background: enabled ? 'rgba(13, 148, 136, 0.04)' : '#f9fafb',
    transition: 'all 0.15s ease',
  }),
  toggleCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 6,
    flexShrink: 0,
  } as CSSProperties,
  toggleWrapper: {
    position: 'relative',
    width: 44,
    height: 24,
    cursor: 'pointer',
    flexShrink: 0,
  } as CSSProperties,
  toggleTrack: (enabled: boolean): CSSProperties => ({
    width: 44,
    height: 24,
    borderRadius: 12,
    background: enabled ? '#0d9488' : '#d1d5db',
    transition: 'background 0.15s ease',
  }),
  toggleThumb: (enabled: boolean): CSSProperties => ({
    position: 'absolute',
    top: 3,
    left: enabled ? 23 : 3,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'left 0.15s ease',
  }),
  info: {
    flex: 1,
    minWidth: 0,
  } as CSSProperties,
  label: {
    fontSize: 15,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 4,
  } as CSSProperties,
  desc: {
    fontSize: 13,
    color: '#9ca3af',
    lineHeight: '1.4',
    marginBottom: 8,
  } as CSSProperties,
  fieldsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  } as CSSProperties,
  fieldCount: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 2,
  } as CSSProperties,
  fieldChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    fontSize: 12,
    color: '#6b7280',
    background: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    padding: '2px 8px',
    whiteSpace: 'nowrap',
  } as CSSProperties,
  fieldIcon: {
    width: 12,
    height: 12,
    color: '#9ca3af',
    flexShrink: 0,
  } as CSSProperties,
  gearBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    background: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    marginTop: 6,
    transition: 'all 0.15s ease',
  } as CSSProperties,
}

function FieldTypeIcon({ type }: { type: string }) {
  const path = FIELD_ICONS[type] ?? FIELD_ICONS.text
  return (
    <svg style={styles.fieldIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

function GearIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx={12} cy={12} r={3} />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function FieldTags({ fields }: { fields: ActivityFieldTag[] }) {
  if (!fields.length) return null
  return (
    <div style={styles.fieldsRow}>
      <span style={styles.fieldCount}>{fields.length} fields</span>
      {fields.map((f, i) => (
        <span key={i} style={styles.fieldChip}>
          <FieldTypeIcon type={f.type} />
          {f.label}
        </span>
      ))}
    </div>
  )
}

export function StoreActivityRenderer({ activities, onToggleActivity, onAdvancedSettings }: StoreActivityRendererProps) {
  return (
    <div>
      <p style={styles.description}>
        Enable or disable store activities. Use advanced settings to configure each activity's form.
      </p>
      <div style={styles.list}>
        {activities.map((activity) => (
          <div key={activity.id} style={styles.card(activity.enabled)}>
            <div style={styles.toggleCol}>
              <div
                style={styles.toggleWrapper}
                onClick={() => onToggleActivity?.(activity.id, !activity.enabled)}
              >
                <div style={styles.toggleTrack(activity.enabled)} />
                <div style={styles.toggleThumb(activity.enabled)} />
              </div>
            </div>
            <div style={styles.info}>
              <div style={styles.label}>{activity.label}</div>
              <div style={styles.desc}>{activity.description}</div>
              <FieldTags fields={activity.fields} />
            </div>
            {onAdvancedSettings && (
              <div
                style={styles.gearBtn}
                onClick={() => {
                  console.log('[StoreActivity] gear clicked', activity.id)
                  onAdvancedSettings(activity.id)
                }}
              >
                <GearIcon />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
