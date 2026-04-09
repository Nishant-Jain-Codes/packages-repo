/**
 * elevenlabs.ts
 *
 * ElevenLabs TTS (text-to-speech) and STT (speech-to-text / Scribe) client.
 *
 * API key priority:
 *   1. import.meta.env.VITE_ELEVENLABS_API_KEY  ← set in .env.local
 *   2. localStorage key "el_api_key"             ← runtime fallback
 */

// ─── Config ───────────────────────────────────────────────────────────────────

const DEFAULT_VOICE_ID = "3gsg3cxXyFLcGIfNbM6C"; // "Jessica" — natural, professional
const DEFAULT_MODEL_TTS = "eleven_turbo_v2_5";     // Lowest latency TTS model
const MODEL_STT = "scribe_v1";                     // ElevenLabs Scribe STT

function getApiKey(): string | null {
  return (
    (import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined) ||
    localStorage.getItem("el_api_key") ||
    null
  );
}

export function setElevenLabsApiKey(key: string) {
  localStorage.setItem("el_api_key", key);
}

export function hasElevenLabsKey(): boolean {
  return !!getApiKey();
}

// ─── TTS ──────────────────────────────────────────────────────────────────────

let currentAudio: HTMLAudioElement | null = null;

export async function speakWithElevenLabs(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("ElevenLabs API key not configured");

  // Stop anything currently playing
  stopElevenLabsSpeech();

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: DEFAULT_MODEL_TTS,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`ElevenLabs TTS error ${response.status}: ${body?.detail?.message ?? response.statusText}`);
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);

  return new Promise((resolve) => {
    const audio = new Audio(audioUrl);
    currentAudio = audio;
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      resolve(); // Resolve anyway so the agent flow continues
    };
    audio.play().catch(() => resolve());
  });
}

export function stopElevenLabsSpeech(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

export function isElevenLabsSpeaking(): boolean {
  return !!currentAudio && !currentAudio.paused;
}

// ─── STT (Scribe) ─────────────────────────────────────────────────────────────

export async function transcribeWithElevenLabs(audioBlob: Blob): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("ElevenLabs API key not configured");

  const formData = new FormData();
  formData.append("file", audioBlob, "recording.webm");
  formData.append("model_id", MODEL_STT);
  formData.append("language_code", "en");

  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`ElevenLabs STT error ${response.status}: ${body?.detail?.message ?? response.statusText}`);
  }

  const result = await response.json();
  return (result.text ?? "").trim();
}

// ─── MediaRecorder-based mic capture ─────────────────────────────────────────

export interface RecordingSession {
  stop: () => Promise<Blob>;
  abort: () => void;
}

export function startRecording(): Promise<RecordingSession> {
  return new Promise((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const chunks: BlobPart[] = [];
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.start(100); // Collect data every 100ms

        const stopTracks = () => stream.getTracks().forEach((t) => t.stop());

        const session: RecordingSession = {
          stop: () =>
            new Promise((res) => {
              recorder.onstop = () => {
                stopTracks();
                res(new Blob(chunks, { type: mimeType }));
              };
              recorder.stop();
            }),
          abort: () => {
            recorder.onstop = null;
            recorder.stop();
            stopTracks();
          },
        };

        resolve(session);
      })
      .catch((err) => {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          reject(new Error("not-allowed"));
        } else if (err.name === "NotFoundError") {
          reject(new Error("audio-capture"));
        } else {
          reject(err);
        }
      });
  });
}

// ─── VAD-enabled recording ────────────────────────────────────────────────────
// Records until silence is detected (user stopped speaking), then resolves.

export interface VADRecordingResult {
  blob: Blob;
}

export function startRecordingWithVAD(options?: {
  silenceThreshold?: number;  // RMS energy (0–1), default 0.01
  silenceDuration?: number;   // ms of silence before stopping, default 1200
  maxDuration?: number;       // max recording ms, default 15000
  minDuration?: number;       // min recording ms before VAD kicks in, default 400
  onSpeechStart?: () => void;
}): Promise<{ result: Promise<VADRecordingResult>; abort: () => void }> {
  const {
    silenceThreshold = 0.01,
    silenceDuration = 1200,
    maxDuration = 15000,
    minDuration = 400,
    onSpeechStart,
  } = options ?? {};

  return new Promise((resolveSetup, rejectSetup) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const chunks: BlobPart[] = [];
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";

        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        recorder.start(100);

        // Web Audio API for silence detection
        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        const dataArray = new Float32Array(analyser.fftSize);

        let aborted = false;
        let silenceStart: number | null = null;
        let hasSpeech = false;
        let rafId: number;
        const startTime = Date.now();

        let resolveResult!: (v: VADRecordingResult) => void;
        const resultPromise = new Promise<VADRecordingResult>((res) => { resolveResult = res; });

        const stopAll = () => {
          cancelAnimationFrame(rafId);
          audioCtx.close().catch(() => {});
          stream.getTracks().forEach((t) => t.stop());
        };

        const finish = () => {
          stopAll();
          recorder.onstop = () => {
            resolveResult({ blob: new Blob(chunks, { type: mimeType }) });
          };
          if (recorder.state !== "inactive") recorder.stop();
          else resolveResult({ blob: new Blob(chunks, { type: mimeType }) });
        };

        const checkVAD = () => {
          if (aborted) return;
          analyser.getFloatTimeDomainData(dataArray);
          const rms = Math.sqrt(
            dataArray.reduce((sum, v) => sum + v * v, 0) / dataArray.length
          );

          const elapsed = Date.now() - startTime;

          if (rms > silenceThreshold) {
            // Speech detected
            if (!hasSpeech) {
              hasSpeech = true;
              onSpeechStart?.();
            }
            silenceStart = null;
          } else if (hasSpeech && elapsed > minDuration) {
            // Silence after speech
            if (!silenceStart) silenceStart = Date.now();
            else if (Date.now() - silenceStart >= silenceDuration) {
              finish(); // Done speaking
              return;
            }
          }

          // Max duration safety
          if (elapsed >= maxDuration) { finish(); return; }

          rafId = requestAnimationFrame(checkVAD);
        };

        rafId = requestAnimationFrame(checkVAD);

        // Max duration timeout as backup
        const maxTimer = setTimeout(() => { if (!aborted) finish(); }, maxDuration);
        resultPromise.finally(() => clearTimeout(maxTimer));

        resolveSetup({
          result: resultPromise,
          abort: () => {
            aborted = true;
            stopAll();
            if (recorder.state !== "inactive") recorder.stop();
          },
        });
      })
      .catch((err) => {
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          rejectSetup(new Error("not-allowed"));
        } else if (err.name === "NotFoundError") {
          rejectSetup(new Error("audio-capture"));
        } else {
          rejectSetup(err);
        }
      });
  });
}
