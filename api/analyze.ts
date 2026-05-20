import type { VercelRequest, VercelResponse } from "@vercel/node";

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "POST 요청만 사용할 수 있습니다.",
    });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "서버에 OPENAI_API_KEY가 설정되어 있지 않습니다.",
      });
    }

    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

    const imageDataUrl = body.imageDataUrl || body.image || body.imageUrl;
    const options = body.options || {};

    if (!imageDataUrl) {
      return res.status(400).json({
        error: "이미지 데이터가 없습니다.",
      });
    }

    const duration = options?.duration ?? 15;
    const platform = options?.platform ?? "shorts";
    const tone = options?.tone ?? "hooking";
    const generationType = options?.generationType ?? "shorts";

    const prompt = `
너는 숏폼 광고기획 전문가이자 상세페이지 카피라이터다.

제품 이미지를 분석해서 아래 JSON 형식으로만 반환해라.
JSON 외 설명 문장, 마크다운, 코드블록은 절대 넣지 마라.

조건:
- 영상 길이: ${duration}초
- 플랫폼: ${platform}
- 톤: ${tone}
- 생성 유형: ${generationType}
- 한국어로 작성
- 과장 광고, 의학적 효능, 허위 표현은 피한다
- 실제 판매용 광고처럼 자연스럽고 설득력 있게 작성
- 고객이 겪는 불편 → 제품 사용 상황 → 장점 → 구매 욕구 순서로 구성
- 짧고 약하게 쓰지 말고 구체적으로 작성
- 음성 대본은 실제 사람이 읽는 말투로 4~6문장 작성
- 캡컷 자막은 짧고 강하게 줄바꿈 형태로 작성
- 콘티는 장면마다 영상 연출이 떠오르도록 구체적으로 작성
- 상세페이지 문구는 제품명 없이도 판매페이지에 바로 쓸 수 있게 작성
- 영상 생성 프롬프트는 이미지/영상 생성 AI에 바로 넣을 수 있게 구체적으로 작성

반환 JSON 형식:
{
  "productSummary": "제품의 종류, 핵심 특징, 예상 사용 상황, 구매 포인트를 3~5문장으로 구체적으로 분석",
  "hook": "3초 안에 시선을 끌 수 있는 강한 광고 후킹 문구 1개",
  "hookOptions": [
    "후킹 문구 1",
    "후킹 문구 2",
    "후킹 문구 3",
    "후킹 문구 4",
    "후킹 문구 5"
  ],
  "voiceScript": "실제 쇼츠 광고처럼 자연스럽고 생생한 ${duration}초 음성 대본",
  "captionScript": "캡컷에 바로 넣을 수 있는 짧은 화면 자막. 줄바꿈 포함",
  "sceneTimeline": [
    {
      "time": "0-3초",
      "visual": "첫 장면 연출. 제품이 돋보이도록 구체적으로 설명",
      "caption": "짧고 강한 화면 자막",
      "voice": "해당 장면에 맞는 보이스 문장"
    },
    {
      "time": "3-6초",
      "visual": "사용 상황 또는 문제 상황을 보여주는 장면",
      "caption": "짧고 강한 화면 자막",
      "voice": "해당 장면에 맞는 보이스 문장"
    },
    {
      "time": "6-10초",
      "visual": "제품 장점과 사용 편의성을 보여주는 장면",
      "caption": "짧고 강한 화면 자막",
      "voice": "해당 장면에 맞는 보이스 문장"
    },
    {
      "time": "10-15초",
      "visual": "구매 욕구를 자극하는 마무리 장면",
      "caption": "짧고 강한 화면 자막",
      "voice": "해당 장면에 맞는 보이스 문장"
    }
  ],
  "videoPrompt": "제품 중심의 숏폼 광고 영상 생성 프롬프트. 배경, 조명, 카메라 움직임, 제품 클로즈업, 사용 장면, 분위기를 포함",
  "detailPageCopy": "상세페이지에 바로 넣을 수 있는 판매 문구. 문제 제기, 제품 장점, 사용 상황, 추천 대상, 구매 유도 문구 포함",
  "thumbnailCopy": "썸네일에 넣기 좋은 짧고 강한 문구 3개",
  "snsPostCopy": "인스타그램이나 쇼츠 설명란에 넣을 수 있는 짧은 홍보 문구",
  "hashtags": ["해시태그1", "해시태그2", "해시태그3", "해시태그4", "해시태그5"],
  "apiPayload": {
    "type": "shorts-ad",
    "duration": ${duration},
    "platform": "${platform}",
    "tone": "${tone}",
    "generationType": "${generationType}"
  }
}
`;

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: prompt,
              },
              {
                type: "input_image",
                image_url: imageDataUrl,
              },
            ],
          },
        ],
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
    });

    const responseData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error("OPENAI_ERROR:", responseData);

      return res.status(openaiResponse.status).json({
        error: responseData?.error?.message || "OpenAI API 호출 실패",
      });
    }

    const outputText =
      responseData.output_text ||
      responseData.output?.[0]?.content?.[0]?.text ||
      "";

    if (!outputText) {
      console.error("EMPTY_AI_RESPONSE:", responseData);

      return res.status(500).json({
        error: "AI 응답이 비어 있습니다.",
      });
    }

    const cleaned = outputText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = safeJsonParse(cleaned);

    if (!parsed) {
      console.error("JSON_PARSE_FAILED:", cleaned);

      return res.status(500).json({
        error: "AI 응답을 JSON으로 변환하지 못했습니다.",
        raw: cleaned,
      });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류";

    console.error("ANALYZE_API_ERROR:", message);

    return res.status(500).json({
      error: message,
    });
  }
}
