import React from 'react';
import { User } from 'firebase/auth';
import {
  LayoutDashboard,
  Users,
  Grid,
  Layers,
  Target,
  FileSpreadsheet,
  ExternalLink,
  Sun,
  Moon,
  HelpCircle,
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { WelltheraLogo } from './WelltheraLogo';

export type ActiveTab = 'overview' | 'partners' | 'rfm' | 'services' | 'cac' | 'sheet';

interface PowerBIHeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  isLoadingAuth: boolean;
  totalRevenue: number;
  totalCustomers: number;
  sheetUrl: string | null;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onOpenHelp?: () => void;
}

export const PowerBIHeader: React.FC<PowerBIHeaderProps> = ({
  activeTab,
  onTabChange,
  user,
  onSignIn,
  onSignOut,
  isLoadingAuth,
  totalRevenue,
  totalCustomers,
  sheetUrl,
  isDarkMode = false,
  onToggleTheme,
  onOpenHelp,
}) => {
  return (
    <header
      className={`border-b sticky top-0 z-30 transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
          : 'bg-[#f9f8f5] border-[#e7e3da] text-[#332e1e] shadow-sm'
      }`}
    >
      {/* Top Banner: Brand + Barrie Ontario Clinic Link + Quick Metric DAX + Google Sign In */}
      <div
        className={`px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b ${
          isDarkMode ? 'border-[#24291c]' : 'border-[#e7e3da]'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Wellthera Brand Logo Mark */}
          <div
            className={`p-2 rounded-xl border flex items-center justify-center transition-transform hover:scale-105 ${
              isDarkMode
                ? 'bg-[#1c2015] border-[#343a27]'
                : 'bg-[#f0ede6] border-[#e7e3da]'
            }`}
          >
            <WelltheraLogo
              size="md"
              variant={isDarkMode ? 'gold' : 'olive'}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif font-bold text-lg lg:text-xl tracking-tight flex items-center gap-2">
                <span>Wellthera Integrated Health</span>
                <span
                  className={`text-[11px] font-sans font-semibold px-2 py-0.5 rounded-full border ${
                    isDarkMode
                      ? 'bg-[#686e4a]/20 text-[#c7ccaa] border-[#686e4a]/40'
                      : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4]'
                  }`}
                >
                  Partner & Customer Intelligence
                </span>
              </h1>
            </div>
            <div
              className={`flex items-center gap-2 text-xs ${
                isDarkMode ? 'text-[#a2a992]' : 'text-[#6e6856]'
              }`}
            >
              <span>Barrie, ON • 464 Big Bay Point Rd</span>
              <span>•</span>
              <a
                href="https://www.wellthera.ca"
                target="_blank"
                rel="noreferrer"
                className="text-[#686e4a] dark:text-[#c7ccaa] font-semibold hover:underline flex items-center gap-1"
                title="Visit official website"
              >
                <span>wellthera.ca</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Center / Right Quick Metrics & Controls */}
        <div className="flex items-center gap-3 lg:gap-5">
          <div
            className={`hidden md:flex items-center gap-4 text-xs pr-4 border-r ${
              isDarkMode ? 'border-[#292e1e]' : 'border-[#e7e3da]'
            }`}
          >
            <div>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider block ${
                  isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                }`}
              >
                Clinic Gross
              </span>
              <span className="font-bold text-sm text-[#686e4a] dark:text-[#aab187]">
                ${totalRevenue.toLocaleString()} CAD
              </span>
            </div>
            <div>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider block ${
                  isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                }`}
              >
                Patients
              </span>
              <span className="font-bold text-sm">
                {totalCustomers} Tracked
              </span>
            </div>
          </div>

          {/* Theme switcher toggle between Wellthera Cream (Website Look) & Noir Atelier */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
                isDarkMode
                  ? 'bg-[#1c2015] border-[#343a27] text-[#e7e3da] hover:bg-[#252a1c]'
                  : 'bg-[#f0ede6] border-[#e7e3da] text-[#332e1e] hover:bg-[#e7e3da]'
              }`}
              title="Toggle between Wellthera Cream and Dark mode"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#e6b000]" />
                  <span className="hidden sm:inline text-[11px] font-medium">Cream Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#686e4a]" />
                  <span className="hidden sm:inline text-[11px] font-medium">Dark Mode</span>
                </>
              )}
            </button>
          )}

          {/* Help & Setup Instructions Modal Trigger ("?" Icon) */}
          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                isDarkMode
                  ? 'bg-[#1c2015] border-[#343a27] text-[#c7ccaa] hover:bg-[#252a1c] hover:border-[#686e4a]'
                  : 'bg-[#edf0e6] border-[#bcc2a4] text-[#52573a] hover:bg-[#dfe4d3] hover:border-[#686e4a]'
              }`}
              title="Setup & Integration Guide (?)"
            >
              <HelpCircle className="w-4 h-4 text-[#686e4a] dark:text-[#aab187]" />
              <span className="hidden sm:inline text-[11px]">Setup Guide</span>
              <span className="w-4 h-4 rounded-full bg-[#686e4a] text-white text-[10px] flex items-center justify-center font-bold">
                ?
              </span>
            </button>
          )}

          {/* Google Workspace Authentication Button */}
          <GoogleSignInButton
            user={user}
            onSignIn={onSignIn}
            onSignOut={onSignOut}
            isLoading={isLoadingAuth}
          />
        </div>
      </div>

      {/* Power BI Navigation Bar with Wellthera Pills */}
      <div
        className={`px-4 lg:px-6 py-2 flex items-center justify-between gap-2 overflow-x-auto ${
          isDarkMode ? 'bg-[#181b11]' : 'bg-[#f0ede6]'
        }`}
      >
        <nav className="flex items-center gap-1.5 min-w-max">
          {[
            { id: 'overview' as const, label: 'Executive Overview', icon: LayoutDashboard },
            { id: 'partners' as const, label: 'Partner ROI Matrix', icon: Users },
            { id: 'rfm' as const, label: 'RFM Customer Matrix', icon: Grid },
            { id: 'services' as const, label: 'Services Breakdown', icon: Layers },
            { id: 'cac' as const, label: 'CAC Cost Analysis', icon: Target },
            {
              id: 'sheet' as const,
              label: 'Google Sheets Tracker',
              icon: FileSpreadsheet,
              highlight: true,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#686e4a] text-white shadow-sm font-semibold'
                    : isDarkMode
                    ? 'text-[#c2c8b0] hover:bg-[#23271b] hover:text-white'
                    : 'text-[#554e38] hover:bg-[#e7e3da] hover:text-[#100e0a]'
                } ${
                  tab.highlight && !isActive
                    ? isDarkMode
                      ? 'border border-[#686e4a]/40 bg-[#686e4a]/15 text-[#d8dec4]'
                      : 'border border-[#bcc2a4] bg-[#edf0e6] text-[#4a5035]'
                    : ''
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />
                <span>{tab.label}</span>
                {tab.highlight && sheetUrl && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>

        {sheetUrl && (
          <a
            href={sheetUrl}
            target="_blank"
            rel="noreferrer"
            className={`hidden lg:flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border transition-colors ${
              isDarkMode
                ? 'bg-[#1e2316] text-[#c7ccaa] border-[#383f2a] hover:bg-[#282e1e]'
                : 'bg-[#f9f8f5] text-[#52573a] border-[#bcc2a4] hover:bg-[#edf0e6]'
            }`}
          >
            <span>Open in Google Sheets</span>
            <ExternalLink className="w-3 h-3 text-[#686e4a]" />
          </a>
        )}
      </div>
    </header>
  );
};
