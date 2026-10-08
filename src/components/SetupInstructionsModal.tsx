import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  FileSpreadsheet,
  FolderSync,
  Github,
  Key,
  ExternalLink,
  Copy,
  Check,
  BookOpen,
  Users,
  Grid,
  TrendingUp,
  ShieldCheck,
  CloudUpload,
  Layers,
} from 'lucide-react';
import {
  DEFAULT_TARGET_DRIVE_FOLDER_ID,
  DEFAULT_TARGET_DRIVE_FOLDER_URL,
} from '../services/googleSheets';

interface SetupInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
  hasGoogleAuth?: boolean;
  onOpenGoogleSheetTab?: () => void;
}

export const SetupInstructionsModal: React.FC<SetupInstructionsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = false,
  hasGoogleAuth = false,
  onOpenGoogleSheetTab,
}) => {
  const [activeTab, setActiveTab] = useState<'management' | 'drive' | 'github' | 'config'>('drive');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const targetFolderUrl = DEFAULT_TARGET_DRIVE_FOLDER_URL;
  const targetFolderId = DEFAULT_TARGET_DRIVE_FOLDER_ID;
  const githubRepoUrl = 'https://github.com/Samuel-Wellthera/Wellthera-Landing-Page';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border transition-colors ${
          isDarkMode
            ? 'bg-[#181b12] border-[#292e1e] text-[#f9f8f5]'
            : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
        }`}
      >
        {/* Top Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-start justify-between gap-4 ${
            isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f0ede6] border-[#e7e3da]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border flex items-center justify-center ${
                isDarkMode
                  ? 'bg-[#686e4a]/15 text-[#c7ccaa] border-[#686e4a]/30'
                  : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4]'
              }`}
            >
              <HelpCircle className="w-6 h-6 text-[#686e4a] dark:text-[#aab187]" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight">
                Setup, Management & Deployment Guide
              </h2>
              <p
                className={`text-xs mt-0.5 ${
                  isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
                }`}
              >
                Wellthera Integrated Health • Customer RFM, Partner ROI & Google Drive/Sheets Integration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors ${
              isDarkMode
                ? 'bg-[#14160e] border-[#292e1e] text-[#8b927a] hover:text-white'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#6e6856] hover:text-[#100e0a]'
            }`}
            title="Close instructions"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`flex items-center gap-1.5 px-4 sm:px-6 pt-2.5 border-b overflow-x-auto ${
            isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f9f8f5] border-[#e7e3da]'
          }`}
        >
          {[
            { id: 'drive' as const, label: 'Google Drive & Sheets', icon: FileSpreadsheet },
            { id: 'github' as const, label: 'GitHub Repository Deployment', icon: Github },
            { id: 'management' as const, label: 'Dashboard & RFM Guide', icon: BookOpen },
            { id: 'config' as const, label: 'Environment & Cloud Config', icon: Key },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-t-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap ${
                  isActive
                    ? isDarkMode
                      ? 'bg-[#181b12] text-[#e6b000] border-t-2 border-[#e6b000] border-x border-[#292e1e]'
                      : 'bg-[#ffffff] text-[#52573a] border-t-2 border-[#686e4a] border-x border-[#e7e3da]'
                    : isDarkMode
                    ? 'text-[#8b927a] hover:text-[#f9f8f5]'
                    : 'text-[#6e6856] hover:text-[#100e0a]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* TAB 1: GOOGLE DRIVE & SHEETS */}
          {activeTab === 'drive' && (
            <div className="space-y-5">
              {/* Target Folder Callout Box */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#686e4a]/40 text-[#f9f8f5]'
                    : 'bg-[#edf0e6] border-[#bcc2a4] text-[#332e1e]'
                }`}
              >
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#686e4a] dark:text-[#c7ccaa] block">
                    Designated Customer Google Drive Folder
                  </span>
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <FolderSync className="w-4 h-4 text-[#686e4a]" />
                    <span>Target Folder ID:</span>
                    <code className="font-mono text-xs px-2 py-0.5 rounded bg-black/10 dark:bg-white/10">
                      {targetFolderId}
                    </code>
                  </div>
                  <p className="text-[11px] opacity-80 max-w-xl">
                    Spreadsheets created from this dashboard will automatically be saved and organized inside this shared Drive folder.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => copyToClipboard(targetFolderUrl, 'folder-url')}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      isDarkMode
                        ? 'bg-[#1c2015] border-[#292e1e] hover:bg-[#252a1c]'
                        : 'bg-[#ffffff] border-[#e7e3da] hover:bg-[#f0ede6]'
                    }`}
                  >
                    {copiedKey === 'folder-url' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#686e4a]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  <a
                    href={targetFolderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-semibold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span>Open in Drive</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="space-y-4">
                <h3 className="font-serif text-base font-bold flex items-center gap-2">
                  <span>How to Connect & Populate Google Sheets:</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e]'
                        : 'bg-[#f9f8f5] border-[#e7e3da]'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#686e4a] text-white font-bold flex items-center justify-center text-xs">
                      1
                    </div>
                    <div className="font-bold text-sm">Sign in with Google</div>
                    <p className="text-[11px] opacity-80 leading-relaxed">
                      Click the official <strong>"Sign in with Google"</strong> button at the top-right of the dashboard. Accept the Google Sheets & Drive permissions requested by your app.
                    </p>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e]'
                        : 'bg-[#f9f8f5] border-[#e7e3da]'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#686e4a] text-white font-bold flex items-center justify-center text-xs">
                      2
                    </div>
                    <div className="font-bold text-sm">Create / Sync Spreadsheet</div>
                    <p className="text-[11px] opacity-80 leading-relaxed">
                      Navigate to the <strong>Google Sheets Tracker</strong> tab and click <strong>"Create Google Sheet in Drive"</strong>. It builds a structured 4-tab workbook and moves it into your designated folder.
                    </p>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl border space-y-1.5 ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e]'
                        : 'bg-[#f9f8f5] border-[#e7e3da]'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-[#686e4a] text-white font-bold flex items-center justify-center text-xs">
                      3
                    </div>
                    <div className="font-bold text-sm">Automated Real-Time Sync</div>
                    <p className="text-[11px] opacity-80 leading-relaxed">
                      Any new customer, partner referral, or service log added in the dashboard can be pushed live into Google Sheets with the <strong>"Sync to Sheet"</strong> button.
                    </p>
                  </div>
                </div>

                {/* 4-Tab Schema Detail */}
                <div
                  className={`p-4 rounded-xl border space-y-3 ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e]'
                      : 'bg-[#f9f8f5] border-[#e7e3da]'
                  }`}
                >
                  <div className="font-bold text-sm flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-[#686e4a]" />
                    <span>The 4-Tab Spreadsheet Architecture:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-2.5 rounded-lg border border-inherit">
                      <strong className="text-[#686e4a] dark:text-[#c7ccaa] block font-mono">
                        Tab 1: Customers & RFM
                      </strong>
                      <span>Customer ID, Name, Partner referral code, visits, spend in CAD, insurance provider, and calculated RFM scores (1–5) with segmentation badges.</span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-inherit">
                      <strong className="text-[#e6b000] block font-mono">
                        Tab 2: Partners & ROI
                      </strong>
                      <span>Directory of Barrie wellness partners, commission rates (%), monthly retainers, patient referral counts, gross revenue, and net clinic margin.</span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-inherit">
                      <strong className="text-[#686e4a] dark:text-[#c7ccaa] block font-mono">
                        Tab 3: Services & Bookings Log
                      </strong>
                      <span>Every appointment logged by therapy (Brazilian MLD, RMT, Acupuncture, Injectables), price, direct insurance billing split, and therapist.</span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-inherit">
                      <strong className="text-[#e6b000] block font-mono">
                        Tab 4: CAC & Channel Costs
                      </strong>
                      <span>Marketing channels, referral spend, patients acquired, blended CAC ($), LTV:CAC multiplier, and payback periods in months and visits.</span>
                    </div>
                  </div>
                </div>

                {onOpenGoogleSheetTab && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => {
                        onClose();
                        onOpenGoogleSheetTab();
                      }}
                      className="px-4 py-2 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-full flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <CloudUpload className="w-4 h-4" />
                      <span>Go to Google Sheets Tracker Now</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: GITHUB REPO DEPLOYMENT */}
          {activeTab === 'github' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e]'
                    : 'bg-[#edf0e6] border-[#bcc2a4]'
                }`}
              >
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#686e4a] dark:text-[#c7ccaa] block">
                    Customer GitHub Repository
                  </span>
                  <div className="font-bold text-sm flex items-center gap-2 mt-0.5">
                    <Github className="w-4 h-4" />
                    <span>Samuel-Wellthera/Wellthera-Landing-Page</span>
                  </div>
                  <p className="text-[11px] opacity-80 mt-1">
                    Choose one of the 3 recommended integration strategies below to link or embed this dashboard into their repository.
                  </p>
                </div>

                <a
                  href={githubRepoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 bg-[#14160e] hover:bg-black text-white font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors border border-[#292e1e]"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>View Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Deployment Strategy Options */}
              <div className="space-y-3">
                <div
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e]'
                      : 'bg-[#f9f8f5] border-[#e7e3da]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-[#686e4a] dark:text-[#c7ccaa] font-bold">
                      Option A: Subdirectory / Subroute Integration (Recommended for Monorepo)
                    </strong>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#edf0e6] dark:bg-[#686e4a]/20 text-[#52573a] dark:text-[#c7ccaa] border border-[#bcc2a4] dark:border-[#686e4a]/40">
                      Best Clean Architecture
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    Place the dashboard inside a <code className="font-mono px-1 bg-black/10 dark:bg-white/10 rounded">/dashboard</code> or <code className="font-mono px-1 bg-black/10 dark:bg-white/10 rounded">/analytics</code> directory inside their repository so it can be built alongside the landing page:
                  </p>

                  <div className="relative">
                    <pre
                      className={`p-3 rounded-lg font-mono text-[11px] overflow-x-auto ${
                        isDarkMode ? 'bg-[#0c0d08] text-[#c2c8b0]' : 'bg-[#f0ede6] text-[#332e1e]'
                      }`}
                    >
{`# 1. Clone customer repository
git clone https://github.com/Samuel-Wellthera/Wellthera-Landing-Page.git
cd Wellthera-Landing-Page

# 2. Create a feature branch
git checkout -b feature/partner-analytics-dashboard

# 3. Copy application files into /dashboard folder
mkdir dashboard
# Copy src/, package.json, vite.config.ts, index.html into dashboard/

# 4. Commit and push PR to GitHub
git add dashboard/
git commit -m "feat: Add Wellthera Partner & Customer Analytics Dashboard"
git push origin feature/partner-analytics-dashboard`}
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `git clone https://github.com/Samuel-Wellthera/Wellthera-Landing-Page.git\ncd Wellthera-Landing-Page\ngit checkout -b feature/partner-analytics-dashboard\nmkdir dashboard\ngit add dashboard/\ngit commit -m "feat: Add Wellthera Partner & Customer Analytics Dashboard"\ngit push origin feature/partner-analytics-dashboard`,
                          'git-commands'
                        )
                      }
                      className="absolute top-2.5 right-2.5 p-1 rounded bg-black/15 hover:bg-black/25 text-inherit"
                      title="Copy CLI commands"
                    >
                      {copiedKey === 'git-commands' ? (
                        <Check className="w-3.5 h-3.5 text-[#686e4a]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e]'
                      : 'bg-[#f9f8f5] border-[#e7e3da]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold">
                      Option B: Standalone Deployment & Landing Page Header Link
                    </strong>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      Fastest Zero-Conflict Setup
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    Deploy this Vite/React project directly to Vercel, Netlify, or Cloudflare Pages on a subdomain like <code className="font-mono px-1 bg-black/10 dark:bg-white/10 rounded">analytics.wellthera.ca</code> or <code className="font-mono px-1 bg-black/10 dark:bg-white/10 rounded">portal.wellthera.ca</code>, then add a discreet link or button in the customer landing page header/footer.
                  </p>
                </div>

                <div
                  className={`p-3.5 rounded-xl border space-y-2 ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e]'
                      : 'bg-[#f9f8f5] border-[#e7e3da]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold">
                      Option C: Iframe Embedding in Existing HTML Landing Page
                    </strong>
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    If Samuel's team prefers an embedded section within their current vanilla HTML page, embed via a responsive container:
                  </p>

                  <div className="relative">
                    <pre
                      className={`p-3 rounded-lg font-mono text-[11px] overflow-x-auto ${
                        isDarkMode ? 'bg-[#0c0d08] text-[#c2c8b0]' : 'bg-[#f0ede6] text-[#332e1e]'
                      }`}
                    >
{`<!-- Wellthera Partner Analytics Dashboard Widget -->
<div style="width: 100%; height: 900px; border-radius: 16px; overflow: hidden; border: 1px solid #e7e3da;">
  <iframe 
    src="https://YOUR_DASHBOARD_URL_HERE" 
    style="width: 100%; height: 100%; border: none;"
    title="Wellthera Partner Analytics"
    allow="clipboard-write">
  </iframe>
</div>`}
                    </pre>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `<div style="width: 100%; height: 900px; border-radius: 16px; overflow: hidden; border: 1px solid #e7e3da;">\n  <iframe src="https://YOUR_DASHBOARD_URL_HERE" style="width: 100%; height: 100%; border: none;" title="Wellthera Partner Analytics" allow="clipboard-write"></iframe>\n</div>`,
                          'iframe-snippet'
                        )
                      }
                      className="absolute top-2.5 right-2.5 p-1 rounded bg-black/15 hover:bg-black/25 text-inherit"
                      title="Copy iframe HTML"
                    >
                      {copiedKey === 'iframe-snippet' ? (
                        <Check className="w-3.5 h-3.5 text-[#686e4a]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANAGEMENT & RFM GUIDE */}
          {activeTab === 'management' && (
            <div className="space-y-4">
              <h3 className="font-serif text-base font-bold flex items-center gap-2">
                <span>Clinical & Partner Intelligence Framework</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e]'
                      : 'bg-[#f9f8f5] border-[#e7e3da]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Users className="w-4 h-4 text-[#686e4a]" />
                    <span>1. Partner ROI Tracking</span>
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    Wellthera collaborates with Barrie local businesses (Barrie CrossFit Apex, Lakeview Physiotherapy, Innisfil Pelvic Health, etc.).
                  </p>
                  <ul className="space-y-1 pl-2 text-[11px] list-disc opacity-80">
                    <li>
                      <strong>Referral Codes:</strong> Each partner is assigned a code (e.g., <code>LAKE-PHYS</code>, <code>CFIT-APEX</code>).
                    </li>
                    <li>
                      <strong>Net Clinic Margin:</strong> Calculated as Gross Revenue minus Commissions and Retainers paid.
                    </li>
                    <li>
                      <strong>ROI Formula:</strong> <code>((Net Margin - Costs) / Costs) * 100</code>.
                    </li>
                  </ul>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e]'
                      : 'bg-[#f9f8f5] border-[#e7e3da]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Grid className="w-4 h-4 text-[#e6b000]" />
                    <span>2. RFM Customer Matrix</span>
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    Patients are scored 1 to 5 across three critical axes:
                  </p>
                  <ul className="space-y-1 pl-2 text-[11px] list-disc opacity-80">
                    <li>
                      <strong>Recency (R):</strong> Days since last appointment (&lt;14d = 5, &gt;90d = 1).
                    </li>
                    <li>
                      <strong>Frequency (F):</strong> Total completed sessions (9+ visits = 5, 1 visit = 1).
                    </li>
                    <li>
                      <strong>Monetary (M):</strong> Total spend in CAD ($1,200+ = 5, &lt;$250 = 1).
                    </li>
                  </ul>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e]'
                      : 'bg-[#f9f8f5] border-[#e7e3da]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Layers className="w-4 h-4 text-[#686e4a]" />
                    <span>3. Services Breakdown</span>
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    Tracks appointment volume and average ticket size across:
                  </p>
                  <ul className="space-y-1 pl-2 text-[11px] list-disc opacity-80">
                    <li>Authentic Brazilian Lymphatic Drainage (Signature service)</li>
                    <li>Registered Massage Therapy (RMT)</li>
                    <li>Medical Acupuncture & Cupping</li>
                    <li>Nurse-Led Injectables & Aesthetic Wellness</li>
                    <li>Direct Insurance Billing vs Self-Pay / Cash ratios</li>
                  </ul>
                </div>

                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e]'
                      : 'bg-[#f9f8f5] border-[#e7e3da]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <TrendingUp className="w-4 h-4 text-[#e6b000]" />
                    <span>4. CAC Cost Analysis & Simulator</span>
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    Provides true patient acquisition economics:
                  </p>
                  <ul className="space-y-1 pl-2 text-[11px] list-disc opacity-80">
                    <li>
                      <strong>Partner CAC ($25.00–$87.50):</strong> Up to 70% cheaper than paid digital advertising.
                    </li>
                    <li>
                      <strong>Paid Search / Meta Ads CAC ($92.86–$104.00):</strong> Useful for baseline capture.
                    </li>
                    <li>
                      <strong>Budget Simulator:</strong> Dynamically calculates patient yield if shifting ad spend to local wellness partnerships.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ENVIRONMENT & CLOUD CONFIG */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <h3 className="font-serif text-base font-bold flex items-center gap-2">
                <Key className="w-4 h-4 text-[#686e4a]" />
                <span>Google Cloud & OAuth Configuration</span>
              </h3>

              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e]'
                    : 'bg-[#f9f8f5] border-[#e7e3da]'
                }`}
              >
                <div className="font-bold text-sm">
                  Google Cloud Console Settings for Client-Side OAuth:
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  When hosting this application in production (e.g., on Vercel, Netlify, or Cloud Run), configure the OAuth 2.0 Web Client in Google Cloud Console:
                </p>

                <div className="space-y-2 text-[11px]">
                  <div>
                    <span className="font-bold opacity-80 block">Authorized JavaScript Origins:</span>
                    <div className="p-2 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px] space-y-1 mt-0.5">
                      <div>http://localhost:3000</div>
                      <div>https://www.wellthera.ca</div>
                      <div>https://wellthera.ca</div>
                      <div>https://YOUR-PRODUCTION-APP-DOMAIN.com</div>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold opacity-80 block">Authorized Redirect URIs:</span>
                    <div className="p-2 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px] mt-0.5">
                      https://YOUR-PRODUCTION-APP-DOMAIN.com
                    </div>
                  </div>

                  <div>
                    <span className="font-bold opacity-80 block">OAuth Scopes Required:</span>
                    <div className="p-2 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px] space-y-1 mt-0.5">
                      <div>https://www.googleapis.com/auth/spreadsheets</div>
                      <div>https://www.googleapis.com/auth/drive.file</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security note */}
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#c7ccaa]'
                    : 'bg-[#edf0e6] border-[#bcc2a4] text-[#52573a]'
                }`}
              >
                <ShieldCheck className="w-5 h-5 shrink-0 text-[#686e4a]" />
                <div className="text-[11px] space-y-1">
                  <span className="font-bold block">Zero Client Secret Exposure Architecture:</span>
                  <p className="opacity-80">
                    Google Workspace OAuth uses client-side popup credentials via Firebase Auth. No Google API client secrets or sensitive tokens are committed to source control or exposed in client bundles.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className={`p-3 sm:p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
            isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f0ede6] border-[#e7e3da]'
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <span className="font-serif font-bold text-sm">Wellthera</span>
            <span className="opacity-75">• Barrie, Ontario</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={targetFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isDarkMode
                  ? 'bg-[#1c2015] border-[#292e1e] text-[#f9f8f5] hover:bg-[#252a1c]'
                  : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e] hover:bg-[#f9f8f5]'
              }`}
            >
              <span>Drive Folder</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
            >
              Done / Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
