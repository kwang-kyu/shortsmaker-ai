import type { ShortsDuration } from "../types";

const API_URL = "/api/speech";

export async function synthesizeSpeechMp3(
  input: string,
  durationSec: ShortsDuration,
): Promise<Blob> {
  let response: Response;

  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input,
        durationSec,
      }),
    });
  } catch {
    throw new Error("서버 연결 실패");
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "TTS 생성 실패");
  }

  return response.blob();
}
