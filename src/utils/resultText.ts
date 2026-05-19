import type { SceneTimelineItem, ShortsAdExport } from "../types";
import {
  DURATION_LABELS,
  PLATFORM_LABELS,
  TONE_LABELS,
} from "../types";

export function formatSceneTimelineForCopy(
  timeline: SceneTimelineItem[],
): string {
  return timeline
    .map(
      (s, i) =>
        `[${i + 1}] ${s.time}\n연출: ${s.visual}\n자막: ${s.caption}\n보이스: ${s.voice}`,
    )
    .join("\n\n");
}

/** 캡컷용 복사 — 장면 구성 블록 */
export function formatSceneTimelineForCapCut(
  timeline: SceneTimelineItem[],
): string {
  return timeline
    .map(
      (s) =>
        `${s.time}\n화면: ${s.visual}\n자막: ${s.caption}\n음성: ${s.voice}`,
    )
    .join("\n\n");
}

export function buildCapCutCopyText(data: ShortsAdExport): string {
  const isDetailPage = data.apiPayload?.type === "detail-page";

  if (isDetailPage) {
    return [
      "[상세페이지 문구 자료]",
      "",
      "■ 상세페이지 제품 분석 요약",
      data.productSummary,
      "",
      "■ 상세페이지 메인 타이틀",
      data.hook,
      "",
      "■ 상세페이지 콘셉트 / 서브 카피",
      data.voiceScript,
      "",
      "■ 고객 고민 / 핵심 판매 포인트",
      data.captionScript,
      "",
      "■ 상세페이지 섹션 구성",
      formatSceneTimelineForCopy(data.sceneTimeline),
      "",
      "■ 상세페이지 이미지 프롬프트",
      data.videoPrompt,
    ].join("\n");
  }

  return [
    "[캡컷용 쇼츠 제작 자료]",
    "",
    "■ 영상 길이",
    `${data.selectedDuration}초`,
    "",
    "■ 플랫폼",
    PLATFORM_LABELS[data.selectedPlatform],
    "",
    "■ 톤",
    TONE_LABELS[data.selectedTone],
    "",
    "■ 제품 요약",
    data.productSummary,
    "",
    "■ 오프닝 훅",
    data.hook,
    "",
    "■ 음성 대본",
    data.voiceScript,
    "",
    "■ 화면 자막",
    data.captionScript,
    "",
    "■ 장면 구성",
    formatSceneTimelineForCapCut(data.sceneTimeline),
    "",
    "■ 영상 생성 프롬프트",
    data.videoPrompt,
  ].join("\n");
}

export function formatApiPayloadForCopy(
  payload: Record<string, unknown>,
): string {
  return JSON.stringify(payload, null, 2);
}

export function buildFullCopyText(data: ShortsAdExport): string {
  const isDetailPage = data.apiPayload?.type === "detail-page";

  const meta = `길이: ${DURATION_LABELS[data.selectedDuration]} | 플랫폼: ${PLATFORM_LABELS[data.selectedPlatform]} | 톤: ${TONE_LABELS[data.selectedTone]}`;

  if (isDetailPage) {
    return [
      meta,
      "",
      "■ 상세페이지 제품 분석 요약",
      data.productSummary,
      "",
      "■ 상세페이지 메인 타이틀",
      data.hook,
      "",
      "■ 상세페이지 콘셉트 / 서브 카피",
      data.voiceScript,
      "",
      "■ 고객 고민 / 핵심 판매 포인트",
      data.captionScript,
      "",
      "■ 상세페이지 섹션 구성",
      formatSceneTimelineForCopy(data.sceneTimeline),
      "",
      "■ 상세페이지 이미지 프롬프트",
      data.videoPrompt,
      "",
      "■ 상세페이지 제작 규격 JSON",
      formatApiPayloadForCopy(data.apiPayload),
    ].join("\n");
  }

  return [
    meta,
    "",
    "■ 제품 분석 요약",
    data.productSummary,
    "",
    "■ 오프닝 훅",
    data.hook,
    "",
    "■ 음성 대본",
    data.voiceScript,
    "",
    "■ 캡컷용 자막",
    data.captionScript,
    "",
    "■ 장면 타임라인",
    formatSceneTimelineForCopy(data.sceneTimeline),
    "",
    "■ 영상 생성 프롬프트",
    data.videoPrompt,
    "",
    "■ API 전송용 JSON (apiPayload)",
    formatApiPayloadForCopy(data.apiPayload),
  ].join("\n");
}

export function buildExportJson(data: ShortsAdExport): string {
  const payload = {
    productSummary: data.productSummary,
    hook: data.hook,
    voiceScript: data.voiceScript,
    captionScript: data.captionScript,
    sceneTimeline: data.sceneTimeline,
    videoPrompt: data.videoPrompt,
    apiPayload: data.apiPayload,
    selectedDuration: data.selectedDuration,
    selectedPlatform: data.selectedPlatform,
    selectedTone: data.selectedTone,
  };

  return JSON.stringify(payload, null, 2);
}

export function downloadJsonFile(data: ShortsAdExport, filename: string): void {
  const blob = new Blob([buildExportJson(data)], {
    type: "application/json;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildDetailPageHtml(data: ShortsAdExport): string {
  const sections = data.sceneTimeline
    .map((section) => {
      return [
        `  <section style="padding:40px 24px; border-bottom:1px solid #eeeeee;">`,
        `    <p style="font-size:14px; color:#888888; margin-bottom:8px;">${escapeHtml(section.time)}</p>`,
        `    <h3 style="font-size:24px; line-height:1.4; margin:0 0 16px; color:#222222;">${escapeHtml(section.visual)}</h3>`,
        `    <p style="font-size:17px; line-height:1.8; color:#444444; margin:0 0 20px; white-space:pre-line;">${escapeHtml(section.caption)}</p>`,
        `    <div style="background:#f7f7f7; padding:16px; border-radius:12px; margin-top:20px;">`,
        `      <p style="font-size:14px; line-height:1.7; color:#666666; margin:0;">`,
        `        <strong>이미지 제작 방향</strong><br />`,
        `        ${escapeHtml(section.voice)}`,
        `      </p>`,
        `    </div>`,
        `  </section>`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    `<div class="detail-page" style="max-width:860px; margin:0 auto; font-family:Arial, 'Noto Sans KR', sans-serif; color:#222222; background:#ffffff;">`,
    `  <section style="padding:56px 24px 40px; text-align:center;">`,
    `    <p style="font-size:15px; color:#777777; margin-bottom:12px;">상세페이지 제품 분석 요약</p>`,
    `    <h2 style="font-size:32px; line-height:1.35; margin:0 0 20px; color:#111111;">${escapeHtml(data.hook)}</h2>`,
    `    <p style="font-size:18px; line-height:1.8; color:#444444; margin:0 auto 24px; max-width:720px; white-space:pre-line;">${escapeHtml(data.productSummary)}</p>`,
    `  </section>`,
    ``,
    `  <section style="padding:36px 24px; background:#fafafa;">`,
    `    <h3 style="font-size:24px; line-height:1.4; margin:0 0 16px; color:#222222;">상세페이지 콘셉트</h3>`,
    `    <p style="font-size:17px; line-height:1.8; color:#444444; margin:0; white-space:pre-line;">${escapeHtml(data.voiceScript)}</p>`,
    `  </section>`,
    ``,
    `  <section style="padding:36px 24px;">`,
    `    <h3 style="font-size:24px; line-height:1.4; margin:0 0 16px; color:#222222;">고객 고민 / 핵심 판매 포인트</h3>`,
    `    <p style="font-size:17px; line-height:1.8; color:#444444; margin:0; white-space:pre-line;">${escapeHtml(data.captionScript)}</p>`,
    `  </section>`,
    ``,
    sections,
    ``,
    `  <section style="padding:48px 24px; text-align:center; background:#111111; color:#ffffff;">`,
    `    <h3 style="font-size:26px; line-height:1.4; margin:0 0 16px;">지금 필요한 순간, 더 편하게 사용해보세요</h3>`,
    `    <p style="font-size:17px; line-height:1.8; margin:0; color:#dddddd;">제품의 장점과 사용 장면을 확인하고 구매를 결정해보세요.</p>`,
    `  </section>`,
    `</div>`,
  ].join("\n");
}
export function downloadDetailPageHtmlFile(
  data: ShortsAdExport,
  filename = "detail-page.html",
): void {
  const html = buildDetailPageHtml(data);

  const fullHtml = [
    "<!doctype html>",
    '<html lang="ko">',
    "<head>",
    '  <meta charset="UTF-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    "  <title>상세페이지 미리보기</title>",
    "  <style>",
    "    body {",
    "      margin: 0;",
    "      background: #f3f4f6;",
    "      font-family: Arial, 'Noto Sans KR', sans-serif;",
    "    }",
    "    .preview-wrap {",
    "      padding: 32px 16px;",
    "      box-sizing: border-box;",
    "    }",
    "  </style>",
    "</head>",
    "<body>",
    '  <div class="preview-wrap">',
    html,
    "  </div>",
    "</body>",
    "</html>",
  ].join("\n");

  const blob = new Blob([fullHtml], {
    type: "text/html;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.style.display = "none";

  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}