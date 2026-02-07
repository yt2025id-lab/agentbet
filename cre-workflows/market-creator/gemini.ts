import { cre, type Runtime } from "@chainlink/cre-sdk";

interface MarketIdea {
  question: string;
  duration: number;
  category: string;
}

/**
 * Ask Gemini to generate a prediction market question based on current events.
 * Uses search grounding to find real-world trending topics.
 */
export function askGeminiForMarketIdea(
  runtime: Runtime<any>,
  httpClient: ReturnType<typeof cre.capabilities.HTTPClient>,
  geminiModel: string
): MarketIdea | null {
  const apiKey = runtime.secrets.get("GEMINI_API_KEY");

  const systemPrompt = `You are an AI that creates prediction market questions based on current trending events.

RULES:
1. The question MUST be answerable with YES or NO
2. The question must be about a real, verifiable event happening within 1-7 days
3. Choose from categories: crypto, sports, politics, tech, entertainment, finance
4. Duration is in seconds (86400 = 1 day, 604800 = 7 days)
5. Make questions specific with clear resolution criteria (include dates, numbers, thresholds)
6. Focus on events people would want to bet on
7. Use search grounding to find current real events

Return ONLY valid JSON:
{"question": "Will X happen by Y date?", "duration": 86400, "category": "crypto"}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: "Search for today's top trending news and events. Generate ONE compelling prediction market question that people would want to bet on. The event should resolve within 1-7 days.",
          },
        ],
      },
    ],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.8,
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
    const idea: MarketIdea = JSON.parse(text);

    if (idea.question && idea.duration > 0) {
      return idea;
    }
    console.log("[gemini] Invalid market idea format:", text);
    return null;
  } catch (e) {
    console.log("[gemini] Failed to parse market idea:", e);
    return null;
  }
}

/**
 * Ask Gemini to validate a user-provided market question.
 */
export function validateMarketQuestion(
  runtime: Runtime<any>,
  httpClient: ReturnType<typeof cre.capabilities.HTTPClient>,
  geminiModel: string,
  question: string
): { valid: boolean; reason: string } {
  const apiKey = runtime.secrets.get("GEMINI_API_KEY");

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: `Evaluate this prediction market question: "${question}"

Is it:
1. A clear YES/NO question?
2. About a verifiable real-world event?
3. Resolvable within a reasonable timeframe?
4. Not offensive or illegal?

Return JSON: {"valid": true/false, "reason": "explanation"}`,
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.1,
    },
  };

  const body = btoa(JSON.stringify(requestBody));

  const response = httpClient
    .sendRequest(runtime, {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body,
      maxResponseBytes: 5000,
      cacheMaxAge: 60,
    })
    .result();

  try {
    const parsed = JSON.parse(atob(response.body));
    const text = parsed.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  } catch {
    return { valid: false, reason: "Failed to validate question" };
  }
}
