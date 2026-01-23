import { NextRequest, NextResponse } from 'next/server';
import Exa from "exa-js";

export const maxDuration = 60;

const exa = new Exa(process.env.EXA_API_KEY as string);

export async function POST(req: NextRequest) {
  try {
    const { idea } = await req.json();

    if (!idea || typeof idea !== 'string' || idea.trim().length < 3) {
      return NextResponse.json({ error: 'Please provide a valid startup idea (at least 3 characters)' }, { status: 400 });
    }

    const result = await exa.searchAndContents(
      idea,
      {
        category: "company",
        numResults: 10,
        text: {
          maxCharacters: 500
        },
        type: "auto"
      }
    );

    return NextResponse.json({
      results: result.results.map((r: any) => {
        // Extract entity data if available
        const entity = r.entities?.[0]?.properties;

        return {
          title: r.title,
          url: r.url,
          text: r.text,
          image: r.image,
          publishedDate: r.publishedDate,
          score: r.score,
          // Entity data (rich company info)
          entity: entity ? {
            name: entity.name,
            description: entity.description,
            foundedYear: entity.foundedYear,
            workforce: entity.workforce?.total,
            headquarters: entity.headquarters ? {
              city: entity.headquarters.city,
              country: entity.headquarters.country,
            } : null,
            financials: entity.financials ? {
              revenueAnnual: entity.financials.revenueAnnual,
              fundingTotal: entity.financials.fundingTotal,
              fundingLatestRound: entity.financials.fundingLatestRound,
            } : null,
            webTraffic: entity.webTraffic?.visitsMonthly,
          } : null
        };
      })
    });
  } catch (error) {
    console.error('Validate idea API error:', error);
    return NextResponse.json({ error: `Failed to validate idea | ${error}` }, { status: 500 });
  }
}
