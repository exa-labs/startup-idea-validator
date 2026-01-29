import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";

export const maxDuration = 60;

const exa = new Exa(process.env.EXA_API_KEY as string);

// Query intent detection and optimization
interface QueryConfig {
  query: string;
  category?: "company" | "news" | "research" | "tweet" | "github" | "general";
  useAutoprompt?: boolean;
  startPublishedDate?: string;
  endPublishedDate?: string;
  needsLiveCrawl?: boolean; // For real-time data like weather, stocks, sports
}

function analyzeAndOptimizeQuery(rawQuery: string): QueryConfig {
  const q = rawQuery.toLowerCase().trim();
  const config: QueryConfig = { query: rawQuery };

  // NEWS / RECENT: Queries about current events, latest, recent
  const newsPatterns = [
    /\b(latest|recent|news|today|this week|yesterday|breaking|update|announcement)\b/,
    /\bwhat('s| is) (happening|new|going on)\b/,
    /\b(2024|2025|2026)\b/,
  ];
  if (newsPatterns.some(p => p.test(q))) {
    config.category = "news";
    // Limit to last 7 days for "latest" queries
    if (/\b(latest|today|this week|breaking)\b/.test(q)) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      config.startPublishedDate = weekAgo.toISOString().split("T")[0];
    }
    // Last 30 days for general news
    else if (/\b(recent|news)\b/.test(q)) {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      config.startPublishedDate = monthAgo.toISOString().split("T")[0];
    }
  }

  // COMPANY: Queries about companies, startups, businesses
  const companyPatterns = [
    /\b(company|companies|startup|startups|business|businesses|firm|firms)\b/,
    /\b(founded|funding|raised|valuation|ipo|acquisition)\b/,
    /\bwho (is|are) (building|making|creating|working on)\b/,
  ];
  if (companyPatterns.some(p => p.test(q))) {
    config.category = "company";
    config.useAutoprompt = true; // Exa's autoprompt works well for company queries
  }

  // RESEARCH / ACADEMIC: Technical, research, papers
  const researchPatterns = [
    /\b(research|paper|study|academic|scientific|journal|arxiv)\b/,
    /\b(how does|how do|explain|what is the)\b.*\b(work|algorithm|method|technique)\b/,
  ];
  if (researchPatterns.some(p => p.test(q))) {
    config.category = "research";
    config.useAutoprompt = true;
  }

  // GITHUB: Code, repos, open source
  const githubPatterns = [
    /\b(github|repo|repository|open source|code|library|framework|package)\b/,
    /\b(implementation|example|tutorial|sample)\b/,
  ];
  if (githubPatterns.some(p => p.test(q))) {
    config.category = "github";
  }

  // TWITTER/X: Social, opinions, discussions
  const tweetPatterns = [
    /\b(twitter|tweet|x\.com|people (saying|think|talking))\b/,
    /\bwhat (do|are) people\b/,
  ];
  if (tweetPatterns.some(p => p.test(q))) {
    config.category = "tweet";
  }

  // CONCEPTUAL / DEFINITION queries - benefit from neural (auto) search
  // Test results: Auto mode 69.2% vs Keyword 60.8% for these queries
  const conceptualPatterns = [
    // "What's the term/word/name for..."
    /\bwhat('s| is) (the |that |a )?(term|word|name|phrase|concept|effect|fallacy|bias|principle|law)\b/i,
    // "What's it called when..."
    /\bwhat('s| is) it called\b/i,
    // "There's a quote/saying..."
    /\bthere's a (quote|saying|term|word|concept|principle)\b/i,
    // "I can't remember the name/word..."
    /\b(can't|cannot) remember (the |that )?(name|word|term|phrase)\b/i,
    // Comparative/explanatory queries
    /\b(difference between|compare|explain|how does|why does)\b/i,
    // "Find a good explanation of..."
    /\bfind (a |an )?(good |best )?(explanation|source|definition)\b/i,
    // Looking for specific concepts
    /\b(alternatives to|similar to|like .+ but)\b/i,
  ];
  if (conceptualPatterns.some(p => p.test(q))) {
    config.useAutoprompt = true; // Use auto mode for better semantic matching
  }

  // TIME-SENSITIVE / LIVE DATA: Needs live crawl with max_age_hours: 0
  const liveCrawlPatterns = [
    // Weather
    /\b(weather|temperature|forecast|rain|sunny|cloudy|humidity|wind)\b/,
    // Stock market / crypto
    /\b(stock|stocks|price|prices|market|nasdaq|dow|s&p|crypto|bitcoin|btc|eth|trading)\b/,
    // Sports scores / live events
    /\b(score|scores|game|match|playing|live|vs|versus)\b.*\b(today|tonight|now|current)\b/,
    /\b(nba|nfl|mlb|nhl|fifa|premier league|world cup)\b.*\b(score|game|today)\b/,
    // Traffic / transit
    /\b(traffic|commute|transit|delay|delays|road conditions)\b/,
    // Flight status
    /\b(flight|flights)\b.*\b(status|delayed|on time|arriving|departing)\b/,
    // Real-time indicators
    /\b(right now|currently|at the moment|as of now|live)\b/,
    // Elections / vote counts
    /\b(election|vote|votes|voting|results|polls)\b.*\b(today|live|current|count)\b/,
  ];
  if (liveCrawlPatterns.some(p => p.test(q))) {
    config.needsLiveCrawl = true;
  }

  // Clean up filler words and speech disfluencies for better search
  let cleanedQuery = rawQuery
    // Remove common prefixes
    .replace(/^(hey|hi|hello|ok|okay|um|uh|so|well|please|can you|could you|I want to|I'd like to|help me|find me|show me|tell me about|what about|how about)\s*/gi, "")
    // Remove trailing politeness
    .replace(/\s*(please|thanks|thank you)\.?$/gi, "")
    // Remove speech disfluencies (um, uh, like, you know, etc.)
    .replace(/\b(um|uh|er|ah|like|you know|I mean|sort of|kind of)\b/gi, "")
    // Remove mid-sentence corrections (—wait—, —actually—, —sorry—, etc.)
    .replace(/—(wait|actually|sorry|no|never mind)—?/gi, " ")
    // Also handle variants without em-dash
    .replace(/\b(wait|actually|sorry|never mind),?\s*/gi, " ")
    // Clean up ellipses from hesitation
    .replace(/\.\.\./g, " ")
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();

  // Handle negation patterns: "not X—the one where Y" → focus on Y
  // Example: "not the availability heuristic—the one where you only see evidence you agree with"
  // Also handles: "not X, the one that Y" and "not X - the one where Y"
  const negationPatterns = [
    /not (?:the |a )?['"]?[\w\s]+['"]?[—\-,]\s*(the one (?:where|that|when).+)/i,
    /not (?:the |a )?['"]?[\w\s]+['"]?[—\-,]\s*((?:where|when|that) .+)/i,
  ];
  for (const pattern of negationPatterns) {
    const match = cleanedQuery.match(pattern);
    if (match) {
      cleanedQuery = match[1];
      break;
    }
  }

  config.query = cleanedQuery;

  // If query is too short after cleanup, use original
  if (config.query.length < 3) {
    config.query = rawQuery.trim();
  }

  return config;
}

export async function POST(req: NextRequest) {
  try {
    const { query, mode = "fast", numResults = 10, withContents = false } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Analyze and optimize the query
    const queryConfig = analyzeAndOptimizeQuery(query);

    // Use "keyword" for instant results (fastest), "auto" for best quality
    // Use "auto" if autoprompt is recommended for this query type
    const searchType = mode === "auto" || queryConfig.useAutoprompt ? "auto" : "keyword";

    // Build search options based on query analysis
    const baseOptions: Record<string, unknown> = {
      type: searchType,
      numResults: Math.min(numResults, 10),
    };

    // Add date filters for news/recent queries
    if (queryConfig.startPublishedDate) {
      baseOptions.startPublishedDate = queryConfig.startPublishedDate;
    }
    if (queryConfig.endPublishedDate) {
      baseOptions.endPublishedDate = queryConfig.endPublishedDate;
    }

    // Add category filter if detected
    if (queryConfig.category === "news") {
      baseOptions.category = "news";
    } else if (queryConfig.category === "company") {
      baseOptions.category = "company";
    } else if (queryConfig.category === "research") {
      baseOptions.category = "research paper";
    } else if (queryConfig.category === "github") {
      baseOptions.category = "github";
    } else if (queryConfig.category === "tweet") {
      baseOptions.category = "tweet";
    }

    if (withContents) {
      // Stage 2: Full search with text snippets (for final results + TTS)
      const textOptions: { maxCharacters: number; maxAgeHours?: number } = {
        maxCharacters: 300
      };

      // Use live crawl for time-sensitive queries (weather, stocks, sports, etc.)
      if (queryConfig.needsLiveCrawl) {
        textOptions.maxAgeHours = 0;
      }

      const result = await exa.searchAndContents(queryConfig.query, {
        ...baseOptions,
        text: textOptions,
        livecrawl: queryConfig.needsLiveCrawl ? "always" : "fallback",
      });

      const results = result.results.map((r) => ({
        title: r.title || "Untitled",
        url: r.url,
        text: r.text || "",
        image: r.image || null,
        publishedDate: r.publishedDate || null,
        score: r.score || null,
      }));

      return NextResponse.json({
        results,
        mode: searchType,
        hasContents: true,
        category: queryConfig.category,
        optimizedQuery: queryConfig.query,
        liveCrawl: queryConfig.needsLiveCrawl || false,
      });
    } else {
      // Stage 1: Fast search - just titles and URLs (no contents)
      // This is much faster for instant display
      // Note: For live crawl queries, we still do fast search here since contents come in stage 2
      const result = await exa.search(queryConfig.query, baseOptions);

      const results = result.results.map((r) => ({
        title: r.title || "Untitled",
        url: r.url,
        text: "", // No text in stage 1
        image: null,
        publishedDate: r.publishedDate || null,
        score: r.score || null,
      }));

      return NextResponse.json({
        results,
        mode: searchType,
        hasContents: false,
        category: queryConfig.category,
        optimizedQuery: queryConfig.query,
        liveCrawl: queryConfig.needsLiveCrawl || false,
      });
    }
  } catch (error) {
    console.error("Voice search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
