import type { ShortsDuration } from "../types";

const API_URL = "/api/speech";

async function readServerError(response: Response): Promise<string> {
  try {
    const body = await response.json();

    if (body?.error) {
      return typeof body.error === "string"
        ? body.error
        : JSON.stringify(body.error);
    }
  } catch {
    /* ignore */
  }

  return `음성 생성 서버 오류 (HTTP ${response.status})`;
}

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
    throw new Error("음성 생성 서버에 연결하지 못했습니다.");
  }

  if (!response.ok) {
    throw new Error(await readServerError(response));
  }

  return response.blob();
}
