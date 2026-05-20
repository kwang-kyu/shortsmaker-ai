export type ShortsDuration = 10 | 15 | 30;

export type PlatformId = "reels" | "shorts" | "tiktok" | "naver_blog";

export type ToneId = "hooking" | "emotional" | "informational" | "sales";

export interface SceneTimelineItem {
  time: string;
  visual: string;
  caption: string;
  voice: string;
}

export interface ShortsAdResult {
  productSummary: string;
  hook: string;
  hookOptions?: string[];
  voiceScript: string;
  captionScript: string;
  sceneTimeline: SceneTimelineItem[];
  videoPrompt: string;
  detailPageCopy?: string;
  thumbnailCopy?: string | string[];
  snsPostCopy?: string;
  hashtags?: string[];
  apiPayload: Record<string, unknown>;
}

/** JSON 다운로드·전체 복사용 (선택 옵션 포함) */
export interface ShortsAdExport extends ShortsAdResult {
  selectedDuration: ShortsDuration;
  selectedPlatform: PlatformId;
  selectedTone: ToneId;
}

export interface GenerationOptions {
  duration: ShortsDuration;
  platform: PlatformId;
  tone: ToneId;
  generationType?: "shorts" | "detail" | "both"; 
}

export const DURATION_OPTIONS: { value: ShortsDuration; label: string }[] = [
  { value: 10, label: "10초" },
  { value: 15, label: "15초" },
  { value: 30, label: "30초" },
];

export const PLATFORM_OPTIONS: {
  id: PlatformId;
  title: string;
  description: string;
}[] = [
  {
    id: "reels",
    title: "릴스",
    description: "감성적·시각적 문구, 여운 있는 컷",
  },
  {
    id: "shorts",
    title: "쇼츠",
    description: "빠른 후킹, 짧은 정보 전달",
  },
  {
    id: "tiktok",
    title: "틱톡",
    description: "트렌디·가벼운 톤, 밈·유행어 활용",
  },
  {
    id: "naver_blog",
    title: "네이버 블로그용",
    description: "설명형·신뢰형, 구매 전환",
  },
];

export const TONE_OPTIONS: {
  id: ToneId;
  title: string;
  description: string;
}[] = [
  {
    id: "hooking",
    title: "강한 후킹형",
    description: "첫 1초 시선 고정, 반전·질문·숫자",
  },
  {
    id: "emotional",
    title: "감성 후기형",
    description: "경험담·공감·신뢰 쌓기",
  },
  {
    id: "informational",
    title: "정보형",
    description: "스펙·비교·팩트 중심 설명",
  },
  {
    id: "sales",
    title: "판매형",
    description: "혜택·긴급성·CTA 강조",
  },
];

export const DURATION_LABELS: Record<ShortsDuration, string> = {
  10: "10초",
  15: "15초",
  30: "30초",
};

export const PLATFORM_LABELS: Record<PlatformId, string> = {
  reels: "릴스",
  shorts: "쇼츠",
  tiktok: "틱톡",
  naver_blog: "네이버 블로그용",
};

export const TONE_LABELS: Record<ToneId, string> = {
  hooking: "강한 후킹형",
  emotional: "감성 후기형",
  informational: "정보형",
  sales: "판매형",
};

/** 길이별 권장 sceneTimeline 구간 수 */
export function sceneCountForDuration(duration: ShortsDuration): number {
  switch (duration) {
    case 10:
      return 4;
    case 15:
      return 5;
    case 30:
      return 10;
  }
}
