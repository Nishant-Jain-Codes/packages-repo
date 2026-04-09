/**
 * VoiceHighlightContext.tsx
 *
 * Provides visual highlight state for voice-triggered UI events:
 *  - highlightField(id)    → rings the named field for ~2s
 *  - highlightSection(id)  → glows the named section for ~2s
 *  - flashSaveButton()     → flashes the Save button for 600ms
 */

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface VoiceHighlightContextValue {
  highlightedFieldId:   string | null;
  highlightedSectionId: string | null;
  removingSectionId:    string | null;
  saveButtonFlash:      boolean;
  highlightField:       (id: string) => void;
  highlightSection:     (id: string) => void;
  startSectionRemoval:  (id: string) => void;
  flashSaveButton:      () => void;
}

const VoiceHighlightContext = createContext<VoiceHighlightContextValue>({
  highlightedFieldId:   null,
  highlightedSectionId: null,
  removingSectionId:    null,
  saveButtonFlash:      false,
  highlightField:      () => {},
  highlightSection:    () => {},
  startSectionRemoval: () => {},
  flashSaveButton:     () => {},
});

export function VoiceHighlightProvider({ children }: { children: ReactNode }) {
  const [highlightedFieldId,   setHighlightedFieldId]   = useState<string | null>(null);
  const [highlightedSectionId, setHighlightedSectionId] = useState<string | null>(null);
  const [removingSectionId,    setRemovingSectionId]    = useState<string | null>(null);
  const [saveButtonFlash,      setSaveButtonFlash]      = useState(false);

  const fieldTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removalTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const highlightField = useCallback((id: string) => {
    if (fieldTimerRef.current) clearTimeout(fieldTimerRef.current);
    setHighlightedFieldId(id);
    fieldTimerRef.current = setTimeout(() => setHighlightedFieldId(null), 2000);

    // Scroll the new field into view after React renders it
    setTimeout(() => {
      const el = document.querySelector(`[data-field-id="${id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }, []);

  const highlightSection = useCallback((id: string) => {
    if (sectionTimerRef.current) clearTimeout(sectionTimerRef.current);
    setHighlightedSectionId(id);
    sectionTimerRef.current = setTimeout(() => setHighlightedSectionId(null), 2000);
  }, []);

  const startSectionRemoval = useCallback((id: string) => {
    if (removalTimerRef.current) clearTimeout(removalTimerRef.current);
    setRemovingSectionId(id);
    removalTimerRef.current = setTimeout(() => setRemovingSectionId(null), 500);
  }, []);

  const flashSaveButton = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setSaveButtonFlash(true);
    saveTimerRef.current = setTimeout(() => setSaveButtonFlash(false), 600);
  }, []);

  return (
    <VoiceHighlightContext.Provider value={{
      highlightedFieldId,
      highlightedSectionId,
      removingSectionId,
      saveButtonFlash,
      highlightField,
      highlightSection,
      startSectionRemoval,
      flashSaveButton,
    }}>
      {children}
    </VoiceHighlightContext.Provider>
  );
}

export function useVoiceHighlight(): VoiceHighlightContextValue {
  return useContext(VoiceHighlightContext);
}
