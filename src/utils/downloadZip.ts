import JSZip from "jszip";
import type { ShortsAdExport } from "../types";
import { buildSrtContent } from "./buildSrt";
import {
  buildCapCutCopyText,
  buildDetailPageHtml,
  buildFullCopyText,
  formatApiPayloadForCopy,
} from "./resultText";

function downloadZipBlob(blob: Blob, filename: string) {
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

export async function downloadResultZip(data: ShortsAdExport) {
  const zip = new JSZip();

  const isDetailPage = data.apiPayload?.type === "detail-page";

  const fullText = buildFullCopyText(data);
  const capcutText = buildCapCutCopyText(data);
  const srtText = buildSrtContent(data);
  const detailHtml = buildDetailPageHtml(data);
  const jsonText = formatApiPayloadForCopy(data.apiPayload);

  const packageType = isDetailPage ? "상세페이지 기획안" : "쇼츠 광고 기획안";

  const guideText = `
쇼츠광고 AI 메이커 결과물 사용 안내

이 ZIP 파일은 ${packageType} 제작에 필요한 결과물을 한 번에 내려받은 파일입니다.
각 파일은 아래 용도에 맞게 사용하시면 됩니다.

1. 01_ad-plan-summary.txt
- AI가 생성한 전체 광고 기획안입니다.
- 제품 분석, 후킹 문구, 대본, 자막, 콘티, 프롬프트 내용을 한 번에 확인할 수 있습니다.

2. 02_shorts-subtitles.srt
- 쇼츠 영상 제작에 사용할 수 있는 자막 파일입니다.
- 캡컷, 프리미어, 기타 영상 편집 프로그램에서 활용할 수 있습니다.

3. 03_detail-page-draft.html
- 상세페이지 초안 HTML 파일입니다.
- 스마트스토어, 블로그, 랜딩페이지, 노션 페이지 등에 맞게 문구와 이미지를 수정해 사용할 수 있습니다.

4. 04_ad-plan-data.json
- 생성 결과의 원본 데이터입니다.
- 백업용, 재가공용, 개발자 전달용으로 사용할 수 있습니다.

5. 05_caption-copy.txt
- 영상 자막, 화면 문구, 상세페이지 문구 등 바로 복사해 사용할 수 있는 문구 파일입니다.

6. 06_readme-guide.txt
- ZIP 파일 구성과 사용 방법을 정리한 안내 파일입니다.

활용 전 확인사항
- 실제 판매 페이지 등록 전 가격, 배송, 교환·반품, 법적 고지 문구는 반드시 직접 확인하세요.
- 건강식품, 의료기기, 기능성 제품 등은 광고 심의 및 표시광고 기준을 별도로 확인해야 합니다.
- AI가 생성한 문구는 초안이므로 최종 검수 후 사용하세요.

생성 유형
- ${packageType}

쇼츠광고 AI 메이커
제품 홍보 콘텐츠 제작을 위한 AI 광고 기획 도구
`;

  zip.file("01_ad-plan-summary.txt", fullText);
  zip.file("02_shorts-subtitles.srt", srtText);
  zip.file(
    "03_detail-page-draft.html",
    detailHtml || "<p>상세페이지 HTML 결과가 없습니다.</p>",
  );
  zip.file("04_ad-plan-data.json", jsonText);
  zip.file("05_caption-copy.txt", capcutText);
  zip.file("06_readme-guide.txt", guideText.trim());

  const blob = await zip.generateAsync({ type: "blob" });

  downloadZipBlob(blob, "shorts-ad-ai-package.zip");
}