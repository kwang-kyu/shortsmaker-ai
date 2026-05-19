import type { ShortsAdExport } from "../types";

const NO_RESULT_MSG = "먼저 쇼츠 구성을 생성해주세요";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** 초 단위 → SRT 타임스탬프 (00:00:00,000) */
export function secondsToSrtTime(seconds: number): string {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(totalMs / 3_600_000);
  const m = Math.floor((totalMs % 3_600_000) / 60_000);
  const s = Math.floor((totalMs % 60_000) / 1000);
  const ms = totalMs % 1000;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${String(ms).padStart(3, "0")}`;
}

/** voiceScript → SRT용 문장 블록 (4~6개 목표) */
export function splitVoiceScriptIntoBlocks(voiceScript: string): string[] {
  const text = voiceScript.trim();
  if (!text) return [];

  const sentences = text
    .split(/(?<=[.!?…])[ \n\t]+|[\n\r]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length >= 4) {
    return sentences;
  }

  const targetCount = 5;
  return splitTextIntoBlocks(text, targetCount);
}

function mergePartsToCount(parts: string[], count: number): string[] {
  if (parts.length <= count) return parts;
  const result: string[] = [];
  const per = Math.ceil(parts.length / count);
  for (let i = 0; i < count; i++) {
    const chunk = parts.slice(i * per, (i + 1) * per).join(", ");
    if (chunk.trim()) result.push(chunk.trim());
  }
  return result;
}

function splitTextIntoBlocks(text: string, count: number): string[] {
  const clamped = Math.min(6, Math.max(4, count));
  const commaParts = text
    .split(/[,，]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (commaParts.length >= clamped) {
    return mergePartsToCount(commaParts, clamped);
  }

  const chunkSize = Math.ceil(text.length / clamped);
  const blocks: string[] = [];
  for (let i = 0; i < clamped; i++) {
    const slice = text.slice(i * chunkSize, (i + 1) * chunkSize).trim();
    if (slice) blocks.push(slice);
  }
  return blocks.length > 0 ? blocks : [text];
}

/** voiceScript 기준 SRT (음성 MP3와 동일 문장) */
export function buildSrtContent(data: ShortsAdExport): string {
  const script = data.voiceScript?.trim();
  if (!script) {
    throw new Error(NO_RESULT_MSG);
  }

  const blocks = splitVoiceScriptIntoBlocks(script);
  if (blocks.length === 0) {
    throw new Error(NO_RESULT_MSG);
  }

  const duration = data.selectedDuration;
  const segmentSec = duration / blocks.length;

  const srtBlocks = blocks.map((blockText, i) => {
    const startSec = i * segmentSec;
    const endSec = (i + 1) * segmentSec;
    return [
      String(i + 1),
      `${secondsToSrtTime(startSec)} --> ${secondsToSrtTime(endSec)}`,
      blockText,
    ].join("\n");
  });

  return `${srtBlocks.join("\n\n")}\n`;
}
