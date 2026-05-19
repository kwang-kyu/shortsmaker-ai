import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { OptionChips } from "./components/OptionChips";
import { ResultsPanel } from "./components/ResultsPanel";
import { Toast } from "./components/Toast";
import { analyzeProductWithVision } from "./services/openai";
import { synthesizeSpeechMp3 } from "./services/openaiTts";
import type {
  PlatformId,
  ShortsAdExport,
  ShortsDuration,
  ToneId,
} from "./types";
import {
  DURATION_OPTIONS,
  PLATFORM_OPTIONS,
  TONE_OPTIONS,
} from "./types";
import { copyText } from "./utils/clipboard";
import { buildSrtContent } from "./utils/buildSrt";
import { fileToDataUrl } from "./utils/imageToBase64";
import { downloadResultZip } from "./utils/downloadZip";
import {
  buildCapCutCopyText,
  buildDetailPageHtml,
  buildFullCopyText,
  downloadDetailPageHtmlFile,
  downloadJsonFile,
} from "./utils/resultText";

const TOAST_MS = 2200;

const ACCESS_CODES: Record<
  string,
  {
    name: string;
    count: number;
  }
> = {
  "TRIAL-5": {
    name: "체험 이용권",
    count: 5,
  },
  "BASIC-30": {
    name: "베이직 이용권",
    count: 30,
  },
  "PREMIUM-100": {
    name: "프리미엄 이용권",
    count: 100,
  },
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  URL.revokeObjectURL(url);
}

const GENERATION_TYPE_OPTIONS: {
  value: "shorts" | "detail" | "both";
  label: string;
  description: string;
}[] = [
  {
    value: "shorts",
    label: "쇼츠 광고 생성",
    description: "쇼츠 대본·자막·장면 구성 생성",
  },
  {
    value: "detail",
    label: "상세페이지 생성",
    description: "상세페이지 문구와 섹션 구성 생성",
  },
  {
    value: "both",
    label: "쇼츠 + 상세페이지",
    description: "쇼츠 광고와 상세페이지를 함께 생성",
  },
];

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<ShortsDuration>(15);
  const [platform, setPlatform] = useState<PlatformId>("shorts");
  const [tone, setTone] = useState<ToneId>("hooking");
  const [generationType, setGenerationType] = useState<
    "shorts" | "detail" | "both"
  >("shorts");

  const [result, setResult] = useState<ShortsAdExport | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("복사 완료");

  const [remainingCount, setRemainingCount] = useState(0);
  const [accessCode, setAccessCode] = useState("");
  const [passName, setPassName] = useState("");
  const [accessMessage, setAccessMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearOutput = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  const showToast = useCallback((message = "복사 완료") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setToastMessage(message);
    setToastVisible(true);

    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, TOAST_MS);
  }, []);

  useEffect(() => {
    const savedCount = localStorage.getItem("shorts-ai-remaining-count");
    const savedPassName = localStorage.getItem("shorts-ai-pass-name");

    if (savedCount) {
      setRemainingCount(Number(savedCount));
    }

    if (savedPassName) {
      setPassName(savedPassName);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("shorts-ai-remaining-count", String(remainingCount));
  }, [remainingCount]);

  useEffect(() => {
    localStorage.setItem("shorts-ai-pass-name", passName);
  }, [passName]);

  const handleApplyAccessCode = useCallback(() => {
    const normalizedCode = accessCode.trim().toUpperCase();
    const pass = ACCESS_CODES[normalizedCode];

    if (!normalizedCode) {
      setAccessMessage("이용권 코드를 입력해 주세요.");
      return;
    }

    if (!pass) {
      setAccessMessage(
        "이용권 코드를 확인할 수 없습니다. 구매처 또는 관리자에게 문의해 주세요.",
      );
      return;
    }

    setPassName(pass.name);
    setRemainingCount(pass.count);
    setAccessMessage(
      `${pass.name}이 정상 적용되었습니다. 남은 생성 횟수는 ${pass.count}회입니다.`,
    );
    showToast("이용권이 적용되었습니다");
  }, [accessCode, showToast]);

  const handleResetAccessCode = useCallback(() => {
    setAccessCode("");
    setPassName("");
    setRemainingCount(0);
    setAccessMessage("다른 이용권 코드를 입력할 수 있습니다.");
    localStorage.removeItem("shorts-ai-remaining-count");
    localStorage.removeItem("shorts-ai-pass-name");
    showToast("이용권 정보가 초기화되었습니다");
  }, [showToast]);

  const canGenerate = Boolean(file) && !isLoading && remainingCount > 0;

  const handleCopy = useCallback(
    async (text: string, successMessage = "복사 완료") => {
      try {
        await copyText(text);
        showToast(successMessage);
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "복사에 실패했습니다.";
        setError(message);
      }
    },
    [showToast],
  );

  const onFiles = useCallback(
    (list: FileList | null) => {
      const next = list?.[0];

      if (!next || !next.type.startsWith("image/")) return;

      setFile(next);
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(next);
      });

      clearOutput();
    },
    [clearOutput],
  );

  const onGenerate = useCallback(async () => {
    if (!file || isLoading || remainingCount <= 0) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    const options = { duration, platform, tone, generationType };

    try {
      const imageDataUrl = await fileToDataUrl(file);
const data = await analyzeProductWithVision(imageDataUrl, options);
      const completeAudio = new Audio(
        "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
      );

      completeAudio.volume = 0.4;
      void completeAudio.play();

      setResult({
        ...data,
        selectedDuration: duration,
        selectedPlatform: platform,
        selectedTone: tone,
      });

      setRemainingCount((prev) => Math.max(prev - 1, 0));
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [
    file,
    isLoading,
    remainingCount,
    duration,
    platform,
    tone,
    generationType,
  ]);

  const handleCopyAll = useCallback(() => {
    if (!result) return;
    void handleCopy(buildFullCopyText(result), "전체 결과 복사 완료");
  }, [result, handleCopy]);

  const handleCopyCapCut = useCallback(() => {
    if (!result) return;
    void handleCopy(buildCapCutCopyText(result), "문구 복사 완료");
  }, [result, handleCopy]);

  const handleCopyDetailHtml = useCallback(async () => {
    if (!result) {
      setError("먼저 상세페이지 기획안을 생성해 주세요.");
      return;
    }

    try {
      const html = buildDetailPageHtml(result);

      if (!html.trim()) {
        setError("복사할 상세페이지 코드가 없습니다.");
        return;
      }

      await handleCopy(html, "상세페이지 코드 복사 완료");
      setError(null);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "상세페이지 코드 복사에 실패했습니다.";
      setError(message);
    }
  }, [result, handleCopy]);

  const handlePreviewDetailHtml = useCallback(() => {
    if (!result) {
      setError("먼저 상세페이지 기획안을 생성해 주세요.");
      return;
    }

    try {
      const html = buildDetailPageHtml(result);
      const fallbackText = JSON.stringify(result.apiPayload, null, 2);
      const previewWindow = window.open("", "_blank", "width=1100,height=950");

      if (!previewWindow) {
        setError(
          "팝업이 차단되었습니다. 브라우저에서 팝업 허용 후 다시 시도해 주세요.",
        );
        return;
      }

      previewWindow.document.open();
      previewWindow.document.write(`
        <!doctype html>
        <html lang="ko">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>쇼츠메이커 AI 상세페이지 미리보기</title>
            <style>
              * {
                box-sizing: border-box;
              }

              body {
                margin: 0;
                background: #f3f4f6;
                color: #111827;
                font-family: Arial, 'Noto Sans KR', sans-serif;
              }

              .preview-shell {
                width: 100%;
                min-height: 100vh;
                padding: 36px 16px 48px;
              }

              .preview-header {
                max-width: 860px;
                margin: 0 auto 20px;
                padding: 24px 26px;
                background: linear-gradient(135deg, #111827, #312e81);
                color: #ffffff;
                border-radius: 18px;
                box-shadow: 0 16px 40px rgba(15, 23, 42, 0.18);
              }

              .preview-badge {
                display: inline-flex;
                align-items: center;
                margin-bottom: 10px;
                padding: 6px 10px;
                border: 1px solid rgba(255, 255, 255, 0.22);
                border-radius: 999px;
                font-size: 12px;
                color: #c7d2fe;
                background: rgba(255, 255, 255, 0.08);
              }

              .preview-title {
                margin: 0 0 8px;
                font-size: 28px;
                line-height: 1.25;
                letter-spacing: -0.04em;
              }

              .preview-desc {
                margin: 0;
                font-size: 15px;
                line-height: 1.7;
                color: #e5e7eb;
              }

              .preview-card {
                max-width: 860px;
                margin: 0 auto;
                padding: 28px;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 20px;
                box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
                overflow: hidden;
              }

              .preview-content {
                width: 100%;
              }

              .preview-content img {
                max-width: 100%;
                height: auto;
                display: block;
                margin: 0 auto;
                border-radius: 12px;
              }

              .preview-content h1,
              .preview-content h2,
              .preview-content h3 {
                letter-spacing: -0.04em;
              }

              .preview-content p {
                line-height: 1.75;
              }

              .fallback-box {
                margin: 0;
                padding: 18px;
                background: #111827;
                color: #d1d5db;
                border-radius: 14px;
                white-space: pre-wrap;
                overflow-x: auto;
                font-size: 13px;
                line-height: 1.6;
              }

              .preview-footer {
                max-width: 860px;
                margin: 18px auto 0;
                padding: 18px 22px;
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 16px;
                color: #4b5563;
                font-size: 14px;
                line-height: 1.7;
              }

              .preview-footer strong {
                color: #111827;
              }

              @media (max-width: 640px) {
                .preview-shell {
                  padding: 20px 12px 36px;
                }

                .preview-header {
                  padding: 20px;
                }

                .preview-title {
                  font-size: 23px;
                }

                .preview-card {
                  padding: 18px;
                  border-radius: 16px;
                }
              }
            </style>
          </head>
          <body>
            <main class="preview-shell">
              <section class="preview-header">
                <div class="preview-badge">상세페이지 미리보기</div>
                <h1 class="preview-title">쇼츠메이커 AI 상세페이지 미리보기</h1>
                <p class="preview-desc">
                  이 화면은 상품 상세페이지 초안 미리보기입니다.
                  문구 흐름, 섹션 구성, 상품 강조 포인트를 확인한 뒤 실제 판매 채널에 맞게 수정해 사용할 수 있습니다.
                </p>
              </section>

              <section class="preview-card">
                <div class="preview-content">
                  ${
                    html.trim()
                      ? html
                      : `<pre class="fallback-box">${fallbackText}</pre>`
                  }
                </div>
              </section>

              <section class="preview-footer">
                <strong>활용 안내</strong><br />
                스마트스토어, 블로그, 랜딩페이지, 인포크링크, 노션 판매 페이지 등에 맞게
                문구와 이미지를 수정해 사용할 수 있습니다. 실제 등록 전에는 가격, 배송, 고지 문구,
                법적 표시사항을 반드시 확인하세요.
              </section>
            </main>
          </body>
        </html>
      `);
      previewWindow.document.close();

      setError(null);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "상세페이지 미리보기에 실패했습니다.";
      setError(message);
    }
  }, [result]);

  const handleDownloadDetailHtml = useCallback(() => {
    if (!result) {
      setError("먼저 상세페이지 기획안을 생성해 주세요.");
      return;
    }

    try {
      downloadDetailPageHtmlFile(result, "detail-page-draft.html");
      showToast("상세페이지 파일 저장 완료");
      setError(null);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "상세페이지 파일 저장에 실패했습니다.";
      setError(message);
    }
  }, [result, showToast]);

  const handleDownloadJson = useCallback(() => {
    if (!result) {
      setError("먼저 결과를 생성해 주세요.");
      return;
    }

    try {
      const filename =
        result.apiPayload?.type === "detail-page"
          ? "detail-page-plan.json"
          : "shorts-ad-plan.json";

      downloadJsonFile(result, filename);
      showToast("원본 데이터 저장 완료");
      setError(null);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "원본 데이터 저장에 실패했습니다.";
      setError(message);
    }
  }, [result, showToast]);

  const handleDownloadZip = useCallback(async () => {
    if (!result) {
      setError("먼저 결과를 생성해 주세요.");
      return;
    }

    try {
      await downloadResultZip(result);
      showToast("ZIP 전체 다운로드 완료");
      setError(null);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "ZIP 파일 저장에 실패했습니다.";
      setError(message);
    }
  }, [result, showToast]);

  const handleDownloadVoiceMp3 = useCallback(async () => {
    const script = result?.voiceScript?.trim();

    if (!script) {
      setError("먼저 쇼츠 구성을 생성해 주세요.");
      return;
    }

    setIsTtsLoading(true);
    setError(null);

    try {
      const blob = await synthesizeSpeechMp3(script, duration);
      downloadBlob(blob, "shorts-ad-voice.mp3");
      showToast("음성 파일 저장 완료");
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "음성 파일 생성에 실패했습니다.";
      setError(message);
    } finally {
      setIsTtsLoading(false);
    }
  }, [result, duration, showToast]);

  const handleDownloadSrt = useCallback(() => {
    if (!result) {
      setError("먼저 결과를 생성해 주세요.");
      return;
    }

    try {
      const srt = buildSrtContent(result);
      const blob = new Blob([srt], {
        type: "application/x-subrip;charset=utf-8",
      });

      const filename =
        result.apiPayload?.type === "detail-page"
          ? "detail-page-copy.txt"
          : "shorts-ad-subtitles.srt";

      downloadBlob(blob, filename);
      showToast(
        result.apiPayload?.type === "detail-page"
          ? "문구 파일 저장 완료"
          : "자막 파일 저장 완료",
      );
      setError(null);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "파일 저장에 실패했습니다.";
      setError(message);
    }
  }, [result, showToast]);

  const durationChips = DURATION_OPTIONS.map((d) => ({
    value: d.value,
    label: d.label,
  }));

  const platformChips = PLATFORM_OPTIONS.map((p) => ({
    value: p.id,
    label: p.title,
    description: p.description,
  }));

  const toneChips = TONE_OPTIONS.map((t) => ({
    value: t.id,
    label: t.title,
    description: t.description,
  }));

  return (
    <div className="shell">
      <header className="hero">
        <div className="hero__badge">AI 숏폼 광고기획 자동화툴</div>
        <h1 className="hero__title">
          쇼츠메이커 <span className="hero__ai">AI</span> 체험판
        </h1>
        <p className="hero__lead">
          제품 사진 1장으로 쇼츠 광고 대본, 캡컷용 자막, 장면별 콘티,
          영상 생성 프롬프트, 상세페이지 초안까지 자동 생성합니다.
          <br />
          구매 후 발급받은 이용권 코드를 입력하면 정해진 횟수만큼 사용할 수
          있습니다.
        </p>
      </header>

      <section className="guide-card" aria-label="사용 안내">
        <div className="guide-card__head">
          <span className="guide-card__badge">고객 시연용 데모</span>
          <h2 className="guide-card__title">
            이용권 코드를 입력한 뒤 제품 사진을 올려보세요
          </h2>
        </div>

        <ol className="guide-card__list">
          <li>발급받은 이용권 코드를 입력하고 이용권 확인을 누르세요.</li>
          <li>남은 생성 횟수가 표시되면 제품 사진을 업로드하세요.</li>
          <li>
            쇼츠 광고, 상세페이지, 쇼츠+상세페이지 중 필요한 결과물을
            선택하세요.
          </li>
          <li>영상 길이, 업로드 플랫폼, 광고 톤을 선택하세요.</li>
          <li>
            생성 버튼을 누르면 대본, 자막, 콘티, 프롬프트, 상세페이지 초안이
            만들어집니다.
          </li>
          <li>완성된 결과는 복사하거나 ZIP 파일로 내려받아 활용하세요.</li>
        </ol>

        <p className="guide-card__note">
          내부 테스트용 코드: TRIAL-5 / BASIC-30 / PREMIUM-100
          <br />
          실제 판매용에서는 고객별로 개별 이용권 코드를 발급하는 방식으로
          확장할 수 있습니다.
        </p>

        <a
          className="guide-card__manual"
          href="/shorts-ai-manual.pdf"
          target="_blank"
          rel="noreferrer"
        >
          📘 사용설명서 보고 따라하기
        </a>

        <a className="guide-card__sample" href="#result-heading">
          👀 생성 결과 위치 보기
        </a>
      </section>

      <main className="grid">
        <section className="panel" aria-labelledby="input-heading">
          <h2 id="input-heading" className="panel__h">
            입력
          </h2>

          <div
            className={`dropzone${isDragging ? " dropzone--drag" : ""}${
              file ? " dropzone--has-file" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              onFiles(e.dataTransfer.files);
            }}
          >
            <input
              ref={fileInputRef}
              id="file"
              className="dropzone__input"
              type="file"
              accept="image/*"
              onChange={(e) => onFiles(e.target.files)}
            />

            {!file ? (
              <label htmlFor="file" className="dropzone__label">
                <span className="dropzone__icon" aria-hidden>
                  +
                </span>
                <span className="dropzone__text">
                  이미지를 끌어다 놓거나 클릭해서 선택
                </span>
                <span className="dropzone__hint">JPG · PNG · WebP 등</span>
              </label>
            ) : (
              <div className="preview">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="업로드한 제품 미리보기"
                    className="preview__img"
                  />
                ) : null}

                <div className="preview__meta">
                  <span className="preview__name">{file.name}</span>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    다른 이미지로 바꾸기
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="options-block">
            <div
              style={{
                marginTop: "4px",
                marginBottom: "16px",
                padding: "16px",
                border: "1px solid #facc15",
                borderRadius: "12px",
                background: "#2f2600",
                color: "#ffffff",
                lineHeight: 1.5,
              }}
            >
              <div
                style={{
                  marginBottom: "10px",
                  fontWeight: 900,
                  fontSize: "15px",
                }}
              >
                이용권 코드 입력
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    setAccessMessage("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleApplyAccessCode();
                    }
                  }}
                  placeholder="예: TRIAL-5"
                  style={{
                    flex: 1,
                    minWidth: 0,
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #6b7280",
                    background: "#111827",
                    color: "#ffffff",
                    fontWeight: 700,
                  }}
                />

                <button
                  type="button"
                  onClick={handleApplyAccessCode}
                  style={{
                    padding: "10px 14px",
                    border: "0",
                    borderRadius: "8px",
                    background: "#facc15",
                    color: "#111827",
                    fontWeight: 900,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  이용권 확인
                </button>
              </div>

              <div
                style={{
                  fontWeight: 800,
                  color: "#fde68a",
                }}
              >
                현재 이용권 : {passName || "미등록"}
              </div>

              <div
                style={{
                  marginTop: "4px",
                  fontWeight: 900,
                  fontSize: "16px",
                }}
              >
                남은 생성 횟수 : {remainingCount}회
              </div>

              {accessMessage ? (
                <div
                  style={{
                    marginTop: "8px",
                    color: "#fde68a",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  {accessMessage}
                </div>
              ) : null}

              {remainingCount === 0 ? (
                <div
                  style={{
                    marginTop: "8px",
                    color: "#fca5a5",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  이용권 코드를 적용하면 생성 기능을 사용할 수 있습니다.
                </div>
              ) : null}

              {passName || remainingCount > 0 ? (
                <button
                  type="button"
                  onClick={handleResetAccessCode}
                  style={{
                    width: "100%",
                    marginTop: "12px",
                    padding: "10px 12px",
                    border: "1px solid #fca5a5",
                    borderRadius: "8px",
                    background: "transparent",
                    color: "#fecaca",
                    fontWeight: 800,
                    cursor: "pointer",
                  }}
                >
                  다른 이용권 입력하기
                </button>
              ) : null}
            </div>

            <OptionChips
              label="생성 유형"
              options={GENERATION_TYPE_OPTIONS}
              value={generationType}
              onChange={(v) => {
                setGenerationType(v as "shorts" | "detail" | "both");
                clearOutput();
              }}
              columns={3}
            />

            <div
              style={{
                marginTop: "10px",
                marginBottom: "16px",
                padding: "10px",
                border: "1px solid #7c5cff",
                borderRadius: "8px",
                color: "#ffffff",
                background: "#2b2350",
                fontWeight: 700,
              }}
            >
              선택한 생성 유형:{" "}
              {generationType === "shorts"
                ? "쇼츠 광고"
                : generationType === "detail"
                  ? "상세페이지"
                  : "쇼츠 + 상세페이지"}
            </div>

            <OptionChips
              label="쇼츠 길이"
              options={durationChips}
              value={duration}
              onChange={(v) => {
                setDuration(v);
                clearOutput();
              }}
              columns={3}
            />

            <OptionChips
              label="플랫폼"
              options={platformChips}
              value={platform}
              onChange={(v) => {
                setPlatform(v);
                clearOutput();
              }}
              columns={4}
            />

            <OptionChips
              label="톤"
              options={toneChips}
              value={tone}
              onChange={(v) => {
                setTone(v);
                clearOutput();
              }}
              columns={2}
            />
          </div>

          <button
            type="button"
            className="btn-primary"
            disabled={!canGenerate}
            onClick={() => void onGenerate()}
          >
            {remainingCount === 0
              ? "이용권 적용 후 생성할 수 있습니다"
              : isLoading
                ? "AI가 광고 기획안을 생성 중입니다…"
                : generationType === "detail"
                  ? "상세페이지 기획안 생성"
                  : generationType === "both"
                    ? `${duration}초 쇼츠 + 상세페이지 동시 생성`
                    : `${duration}초 쇼츠 구성 생성`}
          </button>

          {!file ? (
            <p className="hint">먼저 제품 이미지를 업로드해 주세요.</p>
          ) : remainingCount === 0 ? (
            <p className="hint">
              이용권을 적용하면 생성 버튼을 사용할 수 있습니다.
            </p>
          ) : isLoading ? (
            <p className="hint">AI가 제품 이미지를 분석하고 있습니다…</p>
          ) : null}
        </section>

        <section
          className="panel panel--result"
          aria-labelledby="result-heading"
        >
          <h2 id="result-heading" className="panel__h">
            결과
          </h2>

          {error ? (
            <div className="alert" role="alert">
              <p className="alert__title">알림</p>
              <p className="alert__text">{error}</p>
            </div>
          ) : null}

          {isLoading ? (
            <div className="ai-loading" role="status">
              <div className="ai-loading__spinner" aria-hidden="true" />
              <p className="ai-loading__title">
                AI가 광고 기획안을 만들고 있습니다
              </p>
              <p className="ai-loading__text">
                제품 이미지를 분석하고, 대본·자막·콘티·상세페이지 초안을
                구성하는 중입니다.
              </p>
            </div>
          ) : !result && !error ? (
            <div className="empty" role="status">
              <p className="empty__title">아직 생성 결과가 없습니다</p>
              <p className="empty__text">
                이용권 코드 입력 → 제품 이미지 업로드 → 옵션 선택 후 생성
                버튼을 누르면 결과가 표시됩니다.
              </p>
            </div>
          ) : null}

          {result ? (
            <ResultsPanel
              data={result}
              onCopy={(text) => void handleCopy(text)}
              onCopyAll={handleCopyAll}
              onCopyCapCut={handleCopyCapCut}
              onCopyDetailHtml={handleCopyDetailHtml}
              onPreviewDetailHtml={handlePreviewDetailHtml}
              onDownloadDetailHtml={handleDownloadDetailHtml}
              onDownloadJson={handleDownloadJson}
              onDownloadZip={handleDownloadZip}
              onDownloadVoiceMp3={() => void handleDownloadVoiceMp3()}
              onDownloadSrt={handleDownloadSrt}
              isTtsLoading={isTtsLoading}
            />
          ) : null}
        </section>
      </main>

      <footer className="foot">
        쇼츠메이커 AI 체험판
        <span className="foot__security">
          제품 홍보 콘텐츠 제작을 위한 AI 숏폼 광고기획 도구입니다.
        </span>
      </footer>

      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
fix import name
