"use client";

import { useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface SearchResult {
  title: string;
  url: string;
  text?: string;
  image?: string | null;
  publishedDate?: string | null;
  score?: number | null;
}

interface VoiceSearchResultsProps {
  results: SearchResult[];
}

export default function VoiceSearchResults({ results }: VoiceSearchResultsProps) {
  const [showAll, setShowAll] = useState(false);
  const displayedResults = showAll ? results : results.slice(0, 5);

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-4 font-diatype">
      <h2 className="font-arizona text-lg font-medium text-exa-black">
        Search Results ({results.length})
      </h2>

      <div className="overflow-hidden rounded-lg border border-exa-gray-300 bg-white shadow-tag">
        <table className="w-full">
          <thead>
            <tr className="border-b border-exa-gray-300 bg-exa-gray-100">
              <th className="px-4 py-3 text-left text-xs font-medium text-exa-gray-600 uppercase tracking-wide">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-exa-gray-600 uppercase tracking-wide hidden sm:table-cell">
                Source
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-exa-gray-600 uppercase tracking-wide hidden md:table-cell">
                Summary
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedResults.map((result, index) => (
              <tr
                key={index}
                className="border-b border-exa-gray-200 last:border-b-0 hover:bg-exa-gray-100 transition-colors"
              >
                <td className="px-4 py-3">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2"
                  >
                    <span className="text-sm text-exa-black group-hover:text-exa-blue transition-colors line-clamp-2">
                      {result.title || "Untitled"}
                    </span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0 text-exa-gray-400 group-hover:text-exa-blue mt-1" />
                  </a>
                  {/* Mobile: show source and summary below title */}
                  <div className="sm:hidden mt-1">
                    <span className="text-xs text-exa-gray-600">
                      {getDomain(result.url)}
                    </span>
                  </div>
                  <div className="md:hidden mt-1">
                    {result.text && (
                      <p className="text-xs text-exa-gray-600 line-clamp-2">
                        {result.text}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] text-exa-gray-600">
                      {getDomain(result.url)}
                    </span>
                    {result.publishedDate && (
                      <span className="text-[11px] text-exa-gray-500">
                        {formatDate(result.publishedDate)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {result.text ? (
                    <p className="text-[13px] text-exa-gray-600 line-clamp-2">
                      {result.text}
                    </p>
                  ) : (
                    <span className="text-[13px] text-exa-gray-400 italic">
                      No summary available
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Show more/less button */}
      {results.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 mx-auto text-sm text-exa-blue hover:text-exa-blue-light transition-colors font-medium"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show all {results.length} results
            </>
          )}
        </button>
      )}
    </div>
  );
}
