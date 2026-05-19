import type { VercelRequest, VercelResponse } from "@vercel/node";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 허용됩니다." });
  }

  const apiKey = process.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "서버에 OpenAI API 키가 설정되어 있지 않습니다.",
    });
  }

  const { imageDataUrl, options } = req.body ?? {};

  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    return res.status(400).json({ error: "제품 이미지가 없습니다." });
  }

  const duration = options?.duration ?? 15;
  const platform = options?.platform ?? "shorts";
  const tone = options?.tone ?? "hooking";
  const generationType = options?.generationType ?? "shorts";

  const prompt = `
너는 한국어 숏폼 광고 기획 전문가야.

업로드된 제품 이미지를 보고 아래 JSON 형식으로만 답변해.
설명 문장, 마크다운, 코드블록은 절대 넣지 마.

조건:
- 영상 길이: ${duration}초
- 플랫폼: ${platform}
- 톤: ${tone}
- 생성 유형: ${generationType}

반드시 아래 JSON 구조를 지켜.

{
  "productSummary": "제품 분석 요약",
  "hook": "오프닝 후킹 문구",
  "voiceScript": "음성 대본",
  "captionScript": "캡컷용 화면 자막",
  "videoPrompt": "영상 생성용 프롬프트",
  "sceneTimeline": [
    {
      "time": "0-3초",
      "visual": "화면 연출",
      "caption": "화면 자막",
      "voice": "해당 구간 음성"
    }
  ],
  "apiPayload": {
    "type": "shorts-ad",
    "duration": ${duration},
    "platform": "${platform}",
    "tone": "${tone}",
    "generationType": "${generationType}"
  }
}

주의:
- sceneTimeline은 최소 4개 이상 작성
- 한국어로 작성
- 과장 광고, 질병 치료, 보장 표현 금지
- 제품 이미지에서 확인 가능한 내용 중심으로 작성
`;

  try {
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: imageDataUrl,
                },
              },
            ],
          },
        ],
      }),
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      return res.status(openaiResponse.status).json({
        error:
          data?.error?.message ||
          "OpenAI 이미지 분석 API 호출에 실패했습니다.",
      });
    }

    const content = data?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      return res.status(500).json({
        error: "OpenAI 응답 내용이 비어 있습니다.",
      });
    }

    return res.status(200).json(JSON.parse(content));
  } catch (error) {
    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "이미지 분석 중 알 수 없는 오류가 발생했습니다.",
    });
  }
}
