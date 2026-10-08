import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subValue?: string;
  changePercent?: number;
  changeLabel?: string;
  targetInfo?: string;
  color?: 'olive' | 'gold' | 'ink' | 'rose' | 'amber';
  icon?: React.ReactNode;
  isDarkMode?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subValue,
  changePercent,
  changeLabel = 'vs previous period',
  targetInfo,
  color = 'olive',
  icon,
  isDarkMode = false,
}) => {
  const colorMap = {
    olive: {
      borderLight: 'border-[#bcc2a4] hover:border-[#686e4a]',
      borderDark: 'border-[#383f2a] hover:border-[#686e4a]',
      accentLight: 'text-[#686e4a]',
      accentDark: 'text-[#aab187]',
      topBar: 'bg-[#686e4a]',
      iconBgLight: 'bg-[#edf0e6] text-[#52573a]',
      iconBgDark: 'bg-[#1e2316] text-[#c7ccaa]',
    },
    gold: {
      borderLight: 'border-[#f4d068] hover:border-[#e6b000]',
      borderDark: 'border-[#4a4220] hover:border-[#e6b000]',
      accentLight: 'text-[#b88c00]',
      accentDark: 'text-[#e6b000]',
      topBar: 'bg-[#e6b000]',
      iconBgLight: 'bg-[#fff9e6] text-[#b88c00]',
      iconBgDark: 'bg-[#292412] text-[#e6b000]',
    },
    ink: {
      borderLight: 'border-[#e7e3da] hover:border-[#8f8875]',
      borderDark: 'border-[#2d3222] hover:border-[#4d553a]',
      accentLight: 'text-[#332e1e]',
      accentDark: 'text-[#f9f8f5]',
      topBar: 'bg-[#332e1e] dark:bg-[#c2c8b0]',
      iconBgLight: 'bg-[#f0ede6] text-[#332e1e]',
      iconBgDark: 'bg-[#1e2316] text-[#e7e3da]',
    },
    rose: {
      borderLight: 'border-[#eec2b8] hover:border-[#bf5a47]',
      borderDark: 'border-[#46231d] hover:border-[#bf5a47]',
      accentLight: 'text-[#b84a36]',
      accentDark: 'text-[#e8816f]',
      topBar: 'bg-[#b84a36]',
      iconBgLight: 'bg-[#faeee9] text-[#b84a36]',
      iconBgDark: 'bg-[#2b1815] text-[#e8816f]',
    },
    amber: {
      borderLight: 'border-[#e8d5b5] hover:border-[#c28e46]',
      borderDark: 'border-[#3f3521] hover:border-[#c28e46]',
      accentLight: 'text-[#a36f2b]',
      accentDark: 'text-[#dfa558]',
      topBar: 'bg-[#a36f2b]',
      iconBgLight: 'bg-[#faf2e6] text-[#a36f2b]',
      iconBgDark: 'bg-[#272115] text-[#dfa558]',
    },
  };

  const scheme = colorMap[color] || colorMap.olive;

  return (
    <div
      className={`relative rounded-xl p-4.5 border transition-all duration-200 overflow-hidden group shadow-sm ${
        isDarkMode
          ? `bg-[#1a1e13] ${scheme.borderDark} text-[#f9f8f5]`
          : `bg-[#ffffff] ${scheme.borderLight} text-[#332e1e]`
      }`}
    >
      {/* Top accent line typical in Power BI Fabric tiles */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${scheme.topBar}`} />

      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={`text-[11px] font-bold uppercase tracking-wider truncate font-sans ${
            isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
          }`}
        >
          {title}
        </span>
        {icon && (
          <div
            className={`p-2 rounded-lg transition-transform group-hover:scale-105 ${
              isDarkMode ? scheme.iconBgDark : scheme.iconBgLight
            }`}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl lg:text-3xl font-bold tracking-tight font-serif">
          {value}
        </span>
        {subValue && (
          <span
            className={`text-xs font-medium font-sans ${
              isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
            }`}
          >
            {subValue}
          </span>
        )}
      </div>

      {/* Trend & Target Status */}
      <div
        className={`flex flex-wrap items-center justify-between gap-1 text-[11px] pt-2 border-t ${
          isDarkMode ? 'border-[#24291c]' : 'border-[#f0ede6]'
        }`}
      >
        {changePercent !== undefined ? (
          <div className="flex items-center gap-1 font-sans">
            {changePercent > 0 ? (
              <span className="flex items-center text-[#557738] dark:text-[#83ab5d] font-bold gap-0.5">
                <TrendingUp className="w-3 h-3" />
                +{changePercent}%
              </span>
            ) : changePercent < 0 ? (
              <span className="flex items-center text-[#b84a36] dark:text-[#e8816f] font-bold gap-0.5">
                <TrendingDown className="w-3 h-3" />
                {changePercent}%
              </span>
            ) : (
              <span
                className={`flex items-center font-bold gap-0.5 ${
                  isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                }`}
              >
                <Minus className="w-3 h-3" />
                0%
              </span>
            )}
            <span
              className={isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'}
            >
              {changeLabel}
            </span>
          </div>
        ) : (
          <span
            className={`font-sans ${
              isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
            }`}
          >
            {changeLabel}
          </span>
        )}

        {targetInfo && (
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isDarkMode
                ? 'bg-[#14160e] text-[#a2a992] border-[#292e1e]'
                : 'bg-[#f9f8f5] text-[#554e38] border-[#e7e3da]'
            }`}
          >
            {targetInfo}
          </span>
        )}
      </div>
    </div>
  );
};
