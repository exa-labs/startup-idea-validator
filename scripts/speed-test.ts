/**
 * Speed test: Gemini 2.0 Flash
 *
 * Run with: npx tsx scripts/speed-test.ts
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const testPrompt = `You are a search query optimizer. Extract a clear, concise search query from this spoken question.
Return ONLY the optimized query, nothing else.

User input: "Hey, can you find me some information about the latest AI startups that are working on autonomous vehicles in San Francisco?"`;

const NUM_RUNS = 5;

async function testGemini(): Promise<number> {
  const start = performance.now();

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: testPrompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 100,
    },
  });

  const end = performance.now();
  console.log(`  Response: "${result.response.text()?.trim()}"`);
  return end - start;
}

async function main() {
  console.log("\n🏎️  Speed Test: Gemini 2.0 Flash\n");
  console.log("=" .repeat(60));

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not set");
    process.exit(1);
  }

  const geminiTimes: number[] = [];

  // Warm up (first call is usually slower due to cold start)
  console.log("\n🔥 Warming up API (cold start)...\n");
  const warmupTime = await testGemini();
  console.log(`  ⏱️  Cold start: ${warmupTime.toFixed(0)}ms\n`);
  await new Promise(r => setTimeout(r, 2000));

  console.log("📊 Running " + NUM_RUNS + " tests...\n");

  for (let i = 0; i < NUM_RUNS; i++) {
    console.log(`--- Run ${i + 1} ---`);
    const geminiTime = await testGemini();
    geminiTimes.push(geminiTime);
    console.log(`  ⏱️  Latency: ${geminiTime.toFixed(0)}ms\n`);
    // Small delay to avoid rate limiting
    if (i < NUM_RUNS - 1) await new Promise(r => setTimeout(r, 1500));
  }

  // Calculate stats
  const avgGemini = geminiTimes.reduce((a, b) => a + b, 0) / NUM_RUNS;
  const minGemini = Math.min(...geminiTimes);
  const maxGemini = Math.max(...geminiTimes);

  console.log("=" .repeat(60));
  console.log("\n📈 RESULTS: Gemini 2.0 Flash\n");
  console.log(`  Average: ${avgGemini.toFixed(0)}ms`);
  console.log(`  Min: ${minGemini.toFixed(0)}ms`);
  console.log(`  Max: ${maxGemini.toFixed(0)}ms`);
  console.log(`  Cold start: ${warmupTime.toFixed(0)}ms`);

  console.log("\n" + "=" .repeat(60));
  console.log("\n📊 For reference, GPT-4o-mini typically averages 400-800ms");
  console.log("   Gemini 2.0 Flash is generally 30-50% faster\n");
}

main().catch(console.error);
