import type {
  GenerationOptions,
  SceneTimelineItem,
  ShortsAdResult,
} from "../types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSceneTimeline(raw: unknown): SceneTimelineItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("sceneTimeline이 비어 있거나 올바른 배열이 아닙니다.");
  }

  return raw.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`sceneTimeline[${index}] 형식이 올바르지 않습니다.`);
    }

    const time = typeof item.time === "string" ? item.time : "";
    const visual = typeof item.visual === "string" ? item.visual : "";
    const caption = typeof item.caption === "string" ? item.caption : "";
    const voice = typeof item.voice === "string" ? item.voice : "";

    if (!time || !visual) {
      throw new Error(`sceneTimeline[${index}]에 필수 필드가 없습니다.`);
    }

    return {
      time,
      visual,
      caption,
      voice,
    };
  });
}

function parseShortsAdResult(raw: unknown): ShortsAdResult {
  if (!isRecord(raw)) {
    throw new Error("API 응답이 JSON 객체가 아닙니다.");
  }

  const productSummary =
    typeof raw.productSummary === "string"
      ? raw.productSummary
      : "";

  const hook =
    typeof raw.hook === "string"
      ? raw.hook
      : "";

  const voiceScript =
    typeof raw.voiceScript === "string"
      ? raw.voiceScript
      : "";

  const captionScript =
    typeof raw.captionScript === "string"
      ? raw.captionScript
      : "";

  const videoPrompt =
    typeof raw.videoPrompt === "string"
      ? raw.videoPrompt
      : "";

  const sceneTimeline = parseSceneTimeline(raw.sceneTimeline);

  const apiPayload = isRecord(raw.apiPayload)
    ? raw.apiPayload
    : {};

  return {
    productSummary,
    hook,
    voiceScript,
    captionScript,
    sceneTimeline,
    videoPrompt,
    apiPayload,
  };
}

export async function analyzeProductWithVision(
  imageDataUrl: string,
  options: GenerationOptions,
): Promise<ShortsAdResult> {
  let response: Response;

  try {
    response = await fetch("/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageDataUrl,
        options,
      }),
    });
  } catch {
    throw new Error("서버 연결에 실패했습니다.");
  }

  const data: unknown = await response.json();

  if (!response.ok) {
    if (
      isRecord(data) &&
      typeof data.error === "string"
    ) {
      throw new Error(data.error);
    }

    throw new Error("AI 분석에 실패했습니다.");
  }

  return parseShortsAdResult(data);
}