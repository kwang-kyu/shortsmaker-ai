import type { ShortsDuration } from "../types";

const OPENAI_SPEECH_URL = "https://api.openai.com/v1/audio/speech";
const TTS_MODEL = "gpt-4o-mini-tts";
const TTS_VOICE = "alloy";

function getApiKey(): string {
  const key = import.meta.env.VITE_OPENAI_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "API 키가 없습니다. .env 파일에 VITE_OPENAI_API_KEY를 설정한 뒤 개발 서버를 다시 시작해 주세요.",
    );
  }
  return key;
}

function buildTtsInstructions(durationSec: ShortsDuration): string {
  return [
    "한국어 쇼츠 광고 내레이션처럼 밝고 또렷하게, 기본보다 약간 빠른 속도로 읽어주세요.",
    "문장 사이의 쉼은 짧게 유지하고, 경쾌한 리듬으로 말해주세요.",
    `전체 낭독 길이가 대략 ${durationSec}초 안에 들어오도록 호흡과 속도를 맞춰주세요.`,
    `${durationSec}초 쇼츠에 맞게 말해주세요.`,
  ].join(" ");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readOpenAiError(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (isRecord(body) && isRecord(body.error)) {
      const msg = body.error.message;
      const code = body.error.code;
      if (typeof msg === "string") {
        return code ? `${msg} (${code})` : msg;
      }
    }
  } catch {
    /* ignore */
  }
  return `OpenAI TTS API 오류 (HTTP ${response.status})`;
}

export async function synthesizeSpeechMp3(
  input: string,
  durationSec: ShortsDuration,
): Promise<Blob> {
  const apiKey = getApiKey();

  let response: Response;
  try {
    response = await fetch(OPENAI_SPEECH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: TTS_MODEL,
        voice: TTS_VOICE,
        input,
        instructions: buildTtsInstructions(durationSec),
        response_format: "mp3",
      }),
    });
  } catch {
    throw new Error("네트워크 오류로 OpenAI TTS API에 연결하지 못했습니다.");
  }

  if (!response.ok) {
    throw new Error(await readOpenAiError(response));
  }

  return response.blob();
}
