import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  FolderSync,
  ExternalLink,
  Copy,
  Check,
  Code2,
  Sparkles,
  Download,
  AlertCircle,
  Key,
  ShieldCheck,
  Zap,
  RefreshCw,
} from 'lucide-react';
import {
  Customer,
  Partner,
  ServiceBooking,
  CacChannelSpend,
  GoogleSheetSyncState,
  Practitioner,
  ClinicProcedure,
  QuarterlyOkrPlan,
} from '../types';
import {
  DEFAULT_TARGET_DRIVE_FOLDER_ID,
  DEFAULT_TARGET_DRIVE_FOLDER_URL,
  parseSpreadsheetIdFromInput,
  generateCsvDownload,
  downloadCompleteJsonPackage,
  validateAppsScriptUrl,
  testAppsScriptConnection,
} from '../services/googleSheets';
import { generateWelltheraAppsScript } from '../services/welltheraAppsScriptCode';
import { initialPractitioners, initialProcedures, initialOkrPlans } from '../data/initialData';

interface GoogleSheetsSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'appscript' | 'connect' | 'download';
  isDarkMode?: boolean;
  syncState: GoogleSheetSyncState;
  onSaveSyncSettings: (settings: {
    sheetId: string | null;
    sheetUrl: string | null;
    appsScriptUrl: string | null;
  }) => void;
  customers: Customer[];
  partners: Partner[];
  bookings: ServiceBooking[];
  cacChannels: CacChannelSpend[];
  practitioners?: Practitioner[];
  procedures?: ClinicProcedure[];
  okrPlans?: QuarterlyOkrPlan[];
  accessToken: string | null;
  onSignInGoogle: () => void;
  onCreateViaOAuth: () => void;
}

export const GoogleSheetsSetupModal: React.FC<GoogleSheetsSetupModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'appscript',
  isDarkMode = false,
  syncState,
  onSaveSyncSettings,
  customers,
  partners,
  bookings,
  cacChannels,
  practitioners = initialPractitioners,
  procedures = initialProcedures,
  okrPlans = initialOkrPlans,
  accessToken,
  onSignInGoogle,
  onCreateViaOAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'appscript' | 'connect' | 'download'>(initialTab);
  const [copiedScript, setCopiedScript] = useState(false);
  const [sheetInput, setSheetInput] = useState(syncState.sheetUrl || syncState.sheetId || '');
  const [appsScriptInput, setAppsScriptInput] = useState(syncState.appsScriptUrl || '');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    getOk?: boolean;
    postOk?: boolean;
    message: string;
  } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSheetInput(syncState.sheetUrl || syncState.sheetId || '');
      setAppsScriptInput(syncState.appsScriptUrl || '');
      setSaveError(null);
      setSaveFeedback(null);
      setTestResult(null);
    }
  }, [isOpen, initialTab, syncState.sheetUrl, syncState.sheetId, syncState.appsScriptUrl]);

  if (!isOpen) return null;

  const webhookValidation = appsScriptInput.trim()
    ? validateAppsScriptUrl(appsScriptInput)
    : null;

  const appsScriptCode = generateWelltheraAppsScript(
    customers,
    partners,
    bookings,
    cacChannels,
    practitioners,
    procedures,
    okrPlans
  );

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleTestWebhook = async () => {
    setSaveError(null);
    setTestResult(null);
    setIsTestingWebhook(true);
    try {
      const result = await testAppsScriptConnection(appsScriptInput);
      setTestResult(result);
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    const cleanId = parseSpreadsheetIdFromInput(sheetInput);
    const cleanUrl = cleanId
      ? `https://docs.google.com/spreadsheets/d/${cleanId}/edit`
      : null;

    let finalWebhookUrl: string | null = null;
    if (appsScriptInput.trim()) {
      const check = validateAppsScriptUrl(appsScriptInput);
      if (!check.valid) {
        setSaveError(check.error || 'Please enter a valid Apps Script Web App URL ending in /exec.');
        return;
      }
      finalWebhookUrl = check.normalizedUrl;
    }

    onSaveSyncSettings({
      sheetId: cleanId,
      sheetUrl: cleanUrl,
      appsScriptUrl: finalWebhookUrl,
    });

    setSaveFeedback('Synchronization settings saved successfully!');
    setTimeout(() => {
      setSaveFeedback(null);
      onClose();
    }, 1200);
  };

  const handleDownloadAllCsvs = () => {
    // 1. Customers
    const custHeaders = ['Customer ID', 'Full Name', 'Email', 'Phone', 'Partner Channel', 'Referral Code', 'First Visit', 'Last Visit', 'Total Visits', 'Total Spend (CAD)', 'Preferred Service', 'Insurance Provider', 'Status', 'Recency (Days)', 'R-Score', 'F-Score', 'M-Score', 'RFM Segment'];
    const custRows = customers.map((c) => [c.id, c.name, c.email, c.phone, c.partnerName, c.referralCode, c.firstVisitDate, c.lastVisitDate, c.totalVisits, c.totalSpendCAD, c.preferredService, c.insuranceProvider, c.status, c.recencyDays, c.recencyScore, c.frequencyScore, c.monetaryScore, c.rfmSegment]);
    generateCsvDownload('1_wellthera_customers_rfm', custHeaders, custRows);

    // 2. Partners
    const partnerHeaders = ['Partner ID', 'Partner Name', 'Category', 'Contact Person', 'Email', 'Phone', 'Agreement Type', 'Commission Value', 'Monthly Retainer (CAD)', 'Patients Referred', 'Active Patients', 'Total Bookings', 'Total Revenue (CAD)', 'Commission Paid (CAD)', 'Net Revenue (CAD)', 'ROI %', 'Avg Customer Spend (CAD)', 'Status'];
    const partnerRows = partners.map((p) => [p.id, p.name, p.category, p.contactPerson, p.email, p.phone, p.commissionType, p.commissionValue, p.monthlyRetainerCAD, p.referredCustomersCount, p.activeCustomersCount, p.totalBookingsCount, p.totalRevenueCAD, p.totalCommissionPaidCAD, p.netRevenueCAD, `${p.roiPercent}%`, p.averageCustomerSpendCAD, p.status]);
    generateCsvDownload('2_wellthera_partners_roi', partnerHeaders, partnerRows);

    // 3. Bookings
    const bookingHeaders = ['Booking ID', 'Booking Date', 'Customer Name', 'Partner Source', 'Service Category', 'Service Title', 'Clinician / Therapist', 'Duration (Min)', 'Price (CAD)', 'Insurance Billed (CAD)', 'Patient Paid (CAD)', 'Status'];
    const bookingRows = bookings.map((b) => [b.id, b.bookingDate, b.customerName, b.partnerName, b.serviceCategory, b.serviceTitle, b.therapist, b.durationMinutes, b.priceCAD, b.insuranceBilledCAD, b.patientPaidCAD, b.status]);
    generateCsvDownload('3_wellthera_bookings_log', bookingHeaders, bookingRows);

    // 4. CAC
    const cacHeaders = ['Channel / Partner', 'Month Period', 'Spend (CAD)', 'New Customers Acquired', 'Calculated CAC (CAD)', 'Average LTV (CAD)', 'LTV:CAC Ratio', 'Payback Visits', 'Payback Period (Months)'];
    const cacRows = cacChannels.map((c) => [c.partnerOrChannel, c.month, c.spendCAD, c.newCustomersAcquired, c.calculatedCacCAD, c.averageLtvCAD, `${c.ltvCacRatio}x`, c.paybackPeriodVisits, c.paybackPeriodMonths]);
    generateCsvDownload('4_wellthera_cac_spend', cacHeaders, cacRows);

    // 5. Practitioners & Clinical Team
    const pracHeaders = ['Practitioner ID', 'Full Name', 'Professional Title', 'Discipline / Specialty', 'Email', 'Phone', 'Status', 'Services Offered'];
    const pracRows = practitioners.map((p) => [p.id, p.name, p.title, p.discipline, p.email, p.phone, p.status, Array.isArray(p.servicesOffered) ? p.servicesOffered.join(', ') : p.servicesOffered]);
    generateCsvDownload('5_wellthera_practitioners_team', pracHeaders, pracRows);

    // 6. Procedures & Treatments
    const procHeaders = ['Procedure ID', 'Procedure Name', 'Category', 'Duration (Min)', 'Standard Price (CAD)', 'Insurance Eligible', 'Avg Direct Billed (CAD)', 'Typical Copay (CAD)', 'Assigned Practitioners', 'Status', 'Clinical Description'];
    const procRows = procedures.map((proc) => [proc.id, proc.name, proc.category, proc.durationMinutes, proc.priceCAD, proc.insuranceCovered ? 'Yes' : 'No', proc.typicalInsuranceBillingCAD, proc.typicalCopayCAD, Array.isArray(proc.assignedPractitioners) ? proc.assignedPractitioners.join(', ') : proc.assignedPractitioners, proc.status, proc.description]);
    generateCsvDownload('6_wellthera_procedures_treatments', procHeaders, procRows);

    // 7. OKRs & Quarterly Goals
    const okrHeaders = ['Quarter', 'Year', 'Revenue Goal (CAD)', 'CAC Benchmark (CAD)', 'LTV:CAC Target', 'New Patients Target', 'Retention Target (%)', 'Partner Share Target (%)', 'Objective', 'Owner', 'Key Result', 'Current Value', 'Target Value', 'Unit', 'Status'];
    const okrRows: (string | number)[][] = [];
    okrPlans.forEach((plan) => {
      plan.objectives.forEach((obj) => {
        obj.keyResults.forEach((kr) => {
          okrRows.push([plan.quarter, plan.year, plan.revenueGoalCAD, plan.cacBenchmarkCAD, plan.ltvCacTargetRatio, plan.newPatientsTarget, plan.retentionTargetRate, plan.partnerRevenueShareTarget, obj.title, obj.owner, kr.title, kr.currentValue, kr.targetValue, kr.unit || '', kr.status]);
        });
      });
    });
    generateCsvDownload('7_wellthera_okrs_goals', okrHeaders, okrRows);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-3xl max-h-[92vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${
          isDarkMode
            ? 'bg-[#181b12] border-[#292e1e] text-[#f9f8f5]'
            : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between gap-3 ${
            isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f9f8f5] border-[#e7e3da]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#686e4a] text-white">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-base sm:text-lg font-bold">
                Create and Sync Google Sheets Tracker
              </h2>
              <p className="text-[11px] opacity-75">
                Generate the complete spreadsheet in Google Drive or connect the Apps Script Webhook
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-transparent hover:border-inherit transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`flex items-center gap-1.5 px-4 pt-2.5 border-b overflow-x-auto ${
            isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f0ede6] border-[#e7e3da]'
          }`}
        >
          {[
            { id: 'appscript' as const, label: '⚡ Google Apps Script (Recommended)', icon: Code2 },
            { id: 'connect' as const, label: '🔗 Connect Sheet Link / Webhook', icon: Zap },
            { id: 'download' as const, label: '💾 Download Files (CSV / JSON)', icon: Download },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
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

        {/* Body Content */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs">
          {/* TAB 1: APPS SCRIPT */}
          {activeTab === 'appscript' && (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#edf0e6] border-[#bcc2a4]'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#52573a] dark:text-[#c7ccaa]">
                    <Sparkles className="w-4 h-4 text-[#e6b000]" />
                    <span>How to Generate the Full Spreadsheet with the Front Desk Dashboard</span>
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    This script builds the primary <strong>"🛎️ FRONT DESK DASHBOARD"</strong> tab (instant lookup across all <strong>{customers.length.toLocaleString()}</strong> patients) plus all formatted CRM tabs: Customers &amp; RFM, Bookings ({bookings.length}), Partners, CAC, Practitioners, Procedures, and OKRs &amp; Quarterly Goals.
                  </p>
                </div>
                <button
                  onClick={handleCopyScript}
                  className="px-4 py-2.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>Copied Successfully!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Apps Script Code</span>
                    </>
                  )}
                </button>
              </div>

              {/* 4 Steps Guide */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-inherit space-y-1 bg-black/5 dark:bg-white/5">
                  <strong className="text-[#686e4a] dark:text-[#c7ccaa] block font-bold">
                    Step 1: Open Target Google Drive Folder
                  </strong>
                  <p className="opacity-80">
                    Open the client's shared Google Drive folder where the tracker should be saved:
                  </p>
                  <a
                    href={DEFAULT_TARGET_DRIVE_FOLDER_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-[#686e4a] dark:text-[#c7ccaa] hover:underline pt-1"
                  >
                    <span>Open Drive Folder</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 rounded-xl border border-inherit space-y-1 bg-black/5 dark:bg-white/5">
                  <strong className="text-[#686e4a] dark:text-[#c7ccaa] block font-bold">
                    Step 2: Create a New Spreadsheet
                  </strong>
                  <p className="opacity-80">
                    Inside the folder, click <strong>+ New &gt; Google Sheets</strong>. Name it <code>Wellthera Integrated Health - Tracker</code>.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-inherit space-y-1 bg-black/5 dark:bg-white/5">
                  <strong className="text-[#686e4a] dark:text-[#c7ccaa] block font-bold">
                    Step 3: Open the Apps Script Editor
                  </strong>
                  <p className="opacity-80">
                    In the spreadsheet top menu, navigate to <strong>Extensions &gt; Apps Script</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-inherit space-y-1 bg-black/5 dark:bg-white/5">
                  <strong className="text-[#e6b000] block font-bold">
                    Step 4: Paste, Run &amp; Deploy Web App (2-Way Sync)
                  </strong>
                  <p className="opacity-80">
                    Paste the copied code, save (Ctrl+S), and run <code>buildWelltheraCompleteSpreadsheet</code>. Then click <strong>Deploy &gt; New deployment</strong> (or <strong>Manage deployments &gt; Edit &gt; New version</strong>) → <strong>Web app</strong> → <strong>Execute as: Me</strong> → <strong>Who has access: Anyone</strong> → copy the <code>/exec</code> URL into the Connect tab.
                  </p>
                </div>
              </div>

              {/* Code Preview Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold opacity-75">
                  <span>Code Preview (Google Apps Script JavaScript):</span>
                  <span>{appsScriptCode.split('\n').length} lines</span>
                </div>
                <div className="relative rounded-xl border border-inherit overflow-hidden bg-[#0d1009] text-[#d4dec4] font-mono text-[11px] max-h-48 overflow-y-auto p-3">
                  <pre>{appsScriptCode.slice(0, 1500)}... (full code copied to clipboard)</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONNECT EXISTING SHEET / WEBHOOK */}
          {activeTab === 'connect' && (
            <form onSubmit={handleSaveConnection} className="space-y-4">
              <div
                className={`p-3.5 rounded-xl border space-y-1 ${
                  isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#edf0e6] border-[#bcc2a4]'
                }`}
              >
                <div className="font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#686e4a] dark:text-[#c7ccaa]" />
                  <span>Connect Created Spreadsheet to Dashboard</span>
                </div>
                <p className="text-[11px] opacity-80">
                  After creating your sheet in Google Drive, paste its link here so that the direct links and synchronization actions remain permanently saved.
                </p>
              </div>

              <div className="space-y-2">
                <label className="font-semibold block">
                  Google Sheets Link or ID:
                </label>
                <input
                  type="text"
                  placeholder="https://docs.google.com/spreadsheets/d/1ABC123xyz.../edit"
                  value={sheetInput}
                  onChange={(e) => setSheetInput(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                  }`}
                />
                <span className="text-[10px] opacity-70 block">
                  Example: paste the entire URL from your browser address bar.
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-semibold block">
                    Apps Script Web App URL (2-Way Live Sync — must end in <code>/exec</code>):
                  </label>
                  <div className="flex items-center gap-2">
                    {appsScriptInput.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          setAppsScriptInput('');
                          setSaveError(null);
                          setTestResult(null);
                        }}
                        className="text-[10px] font-semibold text-red-500 hover:underline cursor-pointer"
                      >
                        Clear URL
                      </button>
                    )}
                    <span className="text-[10px] font-bold text-[#686e4a] dark:text-[#c7ccaa]">
                      No OAuth login required
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    value={appsScriptInput}
                    onChange={(e) => {
                      setAppsScriptInput(e.target.value);
                      setSaveError(null);
                      setTestResult(null);
                    }}
                    className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs font-mono transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                      webhookValidation && !webhookValidation.valid
                        ? 'border-red-400 bg-red-50/30 dark:bg-red-950/20 text-inherit'
                        : isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                    }`}
                  />
                  <button
                    type="button"
                    disabled={!appsScriptInput.trim() || isTestingWebhook}
                    onClick={handleTestWebhook}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 ${
                      isDarkMode
                        ? 'bg-[#1c2015] border-[#343a27] text-[#e6b000] hover:bg-[#252a1c]'
                        : 'bg-[#edf0e6] border-[#bcc2a4] text-[#52573a] hover:bg-[#dfe4d3]'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTestingWebhook ? 'animate-spin' : ''}`} />
                    <span>{isTestingWebhook ? 'Testing...' : 'Test GET + POST'}</span>
                  </button>
                </div>

                {/* Live URL Validation Warning */}
                {webhookValidation && !webhookValidation.valid && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[11px] flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>{webhookValidation.error}</span>
                  </div>
                )}

                {webhookValidation && webhookValidation.valid && !testResult && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Valid Apps Script Web App URL format. Click "Test GET + POST" to verify 2-way sync.</span>
                  </div>
                )}

                {/* Live Connection Test Result */}
                {testResult && (
                  <div
                    className={`p-3 rounded-xl border text-[11px] space-y-1.5 ${
                      testResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                        : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 font-bold">
                      <span>{testResult.getOk ? '✅ Pull (GET): OK' : '❌ Pull (GET): Failed'}</span>
                      <span>{testResult.postOk ? '✅ Push (POST): OK' : '❌ Push (POST): Failed'}</span>
                    </div>
                    <p className="leading-relaxed">{testResult.message}</p>
                    {!testResult.postOk && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('appscript')}
                        className="mt-1 underline font-bold cursor-pointer"
                      >
                        → Open Apps Script tab to copy the v5.0 script
                      </button>
                    )}
                  </div>
                )}

                <span className="text-[10px] opacity-75 block leading-relaxed">
                  <strong>Getting HTTP 405?</strong> Make sure you paste the <strong>v5.0 Apps Script</strong> in Google Sheets (<em>Extensions &gt; Apps Script</em>), then click <em>Deploy &gt; Manage deployments &gt; Edit (pencil) &gt; Version: New version &gt; Deploy</em> with <strong>Execute as: Me</strong> and <strong>Who has access: Anyone</strong>, and paste the <code>/exec</code> URL above.
                </span>
                <div className="p-2.5 rounded-lg bg-black/5 dark:bg-white/5 border border-inherit text-[11px] flex items-center justify-between gap-2">
                  <span>In <strong>Vercel</strong>, add as an Environment Variable: <code className="font-mono font-bold text-[#686e4a] dark:text-[#c7ccaa]">VITE_APPS_SCRIPT_WEBHOOK_URL</code></span>
                </div>
              </div>

              {saveError && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-200 text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{saveError}</span>
                </div>
              )}

              {saveFeedback && (
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{saveFeedback}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                {accessToken ? (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Google Account Connected (OAuth)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={onSignInGoogle}
                    className="text-[11px] font-semibold text-[#686e4a] dark:text-[#c7ccaa] hover:underline flex items-center gap-1"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>Connect Google account as well</span>
                  </button>
                )}

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-xl shadow-sm cursor-pointer transition-colors"
                >
                  Save Spreadsheet Connection
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: DOWNLOAD CSVS & JSON */}
          {activeTab === 'download' && (
            <div className="space-y-4">
              <div
                className={`p-3.5 rounded-xl border space-y-1 ${
                  isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#edf0e6] border-[#bcc2a4]'
                }`}
              >
                <div className="font-bold flex items-center gap-2">
                  <Download className="w-4 h-4 text-[#686e4a] dark:text-[#c7ccaa]" />
                  <span>Direct Download for Manual Import</span>
                </div>
                <p className="text-[11px] opacity-80">
                  If you prefer not using Apps Script, you can download all formatted datasets and import directly into Google Sheets (File &gt; Import).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-inherit space-y-2 bg-black/5 dark:bg-white/5 flex flex-col justify-between">
                  <div>
                    <strong className="block font-bold text-sm">
                      Download All 7 Formatted CSV Files
                    </strong>
                    <p className="text-[11px] opacity-75 mt-1">
                      Generates 7 individual CSVs: Customers ({customers.length.toLocaleString()}), Partners, Bookings ({bookings.length}), CAC, Practitioners, Procedures, and OKRs.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadAllCsvs}
                    className="w-full px-4 py-2 bg-[#686e4a] hover:bg-[#52573a] text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CSV Bundle</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-inherit space-y-2 bg-black/5 dark:bg-white/5 flex flex-col justify-between">
                  <div>
                    <strong className="block font-bold text-sm">
                      Download Complete JSON Database
                    </strong>
                    <p className="text-[11px] opacity-75 mt-1">
                      Contains all structured Wellthera records for offline security backup or API integrations.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      downloadCompleteJsonPackage({
                        customers,
                        partners,
                        bookings,
                        cacChannels,
                        practitioners,
                        procedures,
                        okrPlans,
                      })
                    }
                    className={`w-full px-4 py-2 rounded-lg font-semibold flex items-center justify-center gap-2 border transition-colors cursor-pointer ${
                      isDarkMode
                        ? 'bg-[#1c2015] border-[#292e1e] text-[#c7ccaa] hover:bg-[#252a1c]'
                        : 'bg-[#f0ede6] border-[#e7e3da] text-[#554e38] hover:bg-[#e7e3da]'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Full JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-5 py-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
            isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f9f8f5] border-[#e7e3da]'
          }`}
        >
          <div className="flex items-center gap-2">
            <FolderSync className="w-4 h-4 text-[#686e4a] dark:text-[#c7ccaa]" />
            <span className="font-semibold">Client Drive Folder:</span>
            <code className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
              {DEFAULT_TARGET_DRIVE_FOLDER_ID}
            </code>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg border font-semibold transition-colors cursor-pointer ${
              isDarkMode
                ? 'bg-[#1c2015] border-[#292e1e] text-[#c7ccaa] hover:bg-[#252a1c]'
                : 'bg-[#f0ede6] border-[#e7e3da] text-[#554e38] hover:bg-[#e7e3da]'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
