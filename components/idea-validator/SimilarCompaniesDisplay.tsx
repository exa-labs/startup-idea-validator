import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Users, MapPin, DollarSign, TrendingUp, Calendar } from 'lucide-react';

interface EntityData {
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
}

interface Company {
  title: string;
  url: string;
  text?: string;
  image?: string;
  publishedDate?: string;
  score?: number;
  entity?: EntityData | null;
}

interface SimilarCompaniesDisplayProps {
  companies: Company[];
}

const extractDomain = (url: string) => {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return domain;
  } catch {
    return url;
  }
};

const formatNumber = (num: number): string => {
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
  return `$${num}`;
};

const formatTraffic = (num: number): string => {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)}K`;
  return `${num}`;
};

export default function SimilarCompaniesDisplay({ companies }: SimilarCompaniesDisplayProps) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_DISPLAY_COUNT = 6;

  if (!companies?.length) return null;

  // Prioritize companies with entity data
  const sortedCompanies = [...companies].sort((a, b) => {
    if (a.entity && !b.entity) return -1;
    if (!a.entity && b.entity) return 1;
    return 0;
  });

  const visibleCompanies = showAll
    ? sortedCompanies
    : sortedCompanies.slice(0, INITIAL_DISPLAY_COUNT);

  const hasMore = sortedCompanies.length > INITIAL_DISPLAY_COUNT;

  return (
    <div>
      <h2 className="text-2xl font-normal pb-4">
        Similar Companies ({companies.length} found)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCompanies.map((company) => (
          <a
            key={company.url}
            href={company.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white p-5 border rounded-lg hover:ring-brand-default hover:ring-1 transition-all duration-200 group block"
          >
            {/* Header with logo and title */}
            <div className="flex items-start gap-3 mb-3">
              {company.image ? (
                <img
                  src={company.image}
                  alt={company.title}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-400 text-lg font-medium">
                    {company.title?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-medium text-brand-default group-hover:text-brand-default/80 transition-colors truncate">
                    {company.entity?.name || company.title || extractDomain(company.url)}
                  </h3>
                  <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-brand-default transition-colors flex-shrink-0" />
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {extractDomain(company.url)}
                </p>
              </div>
            </div>

            {/* Entity data badges */}
            {company.entity && (
              <div className="flex flex-wrap gap-2 mb-3">
                {company.entity.workforce && (
                  <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                    <Users className="w-3 h-3" />
                    {company.entity.workforce.toLocaleString()}
                  </span>
                )}
                {company.entity.headquarters?.city && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                    <MapPin className="w-3 h-3" />
                    {company.entity.headquarters.city}
                  </span>
                )}
                {company.entity.foundedYear && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                    <Calendar className="w-3 h-3" />
                    {company.entity.foundedYear}
                  </span>
                )}
              </div>
            )}

            {/* Financials row */}
            {company.entity?.financials && (
              <div className="flex flex-wrap gap-2 mb-3">
                {company.entity.financials.fundingTotal && (
                  <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                    <DollarSign className="w-3 h-3" />
                    {formatNumber(company.entity.financials.fundingTotal)} raised
                  </span>
                )}
                {company.entity.financials.revenueAnnual && (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">
                    <TrendingUp className="w-3 h-3" />
                    {formatNumber(company.entity.financials.revenueAnnual)}/yr
                  </span>
                )}
              </div>
            )}

            {/* Web traffic */}
            {company.entity?.webTraffic && (
              <div className="mb-3">
                <span className="text-xs text-gray-500">
                  {formatTraffic(company.entity.webTraffic)} monthly visits
                </span>
              </div>
            )}

            {/* Description */}
            {(company.entity?.description || company.text) && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {company.entity?.description || company.text}
              </p>
            )}
          </a>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-start mt-6">
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowAll(!showAll);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <span>{showAll ? 'Show Less' : `Show ${sortedCompanies.length - INITIAL_DISPLAY_COUNT} More`}</span>
            {showAll ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
