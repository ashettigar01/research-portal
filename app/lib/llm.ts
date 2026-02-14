import axios from "axios";

/* ---------- SAFE JSON PARSER ---------- */

function safeJsonParse(content: string) {
  content = content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const firstBrace = content.indexOf("{");
  const lastBrace = content.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("Invalid JSON from model");
  }

  const jsonString = content.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonString);
  } catch (err) {
    console.error("Invalid JSON from LLM:", jsonString);
    throw new Error("AI returned malformed JSON.");
  }
}

/* ---------- ANALYZE TRANSCRIPT ---------- */

export async function analyzeTranscript(text: string) {
  // Allow more transcript but stay safe for free tier
  const safeText = text.slice(0, 6000);

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        temperature: 0,
        max_tokens: 900,
        messages: [
          {
            role: "system",
            content: `
You are a senior financial research analyst.

Follow these strict rules:

1. Extract ONLY explicitly stated information.
2. Do NOT hallucinate.
3. Do NOT invent numbers.
4. If a section is absent, return "Not mentioned".
5. Use exact phrases from transcript where possible.
6. Executive summary must be 3–4 sentences.
7. Management tone must be one of:
   optimistic, cautious, neutral, mixed.
8. Confidence level must be:
   high, medium, low.
9. Extract 3–5 key positives.
10. Extract 3–5 key concerns.
11. Extract forward guidance ONLY if clearly stated.
12. Return STRICT VALID JSON only.
No explanations.
No markdown.
`
          },
          {
            role: "user",
            content: `
Analyze this earnings call transcript.

Return EXACT JSON structure:

{
  "executive_summary": "",
  "management_tone": "",
  "confidence_level": "",
  "sentiment_score": "",
  "financial_highlights": [],
  "key_positives": [],
  "key_concerns": [],
  "risk_factors": [],
  "forward_guidance": {
    "revenue_outlook": "",
    "margin_outlook": "",
    "capex_outlook": ""
  },
  "capacity_utilization_trend": "",
  "growth_initiatives": [],
  "strategic_actions": [],
  "notable_quotes": [],
  "ai_confidence_score": ""
}

Transcript:
${safeText}
`
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    return safeJsonParse(response.data.choices[0].message.content);

  } catch (error: any) {
    if (error.response?.status === 429) {
      throw new Error("Rate limit reached. Please try again in 30 seconds.");
    }

    console.error("LLM Error:", error.response?.data || error.message);
    throw new Error("Processing failed.");
  }
}
