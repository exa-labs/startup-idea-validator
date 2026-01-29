import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface SearchResult {
  title: string;
  url: string;
  text?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { query, results } = await req.json() as {
      query: string;
      results: SearchResult[]
    };

    if (!query || !results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: "Query and results are required" },
        { status: 400 }
      );
    }

    // Generate a spoken summary using Gemini Flash (top 3 results)
    const topResults = results.slice(0, 3);
    let spokenSummary: string;

    try {
      const summaryPrompt = topResults
        .map((r, i) => `${i + 1}. "${r.title}"\n   ${r.text?.slice(0, 200) || "No description"}`)
        .join("\n\n");

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const systemPrompt = `You are a knowledgeable friend who just looked something up. Speak naturally like you're having a conversation.

Style guidelines:
- Start with the answer or insight, not "I found..." or "Based on my search..."
- Talk like a real person - use "So," "Actually," "Looks like," "Interesting—"
- Share 2-3 key findings with genuine enthusiasm or insight
- Add brief context that makes results meaningful
- Keep it under 60 words (about 12 seconds of speech)
- Sound curious and helpful, not robotic

Bad: "I found 3 results about AI startups. The top results include Anthropic and Mistral."
Good: "So Anthropic and Mistral are leading the pack right now. Anthropic's big on AI safety, while Mistral's going the open-source route. OpenAI's still dominant though. Pretty competitive space."`;

      const userPrompt = `Someone asked: "${query}"

Here's what I found:
${summaryPrompt}

Give a natural, conversational response (under 60 words):`;

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 150,
        },
      });

      spokenSummary = result.response.text()?.trim() ||
        `Looks like there's some interesting stuff on "${query}". Check out the results below.`;
    } catch (geminiError) {
      // Fallback: generate a simple but natural summary
      console.warn("Gemini summarization failed, using simple summary:", geminiError);
      const topTitle = topResults[0]?.title || query;
      spokenSummary = `Here's what came up for that. ${topTitle} looks relevant—check it out below.`;
    }

    // Generate speech using ElevenLabs
    const elevenLabsResponse = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM", // Rachel voice
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY as string,
        },
        body: JSON.stringify({
          text: spokenSummary,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text();
      console.error("ElevenLabs TTS error:", errorText);
      return NextResponse.json(
        { error: "Text-to-speech failed" },
        { status: elevenLabsResponse.status }
      );
    }

    const audioBuffer = await elevenLabsResponse.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString("base64");

    return NextResponse.json({
      audio: base64Audio,
      text: spokenSummary,
      contentType: "audio/mpeg",
    });
  } catch (error) {
    console.error("TTS error:", error);
    return NextResponse.json(
      { error: "Text-to-speech failed" },
      { status: 500 }
    );
  }
}
