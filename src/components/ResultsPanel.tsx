import { useState } from "react";
import type { ShortsAdExport } from "../types";
import {
  DURATION_LABELS,
  PLATFORM_LABELS,
  TONE_LABELS,
} from "../types";
import {
  formatApiPayloadForCopy,
  formatSceneTimelineForCopy,
} from "../utils/resultText";
import { ResultCard } from "./ResultCard";

interface ResultsPanelProps {
  data: ShortsAdExport;
  onCopy: (text: string) => void;
  onCopyAll: () => void;
  onCopyCapCut: () => void;
  onCopyDetailHtml: () => void;
  onPreviewDetailHtml: () => void;
  onDownloadDetailHtml: () => void;
  onDownloadJson: () => void;
  onDownloadZip: () => void;
  onDownloadVoiceMp3: () => void;
  onDownloadSrt: () => void;
  isTtsLoading: boolean;
}

type ResultTab =
  | "summary"
  | "voice"
  | "caption"
  | "timeline"
  | "prompt"
  | "detail"
  | "json";

export function ResultsPanel({
  data,
  onCopy,
  onCopyAll,
  onCopyCapCut,
  onCopyDetailHtml,
  onPreviewDetailHtml,
  onDownloadDetailHtml,
  onDownloadJson,
  onDownloadZip,
  onDownloadVoiceMp3,
  onDownloadSrt,
  isTtsLoading,
}: ResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<ResultTab>("summary");

  const metaLine = `${DURATION_LABELS[data.selectedDuration]} · ${PLATFORM_LABELS[data.selectedPlatform]} · ${TONE_LABELS[data.selectedTone]}`;

  const isDetailPage = data.apiPayload?.type === "detail-page";

  const labels = isDetailPage
    ? {
        productSummary: "상세페이지 제품 분석 요약",
        hook: "상세페이지 메인 타이틀",
        voiceScript: "상세페이지 콘셉트 / 서브 카피",
        captionScript: "고객 고민 / 핵심 판매 포인트",
        timeline: "상세페이지 섹션 구성",
        visual: "섹션명",
        caption: "들어갈 문구",
        voice: "이미지 프롬프트 / 디자인 방향",
        videoPrompt: "상세페이지 이미지 프롬프트",
        apiJson: "원본 데이터",
        copyAll: "전체 결과 복사",
        copyCapCut: "상세페이지 문구 복사",
        jsonDownload: "원본 데이터 저장",
        mp3Download: "음성 파일 저장",
        srtDownload: "문구 파일 저장",
        voiceHint: "상세페이지 콘셉트와 서브 카피 요약",
        captionHint: "고객 고민 문구와 핵심 판매 포인트 정리",
      }
    : {
        productSummary: "제품 분석 요약",
        hook: "오프닝 훅",
        voiceScript: "음성 대본",
        captionScript: "캡컷용 자막",
        timeline: "장면 타임라인",
        visual: "연출",
        caption: "자막",
        voice: "보이스",
        videoPrompt: "영상 생성 프롬프트",
        apiJson: "원본 데이터",
        copyAll: "전체 결과 복사",
        copyCapCut: "캡컷용 자료 복사",
        jsonDownload: "원본 데이터 저장",
        mp3Download: "음성 파일 저장",
        srtDownload: "자막 파일 저장",
        voiceHint: "MP3로 읽히는 문장 · SRT 자막과 동일",
        captionHint: "화면 강조용 짧은 문구",
      };

  const tabItems: { id: ResultTab; label: string }[] = [
    { id: "summary", label: "요약" },
    { id: "voice", label: "대본" },
    { id: "caption", label: "자막" },
    { id: "timeline", label: "콘티" },
    { id: "prompt", label: "프롬프트" },
    { id: "detail", label: "상세페이지" },
    { id: "json", label: "JSON" },
  ];

  const detailPageText = isDetailPage
    ? formatApiPayloadForCopy(data.apiPayload)
    : "상세페이지 생성 모드에서 사용할 수 있습니다.";

  return (
    <article className="results">
      <header className="results__head">
        <div>
          <p className="results__eyebrow">생성 완료</p>
          <p className="results__meta">{metaLine}</p>
        </div>

        <span className="chip chip--ok"> 생성완료 </span>
      </header>

      <div className="results__actions">
        <button type="button" className="btn-secondary" onClick={onCopyAll}>
          {labels.copyAll}
        </button>

        <button type="button" className="btn-secondary" onClick={onCopyCapCut}>
          {labels.copyCapCut}
        </button>

        {isDetailPage ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={onCopyDetailHtml}
          >
            상세페이지 코드 복사
          </button>
        ) : null}

        {isDetailPage ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={onPreviewDetailHtml}
          >
            상세페이지 크게 보기
          </button>
        ) : null}

        {isDetailPage ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={onDownloadDetailHtml}
          >
            상세페이지 파일 저장
          </button>
        ) : null}

        <button type="button" className="btn-secondary" onClick={onDownloadJson}>
          {labels.jsonDownload}
        </button>

        <button type="button" className="btn-secondary" onClick={onDownloadZip}>
          ZIP 전체 다운로드
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={onDownloadVoiceMp3}
          disabled={isTtsLoading}
        >
          {isTtsLoading ? "음성 생성 중..." : labels.mp3Download}
        </button>

        <button
          type="button"
          className="btn-secondary"
          onClick={onDownloadSrt}
          title={
            isDetailPage
              ? "상세페이지 문구를 TXT 파일로 저장합니다."
              : "음성 대본과 동일한 문장으로 SRT 자막 파일을 저장합니다."
          }
        >
          {labels.srtDownload}
        </button>
      </div>

      <div
        className="result-tabs"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.5rem",
          margin: "1rem 0",
        }}
      >
        {tabItems.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              className="btn-secondary"
              onClick={() => setActiveTab(tab.id)}
              style={{
                fontWeight: isActive ? 800 : 500,
                borderColor: isActive ? "#111827" : undefined,
                background: isActive ? "#111827" : undefined,
                color: isActive ? "#ffffff" : undefined,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "summary" ? (
        <>
          <ResultCard
            title={labels.productSummary}
            copyText={data.productSummary}
            onCopy={onCopy}
          >
            <p className="result-text">{data.productSummary}</p>
          </ResultCard>

          <ResultCard title={labels.hook} copyText={data.hook} onCopy={onCopy}>
            <p className="result-text result-text--hook">{data.hook}</p>
          </ResultCard>
      {data.hookOptions?.length ? (
  <ResultCard
    title="🔥 추천 후킹 5개"
    copyText={data.hookOptions.join("\n")}
    onCopy={onCopy}
  >
    <div className="timeline">
      {data.hookOptions.map((hook, index) => (
        <div key={index} className="timeline__item">
          <div className="timeline__body">
            <p className="result-text">
              <strong>{index + 1}.</strong> {hook}
            </p>
          </div>
        </div>
      ))}
    </div>
  </ResultCard>
) : null}    
        </>
      ) : null}

      {activeTab === "voice" ? (
        <ResultCard
          title={labels.voiceScript}
          copyText={data.voiceScript}
          onCopy={onCopy}
        >
          <p className="result-card__hint">{labels.voiceHint}</p>
          <p className="result-text result-text--script">{data.voiceScript}</p>
        </ResultCard>
      ) : null}

      {activeTab === "caption" ? (
        <ResultCard
          title={labels.captionScript}
          copyText={data.captionScript}
          onCopy={onCopy}
        >
          <p className="result-card__hint">{labels.captionHint}</p>
          <p className="result-text result-text--script">
            {data.captionScript}
          </p>
        </ResultCard>
      ) : null}

      {activeTab === "timeline" ? (
        <ResultCard
          title={labels.timeline}
          copyText={formatSceneTimelineForCopy(data.sceneTimeline)}
          onCopy={onCopy}
        >
          <ol className="timeline">
            {data.sceneTimeline.map((s, i) => (
              <li key={i} className="timeline__item">
                <div className="timeline__time">{s.time}</div>

                <div className="timeline__body">
                  <p className="timeline__row">
                    <span className="k">{labels.visual}</span>
                    <span>{s.visual}</span>
                  </p>

                  <p className="timeline__row">
                    <span className="k">{labels.caption}</span>
                    <span>{s.caption}</span>
                  </p>

                  <p className="timeline__row">
                    <span className="k">{labels.voice}</span>
                    <span>{s.voice}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </ResultCard>
      ) : null}

      {activeTab === "prompt" ? (
        <ResultCard
          title={labels.videoPrompt}
          copyText={data.videoPrompt}
          onCopy={onCopy}
        >
          <p className="result-text result-text--dim">{data.videoPrompt}</p>
        </ResultCard>
      ) : null}

      {activeTab === "detail" ? (
        <ResultCard
          title="상세페이지 결과"
          copyText={detailPageText}
          onCopy={onCopy}
        >
          {isDetailPage ? (
            <>
              <p className="result-card__hint">
                상세페이지 코드는 상단의 “상세페이지 코드 복사”, “상세페이지 크게
                보기”, “상세페이지 파일 저장” 버튼으로 사용할 수 있습니다.
              </p>

              <pre className="json-pre">
                {JSON.stringify(data.apiPayload, null, 2)}
              </pre>
            </>
          ) : (
            <p className="result-text">
              상세페이지 생성 모드에서 사용할 수 있습니다.
            </p>
          )}
        </ResultCard>
      ) : null}

      {activeTab === "json" ? (
        <ResultCard
          title={labels.apiJson}
          copyText={formatApiPayloadForCopy(data.apiPayload)}
          onCopy={onCopy}
        >
          <pre className="json-pre">
            {JSON.stringify(data.apiPayload, null, 2)}
          </pre>
        </ResultCard>
      ) : null}
    </article>
  );
}
