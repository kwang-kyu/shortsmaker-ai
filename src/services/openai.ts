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
    throw new Error("sceneTimeline이 올바르지 않습니다.");
  }

  return raw.map((item, index) => {
    if (!isRecord(item)) {
      throw new Error(`sceneTimeline[${index}] 오류`);
    }

    return {
      time: typeof item.time === "string" ? item.time : "",
      visual: typeof item.visual === "string" ? item.visual : "",
      caption: typeof item.caption === "string" ? item.caption : "",
      voice: typeof item.voice === "string" ? item.voice : "",
    };
  });
}

function parseResult(raw: unknown): ShortsAdResult {
  if (!isRecord(raw)) {
    throw new Error("API 응답 오류");
  }

  return {
    productSummary:
      typeof raw.productSummary === "string"
        ? raw.productSummary
        : "",

    hook:
      typeof raw.hook === "string"
        ? raw.hook
        : "",

    voiceScript:
      typeof raw.voiceScript === "string"
        ? raw.voiceScript
        : "",

    captionScript:
      typeof raw.captionScript === "string"
        ? raw.captionScript
        : "",

    videoPrompt:
      typeof raw.videoPrompt === "string"
        ? raw.videoPrompt
        : "",

    sceneTimeline: parseSceneTimeline(raw.sceneTimeline),

    apiPayload:
      isRecord(raw.apiPayload)
        ? raw.apiPayload
        : {},
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
    throw new Error("서버 연결 실패");
  }

  const data: unknown = await response.json();

  if (!response.ok) {
    throw new Error("분석 실패");
  }

  return parseResult(data);
}
