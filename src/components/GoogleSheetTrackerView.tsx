import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CloudUpload,
  Download,
  Plus,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle,
  Table,
  HelpCircle,
  FolderSync,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  Lock,
  Code2,
  Sparkles,
  Zap,
  Settings,
} from 'lucide-react';
import {
  Customer,
  Partner,
  ServiceBooking,
  CacChannelSpend,
  GoogleSheetSyncState,
} from '../types';
import {
  createWelltheraGoogleSheet,
  syncDataToExistingSheet,
  syncDataViaAppsScript,
  generateCsvDownload,
  DEFAULT_TARGET_DRIVE_FOLDER_ID,
  DEFAULT_TARGET_DRIVE_FOLDER_URL,
} from '../services/googleSheets';
import { ConfirmationModal } from './ConfirmationModal';
import { GoogleSheetsSetupModal } from './GoogleSheetsSetupModal';
import { ManagerDailyLogView } from './ManagerDailyLogView';

interface GoogleSheetTrackerViewProps {
  customers: Customer[];
  partners: Partner[];
  bookings: ServiceBooking[];
  cacChannels: CacChannelSpend[];
  syncState: GoogleSheetSyncState;
  setSyncState: React.Dispatch<React.SetStateAction<GoogleSheetSyncState>>;
  accessToken: string | null;
  onAddNewCustomer: (customer: Customer) => void;
  onAddNewPartner: (partner: Partner) => void;
  onAddNewBooking?: (booking: ServiceBooking) => void;
  onOpenSignIn: () => void;
  onRefreshFromSheet?: () => Promise<void>;
  isDarkMode?: boolean;
  onOpenHelp?: () => void;
}

type SheetTab = 'manager' | 'customers' | 'partners' | 'bookings' | 'cac';

export const GoogleSheetTrackerView: React.FC<GoogleSheetTrackerViewProps> = ({
  customers,
  partners,
  bookings,
  cacChannels,
  syncState,
  setSyncState,
  accessToken,
  onAddNewCustomer,
  onAddNewPartner,
  onAddNewBooking,
  onOpenSignIn,
  onRefreshFromSheet,
  isDarkMode = false,
  onOpenHelp,
}) => {
  const [activeTab, setActiveTab] = useState<SheetTab>('manager');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);
  const [showStaffQuickGuide, setShowStaffQuickGuide] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // Destructive / mutating operations confirmation state
  const [confirmationConfig, setConfirmationConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    details?: string[];
    action: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: async () => {},
  });

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustPartnerId, setNewCustPartnerId] = useState(partners[0]?.id || 'p-1');
  const [newCustService, setNewCustService] = useState('Brazilian Lymphatic Drainage');
  const [newCustInsurance, setNewCustInsurance] = useState('Sun Life');
  const [newCustSpend, setNewCustSpend] = useState(160);
  const [newCustVisits, setNewCustVisits] = useState(1);

  // New Partner Form State
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerCategory, setNewPartnerCategory] = useState<Partner['category']>('Fitness & CrossFit');
  const [newPartnerContact, setNewPartnerContact] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');
  const [newPartnerCommission, setNewPartnerCommission] = useState(15);

  const handleCreateSheetPrompt = () => {
    if (!accessToken) {
      // If not logged in with OAuth, open Setup Modal which offers the 1-click Google Apps Script generator
      setIsSetupModalOpen(true);
      return;
    }

    setConfirmationConfig({
      isOpen: true,
      title: 'Create Google Sheet in your Google Drive?',
      description:
        'This will create a new multi-tab spreadsheet in your Google Sheets account with 4 tabs pre-formatted for Wellthera customer and partner tracking.',
      details: [
        `Spreadsheet Title: "Wellthera Integrated Health - Partner & Customer Tracking"`,
        `Target Google Drive Folder: ${DEFAULT_TARGET_DRIVE_FOLDER_ID}`,
        `Includes ${customers.length} Customers & RFM data rows`,
        `Includes ${partners.length} Partners & ROI data rows`,
        `Includes ${bookings.length} Services & Bookings log entries`,
        `Includes ${cacChannels.length} CAC channels and unit economic formulas`,
      ],
      action: async () => {
        try {
          setSyncState((prev) => ({ ...prev, isSyncing: true, syncMessage: 'Creating Google Sheet in Drive folder...' }));
          const res = await createWelltheraGoogleSheet(
            accessToken,
            {
              customers,
              partners,
              bookings,
              cacChannels,
            },
            DEFAULT_TARGET_DRIVE_FOLDER_ID
          );

          setSyncState({
            sheetId: res.spreadsheetId,
            sheetUrl: res.spreadsheetUrl,
            lastSyncedAt: new Date().toLocaleTimeString(),
            isSyncing: false,
            syncMessage: res.folderMoved
              ? 'Spreadsheet created and placed in shared Drive folder!'
              : 'Spreadsheet created successfully in Google Drive!',
          });
        } catch (err: any) {
          console.error(err);
          setSyncState((prev) => ({
            ...prev,
            isSyncing: false,
            syncMessage: `Error: ${err.message || 'Failed to create sheet'}`,
          }));
        }
      },
    });
  };

  const handleSyncUpdatesPrompt = () => {
    // 1. If Apps Script Webhook is configured, sync directly via Apps Script
    if (syncState.appsScriptUrl) {
      setConfirmationConfig({
        isOpen: true,
        title: 'Synchronize with Google Sheet via Apps Script?',
        description:
          'This action will send Dashboard data directly to your Google Sheet via the configured Webhook.',
        details: [
          `Webhook URL: ${syncState.appsScriptUrl}`,
          `Syncing ${customers.length} Customers, ${partners.length} Partners, and ${bookings.length} Bookings`,
        ],
        action: async () => {
          try {
            setSyncState((prev) => ({ ...prev, isSyncing: true, syncMessage: 'Syncing via Apps Script Webhook...' }));
            const res = await syncDataViaAppsScript(syncState.appsScriptUrl!, {
              customers,
              partners,
              bookings,
              cacChannels,
            });

            setSyncState((prev) => ({
              ...prev,
              lastSyncedAt: new Date().toLocaleTimeString(),
              isSyncing: false,
              syncMessage: res.message || 'Successfully synchronized via Apps Script!',
            }));
          } catch (err: any) {
            console.error(err);
            setSyncState((prev) => ({
              ...prev,
              isSyncing: false,
              syncMessage: `Sync error: ${err.message}`,
            }));
          }
        },
      });
      return;
    }

    // 2. If Google OAuth token and sheetId are available, sync via Google Sheets REST API
    if (accessToken && syncState.sheetId) {
      setConfirmationConfig({
        isOpen: true,
        title: 'Push All Updates to Google Sheet?',
        description:
          'This will update existing cells in your Google Sheet on Google Drive with the latest data from this application.',
        details: [
          `Target Sheet: ${syncState.sheetUrl}`,
          `Updating ${customers.length} Customers, ${partners.length} Partners, and ${bookings.length} Bookings`,
        ],
        action: async () => {
          try {
            setSyncState((prev) => ({ ...prev, isSyncing: true, syncMessage: 'Syncing rows to Google Sheets...' }));
            await syncDataToExistingSheet(accessToken, syncState.sheetId!, {
              customers,
              partners,
              bookings,
              cacChannels,
            });

            setSyncState((prev) => ({
              ...prev,
              lastSyncedAt: new Date().toLocaleTimeString(),
              isSyncing: false,
              syncMessage: 'Synchronized successfully with Google Sheets!',
            }));
          } catch (err: any) {
            console.error(err);
            setSyncState((prev) => ({
              ...prev,
              isSyncing: false,
              syncMessage: `Sync Error: ${err.message}`,
            }));
          }
        },
      });
      return;
    }

    // 3. If neither is connected, open the Setup & Apps Script Modal so the user can easily connect or copy the script
    setIsSetupModalOpen(true);
  };

  const handleCsvExport = () => {
    if (activeTab === 'customers') {
      const headers = ['Customer ID', 'Name', 'Email', 'Partner', 'Visits', 'Total Spend CAD', 'Service', 'Insurance', 'RFM Segment'];
      const rows = customers.map((c) => [c.id, c.name, c.email, c.partnerName, c.totalVisits, c.totalSpendCAD, c.preferredService, c.insuranceProvider, c.rfmSegment]);
      generateCsvDownload('wellthera_customers_rfm', headers, rows);
    } else if (activeTab === 'partners') {
      const headers = ['Partner ID', 'Partner Name', 'Category', 'Contact', 'Email', 'Patients Referred', 'Total Revenue CAD', 'Commission Paid CAD', 'Net Revenue CAD', 'ROI %'];
      const rows = partners.map((p) => [p.id, p.name, p.category, p.contactPerson, p.email, p.referredCustomersCount, p.totalRevenueCAD, p.totalCommissionPaidCAD, p.netRevenueCAD, `${p.roiPercent}%`]);
      generateCsvDownload('wellthera_partners_roi', headers, rows);
    } else if (activeTab === 'bookings') {
      const headers = ['Booking ID', 'Customer', 'Partner', 'Category', 'Date', 'Price CAD', 'Insurance Billed CAD', 'Patient Paid CAD'];
      const rows = bookings.map((b) => [b.id, b.customerName, b.partnerName, b.serviceCategory, b.bookingDate, b.priceCAD, b.insuranceBilledCAD, b.patientPaidCAD]);
      generateCsvDownload('wellthera_bookings_log', headers, rows);
    } else {
      const headers = ['Channel / Partner', 'Month', 'Spend CAD', 'New Customers', 'CAC CAD', 'LTV CAD', 'LTV:CAC Ratio'];
      const rows = cacChannels.map((c) => [c.partnerOrChannel, 'Rolling 12M', c.spendCAD, c.newCustomersAcquired, c.calculatedCacCAD, c.averageLtvCAD, `${c.ltvCacRatio}x`]);
      generateCsvDownload('wellthera_cac_spend', headers, rows);
    }
  };

  const submitNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    const partner = partners.find((p) => p.id === newCustPartnerId) || partners[0];
    const newCustomer: Customer = {
      id: `c-${Date.now().toString().slice(-4)}`,
      name: newCustName,
      email: newCustEmail || `${newCustName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
      phone: newCustPhone || '(705) 555-1234',
      partnerId: partner.id,
      partnerName: partner.name,
      referralCode: `${partner.name.slice(0, 4).toUpperCase()}-${newCustName.split(' ')[0].toUpperCase()}`,
      firstVisitDate: new Date().toISOString().split('T')[0],
      lastVisitDate: new Date().toISOString().split('T')[0],
      totalVisits: Number(newCustVisits) || 1,
      totalSpendCAD: Number(newCustSpend) || 160,
      preferredService: newCustService,
      insuranceProvider: newCustInsurance,
      status: 'Active',
      recencyDays: 0,
      recencyScore: 5,
      frequencyScore: Number(newCustVisits) > 2 ? 2 : 1,
      monetaryScore: Number(newCustSpend) >= 500 ? 3 : 2,
      rfmSegment: 'Recent Customers',
    };

    onAddNewCustomer(newCustomer);
    setIsAddCustomerModalOpen(false);
    setNewCustName('');
    setNewCustEmail('');
  };

  const submitNewPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) return;

    const partner: Partner = {
      id: `p-${Date.now().toString().slice(-4)}`,
      name: newPartnerName,
      category: newPartnerCategory,
      contactPerson: newPartnerContact || 'Clinic Contact',
      email: newPartnerEmail || `contact@${newPartnerName.toLowerCase().replace(/[^a-z]/g, '')}.ca`,
      phone: '(705) 555-9000',
      commissionType: 'Percentage',
      commissionValue: Number(newPartnerCommission) || 15,
      monthlyRetainerCAD: 0,
      referredCustomersCount: 0,
      activeCustomersCount: 0,
      totalBookingsCount: 0,
      totalRevenueCAD: 0,
      totalCommissionPaidCAD: 0,
      netRevenueCAD: 0,
      roiPercent: 0,
      averageCustomerSpendCAD: 0,
      status: 'Active',
    };

    onAddNewPartner(partner);
    setIsAddPartnerModalOpen(false);
    setNewPartnerName('');
    setNewPartnerContact('');
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Google Sheet Connection Bar */}
      <div
        className={`rounded-xl border p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 transition-colors ${
          isDarkMode
            ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
            : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isDarkMode
                ? 'bg-[#686e4a]/15 text-[#c7ccaa] border-[#686e4a]/30'
                : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4]'
            }`}
          >
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-lg font-bold">
                Wellthera Google Sheet Customer & Partner Tracker
              </h3>
              {syncState.sheetUrl && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#edf0e6] dark:bg-[#686e4a]/20 text-[#52573a] dark:text-[#c7ccaa] border border-[#bcc2a4] dark:border-[#686e4a]/40 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-[#686e4a]" /> Live Connected
                </span>
              )}
            </div>
            <p
              className={`text-xs mt-0.5 ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
              }`}
            >
              Multi-tab spreadsheet schema with customer referrals, partner ROI metrics, and service bookings.
            </p>
          </div>
        </div>

        {/* Action Buttons: Create Sheet, Push Updates, Download CSV */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setIsSetupModalOpen(true)}
            className={`px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5 transition-colors border shadow-xs cursor-pointer ${
              isDarkMode
                ? 'bg-[#1c2015] border-[#343a27] text-[#e6b000] hover:bg-[#252a1c]'
                : 'bg-[#edf0e6] border-[#bcc2a4] text-[#52573a] hover:bg-[#dfe4d3]'
            }`}
            title="Spreadsheet Setup & Apps Script Generator"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Generate Sheet (Apps Script)</span>
          </button>

          {syncState.sheetUrl && (
            <a
              href={syncState.sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-[#686e4a] hover:bg-[#52573a] text-white font-semibold rounded-full flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in Google Sheets</span>
            </a>
          )}

          {onRefreshFromSheet && (
            <button
              onClick={onRefreshFromSheet}
              disabled={syncState.isSyncing}
              className={`px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer ${
                isDarkMode
                  ? 'bg-[#1c2015] border-[#343a27] text-[#e6b000] hover:bg-[#252a1c]'
                  : 'bg-[#edf0e6] border-[#bcc2a4] text-[#52573a] hover:bg-[#dfe4d3]'
              }`}
              title="Pull latest patients, partners, and bookings from Google Sheets"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
              <span>{syncState.isSyncing ? 'Fetching...' : 'Pull from Google Sheet'}</span>
            </button>
          )}

          <button
            onClick={handleSyncUpdatesPrompt}
            disabled={syncState.isSyncing}
            className={`px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5 transition-colors border cursor-pointer ${
              syncState.sheetUrl || syncState.appsScriptUrl
                ? 'bg-[#686e4a] hover:bg-[#52573a] text-white border-transparent shadow-sm'
                : isDarkMode
                ? 'bg-[#1c2015] border-[#292e1e] text-[#c7ccaa] hover:bg-[#252a1c]'
                : 'bg-[#f0ede6] border-[#e7e3da] text-[#554e38] hover:bg-[#e7e3da]'
            }`}
          >
            <CloudUpload className="w-3.5 h-3.5" />
            <span>Sync to Sheet</span>
          </button>

          <button
            onClick={handleCsvExport}
            className={`px-3.5 py-2 rounded-full font-semibold flex items-center gap-1.5 transition-colors border ${
              isDarkMode
                ? 'bg-[#1c2015] border-[#292e1e] text-[#c2c8b0] hover:bg-[#252a1c]'
                : 'bg-[#f0ede6] border-[#e7e3da] text-[#554e38] hover:bg-[#e7e3da]'
            }`}
            title="Download CSV file for current tab"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Target Drive Folder & Guide Bar */}
      <div
        className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
          isDarkMode
            ? 'bg-[#14160e] border-[#292e1e]'
            : 'bg-[#edf0e6] border-[#bcc2a4]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <FolderSync className="w-4 h-4 text-[#686e4a] shrink-0" />
          <span className="font-semibold">Target Customer Drive Folder:</span>
          <code className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10">
            {DEFAULT_TARGET_DRIVE_FOLDER_ID}
          </code>
          <a
            href={DEFAULT_TARGET_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#686e4a] dark:text-[#c7ccaa] font-bold hover:underline flex items-center gap-1 ml-1"
          >
            <span>Open in Google Drive</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStaffQuickGuide(!showStaffQuickGuide)}
            className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showStaffQuickGuide
                ? 'bg-[#686e4a] text-white border-[#686e4a]'
                : isDarkMode
                ? 'bg-[#1c2015] border-[#292e1e] text-[#c7ccaa] hover:bg-[#252a1c]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#52573a] hover:bg-[#f0ede6]'
            }`}
            title="Staff instructions for updating the spreadsheet"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Front Desk SOP Guide</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showStaffQuickGuide ? 'rotate-180' : ''}`} />
          </button>

          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDarkMode
                  ? 'bg-[#1c2015] border-[#292e1e] text-[#c7ccaa] hover:bg-[#252a1c]'
                  : 'bg-[#ffffff] border-[#e7e3da] text-[#52573a] hover:bg-[#f0ede6]'
              }`}
              title="General Setup & Deployment Guide"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#686e4a]" />
              <span>Full Manual (?)</span>
            </button>
          )}
        </div>
      </div>

      {/* Staff SOP Quick Guide Collapsible Card */}
      {showStaffQuickGuide && (
        <div
          className={`p-4 rounded-xl border space-y-3 animate-in fade-in duration-150 ${
            isDarkMode
              ? 'bg-[#181b12] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#f9f8f5] border-[#bcc2a4] text-[#332e1e]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-[#686e4a] dark:text-[#c7ccaa]" />
              <strong className="text-xs sm:text-sm font-serif">
                Daily Clinic Routine & Staff Spreadsheet Instructions:
              </strong>
            </div>
            {onOpenHelp && (
              <button
                onClick={onOpenHelp}
                className="text-[11px] text-[#686e4a] dark:text-[#c7ccaa] font-bold hover:underline"
              >
                Open Full Manual →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
            <div className="p-3 rounded-lg border border-inherit space-y-1.5 bg-black/5 dark:bg-white/5">
              <strong className="text-[#686e4a] dark:text-[#c7ccaa] block font-semibold">
                1. At Every Completed Checkout:
              </strong>
              <p className="opacity-80 leading-relaxed">
                Open <strong>Services & Bookings Log</strong> in Google Sheets and add a row: Patient Name, Date, Service Category, Therapist, and Total Price CAD.
              </p>
              <p className="text-[10px] opacity-70">
                • If insurance was billed: enter covered amount in <em>Direct Insurance Billed</em> and copay in <em>Patient Out-of-Pocket</em>.
              </p>
            </div>

            <div className="p-3 rounded-lg border border-inherit space-y-1.5 bg-black/5 dark:bg-white/5">
              <strong className="text-[#e6b000] block font-semibold">
                2. When Patient is NEW to Clinic:
              </strong>
              <p className="opacity-80 leading-relaxed">
                Open <strong>Customers & RFM</strong> and add the profile: Name, Phone, Email, Insurance Provider, and Referral Partner Code.
              </p>
              <p className="text-[10px] opacity-70 font-mono">
                Barrie Referral Codes: <code className="font-bold">CFIT-APEX</code> | <code className="font-bold">LAKE-PHYS</code> | <code className="font-bold">INNIS-PELV</code> | <code className="font-bold">BARRIE-CHIR</code> | <code className="font-bold">DIRECT</code>
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-amber-300 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 text-[11px] flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Important:</strong> Never delete existing rows and do not edit calculated formula columns (R-Score, F-Score, Segment).
              </span>
            </div>
            <button
              onClick={() => setShowStaffQuickGuide(false)}
              className="text-[10px] font-bold uppercase underline shrink-0 hover:opacity-80"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Sync Status Banner */}
      {syncState.syncMessage && (
        <div
          className={`rounded-xl px-4 py-2 text-xs flex items-center justify-between border ${
            isDarkMode
              ? 'bg-[#14160e] border-[#292e1e] text-[#c7ccaa]'
              : 'bg-[#edf0e6] border-[#bcc2a4] text-[#332e1e]'
          }`}
        >
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#686e4a] animate-pulse" />
            <span>{syncState.syncMessage}</span>
            {syncState.lastSyncedAt && (
              <span className="opacity-70">({syncState.lastSyncedAt})</span>
            )}
          </div>
          {syncState.sheetUrl && (
            <a
              href={syncState.sheetUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[#686e4a] dark:text-[#c7ccaa] font-bold hover:underline flex items-center gap-1"
            >
              <span>View Sheet ID: {syncState.sheetId?.slice(0, 12)}...</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Google Sheet Tabs Selector + Table Controls */}
      <div
        className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${
          isDarkMode
            ? 'bg-[#1a1e13] border-[#292e1e]'
            : 'bg-[#ffffff] border-[#e7e3da]'
        }`}
      >
        {/* Spreadsheet Tab Bar */}
        <div
          className={`flex flex-wrap items-center justify-between px-3 pt-2 gap-2 border-b ${
            isDarkMode
              ? 'bg-[#14160e] border-[#292e1e]'
              : 'bg-[#f0ede6] border-[#e7e3da]'
          }`}
        >
          <div className="flex items-center gap-1 overflow-x-auto">
            {(
              [
                { id: 'manager', label: "👩‍💼 Manager's Desk (Daily)", count: bookings.length },
                { id: 'customers', label: '1. Customers & RFM', count: customers.length },
                { id: 'partners', label: '2. Partners & ROI', count: partners.length },
                { id: 'bookings', label: '3. Services & Bookings', count: bookings.length },
                { id: 'cac', label: '4. CAC & Channel Costs', count: cacChannels.length },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? isDarkMode
                      ? 'bg-[#1a1e13] text-[#e6b000] border-t-2 border-[#e6b000] border-x border-[#292e1e]'
                      : 'bg-[#ffffff] text-[#52573a] border-t-2 border-[#686e4a] border-x border-[#e7e3da]'
                    : isDarkMode
                    ? 'text-[#8b927a] hover:text-[#f9f8f5]'
                    : 'text-[#6e6856] hover:text-[#100e0a]'
                }`}
              >
                <Table className="w-3.5 h-3.5 opacity-70" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isDarkMode ? 'bg-[#14160e] text-[#a2a992]' : 'bg-[#f0ede6] text-[#554e38]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Row Insertion */}
          <div className="flex items-center gap-2 pb-2">
            {activeTab === 'customers' && (
              <button
                onClick={() => setIsAddCustomerModalOpen(true)}
                className="px-3 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-semibold text-xs rounded-full transition-colors flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Customer Row</span>
              </button>
            )}
            {activeTab === 'partners' && (
              <button
                onClick={() => setIsAddPartnerModalOpen(true)}
                className="px-3 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-semibold text-xs rounded-full transition-colors flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Partner Row</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 0: Manager Daily Operational Console */}
        {activeTab === 'manager' && (
          <div className="p-4 sm:p-5">
            <ManagerDailyLogView
              bookings={bookings}
              customers={customers}
              partners={partners}
              onAddNewBooking={onAddNewBooking || (() => {})}
              onAddNewCustomer={onAddNewCustomer}
              syncState={syncState}
              onSyncNow={handleSyncUpdatesPrompt}
              isDarkMode={isDarkMode}
            />
          </div>
        )}

        {/* Tab 1: Customers Table View */}
        {activeTab === 'customers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`uppercase text-[10px] tracking-wider border-b ${
                    isDarkMode
                      ? 'bg-[#181b11] border-[#292e1e] text-[#8b927a]'
                      : 'bg-[#f9f8f5] border-[#e7e3da] text-[#7d7663]'
                  }`}
                >
                  <th className="py-2.5 px-3 font-mono font-bold">ID</th>
                  <th className="py-2.5 px-4 font-bold">Patient Name</th>
                  <th className="py-2.5 px-3 font-bold">Partner Referral</th>
                  <th className="py-2.5 px-3 font-bold">Referral Code</th>
                  <th className="py-2.5 px-2 font-bold text-center">Visits</th>
                  <th className="py-2.5 px-3 font-bold">Total CAD</th>
                  <th className="py-2.5 px-3 font-bold">Preferred Service</th>
                  <th className="py-2.5 px-3 font-bold">Direct Insurer</th>
                  <th className="py-2.5 px-3 font-bold">RFM Segment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit font-mono">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className={`transition-colors ${
                      isDarkMode
                        ? 'hover:bg-[#202517] border-[#292e1e]'
                        : 'hover:bg-[#f4f1eb] border-[#e7e3da]'
                    }`}
                  >
                    <td className="py-2.5 px-3 opacity-60">{c.id}</td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-sm">
                      {c.name}
                    </td>
                    <td className="py-2.5 px-3 font-sans">{c.partnerName}</td>
                    <td className="py-2.5 px-3 text-[#686e4a] dark:text-[#aab187] font-bold">
                      {c.referralCode}
                    </td>
                    <td className="py-2.5 px-2 text-center font-bold">{c.totalVisits}</td>
                    <td className="py-2.5 px-3 font-bold text-[#686e4a] dark:text-[#aab187]">
                      ${c.totalSpendCAD}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-xs">{c.preferredService}</td>
                    <td className="py-2.5 px-3 font-sans text-xs">{c.insuranceProvider}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isDarkMode
                            ? 'bg-[#14160e] text-[#c7ccaa] border-[#292e1e]'
                            : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4]'
                        }`}
                      >
                        {c.rfmSegment}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Partners Table View */}
        {activeTab === 'partners' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`uppercase text-[10px] tracking-wider border-b ${
                    isDarkMode
                      ? 'bg-[#181b11] border-[#292e1e] text-[#8b927a]'
                      : 'bg-[#f9f8f5] border-[#e7e3da] text-[#7d7663]'
                  }`}
                >
                  <th className="py-2.5 px-3 font-mono font-bold">ID</th>
                  <th className="py-2.5 px-4 font-bold">Partner Name</th>
                  <th className="py-2.5 px-3 font-bold">Category</th>
                  <th className="py-2.5 px-3 font-bold">Contact</th>
                  <th className="py-2.5 px-2 font-bold text-center">Patients</th>
                  <th className="py-2.5 px-3 font-bold">Gross CAD</th>
                  <th className="py-2.5 px-3 font-bold">Commission CAD</th>
                  <th className="py-2.5 px-3 font-bold">Net Margin CAD</th>
                  <th className="py-2.5 px-3 font-bold">ROI %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit font-mono">
                {partners.map((p) => (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isDarkMode
                        ? 'hover:bg-[#202517] border-[#292e1e]'
                        : 'hover:bg-[#f4f1eb] border-[#e7e3da]'
                    }`}
                  >
                    <td className="py-2.5 px-3 opacity-60">{p.id}</td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-sm">
                      {p.name}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-xs">{p.category}</td>
                    <td className="py-2.5 px-3 font-sans text-xs">{p.contactPerson}</td>
                    <td className="py-2.5 px-2 text-center font-bold">
                      {p.referredCustomersCount}
                    </td>
                    <td className="py-2.5 px-3 font-bold">${p.totalRevenueCAD}</td>
                    <td className="py-2.5 px-3">${p.totalCommissionPaidCAD}</td>
                    <td className="py-2.5 px-3 font-bold text-[#686e4a] dark:text-[#aab187]">
                      ${p.netRevenueCAD}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#686e4a] dark:text-[#aab187]">
                      +{p.roiPercent.toFixed(0)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Bookings Table View */}
        {activeTab === 'bookings' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`uppercase text-[10px] tracking-wider border-b ${
                    isDarkMode
                      ? 'bg-[#181b11] border-[#292e1e] text-[#8b927a]'
                      : 'bg-[#f9f8f5] border-[#e7e3da] text-[#7d7663]'
                  }`}
                >
                  <th className="py-2.5 px-3 font-mono font-bold">ID</th>
                  <th className="py-2.5 px-4 font-bold">Customer</th>
                  <th className="py-2.5 px-3 font-bold">Partner Source</th>
                  <th className="py-2.5 px-3 font-bold">Category</th>
                  <th className="py-2.5 px-3 font-bold">Date</th>
                  <th className="py-2.5 px-3 font-bold">Price CAD</th>
                  <th className="py-2.5 px-3 font-bold">Insurance Billed</th>
                  <th className="py-2.5 px-3 font-bold">Patient Copay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit font-mono">
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className={`transition-colors ${
                      isDarkMode
                        ? 'hover:bg-[#202517] border-[#292e1e]'
                        : 'hover:bg-[#f4f1eb] border-[#e7e3da]'
                    }`}
                  >
                    <td className="py-2.5 px-3 opacity-60">{b.id}</td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-sm">
                      {b.customerName}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-xs">{b.partnerName}</td>
                    <td className="py-2.5 px-3 font-sans text-xs">{b.serviceCategory}</td>
                    <td className="py-2.5 px-3 text-xs">{b.bookingDate}</td>
                    <td className="py-2.5 px-3 font-bold">${b.priceCAD}</td>
                    <td className="py-2.5 px-3 text-[#686e4a] dark:text-[#aab187]">
                      ${b.insuranceBilledCAD}
                    </td>
                    <td className="py-2.5 px-3 text-[#b88c00] dark:text-[#e6b000]">
                      ${b.patientPaidCAD}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: CAC Table View */}
        {activeTab === 'cac' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr
                  className={`uppercase text-[10px] tracking-wider border-b ${
                    isDarkMode
                      ? 'bg-[#181b11] border-[#292e1e] text-[#8b927a]'
                      : 'bg-[#f9f8f5] border-[#e7e3da] text-[#7d7663]'
                  }`}
                >
                  <th className="py-2.5 px-3 font-mono font-bold">ID</th>
                  <th className="py-2.5 px-4 font-bold">Channel / Partner</th>
                  <th className="py-2.5 px-3 font-bold">Spend CAD</th>
                  <th className="py-2.5 px-2 font-bold text-center">New Patients</th>
                  <th className="py-2.5 px-3 font-bold">CAC CAD</th>
                  <th className="py-2.5 px-3 font-bold">Avg LTV CAD</th>
                  <th className="py-2.5 px-3 font-bold">LTV:CAC</th>
                  <th className="py-2.5 px-3 font-bold">Payback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit font-mono">
                {cacChannels.map((c) => (
                  <tr
                    key={c.id}
                    className={`transition-colors ${
                      isDarkMode
                        ? 'hover:bg-[#202517] border-[#292e1e]'
                        : 'hover:bg-[#f4f1eb] border-[#e7e3da]'
                    }`}
                  >
                    <td className="py-2.5 px-3 opacity-60">{c.id}</td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-sm">
                      {c.partnerOrChannel}
                    </td>
                    <td className="py-2.5 px-3 font-bold">${c.spendCAD}</td>
                    <td className="py-2.5 px-2 text-center font-bold">
                      {c.newCustomersAcquired}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#686e4a] dark:text-[#aab187]">
                      ${c.calculatedCacCAD.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3">${c.averageLtvCAD}</td>
                    <td className="py-2.5 px-3 font-bold text-[#686e4a] dark:text-[#aab187]">
                      {c.ltvCacRatio.toFixed(1)}x
                    </td>
                    <td className="py-2.5 px-3 text-xs">{c.paybackPeriodMonths} months</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add New Customer */}
      {isAddCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`rounded-2xl max-w-md w-full p-6 shadow-2xl border ${
              isDarkMode
                ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
            }`}
          >
            <h3 className="font-serif text-xl font-bold mb-4">
              Insert Patient Tracking Row
            </h3>
            <form onSubmit={submitNewCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Jessica Williams"
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Partner Referral Source *
                </label>
                <select
                  value={newCustPartnerId}
                  onChange={(e) => setNewCustPartnerId(e.target.value)}
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Primary Therapy Booked
                </label>
                <select
                  value={newCustService}
                  onChange={(e) => setNewCustService(e.target.value)}
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                >
                  <option value="Brazilian Lymphatic Drainage">
                    Brazilian Lymphatic Drainage (Specialty)
                  </option>
                  <option value="Registered Massage Therapy">Registered Massage Therapy</option>
                  <option value="Acupuncture">Medical Acupuncture</option>
                  <option value="Nurse-Led Injectables">Nurse-Led Injectables</option>
                  <option value="Psychotherapy">Psychotherapy</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Initial Spend (CAD)</label>
                  <input
                    type="number"
                    value={newCustSpend}
                    onChange={(e) => setNewCustSpend(Number(e.target.value))}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Initial Bookings</label>
                  <input
                    type="number"
                    value={newCustVisits}
                    onChange={(e) => setNewCustVisits(Number(e.target.value))}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div
                className={`mt-5 pt-3 border-t flex justify-end gap-2 ${
                  isDarkMode ? 'border-[#24291c]' : 'border-[#e7e3da]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsAddCustomerModalOpen(false)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#a2a992]'
                      : 'bg-[#f0ede6] border-[#e7e3da] text-[#554e38]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-lg shadow-sm"
                >
                  Insert Customer Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Partner */}
      {isAddPartnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`rounded-2xl max-w-md w-full p-6 shadow-2xl border ${
              isDarkMode
                ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
            }`}
          >
            <h3 className="font-serif text-xl font-bold mb-4">
              Add Partner Organization
            </h3>
            <form onSubmit={submitNewPartner} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Partner Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPartnerName}
                  onChange={(e) => setNewPartnerName(e.target.value)}
                  placeholder="e.g. Barrie Tri-Sport Club"
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">Category *</label>
                <select
                  value={newPartnerCategory}
                  onChange={(e) => setNewPartnerCategory(e.target.value as any)}
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                >
                  <option value="Fitness & CrossFit">Fitness & CrossFit</option>
                  <option value="Physiotherapy & Chiro">Physiotherapy & Chiro</option>
                  <option value="OB-GYN, Doulas & Pelvic Health">OB-GYN, Doulas & Pelvic Health</option>
                  <option value="MedSpa & Aesthetics">MedSpa & Aesthetics</option>
                  <option value="Local Wellness Influencer">Local Wellness Influencer</option>
                  <option value="Corporate Wellness">Corporate Wellness</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">Contact Person</label>
                <input
                  type="text"
                  value={newPartnerContact}
                  onChange={(e) => setNewPartnerContact(e.target.value)}
                  placeholder="e.g. Samantha King"
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">Referral Commission Rate (%)</label>
                <input
                  type="number"
                  value={newPartnerCommission}
                  onChange={(e) => setNewPartnerCommission(Number(e.target.value))}
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div
                className={`mt-5 pt-3 border-t flex justify-end gap-2 ${
                  isDarkMode ? 'border-[#24291c]' : 'border-[#e7e3da]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsAddPartnerModalOpen(false)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#a2a992]'
                      : 'bg-[#f0ede6] border-[#e7e3da] text-[#554e38]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-lg shadow-sm"
                >
                  Create Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Destructive / Mutating Operations */}
      <ConfirmationModal
        isOpen={confirmationConfig.isOpen}
        title={confirmationConfig.title}
        description={confirmationConfig.description}
        details={confirmationConfig.details}
        confirmLabel="Proceed & Execute"
        onConfirm={async () => {
          setConfirmationConfig((prev) => ({ ...prev, isOpen: false }));
          await confirmationConfig.action();
        }}
        onCancel={() => setConfirmationConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Google Sheets Apps Script & Setup Modal */}
      <GoogleSheetsSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        isDarkMode={isDarkMode}
        syncState={syncState}
        onSaveSyncSettings={(settings) => {
          setSyncState((prev) => ({
            ...prev,
            sheetId: settings.sheetId ?? prev.sheetId,
            sheetUrl: settings.sheetUrl ?? prev.sheetUrl,
            appsScriptUrl: settings.appsScriptUrl ?? prev.appsScriptUrl,
            syncMessage: 'Synchronization settings successfully updated!',
          }));
        }}
        customers={customers}
        partners={partners}
        bookings={bookings}
        cacChannels={cacChannels}
        accessToken={accessToken}
        onSignInGoogle={onOpenSignIn}
        onCreateViaOAuth={handleCreateSheetPrompt}
      />
    </div>
  );
};
