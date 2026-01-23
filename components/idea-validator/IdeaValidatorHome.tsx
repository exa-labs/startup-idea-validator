"use client";

import { useState, FormEvent, KeyboardEvent } from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";
import SimilarCompaniesDisplay from "./SimilarCompaniesDisplay";
import LandscapeAnalysis from "./LandscapeAnalysis";
import { IdeaValidatorSkeleton } from "./IdeaValidatorSkeletons";

interface Company {
  title: string;
  url: string;
  text?: string;
  image?: string;
  publishedDate?: string;
  score?: number;
  entity?: {
    name: string;
    description?: string;
    foundedYear?: number;
    workforce?: number;
    headquarters?: {
      city?: string;
      country?: string;
    };
    financials?: {
      revenueAnnual?: number;
      fundingTotal?: number;
      fundingLatestRound?: {
        name?: string;
        date?: string;
        amount?: number;
      };
    };
    webTraffic?: number;
  } | null;
}

interface Analysis {
  overview: string;
  keyPlayers: { name: string; description: string }[];
  gaps: string[];
  recommendation: string;
  uniquenessScore: number;
}

const EXAMPLE_IDEAS = [
  "A Tamagotchi but it's your GitHub commit streak",
  "Uber for dog walking",
  "AI-powered resume builder",
  "Notion for personal finance",
];

export default function IdeaValidatorHome() {
  const [idea, setIdea] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [similarCompanies, setSimilarCompanies] = useState<Company[] | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchSimilarCompanies = async (ideaText: string) => {
    const response = await fetch('/api/validate-idea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea: ideaText }),
    });

    if (!response.ok) {
      throw new Error('Failed to find similar companies');
    }

    const data = await response.json();
    return data.results as Company[];
  };

  const fetchAnalysis = async (ideaText: string, companies: Company[]) => {
    const response = await fetch('/api/analyze-landscape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idea: ideaText, companies }),
    });

    if (!response.ok) {
      throw new Error('Failed to analyze competitive landscape');
    }

    const data = await response.json();
    return data.result as Analysis;
  };

  const handleValidate = async (e: FormEvent) => {
    e.preventDefault();

    if (!idea.trim()) {
      setErrors({ form: "Please enter a startup idea" });
      return;
    }

    if (idea.trim().length < 10) {
      setErrors({ form: "Please describe your idea in more detail (at least 10 characters)" });
      return;
    }

    setIsValidating(true);
    setErrors({});
    setSimilarCompanies(null);
    setAnalysis(null);

    try {
      const companies = await fetchSimilarCompanies(idea);
      setSimilarCompanies(companies);

      if (companies.length > 0) {
        const analysisResult = await fetchAnalysis(idea, companies);
        setAnalysis(analysisResult);
      }
    } catch (error) {
      setErrors({
        api: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleExampleClick = (exampleIdea: string) => {
    setIdea(exampleIdea);
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 4) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Highly Unique';
    if (score >= 6) return 'Moderate Competition';
    if (score >= 4) return 'Competitive Market';
    return 'Saturated Market';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 7) return 'bg-green-500';
    if (score >= 4) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-full min-h-screen flex flex-col items-center pt-16 pb-32 px-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 mb-8 max-w-[600px]">
        <h1 className="text-[32px] md:text-[40px] font-normal text-center tracking-[-0.02em] leading-[1.2]">
          Startup Idea Validator
        </h1>
        <p className="text-[15px] text-[#787572] text-center leading-[1.6] max-w-[420px]">
          Check if your startup idea already exists. Find similar companies and understand the competitive landscape.
        </p>
      </div>

      {/* Form Container */}
      <div className="w-full max-w-[560px] flex flex-col gap-4">
        <form
          onSubmit={handleValidate}
          className="flex flex-col w-full overflow-hidden rounded-[8px] sm:rounded-[12px] border-[0.5px] border-[#e0e0e0] bg-white p-0.5 hover:border-[#c0c0c0] focus-within:border-[#c0c0c0] [box-shadow:0_4px_10px_-1px_rgba(0,0,0,0.03),0_1px_4px_-1px_rgba(0,0,0,0.04),0_0.5px_2px_-1px_rgba(0,0,0,0.05)] focus-within:[box-shadow:0_4px_10px_-1px_rgba(0,0,0,0.05),0_1px_4px_-1px_rgba(0,0,0,0.06),0_0.5px_2px_-1px_rgba(0,0,0,0.08)] [transition:box-shadow_100ms_ease-in-out,border-color_100ms_ease-in-out]"
        >
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (idea.trim()) {
                  e.currentTarget.form?.requestSubmit();
                }
              }
            }}
            placeholder="Describe your startup idea..."
            disabled={isValidating}
            rows={1}
            className="flex-1 resize-none rounded-none border-none shadow-none outline-none ring-0 bg-transparent text-[#1a1a1a] focus:ring-0 focus:outline-none [field-sizing:content] max-h-[8lh] overflow-y-auto text-[15px] p-3"
          />

          {/* Toolbar with submit button */}
          <div className="flex items-center justify-between p-1.5 sm:p-2">
            <div className="flex items-center gap-2">
              {/* Placeholder for future toolbar items */}
            </div>
            <div className="h-[33px] mr-[1px]">
              <button
                type="submit"
                disabled={isValidating || !idea.trim()}
                className="relative h-full px-3 gap-1.5 rounded-[8px] text-white transition-all duration-200 ease-in-out hover:scale-[1.03] disabled:opacity-50 disabled:cursor-not-allowed [background:linear-gradient(180deg,#001651_0%,#0040F0_100%)] [box-shadow:inset_0_-1.5px_2px_0_#638DFF,inset_0_0_10px_0_#0043FB,inset_0_0_8px_0_#0043FB] disabled:[box-shadow:none]"
              >
                <ArrowUp className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </form>

        {/* Example ideas */}
        <div className="flex flex-wrap gap-2">
          <span className="text-[13px] text-[#787572]">Try:</span>
          {EXAMPLE_IDEAS.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => handleExampleClick(example)}
              disabled={isValidating}
              className="text-[13px] px-3 py-1 bg-[#fef6e3] hover:bg-[#fcecc4] text-[#89805d] rounded-full transition-colors disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>

        {/* Powered by */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-[13px] text-[#787572]">Powered by</span>
          <a
            href="https://exa.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img src="/exa_logo.png" alt="Exa" className="h-5 object-contain" />
          </a>
        </div>
      </div>

      {/* Error display */}
      {Object.entries(errors).map(([key, message]) => (
        <div key={key} className="w-full max-w-[480px] mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-[14px] rounded">
          {message}
        </div>
      ))}

      {/* Loading state */}
      {isValidating && (
        <div className="w-full max-w-[900px] mt-12">
          <IdeaValidatorSkeleton />
        </div>
      )}

      {/* Results */}
      {!isValidating && (similarCompanies !== null || analysis !== null) && (
        <div className="w-full max-w-[900px] mt-12 space-y-10">
          {/* Uniqueness Score */}
          {analysis && (
            <div className="bg-white border border-[#e0e0e0] rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[18px] font-medium mb-1">Uniqueness Score</h2>
                  <p className={`text-[14px] ${getScoreColor(analysis.uniquenessScore)}`}>
                    {getScoreLabel(analysis.uniquenessScore)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[36px] font-medium ${getScoreColor(analysis.uniquenessScore)}`}>
                    {analysis.uniquenessScore}
                  </span>
                  <span className="text-[18px] text-[#787572]">/10</span>
                </div>
              </div>
              {/* Score bar */}
              <div className="mt-4 h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getScoreBgColor(analysis.uniquenessScore)}`}
                  style={{ width: `${analysis.uniquenessScore * 10}%` }}
                />
              </div>
            </div>
          )}

          {/* Similar Companies */}
          {similarCompanies && similarCompanies.length > 0 && (
            <SimilarCompaniesDisplay companies={similarCompanies} />
          )}

          {/* No companies found */}
          {similarCompanies && similarCompanies.length === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <h3 className="text-[18px] font-medium text-green-800 mb-2">
                No Similar Companies Found
              </h3>
              <p className="text-[15px] text-green-700">
                Your idea appears to be unique! We couldn't find existing companies doing exactly this.
              </p>
            </div>
          )}

          {/* Competitive Analysis */}
          {analysis && (
            <LandscapeAnalysis analysis={analysis} />
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 w-full py-4 bg-white border-t border-[#e0e0e0]">
        <div className="flex items-center justify-center gap-6 text-[14px]">
          <Link
            href="https://exa.ai/demos"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#787572] hover:text-black hover:underline transition-colors"
          >
            More Demos
          </Link>
          <span className="text-[#e0e0e0]">|</span>
          <Link
            href="https://dashboard.exa.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#787572] hover:text-black hover:underline transition-colors"
          >
            Try Exa API
          </Link>
        </div>
      </footer>
    </div>
  );
}
