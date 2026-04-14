import type { CSSProperties } from "react";

interface SaveOutputTabProps {
  output: { timestamp: string; payload: unknown } | null;
}

const emptyState: CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#9ca3af",
  fontSize: 13,
};

const header: CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid #222",
  background: "#111",
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexShrink: 0,
};

const copyBtn: CSSProperties = {
  marginLeft: "auto",
  fontSize: 11,
  padding: "2px 8px",
  border: "1px solid #334155",
  borderRadius: 4,
  color: "#9ca3af",
  background: "transparent",
  cursor: "pointer",
};

const textarea: CSSProperties = {
  flex: 1,
  padding: 16,
  fontFamily: "monospace",
  fontSize: 13,
  background: "#0a0a0a",
  color: "#e5e5e5",
  resize: "none",
  outline: "none",
  border: "none",
};

export function SaveOutputTab({ output }: SaveOutputTabProps) {
  if (!output) {
    return <div style={emptyState}>No saves yet. Make changes in the playground and click Save.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div style={header}>
        <span style={{ fontSize: 11, color: "#d1d5db" }}>
          Last saved — {new Date(output.timestamp).toLocaleTimeString()}
        </span>
        <button
          style={copyBtn}
          onClick={() => navigator.clipboard.writeText(JSON.stringify(output.payload, null, 2))}
        >
          Copy
        </button>
      </div>
      <textarea style={textarea} readOnly value={JSON.stringify(output.payload, null, 2) ?? ""} />
    </div>
  );
}
