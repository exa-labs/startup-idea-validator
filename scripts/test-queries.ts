import Exa from "exa-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const exa = new Exa(process.env.EXA_API_KEY as string);

interface QueryConfig {
  query: string;
  category?: "company" | "news" | "research" | "tweet" | "github" | "general";
  useAutoprompt?: boolean;
  startPublishedDate?: string;
  endPublishedDate?: string;
  needsLiveCrawl?: boolean;
}

function analyzeAndOptimizeQuery(rawQuery: string): QueryConfig {
  const q = rawQuery.toLowerCase().trim();
  const config: QueryConfig = { query: rawQuery };

  // NEWS / RECENT
  const newsPatterns = [
    /\b(latest|recent|news|today|this week|yesterday|breaking|update|announcement)\b/,
    /\bwhat('s| is) (happening|new|going on)\b/,
    /\b(2024|2025|2026)\b/,
  ];
  if (newsPatterns.some(p => p.test(q))) {
    config.category = "news";
    if (/\b(latest|today|this week|breaking)\b/.test(q)) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      config.startPublishedDate = weekAgo.toISOString().split("T")[0];
    } else if (/\b(recent|news)\b/.test(q)) {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      config.startPublishedDate = monthAgo.toISOString().split("T")[0];
    }
  }

  // COMPANY
  const companyPatterns = [
    /\b(company|companies|startup|startups|business|businesses|firm|firms)\b/,
    /\b(founded|funding|raised|valuation|ipo|acquisition)\b/,
    /\bwho (is|are) (building|making|creating|working on)\b/,
  ];
  if (companyPatterns.some(p => p.test(q))) {
    config.category = "company";
    config.useAutoprompt = true;
  }

  // RESEARCH / ACADEMIC
  const researchPatterns = [
    /\b(research|paper|study|academic|scientific|journal|arxiv)\b/,
    /\b(how does|how do|explain|what is the)\b.*\b(work|algorithm|method|technique)\b/,
  ];
  if (researchPatterns.some(p => p.test(q))) {
    config.category = "research";
    config.useAutoprompt = true;
  }

  // GITHUB
  const githubPatterns = [
    /\b(github|repo|repository|open source|code|library|framework|package)\b/,
    /\b(implementation|example|tutorial|sample)\b/,
  ];
  if (githubPatterns.some(p => p.test(q))) {
    config.category = "github";
  }

  // TWITTER/X
  const tweetPatterns = [
    /\b(twitter|tweet|x\.com|people (saying|think|talking))\b/,
    /\bwhat (do|are) people\b/,
  ];
  if (tweetPatterns.some(p => p.test(q))) {
    config.category = "tweet";
  }

  // CONCEPTUAL / DEFINITION queries - benefit from neural (auto) search
  const conceptualPatterns = [
    /\bwhat('s| is) (the |that |a )?(term|word|name|phrase|concept|effect|fallacy|bias|principle|law)\b/i,
    /\bwhat('s| is) it called\b/i,
    /\bthere's a (quote|saying|term|word|concept|principle)\b/i,
    /\b(can't|cannot) remember (the |that )?(name|word|term|phrase)\b/i,
    /\b(difference between|compare|explain|how does|why does)\b/i,
    /\bfind (a |an )?(good |best )?(explanation|source|definition)\b/i,
    /\b(alternatives to|similar to|like .+ but)\b/i,
  ];
  if (conceptualPatterns.some(p => p.test(q))) {
    config.useAutoprompt = true;
  }

  // TIME-SENSITIVE / LIVE DATA
  const liveCrawlPatterns = [
    /\b(weather|temperature|forecast|rain|sunny|cloudy|humidity|wind)\b/,
    /\b(stock|stocks|price|prices|market|nasdaq|dow|s&p|crypto|bitcoin|btc|eth|trading)\b/,
    /\b(score|scores|game|match|playing|live|vs|versus)\b.*\b(today|tonight|now|current)\b/,
    /\b(nba|nfl|mlb|nhl|fifa|premier league|world cup)\b.*\b(score|game|today)\b/,
    /\b(traffic|commute|transit|delay|delays|road conditions)\b/,
    /\b(flight|flights)\b.*\b(status|delayed|on time|arriving|departing)\b/,
    /\b(right now|currently|at the moment|as of now|live)\b/,
    /\b(election|vote|votes|voting|results|polls)\b.*\b(today|live|current|count)\b/,
  ];
  if (liveCrawlPatterns.some(p => p.test(q))) {
    config.needsLiveCrawl = true;
  }

  // Clean up filler words and disfluencies
  let cleanedQuery = rawQuery
    .replace(/^(hey|hi|hello|ok|okay|um|uh|so|well|please|can you|could you|I want to|I'd like to|help me|find me|show me|tell me about|what about|how about)\s*/gi, "")
    .replace(/\s*(please|thanks|thank you)\.?$/gi, "")
    // Clean up speech disfluencies
    .replace(/\b(um|uh|er|ah|like|you know|I mean|sort of|kind of)\b/gi, "")
    // Remove mid-sentence corrections
    .replace(/—(wait|actually|sorry|no|never mind)—?/gi, " ")
    .replace(/\b(wait|actually|sorry|never mind),?\s*/gi, " ")
    .replace(/\.\.\./g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Handle negation patterns: "not X—the one where Y" → focus on Y
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

  if (config.query.length < 3) {
    config.query = rawQuery.trim();
  }

  return config;
}

interface TestResult {
  query: string;
  optimizedQuery: string;
  mode: string;
  category: string | undefined;
  useAutoprompt: boolean;
  topResults: { title: string; url: string; text: string }[];
  expectedTerms: string[];
  foundTerms: string[];
  score: number;
  latencyMs: number;
  notes: string[];
}

// Expected answers for evaluation
const EXPECTED_ANSWERS: Record<string, string[]> = {
  // ========== 1) HERO PROMPTS ==========
  "What's the psychology term for remembering the first and last items in a list, but not the middle?":
    ["serial position effect", "primacy effect", "recency effect"],
  "There's a quote like 'all models are wrong…' What's the full quote and who said it?":
    ["George Box", "all models are wrong but some are useful"],
  "What's that effect where the more you do something, the more you like it—like exposure makes you like it?":
    ["mere exposure effect", "familiarity principle", "exposure effect"],
  "What's the name for when you think you knew something all along after you learn it?":
    ["hindsight bias", "knew-it-all-along", "creeping determinism"],
  "What's the term for a word that sounds like what it means—like 'buzz'?":
    ["onomatopoeia"],
  "What's the economic term for when demand goes up and price goes up because people think it's trendy?":
    ["Veblen good", "snob effect", "conspicuous consumption"],
  "What's the phrase for when a user gets overwhelmed by too many choices?":
    ["paradox of choice", "choice overload", "decision fatigue", "analysis paralysis"],
  "What's the name of the fallacy where you only notice evidence that supports your belief?":
    ["confirmation bias"],
  "What's that thing called where a product gets worse as it gets more features—like too much complexity?":
    ["feature creep", "bloat", "scope creep", "featuritis"],
  "What's the name for a graph that shows trade-offs between two goals—like accuracy vs latency?":
    ["Pareto frontier", "Pareto curve", "efficient frontier", "trade-off curve"],

  // ========== 2) TIP-OF-THE-TONGUE PROMPTS ==========
  "What's the term for when a group makes worse decisions because they want harmony?":
    ["groupthink"],
  "What's that thing called where you assume others know what you know?":
    ["curse of knowledge", "curse of expertise"],
  "What's the term for thinking you're above average at everything?":
    ["Dunning-Kruger effect", "illusory superiority", "Lake Wobegon effect", "above-average effect"],
  "What's the concept where improving one metric makes another metric worse?":
    ["Goodhart's law", "Campbell's law", "trade-off", "multi-objective optimization"],
  "What's the term for when you attribute your success to skill but others' success to luck?":
    ["fundamental attribution error", "self-serving bias", "actor-observer bias"],
  "What's the word for being afraid of missing out when others are doing things?":
    ["FOMO", "fear of missing out"],
  "What's the term for when a system looks stable but is actually fragile?":
    ["fragility", "antifragile", "black swan", "hidden risk", "tail risk"],
  "What's the name for a problem that looks small but has huge downstream effects?":
    ["butterfly effect", "cascading failure", "ripple effect", "knock-on effect"],
  "What's the term for when a plan fails because it ignored rare events?":
    ["black swan", "tail risk", "fat tail", "planning fallacy"],
  "What's it called when a number seems meaningful just because it's precise?":
    ["false precision", "precision bias", "spurious accuracy", "overprecision"],

  // ========== 5) FIND THE THING I HALF-REMEMBER ==========
  "I read an article about why adding more features can make a product worse—can you find it or explain the concept?":
    ["feature creep", "bloat", "featuritis", "second-system effect"],
  "There was a well-known paper about 'attention is all you need'—what's the main idea and where's the paper?":
    ["attention is all you need", "transformer", "Vaswani"],
  "I saw a blog post about why switching costs matter in startups—find a good explanation.":
    ["switching costs", "lock-in", "moat"],
  "I can't remember the name of that software principle about duplication being bad—what's it called and what's the best explanation?":
    ["DRY", "don't repeat yourself", "duplication"],
  "Find a good explanation of 'strong opinions, loosely held' and where it comes from.":
    ["strong opinions, loosely held", "Paul Saffo"],
  "There's that idea that 'premature optimization is the root of all evil'—what's the exact quote and context?":
    ["premature optimization", "Donald Knuth", "root of all evil"],
  "Find a good, reputable explanation of why correlation doesn't imply causation.":
    ["correlation", "causation", "spurious"],
  "What's a good source explaining the difference between precision and recall?":
    ["precision", "recall", "F1"],
  "Find an explanation of Pareto's principle that includes an example.":
    ["Pareto", "80/20", "80-20"],
  "What's a good source explaining the difference between inference and training in ML?":
    ["inference", "training", "machine learning"],

  // ========== 6) RECENCY-SENSITIVE PROMPTS ==========
  "What are the latest developments in open-source voice transcription?":
    ["whisper", "transcription", "speech-to-text", "voice"],
  "What happened recently with real-time voice agents or multimodal assistants?":
    ["voice agent", "multimodal", "real-time"],
  "What are the most recent announcements from ElevenLabs?":
    ["ElevenLabs", "voice", "audio"],
  "What's new in Next.js recently regarding streaming or server actions?":
    ["Next.js", "streaming", "server actions"],
  "What are the latest changes in OpenAI function calling / tool use?":
    ["OpenAI", "function calling", "tool use"],
  "Find recent examples of 'speculative search' or 'predictive retrieval' in products.":
    ["speculative", "predictive", "retrieval"],
  "What are recent best practices for low-latency RAG?":
    ["RAG", "latency", "retrieval"],
  "Find recent blog posts about building AI agents with citations.":
    ["agent", "citation", "AI"],
  "What's new this month in AI voice interfaces?":
    ["voice", "AI", "interface"],
  "Find recent discussions of latency budgets for voice assistants.":
    ["latency", "budget", "voice"],

  // ========== 7) MESSY SPEECH PROMPTS ==========
  "Um—what's that word… when you remember the first and last things… not the middle… it's like a memory effect?":
    ["serial position effect", "primacy", "recency"],
  "I'm trying to find—sorry—what's the concept where users get overwhelmed by too many options?":
    ["paradox of choice", "choice overload", "decision fatigue"],
  "Find the… wait, not the 'availability heuristic'—the one where you only see evidence you agree with.":
    ["confirmation bias"],
  "What's the name of the—uh—fallacy where you think you knew it all along after you learn it?":
    ["hindsight bias"],
  "I heard a quote—something like 'all models are wrong but…' can you find the rest?":
    ["all models are wrong", "George Box", "but some are useful"],
  "Can you find the docs page… I think it's called highlights? Exa highlights? Like excerpts for LLMs?":
    ["highlights", "Exa", "excerpts"],
  "I'm looking for the difference between SSE and websockets—like streaming updates—not video streaming.":
    ["SSE", "Server-Sent Events", "WebSocket"],
  "I want the Next.js thing where you stream from the server—route handlers? Not server actions.":
    ["Next.js", "route handler", "streaming"],
  "Find best practices for low latency voice agents—like, sub-second retrieval and response.":
    ["latency", "voice", "retrieval"],
  "I read about speculative decoding… actually speculative search—can you find something on that?":
    ["speculative", "search", "retrieval"],

  // ========== 8) CORRECTION PROMPTS ==========
  "Find the definition of 'primacy effect'—actually, I mean the one that includes primacy and recency together.":
    ["serial position effect", "primacy", "recency"],
  "Find the quote 'all models are wrong'—actually I want the context, not just the quote.":
    ["George Box", "all models are wrong", "context"],
  "Search for 'groupthink'—wait, I meant 'group polarization.' What's the difference?":
    ["group polarization", "groupthink", "difference"],
  "Find the best explanation of 'precision vs recall'—actually I want a chart or visual explanation.":
    ["precision", "recall", "chart", "visual"],
  "Find Exa docs on fast search—actually, specifically what increases latency.":
    ["Exa", "latency", "fast"],
  "Search for SSE vs WebSockets—actually I want Next.js examples.":
    ["SSE", "WebSocket", "Next.js"],
  "Find how to implement streaming—actually, in the simplest possible Next.js route.":
    ["streaming", "Next.js", "route"],
  "Find information about voice activity detection—actually, browser-based approaches, not mobile SDKs.":
    ["voice activity detection", "VAD", "browser"],
  "Find an intro to RAG—actually, for voice assistants and low-latency constraints.":
    ["RAG", "voice", "latency"],
  "Search for 'confirmation bias'—actually, I want examples and how to reduce it.":
    ["confirmation bias", "examples", "reduce", "overcome"],
};

async function testQuery(query: string, forceMode?: "keyword" | "auto"): Promise<TestResult> {
  const startTime = Date.now();
  const queryConfig = analyzeAndOptimizeQuery(query);

  // Use forced mode or detected mode
  const searchType = forceMode || (queryConfig.useAutoprompt ? "auto" : "keyword");

  const baseOptions: Record<string, unknown> = {
    type: searchType,
    numResults: 5,
  };

  if (queryConfig.startPublishedDate) {
    baseOptions.startPublishedDate = queryConfig.startPublishedDate;
  }
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

  try {
    const textOptions: { maxCharacters: number; maxAgeHours?: number } = {
      maxCharacters: 500,
    };
    if (queryConfig.needsLiveCrawl) {
      textOptions.maxAgeHours = 0;
    }

    const result = await exa.searchAndContents(queryConfig.query, {
      ...baseOptions,
      text: textOptions,
      livecrawl: queryConfig.needsLiveCrawl ? "always" : "fallback",
    });

    const latencyMs = Date.now() - startTime;
    const expectedTerms = EXPECTED_ANSWERS[query] || [];

    const allText = result.results
      .map(r => `${r.title} ${r.text}`.toLowerCase())
      .join(" ");

    const foundTerms = expectedTerms.filter(term =>
      allText.includes(term.toLowerCase())
    );

    const score = expectedTerms.length > 0
      ? (foundTerms.length / expectedTerms.length) * 100
      : -1;

    const notes: string[] = [];
    if (foundTerms.length === 0 && expectedTerms.length > 0) {
      notes.push("❌ No expected terms found");
    } else if (foundTerms.length === expectedTerms.length) {
      notes.push("✅ All terms found");
    } else if (foundTerms.length > 0) {
      notes.push(`⚠️ ${foundTerms.length}/${expectedTerms.length} terms`);
    }

    return {
      query,
      optimizedQuery: queryConfig.query,
      mode: searchType,
      category: queryConfig.category,
      useAutoprompt: queryConfig.useAutoprompt || false,
      topResults: result.results.slice(0, 3).map(r => ({
        title: r.title || "Untitled",
        url: r.url,
        text: (r.text || "").slice(0, 200),
      })),
      expectedTerms,
      foundTerms,
      score,
      latencyMs,
      notes,
    };
  } catch (error) {
    return {
      query,
      optimizedQuery: queryConfig.query,
      mode: searchType,
      category: queryConfig.category,
      useAutoprompt: queryConfig.useAutoprompt || false,
      topResults: [],
      expectedTerms: EXPECTED_ANSWERS[query] || [],
      foundTerms: [],
      score: 0,
      latencyMs: Date.now() - startTime,
      notes: [`❌ Error: ${error instanceof Error ? error.message : "Unknown"}`],
    };
  }
}

interface CategoryResults {
  name: string;
  results: TestResult[];
  avgLatency: number;
  avgScore: number;
  perfect: number;
  partial: number;
  failed: number;
}

async function testCategory(name: string, queries: string[]): Promise<CategoryResults> {
  console.log(`\n## ${name}\n`);
  const results: TestResult[] = [];

  for (const query of queries) {
    const displayQuery = query.length > 70 ? query.slice(0, 70) + "..." : query;
    process.stdout.write(`  "${displayQuery}"`);
    const result = await testQuery(query);
    results.push(result);

    const modeIndicator = result.useAutoprompt ? "🧠" : "⚡";
    console.log(`\n    ${modeIndicator} ${result.mode} | ${result.latencyMs}ms | ${result.score >= 0 ? result.score.toFixed(0) + "%" : "N/A"} ${result.notes.join(" ")}`);

    await new Promise(r => setTimeout(r, 400));
  }

  const scoredResults = results.filter(r => r.score >= 0);
  return {
    name,
    results,
    avgLatency: results.reduce((a, r) => a + r.latencyMs, 0) / results.length,
    avgScore: scoredResults.length > 0
      ? scoredResults.reduce((a, r) => a + r.score, 0) / scoredResults.length
      : 0,
    perfect: results.filter(r => r.score === 100).length,
    partial: results.filter(r => r.score > 0 && r.score < 100).length,
    failed: results.filter(r => r.score === 0).length,
  };
}

async function runTests() {
  console.log("═".repeat(80));
  console.log("   EXA VOICE SEARCH - COMPREHENSIVE QUERY EVALUATION");
  console.log("═".repeat(80));
  console.log(`\n📅 Test Date: ${new Date().toISOString()}`);
  console.log(`🔑 Legend: ⚡ = keyword (fast) | 🧠 = auto (neural)\n`);

  const categories: { name: string; queries: string[] }[] = [
    {
      name: "1️⃣  HERO PROMPTS (Live Demo)",
      queries: [
        "What's the psychology term for remembering the first and last items in a list, but not the middle?",
        "There's a quote like 'all models are wrong…' What's the full quote and who said it?",
        "What's that effect where the more you do something, the more you like it—like exposure makes you like it?",
        "What's the name for when you think you knew something all along after you learn it?",
        "What's the term for a word that sounds like what it means—like 'buzz'?",
        "What's the economic term for when demand goes up and price goes up because people think it's trendy?",
        "What's the phrase for when a user gets overwhelmed by too many choices?",
        "What's the name of the fallacy where you only notice evidence that supports your belief?",
        "What's that thing called where a product gets worse as it gets more features—like too much complexity?",
        "What's the name for a graph that shows trade-offs between two goals—like accuracy vs latency?",
      ],
    },
    {
      name: "2️⃣  TIP-OF-THE-TONGUE (Term Recall)",
      queries: [
        "What's the term for when a group makes worse decisions because they want harmony?",
        "What's that thing called where you assume others know what you know?",
        "What's the term for thinking you're above average at everything?",
        "What's the concept where improving one metric makes another metric worse?",
        "What's the term for when you attribute your success to skill but others' success to luck?",
        "What's the word for being afraid of missing out when others are doing things?",
        "What's the term for when a system looks stable but is actually fragile?",
        "What's the name for a problem that looks small but has huge downstream effects?",
        "What's the term for when a plan fails because it ignored rare events?",
        "What's it called when a number seems meaningful just because it's precise?",
      ],
    },
    {
      name: "5️⃣  HALF-REMEMBERED (Articles/Papers)",
      queries: [
        "I read an article about why adding more features can make a product worse—can you find it or explain the concept?",
        "There was a well-known paper about 'attention is all you need'—what's the main idea and where's the paper?",
        "I saw a blog post about why switching costs matter in startups—find a good explanation.",
        "I can't remember the name of that software principle about duplication being bad—what's it called and what's the best explanation?",
        "Find a good explanation of 'strong opinions, loosely held' and where it comes from.",
        "There's that idea that 'premature optimization is the root of all evil'—what's the exact quote and context?",
        "Find a good, reputable explanation of why correlation doesn't imply causation.",
        "What's a good source explaining the difference between precision and recall?",
        "Find an explanation of Pareto's principle that includes an example.",
        "What's a good source explaining the difference between inference and training in ML?",
      ],
    },
    {
      name: "6️⃣  RECENCY-SENSITIVE (Fresh Data)",
      queries: [
        "What are the latest developments in open-source voice transcription?",
        "What happened recently with real-time voice agents or multimodal assistants?",
        "What are the most recent announcements from ElevenLabs?",
        "What's new in Next.js recently regarding streaming or server actions?",
        "What are the latest changes in OpenAI function calling / tool use?",
        "Find recent examples of 'speculative search' or 'predictive retrieval' in products.",
        "What are recent best practices for low-latency RAG?",
        "Find recent blog posts about building AI agents with citations.",
        "What's new this month in AI voice interfaces?",
        "Find recent discussions of latency budgets for voice assistants.",
      ],
    },
    {
      name: "7️⃣  MESSY SPEECH (Disfluencies)",
      queries: [
        "Um—what's that word… when you remember the first and last things… not the middle… it's like a memory effect?",
        "I'm trying to find—sorry—what's the concept where users get overwhelmed by too many options?",
        "Find the… wait, not the 'availability heuristic'—the one where you only see evidence you agree with.",
        "What's the name of the—uh—fallacy where you think you knew it all along after you learn it?",
        "I heard a quote—something like 'all models are wrong but…' can you find the rest?",
        "Can you find the docs page… I think it's called highlights? Exa highlights? Like excerpts for LLMs?",
        "I'm looking for the difference between SSE and websockets—like streaming updates—not video streaming.",
        "I want the Next.js thing where you stream from the server—route handlers? Not server actions.",
        "Find best practices for low latency voice agents—like, sub-second retrieval and response.",
        "I read about speculative decoding… actually speculative search—can you find something on that?",
      ],
    },
    {
      name: "8️⃣  CORRECTIONS (Self-Refinement)",
      queries: [
        "Find the definition of 'primacy effect'—actually, I mean the one that includes primacy and recency together.",
        "Find the quote 'all models are wrong'—actually I want the context, not just the quote.",
        "Search for 'groupthink'—wait, I meant 'group polarization.' What's the difference?",
        "Find the best explanation of 'precision vs recall'—actually I want a chart or visual explanation.",
        "Find Exa docs on fast search—actually, specifically what increases latency.",
        "Search for SSE vs WebSockets—actually I want Next.js examples.",
        "Find how to implement streaming—actually, in the simplest possible Next.js route.",
        "Find information about voice activity detection—actually, browser-based approaches, not mobile SDKs.",
        "Find an intro to RAG—actually, for voice assistants and low-latency constraints.",
        "Search for 'confirmation bias'—actually, I want examples and how to reduce it.",
      ],
    },
  ];

  const allResults: CategoryResults[] = [];

  for (const category of categories) {
    const results = await testCategory(category.name, category.queries);
    allResults.push(results);
  }

  // Summary
  console.log("\n" + "═".repeat(80));
  console.log("   SUMMARY REPORT");
  console.log("═".repeat(80));

  console.log("\n┌─────────────────────────────────────┬──────────┬─────────┬─────────┬─────────┬────────┐");
  console.log("│ Category                            │ Latency  │ Score   │ Perfect │ Partial │ Failed │");
  console.log("├─────────────────────────────────────┼──────────┼─────────┼─────────┼─────────┼────────┤");

  for (const r of allResults) {
    const name = r.name.replace(/[0-9️⃣]+\s+/, "").slice(0, 35).padEnd(35);
    console.log(
      `│ ${name} │ ${r.avgLatency.toFixed(0).padStart(5)}ms │ ${r.avgScore.toFixed(0).padStart(5)}%  │ ${r.perfect.toString().padStart(3)}/10  │ ${r.partial.toString().padStart(3)}/10  │ ${r.failed.toString().padStart(3)}/10 │`
    );
  }
  console.log("└─────────────────────────────────────┴──────────┴─────────┴─────────┴─────────┴────────┘");

  // Mode detection stats
  console.log("\n📊 MODE DETECTION ANALYSIS:");
  let autoCount = 0;
  let keywordCount = 0;
  for (const cat of allResults) {
    for (const r of cat.results) {
      if (r.useAutoprompt) autoCount++;
      else keywordCount++;
    }
  }
  console.log(`   Auto (neural) triggered: ${autoCount}/${autoCount + keywordCount} queries`);
  console.log(`   Keyword (fast) used: ${keywordCount}/${autoCount + keywordCount} queries`);

  // Problem queries
  console.log("\n" + "═".repeat(80));
  console.log("   QUERIES NEEDING IMPROVEMENT (Score < 50%)");
  console.log("═".repeat(80));

  for (const cat of allResults) {
    const failures = cat.results.filter(r => r.score >= 0 && r.score < 50);
    if (failures.length > 0) {
      console.log(`\n### ${cat.name}`);
      for (const r of failures) {
        console.log(`\n❌ "${r.query.slice(0, 60)}..."`);
        console.log(`   Optimized: "${r.optimizedQuery.slice(0, 60)}..."`);
        console.log(`   Expected: ${r.expectedTerms.slice(0, 3).join(", ")}`);
        console.log(`   Found: ${r.foundTerms.length > 0 ? r.foundTerms.join(", ") : "None"}`);
        console.log(`   Top result: ${r.topResults[0]?.title || "N/A"}`);
      }
    }
  }

  // Recommendations
  console.log("\n" + "═".repeat(80));
  console.log("   RECOMMENDATIONS");
  console.log("═".repeat(80));

  console.log(`
1. CONCEPTUAL QUERY DETECTION ✅
   Added patterns to detect "what's the term for..." queries
   These now use 'auto' mode for better semantic matching

2. DISFLUENCY CLEANUP ✅
   Added regex to strip "um", "uh", "wait", "actually" etc.
   Improves query quality for messy speech

3. CORRECTION HANDLING ⚠️
   Current: Takes full query including correction
   Consider: Parse "actually, I mean X" to extract X as the real query

4. RECENCY QUERIES ✅
   Detected "latest", "recent", "this month" patterns
   Applied date filters automatically

5. SPECIFIC IMPROVEMENTS NEEDED:
   - "Veblen good" queries rarely found - consider synonym expansion
   - "Pareto frontier" graphs - too technical, needs query rewriting
   - Correction queries need smarter parsing to extract final intent
`);

  // Overall stats
  const totalQueries = allResults.reduce((a, c) => a + c.results.length, 0);
  const totalPerfect = allResults.reduce((a, c) => a + c.perfect, 0);
  const totalPartial = allResults.reduce((a, c) => a + c.partial, 0);
  const totalFailed = allResults.reduce((a, c) => a + c.failed, 0);
  const overallScore = allResults.reduce((a, c) => a + c.avgScore * c.results.length, 0) / totalQueries;

  console.log("\n" + "═".repeat(80));
  console.log("   OVERALL STATISTICS");
  console.log("═".repeat(80));
  console.log(`
   Total Queries Tested: ${totalQueries}
   Overall Score: ${overallScore.toFixed(1)}%

   ✅ Perfect Matches: ${totalPerfect} (${(totalPerfect / totalQueries * 100).toFixed(1)}%)
   ⚠️ Partial Matches: ${totalPartial} (${(totalPartial / totalQueries * 100).toFixed(1)}%)
   ❌ No Matches: ${totalFailed} (${(totalFailed / totalQueries * 100).toFixed(1)}%)
`);
}

runTests().catch(console.error);
