import React from 'react';

interface Analysis {
  overview: string;
  keyPlayers: { name: string; description: string }[];
  gaps: string[];
  recommendation: string;
  uniquenessScore: number;
}

interface LandscapeAnalysisProps {
  analysis: Analysis;
}

export default function LandscapeAnalysis({ analysis }: LandscapeAnalysisProps) {
  return (
    <div className="bg-white border border-[#e0e0e0] rounded-lg p-6 space-y-6">
      <h2 className="text-[20px] font-medium">Competitive Landscape Analysis</h2>

      {/* Market Overview */}
      <div>
        <h3 className="text-[16px] font-medium mb-2 text-[#1a1a1a]">
          Market Overview
        </h3>
        <p className="text-[15px] text-[#4a4a4a] leading-[1.6]">{analysis.overview}</p>
      </div>

      {/* Key Players */}
      {analysis.keyPlayers && analysis.keyPlayers.length > 0 && (
        <div>
          <h3 className="text-[16px] font-medium mb-3 text-[#1a1a1a]">
            Key Players
          </h3>
          <div className="space-y-2">
            {analysis.keyPlayers.map((player, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-[#1f40ed] font-medium text-[15px]">{player.name}</span>
                <span className="text-[#c0c0c0]">—</span>
                <span className="text-[#4a4a4a] text-[15px]">{player.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gaps & Opportunities */}
      {analysis.gaps && analysis.gaps.length > 0 && (
        <div>
          <h3 className="text-[16px] font-medium mb-3 text-[#1a1a1a]">
            Gaps & Opportunities
          </h3>
          <ul className="space-y-2">
            {analysis.gaps.map((gap, index) => (
              <li key={index} className="flex items-start gap-3 text-[15px] text-[#4a4a4a]">
                <span className="text-green-600 font-medium">+</span>
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendation */}
      <div className="border-t border-[#e0e0e0] pt-6">
        <h3 className="text-[16px] font-medium mb-2 text-[#1a1a1a]">
          Recommendation
        </h3>
        <p className="text-[15px] text-[#4a4a4a] leading-[1.6]">{analysis.recommendation}</p>
      </div>
    </div>
  );
}
