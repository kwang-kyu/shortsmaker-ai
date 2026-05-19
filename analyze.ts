import type { VercelRequest, VercelResponse } from "@vercel/node";

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

    const { imageDataUrl, options } = req.body;

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
너는 숏폼 광고기획 전문가다.

제품 이미지를 분석해서 아래 형식의 JSON만 반환해라.

조건:
- 영상 길이: ${duration}초
- 플랫폼: ${platform}
- 톤: ${tone}
- 생성 유형: ${generationType}
- 한국어로 작성
- 과장 광고 표현은 피하고 자연스럽게 작성
- JSON 외의 설명 문장은 절대 넣지 마라

반환 JSON 형식:
{
  "productSummary": "제품 분석 요약",
  "openingHook": "오프닝 훅",
  "voiceScript": "음성 대본",
  "capcutCaptions": ["자막1", "자막2", "자막3"],
  "sceneTimeline": [
    {
      "time": "0-3초",
      "visual": "장면 설명",
      "caption": "화면 자막",
      "voice": "보이스 문장"
    }
  ],
  "videoPrompt": "영상 생성 프롬프트",
  "detailPageCopy": "상세페이지 문구 초안",
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
        Authorization: `Bearer ${apiKey}`,
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
      }),
    });

    const responseData = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return res.status(openaiResponse.status).json({
        error: responseData?.error?.message || "OpenAI API 호출 실패",
      });
    }

    const outputText =
      responseData.output_text ||
      responseData.output?.[0]?.content?.[0]?.text ||
      "";

    if (!outputText) {
      return res.status(500).json({
        error: "AI 응답이 비어 있습니다.",
      });
    }

    const cleaned = outputText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return res.status(200).json(parsed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 서버 오류";

    return res.status(500).json({
      error: message,
    });
  }
}