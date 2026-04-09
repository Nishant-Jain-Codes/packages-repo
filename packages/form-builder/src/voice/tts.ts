/**
 * tts.ts — Thin wrapper around window.speechSynthesis
 */

export function isTTSSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function speak(text: string, options?: { rate?: number; pitch?: number; lang?: string }): void {
  if (!isTTSSupported()) return;

  // Cancel any currently speaking utterance
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = options?.rate ?? 1.05;
  utterance.pitch = options?.pitch ?? 1;
  utterance.lang = options?.lang ?? "en-US";

  // Pick a natural-sounding voice when available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(
    (v) =>
      v.lang.startsWith("en") &&
      (v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("google us english") ||
        v.name.toLowerCase().includes("karen"))
  );
  if (preferred) utterance.voice = preferred;

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (!isTTSSupported()) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  return isTTSSupported() && window.speechSynthesis.speaking;
}
