import { DiffEditor, type DiffOnMount } from "@monaco-editor/react";
import { useRef, useEffect, type CSSProperties } from "react";
import type { editor } from "monaco-editor";

interface DiffTabProps {
  original: string;
  modified: string;
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

export function DiffTab({ original, modified }: DiffTabProps) {
  const hasChanges = original !== modified;
  const editorRef = useRef<editor.IStandaloneDiffEditor | null>(null);

  const handleMount: DiffOnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Custom diff highlight colors: red=removed, yellow=modified, green=added
    monaco.editor.defineTheme("diff-theme", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        // Removed lines (original side) — red
        "diffEditor.removedLineBackground": "#4c1d1d",
        "diffEditor.removedTextBackground": "#7f1d1d80",
        // Added lines (modified side) — green
        "diffEditor.insertedLineBackground": "#14352a",
        "diffEditor.insertedTextBackground": "#05603880",
        // Modified word-level highlights — yellow
        "diffEditorOverview.insertedForeground": "#22c55e",
        "diffEditorOverview.removedForeground": "#ef4444",
        // Gutter indicators
        "editorGutter.addedBackground": "#22c55e",
        "editorGutter.modifiedBackground": "#eab308",
        "editorGutter.deletedBackground": "#ef4444",
      },
    });
    monaco.editor.setTheme("diff-theme");
  };

  // Update models when props change
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const origModel = ed.getModel()?.original;
    const modModel = ed.getModel()?.modified;
    if (origModel && origModel.getValue() !== original) {
      origModel.setValue(original);
    }
    if (modModel && modModel.getValue() !== modified) {
      modModel.setValue(modified);
    }
  }, [original, modified]);

  return (
    <div style={wrapper}>
      <div style={editorWrap}>
        <DiffEditor
          height="100%"
          language="json"
          original={original}
          modified={modified}
          theme="vs-dark"
          onMount={handleMount}
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            folding: true,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            renderSideBySide: true,
            enableSplitViewResizing: true,
            renderIndicators: true,
            originalEditable: false,
            diffWordWrap: "on",
          }}
        />
      </div>
      <div style={statusBar}>
        {hasChanges ? (
          <span style={{ color: "#fbbf24" }}>&#x26A0; Draft has unsaved changes</span>
        ) : (
          <span style={{ color: "#4ade80" }}>&#x2713; No changes</span>
        )}
      </div>
    </div>
  );
}
