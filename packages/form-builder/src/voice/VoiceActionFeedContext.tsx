/**
 * VoiceActionFeedContext.tsx
 *
 * Lightweight context that holds a queue of voice action pills.
 * Components call emitAction() to push an entry; entries auto-remove
 * after 3 seconds. Max 3 visible at a time (oldest drops when exceeded).
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface FeedEntry {
  id: string;
  icon: string;           // lucide icon name string (used by VoiceActionFeed)
  label: string;
  color: "emerald" | "blue" | "red" | "amber" | "purple" | "slate";
  exiting: boolean;       // true while fade-out animation plays
}

interface VoiceActionFeedContextValue {
  entries: FeedEntry[];
  emitAction: (entry: Omit<FeedEntry, "id" | "exiting">) => void;
}

const VoiceActionFeedContext = createContext<VoiceActionFeedContextValue>({
  entries: [],
  emitAction: () => {},
});

let _nextId = 0;
const nextId = () => String(++_nextId);

const MAX_ENTRIES = 3;
const DISPLAY_MS  = 3000;
const EXIT_MS     = 300; // fade-out duration before removal

export function VoiceActionFeedProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeEntry = useCallback((id: string) => {
    // Start exit animation
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, exiting: true } : e));
    // Remove after animation completes
    setTimeout(() => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }, EXIT_MS);
  }, []);

  const emitAction = useCallback((entry: Omit<FeedEntry, "id" | "exiting">) => {
    const id = nextId();
    setEntries((prev) => {
      const next = [...prev, { ...entry, id, exiting: false }];
      // If over limit, mark oldest for removal
      if (next.length > MAX_ENTRIES) {
        const oldest = next[0];
        if (!oldest.exiting) {
          const existing = timersRef.current.get(oldest.id);
          if (existing) { clearTimeout(existing); timersRef.current.delete(oldest.id); }
          removeEntry(oldest.id);
        }
        return next.slice(1);
      }
      return next;
    });

    // Auto-dismiss after DISPLAY_MS
    const t = setTimeout(() => {
      timersRef.current.delete(id);
      removeEntry(id);
    }, DISPLAY_MS);
    timersRef.current.set(id, t);
  }, [removeEntry]);

  return (
    <VoiceActionFeedContext.Provider value={{ entries, emitAction }}>
      {children}
    </VoiceActionFeedContext.Provider>
  );
}

export function useVoiceActionFeed(): VoiceActionFeedContextValue {
  return useContext(VoiceActionFeedContext);
}
