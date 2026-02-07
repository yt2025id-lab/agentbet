import { cre, type Runtime } from "@chainlink/cre-sdk";

interface GeminiSettlementResult {
  outcome: "YES" | "NO";
  confidence: number;
  reasoning: string;
}

/**
 * Ask Google Gemini to determine if a prediction market question has resolved YES or NO.
 * Uses search grounding for real-world verification.
 */
export function askGeminiForSettlement(
  runtime: Runtime<any>,
  httpClient: ReturnType<typeof cre.capabilities.HTTPClient>,
  geminiModel: string,
  question: string
): GeminiSettlementResult | null {
  const apiKey = runtime.secrets.get("GEMINI_API_KEY");

  const systemPrompt = `You are an objective fact-checker for prediction markets.
Given a YES/NO prediction market question, determine the factual outcome based on current real-world information.

IMPORTANT RULES:
1. Only answer YES or NO based on verifiable facts
2. Use web search to verify current real-world data
3. If the event has not yet occurred or is uncertain, set confidence below 50
4. Confidence is 0-100, where 100 means absolute certainty

Return ONLY valid JSON with this exact format:
{"outcome": "YES" or "NO", "confidence": 0-100, "reasoning": "brief explanation"}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Prediction market question to settle: "${question}"\n\nHas this event occurred? What is the factual outcome?`,
          },
        ],
      },
    ],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
    tools: [{ googleSearch: {} }],
  };

  const body = btoa(JSON.stringify(requestBody));

  const response = httpClient
    .sendRequest(runtime, {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      maxResponseBytes: 10000,
      cacheMaxAge: 60,
    })
    .result();

  try {
    const parsed = JSON.parse(atob(response.body));
    const text = parsed.candidates[0].content.parts[0].text;
    const result: GeminiSettlementResult = JSON.parse(text);

    // Validate
    if (
      (result.outcome === "YES" || result.outcome === "NO") &&
      typeof result.confidence === "number" &&
      result.confidence >= 0 &&
      result.confidence <= 100
    ) {
      return result;
    }
    console.log("[gemini] Invalid response format:", text);
    return null;
  } catch (e) {
    console.log("[gemini] Failed to parse response:", e);
    return null;
  }
}
