import { NextRequest, NextResponse } from 'next/server';
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from 'ai';
import { z } from 'zod';

export const maxDuration = 100;

export async function POST(req: NextRequest) {
  try {
    const { idea, companies } = await req.json();

    if (!idea || !companies || !Array.isArray(companies)) {
      return NextResponse.json({ error: 'Idea and companies data are required' }, { status: 400 });
    }

    const companiesText = companies.map((c: any, i: number) =>
      `${i + 1}. ${c.title}\n   URL: ${c.url}\n   Description: ${c.text || 'No description available'}`
    ).join('\n\n');

    const analysisSchema = z.object({
      overview: z.string().describe('A 2-3 sentence overview of the market landscape for this idea'),
      keyPlayers: z.array(z.object({
        name: z.string(),
        description: z.string().describe('One sentence about what makes this company relevant')
      })).describe('Top 3-5 key players in this space'),
      gaps: z.array(z.string()).describe('2-4 market gaps or opportunities the user could exploit'),
      recommendation: z.string().describe('A concise go/no-go recommendation with reasoning'),
      uniquenessScore: z.number().min(1).max(10).describe('1-10 score where 10 is completely unique and 1 is highly saturated')
    });

    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: analysisSchema,
      output: 'object',
      system: "You are a startup advisor analyzing competitive landscapes. Be direct, honest, and actionable. Use simple language. If the market is crowded, say so. If there's opportunity, highlight it clearly.",
      prompt: `Analyze the competitive landscape for this startup idea:

STARTUP IDEA:
"${idea}"

SIMILAR COMPANIES FOUND:
${companiesText}

Based on these similar companies, provide:
1. A brief market overview
2. The key players and what they do
3. Gaps and opportunities the user could exploit
4. Your recommendation on whether to pursue this idea
5. A uniqueness score from 1-10 (10 = very unique, 1 = highly saturated)

Be honest and helpful. If the idea already exists in many forms, say so. If there's a unique angle, highlight it.`
    });

    return NextResponse.json({ result: object });

  } catch (error) {
    console.error('Analyze landscape API error:', error);
    return NextResponse.json({ error: `Competitive analysis failed | ${error}` }, { status: 500 });
  }
}
