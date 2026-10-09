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
  Globe,
  Rocket,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ClipboardCheck,
  Lock,
  UserCheck,
  DollarSign,
  Calendar,
  Zap,
  Code2,
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
  const [activeTab, setActiveTab] = useState<'staff' | 'drive' | 'vercel' | 'github' | 'management' | 'config'>('staff');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const targetFolderUrl = DEFAULT_TARGET_DRIVE_FOLDER_URL;
  const targetFolderId = DEFAULT_TARGET_DRIVE_FOLDER_ID;
  const githubRepoUrl = 'https://github.com/FlyusAgency/CRM---Wellthera-Flyus';

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
            { id: 'staff' as const, label: 'Manual da Equipe (Staff SOP)', icon: ClipboardCheck },
            { id: 'drive' as const, label: 'Google Drive & Sheets', icon: FileSpreadsheet },
            { id: 'vercel' as const, label: 'Deploy to Vercel & Domain', icon: Globe },
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
          {/* TAB: STAFF SOP / CLINIC STAFF MANUAL */}
          {activeTab === 'staff' && (
            <div className="space-y-5">
              {/* Top Banner with Quick Copy Action */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e]'
                    : 'bg-[#edf0e6] border-[#bcc2a4]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#686e4a] text-white">
                      Front Desk Operating SOP
                    </span>
                    <span className="text-[11px] opacity-80">
                      Standard Operating Procedure (SOP)
                    </span>
                  </div>
                  <h3 className="font-serif text-base sm:text-lg font-bold mt-1">
                    Front Desk & Staff Spreadsheet Guide
                  </h3>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Practical instructions for staff to maintain the Google Sheets tracker daily without breaking formulas or reports.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `*FRONT DESK OPERATING MANUAL - WELLTHERA*\n\n1. DAILY DATA ENTRY:\n- Every completed checkout: Add to "Services & Bookings Log" (Date, Patient, Service Category, CAD Price, Insurance vs Out-of-Pocket split).\n- Brand NEW patient: Register in "Customers & RFM" (Name, Phone, Email, Referral Partner Code, Insurance Provider).\n\n2. REFERRAL PARTNER CODES (Ask at check-in: "Who referred you?"): \n- CFIT-APEX (Barrie CrossFit Apex - 15%)\n- LAKE-PHYS (Lakeview Physiotherapy - 12%)\n- INNIS-PELV (Innisfil Pelvic Health - $25 flat)\n- BARRIE-CHIR (Barrie Central Chiro - 10%)\n- DIRECT (Direct/website without referral)\n\n3. ACCEPTED INSURANCE:\n- Sun Life | Manulife | Canada Life | Green Shield Canada | Blue Cross | None / Self-Pay\n\n4. GOLDEN RULES:\n- Use YYYY-MM-DD date format (e.g. 2026-10-08)\n- Enter numbers without dollar signs (e.g. 150 instead of $150)\n- NEVER delete existing rows or alter calculated formula columns (R-Score, F-Score, M-Score, Segment).`,
                        'staff-cheat-sheet'
                      )
                    }
                    className="px-3.5 py-2 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors text-xs"
                  >
                    {copiedKey === 'staff-cheat-sheet' ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Summary for Staff / Slack</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3 Steps Daily Routine */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e]'
                    : 'bg-[#f9f8f5] border-[#e7e3da]'
                }`}
              >
                <div className="font-bold text-sm text-[#686e4a] dark:text-[#c7ccaa] flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Daily Staff Routine (Step-by-Step)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-3 rounded-lg border border-inherit space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#686e4a] text-white font-bold flex items-center justify-center text-xs">
                        1
                      </span>
                      <strong className="text-sm">Patient Check-in</strong>
                    </div>
                    <p className="opacity-80 leading-relaxed">
                      Check if the patient already exists in the <strong>Customers & RFM</strong> tab. If it is their first visit:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 opacity-90">
                      <li>Ask: <em>"How did you hear about Wellthera? Were you referred by a doctor, gym, or coach?"</em></li>
                      <li>Register in <strong>Customers & RFM</strong> with the corresponding referral partner code.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg border border-inherit space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#686e4a] text-white font-bold flex items-center justify-center text-xs">
                        2
                      </span>
                      <strong className="text-sm">Checkout & Payment</strong>
                    </div>
                    <p className="opacity-80 leading-relaxed">
                      As soon as the session concludes, open the <strong>Services & Bookings Log</strong> tab and add a new row at the bottom:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 opacity-90">
                      <li>Appointment Date (<code className="font-mono">YYYY-MM-DD</code>).</li>
                      <li>Service and Attending Practitioner.</li>
                      <li>Split amounts: direct billing covered by insurance vs copayment paid out-of-pocket by patient.</li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg border border-inherit space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#686e4a] text-white font-bold flex items-center justify-center text-xs">
                        3
                      </span>
                      <strong className="text-sm">End-of-Shift Reconciliation</strong>
                    </div>
                    <p className="opacity-80 leading-relaxed">
                      At closing or end of front desk shift:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 opacity-90">
                      <li>Verify total row count in Google Sheets matches clinic calendar bookings and POS terminal totals.</li>
                      <li>Open the Dashboard <strong>Google Sheets Tracker</strong> tab and click <strong>"Sync to Sheet"</strong> to refresh live metrics.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Two Main Tabs Staff Interacts With */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tab 1: Bookings Log Guide */}
                <div
                  className={`p-4 rounded-xl border space-y-2.5 ${
                    isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f9f8f5] border-[#e7e3da]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold text-[#686e4a] dark:text-[#c7ccaa]">
                      Primary Tab: "Services & Bookings Log"
                    </strong>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#686e4a]/15 text-[#686e4a] dark:text-[#c7ccaa]">
                      90% of Daily Workflow
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    Staff record <strong>each completed session</strong> here. Every row represents an individual patient visit.
                  </p>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-2 rounded bg-black/5 dark:bg-white/5 flex items-start gap-2">
                      <span className="font-mono font-bold text-[#686e4a] shrink-0">Booking ID:</span>
                      <span className="opacity-80">Generate a sequential ID, e.g., <code className="font-mono">b-3001</code>.</span>
                    </div>
                    <div className="p-2 rounded bg-black/5 dark:bg-white/5 flex items-start gap-2">
                      <span className="font-mono font-bold text-[#686e4a] shrink-0">Customer Name:</span>
                      <span className="opacity-80">Exact registered patient name.</span>
                    </div>
                    <div className="p-2 rounded bg-black/5 dark:bg-white/5 flex items-start gap-2">
                      <span className="font-mono font-bold text-[#686e4a] shrink-0">Service Category:</span>
                      <span className="opacity-80">Physiotherapy & MLD, Massage Therapy, Acupuncture, etc.</span>
                    </div>
                    <div className="p-2 rounded bg-black/5 dark:bg-white/5 flex items-start gap-2">
                      <span className="font-mono font-bold text-[#686e4a] shrink-0">Prices in CAD:</span>
                      <span className="opacity-80">
                        Total Price = Direct Insurance Billed + Patient Out-of-Pocket (e.g. $150 = $120 insurance + $30 copay).
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tab 2: Customers Guide */}
                <div
                  className={`p-4 rounded-xl border space-y-2.5 ${
                    isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f9f8f5] border-[#e7e3da]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-bold text-[#e6b000]">
                      Tab: "Customers & RFM"
                    </strong>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      New Patients Only
                    </span>
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    Filled <strong>only once</strong> when a patient visits for their initial session or enters the clinic roster.
                  </p>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-2 rounded bg-black/5 dark:bg-white/5 flex items-start gap-2">
                      <span className="font-mono font-bold text-[#e6b000] shrink-0">Customer ID:</span>
                      <span className="opacity-80">Unique patient ID, e.g., <code className="font-mono">c-1120</code>.</span>
                    </div>
                    <div className="p-2 rounded bg-black/5 dark:bg-white/5 flex items-start gap-2">
                      <span className="font-mono font-bold text-[#e6b000] shrink-0">Referral Code:</span>
                      <span className="opacity-80">Partner referral code (e.g. <code className="font-mono">CFIT-APEX</code>). If direct, enter <code className="font-mono">DIRECT</code>.</span>
                    </div>
                    <div className="p-2 rounded bg-black/5 dark:bg-white/5 flex items-start gap-2">
                      <span className="font-mono font-bold text-[#e6b000] shrink-0">Insurance Provider:</span>
                      <span className="opacity-80">Exact insurance provider name (Sun Life, Manulife, etc.) or None / Self-Pay.</span>
                    </div>
                    <div className="p-2 rounded bg-black/5 dark:bg-white/5 flex items-start gap-2">
                      <span className="font-mono font-bold text-[#e6b000] shrink-0">RFM Scores:</span>
                      <span className="opacity-80"><strong>DO NOT TOUCH!</strong> R-Score, F-Score and RFM Segment are calculated automatically via analytics formulas.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Codes & Dropdowns Lookup Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Partner Codes Table */}
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f9f8f5] border-[#e7e3da]'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between text-[#686e4a] dark:text-[#c7ccaa]">
                    <span>Official Barrie Partner Referral Codes</span>
                    <span className="text-[10px] opacity-70">For Referral Code Field</span>
                  </div>

                  <div className="overflow-x-auto text-[11px]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b opacity-60">
                          <th className="pb-1 font-mono">Code</th>
                          <th className="pb-1">Partner</th>
                          <th className="pb-1">Commission</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5 font-mono">
                        <tr>
                          <td className="py-1 font-bold text-[#686e4a] dark:text-[#c7ccaa]">CFIT-APEX</td>
                          <td className="py-1 font-sans">Barrie CrossFit Apex</td>
                          <td className="py-1">15% rev share</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold text-[#686e4a] dark:text-[#c7ccaa]">LAKE-PHYS</td>
                          <td className="py-1 font-sans">Lakeview Physiotherapy</td>
                          <td className="py-1">12% rev share</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold text-[#686e4a] dark:text-[#c7ccaa]">INNIS-PELV</td>
                          <td className="py-1 font-sans">Innisfil Pelvic Health</td>
                          <td className="py-1">$25 flat</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold text-[#686e4a] dark:text-[#c7ccaa]">BARRIE-CHIR</td>
                          <td className="py-1 font-sans">Barrie Central Chiro</td>
                          <td className="py-1">10% rev share</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold opacity-60">DIRECT</td>
                          <td className="py-1 font-sans">No partner / Direct Walk-in</td>
                          <td className="py-1">$0</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Accepted Insurance Table */}
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f9f8f5] border-[#e7e3da]'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center justify-between text-[#e6b000]">
                    <span>Accepted Insurance Providers</span>
                    <span className="text-[10px] opacity-70">Insurance Provider Field</span>
                  </div>

                  <div className="overflow-x-auto text-[11px]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b opacity-60">
                          <th className="pb-1">Exact Provider Name</th>
                          <th className="pb-1">Billing Portal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5 dark:divide-white/5">
                        <tr>
                          <td className="py-1 font-semibold">Sun Life</td>
                          <td className="py-1 opacity-80">eClaims / TELUS Health</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-semibold">Manulife</td>
                          <td className="py-1 opacity-80">eClaims portal</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-semibold">Canada Life</td>
                          <td className="py-1 opacity-80">Great-West / London Life portal</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-semibold">Green Shield Canada</td>
                          <td className="py-1 opacity-80">Green Shield direct portal</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-semibold">Blue Cross</td>
                          <td className="py-1 opacity-80">Medavie / Ontario Blue Cross</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-semibold opacity-60">None / Self-Pay</td>
                          <td className="py-1 opacity-60">Out-of-Pocket / Card / Cash</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 4 Golden Rules Alert Box */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  isDarkMode ? 'bg-amber-950/20 border-amber-900/30' : 'bg-amber-50 border-amber-200'
                }`}
              >
                <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-[11px] leading-relaxed">
                  <strong className="text-amber-900 dark:text-amber-300 font-bold text-xs block">
                    Important Data Integrity Rules:
                  </strong>
                  <ul className="list-disc pl-4 space-y-0.5 opacity-90">
                    <li><strong>NEVER delete existing rows</strong>: if an appointment was cancelled, change the Status column to <code className="font-mono">Cancelled</code> or <code className="font-mono">No-Show</code> instead of deleting.</li>
                    <li><strong>NEVER rename header titles in Row 1</strong> (e.g. "Customer ID", "Total Spend (CAD)"), as the live synchronizer requires exact header keys.</li>
                    <li><strong>Enter numeric values without currency symbols</strong> (type <code className="font-mono">150</code> instead of <code className="font-mono">$150.00</code>).</li>
                    <li>Access the official Google Drive folder at: <code className="font-mono">{targetFolderUrl}</code>.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VERCEL & CUSTOM DOMAIN */}
          {activeTab === 'vercel' && (
            <div className="space-y-5">
              {/* Vercel Status & Fast Launch */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e]'
                    : 'bg-[#edf0e6] border-[#bcc2a4]'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#686e4a] text-white">
                      Vercel Ready
                    </span>
                    <span className="text-[11px] opacity-80">
                      Vite SPA + Custom Domain Support
                    </span>
                  </div>
                  <h3 className="font-serif text-base sm:text-lg font-bold mt-1">
                    Deploying to Vercel with your Custom Domain
                  </h3>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Your GitHub repository <code className="font-mono px-1 bg-black/10 dark:bg-white/10 rounded">FlyusAgency/CRM---Wellthera-Flyus</code> connects directly to Vercel for zero-config CI/CD.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href="https://vercel.com/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-[#100e0a] hover:bg-black text-white font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors"
                  >
                    <Rocket className="w-4 h-4 text-[#e6b000]" />
                    <span>Open Vercel New Project</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </a>
                </div>
              </div>

              {/* Step 1: Import Project */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e]'
                    : 'bg-[#f9f8f5] border-[#e7e3da]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-[#686e4a] dark:text-[#c7ccaa]">
                  <div className="w-5 h-5 rounded-full bg-[#686e4a] text-white flex items-center justify-center text-xs">
                    1
                  </div>
                  <span>Import GitHub Repository into Vercel</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="space-y-2 leading-relaxed opacity-90">
                    <p>
                      1. Log into your <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Vercel Dashboard</a> and click <strong>"Add New..." → "Project"</strong>.
                    </p>
                    <p>
                      2. Under <em>Import Git Repository</em>, select <strong>FlyusAgency/CRM---Wellthera-Flyus</strong>.
                    </p>
                    <p>
                      3. In the <em>Configure Project</em> screen:
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>Framework Preset:</strong> Vite (auto-detected)</li>
                      <li>
                        <strong>Root Directory:</strong> If this code is in the repository root, leave as <code className="font-mono px-1 bg-black/10 dark:bg-white/10 rounded">./</code>. If placed inside a subfolder, click <em>Edit</em> and pick <code className="font-mono px-1 bg-black/10 dark:bg-white/10 rounded">dashboard</code>.
                      </li>
                      <li><strong>Build Command:</strong> <code className="font-mono px-1 bg-black/10 dark:bg-white/10 rounded">npm run build</code></li>
                      <li><strong>Output Directory:</strong> <code className="font-mono px-1 bg-black/10 dark:bg-white/10 rounded">dist</code></li>
                    </ul>
                  </div>

                  <div
                    className={`p-3 rounded-lg border space-y-2 ${
                      isDarkMode ? 'bg-[#0c0d08] border-[#292e1e]' : 'bg-[#ffffff] border-[#e7e3da]'
                    }`}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#686e4a] dark:text-[#c7ccaa] font-bold">
                      Pre-Configured vercel.json File
                    </div>
                    <p className="text-[11px] opacity-80">
                      We have added <code className="font-mono">vercel.json</code> to the project root with Vite SPA rewrites so that page refreshes never return 404 errors:
                    </p>
                    <pre className="p-2 rounded bg-black/5 dark:bg-white/5 font-mono text-[10px] overflow-x-auto">
{`{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* Step 2: Custom Domain Mapping & DNS Records */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e]'
                    : 'bg-[#f9f8f5] border-[#e7e3da]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-[#686e4a] dark:text-[#c7ccaa]">
                  <div className="w-5 h-5 rounded-full bg-[#686e4a] text-white flex items-center justify-center text-xs">
                    2
                  </div>
                  <span>Add Your Custom Domain & Configure DNS Records</span>
                </div>

                <p className="text-[11px] opacity-80 leading-relaxed">
                  Go to <strong>Project Settings → Domains</strong> in Vercel. You have two main setup strategies depending on whether you want a dedicated subdomain for the clinic dashboard or the primary domain:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Strategy A: Subdomain */}
                  <div
                    className={`p-3 rounded-xl border space-y-2.5 ${
                      isDarkMode ? 'bg-[#0c0d08] border-[#292e1e]' : 'bg-[#ffffff] border-[#e7e3da]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-[#686e4a] dark:text-[#c7ccaa]">
                        Strategy A: Subdomain (Recommended)
                      </strong>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        Zero Conflict
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80">
                      Best if <code className="font-mono">www.wellthera.ca</code> is the patient landing page and you want <code className="font-mono">analytics.wellthera.ca</code> or <code className="font-mono">dashboard.wellthera.ca</code> for the partner dashboard.
                    </p>

                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="p-2 rounded bg-black/5 dark:bg-white/5 flex items-center justify-between">
                        <div>
                          <span className="opacity-60 block text-[9px]">TYPE / RECORD:</span>
                          <span className="font-bold text-[#686e4a] dark:text-[#c7ccaa]">CNAME</span>
                        </div>
                        <div>
                          <span className="opacity-60 block text-[9px]">NAME / HOST:</span>
                          <span>analytics (or dashboard)</span>
                        </div>
                        <div>
                          <span className="opacity-60 block text-[9px]">VALUE / TARGET:</span>
                          <span>cname.vercel-dns.com</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard('cname.vercel-dns.com', 'cname-val')}
                          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                          title="Copy CNAME value"
                        >
                          {copiedKey === 'cname-val' ? (
                            <Check className="w-3.5 h-3.5 text-[#686e4a]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Strategy B: Apex / Root Domain */}
                  <div
                    className={`p-3 rounded-xl border space-y-2.5 ${
                      isDarkMode ? 'bg-[#0c0d08] border-[#292e1e]' : 'bg-[#ffffff] border-[#e7e3da]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-bold text-[#e6b000]">
                        Strategy B: Apex / Root Domain
                      </strong>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        Primary Site
                      </span>
                    </div>
                    <p className="text-[11px] opacity-80">
                      If this dashboard serves as the main application on your root custom domain (e.g., <code className="font-mono">yourdomain.com</code> and <code className="font-mono">www.yourdomain.com</code>):
                    </p>

                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="p-2 rounded bg-black/5 dark:bg-white/5 flex items-center justify-between">
                        <div>
                          <span className="opacity-60 block text-[9px]">A RECORD (Apex):</span>
                          <span className="font-bold">@ → 76.76.21.21</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard('76.76.21.21', 'a-record-val')}
                          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                          title="Copy A Record IP"
                        >
                          {copiedKey === 'a-record-val' ? (
                            <Check className="w-3.5 h-3.5 text-[#686e4a]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="p-2 rounded bg-black/5 dark:bg-white/5 flex items-center justify-between">
                        <div>
                          <span className="opacity-60 block text-[9px]">CNAME (www):</span>
                          <span className="font-bold">www → cname.vercel-dns.com</span>
                        </div>
                        <button
                          onClick={() => copyToClipboard('cname.vercel-dns.com', 'cname-www')}
                          className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
                          title="Copy CNAME"
                        >
                          {copiedKey === 'cname-www' ? (
                            <Check className="w-3.5 h-3.5 text-[#686e4a]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Automated Webhook via Vercel Environment Variables */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e]'
                    : 'bg-[#f9f8f5] border-[#e7e3da]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-[#e6b000]">
                  <div className="w-5 h-5 rounded-full bg-[#e6b000] text-black font-bold flex items-center justify-center text-xs">
                    3
                  </div>
                  <span>Configure Automated Webhook via Vercel Environment Variables</span>
                </div>

                <p className="text-[11px] opacity-80 leading-relaxed">
                  To synchronize <strong>automatically in real time</strong> data logged by the front desk in Google Sheets with the Dashboard without requiring manual OAuth logins on every visit:
                </p>

                <div className="p-3.5 rounded-xl border border-inherit space-y-2 bg-black/5 dark:bg-white/5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>Variable Name on Vercel:</span>
                    <code className="font-mono px-2 py-0.5 rounded bg-[#686e4a] text-white">
                      VITE_APPS_SCRIPT_WEBHOOK_URL
                    </code>
                  </div>
                  <p className="text-[11px] opacity-80">
                    1. In Vercel, open your project &gt; <strong>Settings &gt; Environment Variables</strong>.<br/>
                    2. In <strong>Key</strong> type: <code className="font-mono font-bold">VITE_APPS_SCRIPT_WEBHOOK_URL</code>.<br/>
                    3. In <strong>Value</strong> paste your Apps Script Web App Deployment URL (ending in <code className="font-mono">/exec</code>).<br/>
                    4. Select environments: <strong>Production</strong>, <strong>Preview</strong>, and <strong>Development</strong> and click <strong>Save</strong>.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] opacity-70">
                      Once configured, the Dashboard pulls new appointments and patients from the sheet every 45 seconds!
                    </span>
                    <button
                      onClick={() => copyToClipboard('VITE_APPS_SCRIPT_WEBHOOK_URL', 'env-webhook-key')}
                      className="px-2.5 py-1 rounded bg-[#686e4a] text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'env-webhook-key' ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Variable Name</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 4: Google Cloud & Firebase Domain Authorization */}
              <div
                className={`p-4 rounded-xl border space-y-3 ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e]'
                    : 'bg-[#f9f8f5] border-[#e7e3da]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-[#686e4a] dark:text-[#c7ccaa]">
                  <div className="w-5 h-5 rounded-full bg-[#686e4a] text-white font-bold flex items-center justify-center text-xs">
                    4
                  </div>
                  <span>Authorize Your Custom Domain for Google Drive & OAuth</span>
                </div>

                <div
                  className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                    isDarkMode ? 'bg-amber-950/20 border-amber-900/30' : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Crucial Security Step:</strong> Google OAuth and Firebase will reject login attempts on your new custom domain until you add the domain to the Authorized Origins list. This takes only 60 seconds:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 rounded-lg border border-inherit space-y-1.5">
                    <strong>1. Firebase Authentication:</strong>
                    <p className="opacity-80">
                      Open <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Firebase Console</a> → Authentication → <strong>Settings</strong> → <strong>Authorized Domains</strong>.
                    </p>
                    <p className="opacity-80">
                      Click <em>Add Domain</em> and enter your custom domain (e.g., <code className="font-mono">analytics.wellthera.ca</code> or <code className="font-mono">yourdomain.com</code>).
                    </p>
                  </div>

                  <div className="p-3 rounded-lg border border-inherit space-y-1.5">
                    <strong>2. Google Cloud OAuth Consent:</strong>
                    <p className="opacity-80">
                      In <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Google Cloud Credentials</a>, click your Web Client ID.
                    </p>
                    <p className="opacity-80">
                      Under <strong>Authorized JavaScript origins</strong>, add <code className="font-mono">https://analytics.wellthera.ca</code>. Click Save.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4: Verification & Automated SSL */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDarkMode ? 'bg-[#0c0d08] border-[#292e1e]' : 'bg-[#ffffff] border-[#e7e3da]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#686e4a] dark:text-[#aab187] shrink-0" />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm">
                      Automatic SSL & Instant CI/CD Deploys
                    </h4>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Vercel will automatically provision a free Let's Encrypt SSL certificate within 2–5 minutes of DNS propagation. Every future <code className="font-mono">git push</code> will deploy automatically!
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('drive')}
                  className="px-3 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
                >
                  <span>Google Drive Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

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

              {/* Apps Script 1-Click Fast Option Banner */}
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDarkMode
                    ? 'bg-[#181b12] border-[#e6b000]/40 text-[#f9f8f5]'
                    : 'bg-[#fcfaf5] border-[#e6b000]/60 text-[#332e1e]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#e6b000]">
                    <Zap className="w-4 h-4" />
                    <span>Recommended Method: Automated Google Apps Script (2 Minutes)</span>
                  </div>
                  <p className="text-[11px] opacity-85 leading-relaxed max-w-xl">
                    If you prefer not to configure OAuth credentials in Google Cloud, simply create a sheet in the client's Drive folder and paste the automation script available via the <strong>"Generate Sheet (Apps Script)"</strong> button in the Google Sheets Tracker menu. All 5 tabs and CRM datasets will be built immediately!
                  </p>
                </div>
                {onOpenGoogleSheetTab && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenGoogleSheetTab();
                    }}
                    className="px-4 py-2 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-lg flex items-center gap-2 shadow-sm shrink-0 cursor-pointer text-xs"
                  >
                    <span>Go to Google Sheets Tracker</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
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
                    <span>FlyusAgency/CRM---Wellthera-Flyus</span>
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
git clone https://github.com/FlyusAgency/CRM---Wellthera-Flyus.git
cd CRM---Wellthera-Flyus

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
                          `git clone https://github.com/FlyusAgency/CRM---Wellthera-Flyus.git\ncd CRM---Wellthera-Flyus\ngit checkout -b feature/partner-analytics-dashboard\nmkdir dashboard\ngit add dashboard/\ngit commit -m "feat: Add Wellthera Partner & Customer Analytics Dashboard"\ngit push origin feature/partner-analytics-dashboard`,
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
