import Editor from "@monaco-editor/react";
import type { CSSProperties } from "react";

interface JsonTabProps {
  value: string;
  onChange: (v: string) => void;
  parseResult?: { data: any; error: string | null };
  readOnly?: boolean;
}

const wrapper: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
};

const editorWrap: CSSProperties = {
  flex: 1,
  minHeight: 0,
};

const statusBar: CSSProperties = {
  padding: "5px 16px",
  background: "#111",
  borderTop: "1px solid #222",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: 12,
  flexShrink: 0,
};

export function JsonTab({ value, onChange, parseResult, readOnly }: JsonTabProps) {
  const lineCount = value.split("\n").length;

  return (
    <div style={wrapper}>
      <div style={editorWrap}>
        <Editor
          height="100%"
          defaultLanguage="json"
          value={value}
          onChange={(v) => onChange(v ?? "")}
          theme="vs-dark"
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            folding: true,
            foldingStrategy: "indentation",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 2,
            formatOnPaste: true,
            renderLineHighlight: "line",
            bracketPairColorization: { enabled: true },
            guides: { bracketPairs: true, indentation: true },
            find: {
              addExtraSpaceOnTop: false,
              autoFindInSelection: "never",
              seedSearchStringFromSelection: "always",
            },
          }}
        />
      </div>
      <div style={statusBar}>
        {parseResult?.error ? (
          <span style={{ color: "#f87171" }}>&#x2717; {parseResult.error}</span>
        ) : (
          <span style={{ color: "#4ade80" }}>&#x2713; Valid JSON</span>
        )}
        <span style={{ color: "#6b7280" }}>{lineCount} lines</span>
      </div>
    </div>
  );
}
