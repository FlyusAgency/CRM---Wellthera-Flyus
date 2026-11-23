import React, { useState, useMemo } from 'react';
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
  Trash2,
  Pencil,
  UserCheck,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Check,
  X,
  Filter,
} from 'lucide-react';
import {
  Customer,
  Partner,
  ServiceBooking,
  CacChannelSpend,
  GoogleSheetSyncState,
  Practitioner,
  ClinicProcedure,
  PartnerCategory,
  ServiceCategory,
  RfmSegment,
  QuarterlyOkrPlan,
} from '../types';
import {
  createWelltheraGoogleSheet,
  syncDataToExistingSheet,
  syncDataViaAppsScript,
  validateAppsScriptUrl,
  generateCsvDownload,
  DEFAULT_TARGET_DRIVE_FOLDER_ID,
  DEFAULT_TARGET_DRIVE_FOLDER_URL,
} from '../services/googleSheets';
import { initialPractitioners, initialProcedures, initialOkrPlans } from '../data/initialData';
import { ConfirmationModal } from './ConfirmationModal';
import { GoogleSheetsSetupModal } from './GoogleSheetsSetupModal';
import { ManagerDailyLogView } from './ManagerDailyLogView';

interface GoogleSheetTrackerViewProps {
  customers: Customer[];
  partners: Partner[];
  bookings: ServiceBooking[];
  cacChannels: CacChannelSpend[];
  practitioners?: Practitioner[];
  procedures?: ClinicProcedure[];
  okrPlans?: QuarterlyOkrPlan[];
  syncState: GoogleSheetSyncState;
  setSyncState: React.Dispatch<React.SetStateAction<GoogleSheetSyncState>>;
  accessToken: string | null;
  onAddNewCustomer: (customer: Customer) => void;
  onAssignPartnerToCustomer?: (
    customerId: string,
    partnerId: string,
    partnerName: string,
    referralCode?: string,
    updatePastBookings?: boolean
  ) => void;
  onAssignPartnerToBooking?: (
    bookingId: string,
    partnerId: string,
    partnerName: string
  ) => void;
  onAddNewPartner: (partner: Partner) => void;
  onUpdatePartner?: (partner: Partner) => void;
  onDeletePartner?: (id: string) => void;
  onAddNewBooking?: (booking: ServiceBooking) => void;
  onAddNewPractitioner?: (practitioner: Practitioner) => void;
  onUpdatePractitioner?: (practitioner: Practitioner) => void;
  onDeletePractitioner?: (id: string) => void;
  onAddNewProcedure?: (procedure: ClinicProcedure) => void;
  onUpdateProcedure?: (procedure: ClinicProcedure) => void;
  onDeleteProcedure?: (id: string) => void;
  onOpenSignIn: () => void;
  onRefreshFromSheet?: () => Promise<void>;
  isDarkMode?: boolean;
  onOpenHelp?: () => void;
}

type SheetTab = 'manager' | 'customers' | 'partners' | 'bookings' | 'cac' | 'practitioners' | 'procedures';

export const GoogleSheetTrackerView: React.FC<GoogleSheetTrackerViewProps> = ({
  customers,
  partners,
  bookings,
  cacChannels,
  practitioners = initialPractitioners,
  procedures = initialProcedures,
  okrPlans = initialOkrPlans,
  syncState,
  setSyncState,
  accessToken,
  onAddNewCustomer,
  onAssignPartnerToCustomer,
  onAssignPartnerToBooking,
  onAddNewPartner,
  onUpdatePartner,
  onDeletePartner,
  onAddNewBooking,
  onAddNewPractitioner,
  onUpdatePractitioner,
  onDeletePractitioner,
  onAddNewProcedure,
  onUpdateProcedure,
  onDeleteProcedure,
  onOpenSignIn,
  onRefreshFromSheet,
  isDarkMode = false,
  onOpenHelp,
}) => {
  const [activeTab, setActiveTab] = useState<SheetTab>('manager');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);
  const [isAddPractitionerModalOpen, setIsAddPractitionerModalOpen] = useState(false);
  const [isAddProcedureModalOpen, setIsAddProcedureModalOpen] = useState(false);
  const [showStaffQuickGuide, setShowStaffQuickGuide] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [setupModalTab, setSetupModalTab] = useState<'appscript' | 'connect' | 'download'>('appscript');

  // New Practitioner Form State
  const [newPractName, setNewPractName] = useState('');
  const [newPractTitle, setNewPractTitle] = useState('Registered Massage Therapist');
  const [newPractDiscipline, setNewPractDiscipline] = useState('Massage Therapy');
  const [newPractEmail, setNewPractEmail] = useState('');
  const [newPractPhone, setNewPractPhone] = useState('');
  const [newPractServices, setNewPractServices] = useState('Brazilian Lymphatic Drainage, Registered Massage Therapy');

  // New Procedure Form State
  const [newProcName, setNewProcName] = useState('');
  const [newProcCategory, setNewProcCategory] = useState('Registered Massage Therapy');
  const [newProcDuration, setNewProcDuration] = useState(60);
  const [newProcPrice, setNewProcPrice] = useState(150);
  const [newProcInsurance, setNewProcInsurance] = useState(true);
  const [newProcBilling, setNewProcBilling] = useState(150);
  const [newProcCopay, setNewProcCopay] = useState(0);
  const [newProcDesc, setNewProcDesc] = useState('');

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

  // Assign Partner to Customer Modal State
  const [assigningCustomer, setAssigningCustomer] = useState<Customer | null>(null);
  const [assignPartnerId, setAssignPartnerId] = useState<string>('no-partner');
  const [assignReferralCode, setAssignReferralCode] = useState<string>('');
  const [assignUpdateBookings, setAssignUpdateBookings] = useState<boolean>(true);

  // Assign Partner to Booking Modal State
  const [assigningBooking, setAssigningBooking] = useState<ServiceBooking | null>(null);
  const [assignBookingPartnerId, setAssignBookingPartnerId] = useState<string>('no-partner');

  // Edit Partner Modal State
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  // Edit Practitioner Modal State
  const [editingPractitioner, setEditingPractitioner] = useState<Practitioner | null>(null);
  const [editPractServices, setEditPractServices] = useState<string>('');

  // Edit Procedure Modal State
  const [editingProcedure, setEditingProcedure] = useState<ClinicProcedure | null>(null);
  const [editProcPractitioners, setEditProcPractitioners] = useState<string>('');

  // Customer Filter & Pagination State (ClinicSense patient database)
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [customerPartnerFilter, setCustomerPartnerFilter] = useState<string>('all');
  const [customerRfmFilter, setCustomerRfmFilter] = useState<string>('all');
  const [customerPage, setCustomerPage] = useState<number>(1);
  const [customerPageSize, setCustomerPageSize] = useState<number>(25);

  // Filtered & Paginated Customers List
  const filteredCustomersList = useMemo(() => {
    return customers.filter((c) => {
      // Search across name, email, phone, service, referral code, partner
      if (customerSearch.trim()) {
        const q = customerSearch.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        const matchesPhone = c.phone?.toLowerCase().includes(q);
        const matchesService = c.preferredService?.toLowerCase().includes(q);
        const matchesCode = c.referralCode?.toLowerCase().includes(q);
        const matchesPartner = c.partnerName?.toLowerCase().includes(q);
        if (
          !matchesName &&
          !matchesEmail &&
          !matchesPhone &&
          !matchesService &&
          !matchesCode &&
          !matchesPartner
        ) {
          return false;
        }
      }
      // Partner filter
      if (customerPartnerFilter === 'unassigned' || customerPartnerFilter === 'no-partner') {
        if (
          c.partnerId &&
          c.partnerId !== 'no-partner' &&
          c.partnerId !== 'direct' &&
          c.partnerId !== 'p-8'
        ) {
          return false;
        }
      } else if (customerPartnerFilter !== 'all') {
        if (c.partnerId !== customerPartnerFilter) {
          return false;
        }
      }
      // RFM filter
      if (customerRfmFilter !== 'all') {
        if (c.rfmSegment !== customerRfmFilter) {
          return false;
        }
      }
      return true;
    });
  }, [customers, customerSearch, customerPartnerFilter, customerRfmFilter]);

  const totalCustomerPages = Math.max(1, Math.ceil(filteredCustomersList.length / customerPageSize));
  const paginatedCustomers = useMemo(() => {
    const start = (customerPage - 1) * customerPageSize;
    return filteredCustomersList.slice(start, start + customerPageSize);
  }, [filteredCustomersList, customerPage, customerPageSize]);

  // Open Partner Assignment Modal for a Customer
  const handleOpenAssignCustomerModal = (customer: Customer) => {
    setAssigningCustomer(customer);
    const isNoPartner =
      !customer.partnerId ||
      customer.partnerId === 'no-partner' ||
      customer.partnerId === 'direct' ||
      customer.partnerId === 'p-8';
    const initialPartnerId = isNoPartner ? 'no-partner' : customer.partnerId;
    setAssignPartnerId(initialPartnerId);

    const partner = partners.find((p) => p.id === initialPartnerId);
    setAssignReferralCode(
      isNoPartner
        ? 'DIRECT'
        : customer.referralCode && customer.referralCode !== 'DIRECT'
        ? customer.referralCode
        : partner?.referralCode || (partner ? partner.name.split(' ')[0].toUpperCase() + '-REF' : 'REF')
    );
    setAssignUpdateBookings(true);
  };

  // Submit Partner Assignment for a Customer
  const handleSaveCustomerPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningCustomer) return;

    if (assignPartnerId === 'no-partner' || assignPartnerId === 'direct') {
      if (onAssignPartnerToCustomer) {
        onAssignPartnerToCustomer(
          assigningCustomer.id,
          'no-partner',
          'No partner',
          'DIRECT',
          assignUpdateBookings
        );
      }
    } else {
      const selectedPartner = partners.find((p) => p.id === assignPartnerId);
      const partnerName = selectedPartner ? selectedPartner.name : 'Referral Partner';
      const code =
        assignReferralCode.trim() ||
        selectedPartner?.referralCode ||
        partnerName.split(' ')[0].toUpperCase() + '-REF';

      if (onAssignPartnerToCustomer) {
        onAssignPartnerToCustomer(
          assigningCustomer.id,
          assignPartnerId,
          partnerName,
          code,
          assignUpdateBookings
        );
      }
    }
    setAssigningCustomer(null);
  };

  // Open Partner Assignment for a Booking
  const handleOpenAssignBookingModal = (booking: ServiceBooking) => {
    setAssigningBooking(booking);
    const isNoPartner =
      !booking.partnerId ||
      booking.partnerId === 'no-partner' ||
      booking.partnerId === 'direct' ||
      booking.partnerId === 'p-8';
    setAssignBookingPartnerId(isNoPartner ? 'no-partner' : booking.partnerId);
  };

  // Submit Partner Assignment for a Booking
  const handleSaveBookingPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningBooking) return;

    if (assignBookingPartnerId === 'no-partner' || assignBookingPartnerId === 'direct') {
      if (onAssignPartnerToBooking) {
        onAssignPartnerToBooking(assigningBooking.id, 'no-partner', 'No partner');
      }
    } else {
      const partner = partners.find((p) => p.id === assignBookingPartnerId);
      const partnerName = partner ? partner.name : 'Referral Partner';
      if (onAssignPartnerToBooking) {
        onAssignPartnerToBooking(assigningBooking.id, assignBookingPartnerId, partnerName);
      }
    }
    setAssigningBooking(null);
  };

  // Open Edit Practitioner Modal
  const handleOpenEditPractitioner = (p: Practitioner) => {
    setEditingPractitioner(p);
    setEditPractServices(p.servicesOffered.join(', '));
  };

  // Save Edited Practitioner
  const handleSaveEditPractitioner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPractitioner) return;

    const updated: Practitioner = {
      ...editingPractitioner,
      servicesOffered: editPractServices
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (onUpdatePractitioner) {
      onUpdatePractitioner(updated);
    }
    setEditingPractitioner(null);
  };

  // Open Edit Procedure Modal
  const handleOpenEditProcedure = (proc: ClinicProcedure) => {
    setEditingProcedure(proc);
    setEditProcPractitioners(proc.assignedPractitioners.join(', '));
  };

  // Save Edited Procedure
  const handleSaveEditProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProcedure) return;

    const updated: ClinicProcedure = {
      ...editingProcedure,
      assignedPractitioners: editProcPractitioners
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (onUpdateProcedure) {
      onUpdateProcedure(updated);
    }
    setEditingProcedure(null);
  };

  // Open Edit Partner Modal
  const handleOpenEditPartner = (p: Partner) => {
    setEditingPartner(p);
  };

  // Save Edited Partner
  const handleSaveEditPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;

    if (onUpdatePartner) {
      onUpdatePartner(editingPartner);
    }
    setEditingPartner(null);
  };

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustPartnerId, setNewCustPartnerId] = useState(partners[0]?.id || 'no-partner');
  const [newCustService, setNewCustService] = useState('Brazilian Lymphatic Drainage');
  const [newCustInsurance, setNewCustInsurance] = useState('Sun Life');
  const [newCustSpend, setNewCustSpend] = useState(160);
  const [newCustVisits, setNewCustVisits] = useState(1);

  // New Partner Form State
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newPartnerCategory, setNewPartnerCategory] = useState<Partner['category']>('Fitness & CrossFit');
  const [newPartnerContact, setNewPartnerContact] = useState('');
  const [newPartnerEmail, setNewPartnerEmail] = useState('');
  const [newPartnerCode, setNewPartnerCode] = useState('');
  const [newPartnerCommission, setNewPartnerCommission] = useState(10);

  const handleCreatePractitioner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPractName.trim()) return;

    const newPr: Practitioner = {
      id: `pr-${practitioners.length + 1}`,
      name: newPractName.trim(),
      title: newPractTitle.trim() || 'Registered Massage Therapist',
      discipline: newPractDiscipline.trim() || 'Massage Therapy',
      email: newPractEmail.trim(),
      phone: newPractPhone.trim(),
      status: 'Active',
      servicesOffered: newPractServices
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (onAddNewPractitioner) {
      onAddNewPractitioner(newPr);
    }
    setNewPractName('');
    setNewPractEmail('');
    setNewPractPhone('');
    setIsAddPractitionerModalOpen(false);
  };

  const handleCreateProcedure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcName.trim()) return;

    const newProc: ClinicProcedure = {
      id: `proc-${procedures.length + 1}`,
      name: newProcName.trim(),
      category: (newProcCategory.trim() as any) || 'Registered Massage Therapy',
      durationMinutes: Number(newProcDuration) || 60,
      priceCAD: Number(newProcPrice) || 150,
      insuranceCovered: newProcInsurance,
      typicalInsuranceBillingCAD: Number(newProcBilling) || 0,
      typicalCopayCAD: Number(newProcCopay) || 0,
      assignedPractitioners: ['All Active Practitioners'],
      status: 'Active',
      description: newProcDesc.trim() || 'Clinical service at Wellthera Barrie',
    };

    if (onAddNewProcedure) {
      onAddNewProcedure(newProc);
    }
    setNewProcName('');
    setNewProcDesc('');
    setIsAddProcedureModalOpen(false);
  };

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
              practitioners,
              procedures,
              okrPlans,
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
    // 1. If Apps Script Webhook is configured, validate URL before attempting POST
    if (syncState.appsScriptUrl) {
      const urlCheck = validateAppsScriptUrl(syncState.appsScriptUrl);
      if (!urlCheck.valid) {
        // If user has OAuth + sheetId ready, fall through to OAuth sync; otherwise open Connect modal directly
        if (!(accessToken && syncState.sheetId)) {
          setSyncState((prev) => ({
            ...prev,
            syncMessage: `Sync error: ${urlCheck.error}`,
          }));
          setSetupModalTab('connect');
          setIsSetupModalOpen(true);
          return;
        }
      } else {
        setConfirmationConfig({
          isOpen: true,
          title: 'Synchronize with Google Sheet via Apps Script?',
          description:
            'This action will send all Dashboard datasets (Customers, Bookings, Partners, Practitioners, Procedures, CAC, and OKRs) directly to your Google Sheet via the configured Webhook.',
          details: [
            `Webhook URL: ${urlCheck.normalizedUrl}`,
            `Syncing ${customers.length.toLocaleString()} Patients, ${partners.length} Partners, ${bookings.length} Bookings, ${practitioners.length} Practitioners, ${procedures.length} Procedures, and ${okrPlans.length} OKR Quarters`,
          ],
          action: async () => {
            try {
              setSyncState((prev) => ({ ...prev, isSyncing: true, syncMessage: 'Syncing via Apps Script Webhook...' }));
              const res = await syncDataViaAppsScript(urlCheck.normalizedUrl, {
                customers,
                partners,
                bookings,
                cacChannels,
                practitioners,
                procedures,
                okrPlans,
              });

              setSyncState((prev) => ({
                ...prev,
                appsScriptUrl: urlCheck.normalizedUrl,
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
    }

    // 2. If Google OAuth token and sheetId are available, sync via Google Sheets REST API
    if (accessToken && syncState.sheetId) {
      setConfirmationConfig({
        isOpen: true,
        title: 'Push All Updates to Google Sheet?',
        description:
          'This will update all tabs in your Google Sheet on Google Drive with the latest data from this application.',
        details: [
          `Target Sheet: ${syncState.sheetUrl}`,
          `Updating ${customers.length.toLocaleString()} Patients, ${partners.length} Partners, ${bookings.length} Bookings, ${practitioners.length} Practitioners, ${procedures.length} Procedures, and ${okrPlans.length} OKR Quarters`,
        ],
        action: async () => {
          try {
            setSyncState((prev) => ({ ...prev, isSyncing: true, syncMessage: 'Syncing rows to Google Sheets...' }));
            await syncDataToExistingSheet(accessToken, syncState.sheetId!, {
              customers,
              partners,
              bookings,
              cacChannels,
              practitioners,
              procedures,
              okrPlans,
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
    const trimmedName = newPartnerName.trim();
    if (!trimmedName) return;

    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 20);
    const autoCode =
      newPartnerCode.trim().toUpperCase() ||
      trimmedName
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 6)
        .toUpperCase() + '-REF';

    const partner: Partner = {
      id: `p-${slug || 'partner'}-${Date.now().toString().slice(-4)}`,
      name: trimmedName,
      category: newPartnerCategory,
      contactPerson: newPartnerContact.trim() || 'Clinic Contact',
      email:
        newPartnerEmail.trim() ||
        `contact@${trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'partner'}.ca`,
      phone: '(705) 555-0100',
      commissionType: 'Percentage',
      commissionValue: Number.isFinite(Number(newPartnerCommission))
        ? Number(newPartnerCommission)
        : 0,
      referralCode: autoCode,
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
    setActiveTab('partners');
    setNewPartnerName('');
    setNewPartnerContact('');
    setNewPartnerEmail('');
    setNewPartnerCode('');
    setNewPartnerCommission(10);
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
            onClick={() => {
              setSetupModalTab('appscript');
              setIsSetupModalOpen(true);
            }}
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
                Active Codes: <code className="font-bold">DIRECT</code> (No partner) | <code className="font-bold">CLIENT-REF</code> (Existing Wellthera Client) | <code className="font-bold">GOOGLE</code> | <code className="font-bold">PARTNER</code> (Wellthera Partners) | <code className="font-bold">META</code> | + Custom Partner Codes
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
      {syncState.syncMessage && (() => {
        const isError = /error|failed|405|invalid/i.test(syncState.syncMessage);
        return (
          <div
            className={`rounded-xl px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 border ${
              isError
                ? isDarkMode
                  ? 'bg-red-950/30 border-red-800/60 text-red-200'
                  : 'bg-red-50 border-red-200 text-red-900'
                : isDarkMode
                ? 'bg-[#14160e] border-[#292e1e] text-[#c7ccaa]'
                : 'bg-[#edf0e6] border-[#bcc2a4] text-[#332e1e]'
            }`}
          >
            <div className="flex items-start sm:items-center gap-2 font-mono flex-1 min-w-[240px]">
              <span
                className={`w-2 h-2 rounded-full shrink-0 mt-1 sm:mt-0 ${
                  isError ? 'bg-red-500' : 'bg-[#686e4a] animate-pulse'
                }`}
              />
              <span className="leading-relaxed">{syncState.syncMessage}</span>
              {syncState.lastSyncedAt && !isError && (
                <span className="opacity-70 shrink-0">({syncState.lastSyncedAt})</span>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {isError && (
                <button
                  onClick={() => {
                    setSetupModalTab('connect');
                    setIsSetupModalOpen(true);
                  }}
                  className="px-3 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white font-sans font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>Fix Sync Setup</span>
                </button>
              )}
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
          </div>
        );
      })()}

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
                { id: 'practitioners', label: '5. Practitioners & Team', count: practitioners.length },
                { id: 'procedures', label: '6. Procedures & Treatments', count: procedures.length },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
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
            {activeTab === 'practitioners' && (
              <button
                onClick={() => setIsAddPractitionerModalOpen(true)}
                className="px-3 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-semibold text-xs rounded-full transition-colors flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Practitioner</span>
              </button>
            )}
            {activeTab === 'procedures' && (
              <button
                onClick={() => setIsAddProcedureModalOpen(true)}
                className="px-3 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-semibold text-xs rounded-full transition-colors flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Service / Treatment</span>
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
              practitioners={practitioners}
              procedures={procedures}
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
          <div className="space-y-4">
            {/* Filter, Search & Partner Assignment Bar */}
            <div
              className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                isDarkMode
                  ? 'bg-[#181b11] border-[#292e1e]'
                  : 'bg-[#fbfaf8] border-[#e7e3da]'
              }`}
            >
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                {/* Search Box */}
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setCustomerPage(1);
                    }}
                    placeholder={`Search ${customers.length.toLocaleString()} patients by name, email, phone, or service...`}
                    className={`w-full pl-8 pr-7 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                  {customerSearch && (
                    <button
                      onClick={() => {
                        setCustomerSearch('');
                        setCustomerPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Partner Filter Dropdown */}
                <div className="flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 opacity-60" />
                  <select
                    value={customerPartnerFilter}
                    onChange={(e) => {
                      setCustomerPartnerFilter(e.target.value);
                      setCustomerPage(1);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  >
                    <option value="all">All Patients ({customers.length})</option>
                    <option value="unassigned">
                      No partner ({customers.filter((c) => !c.partnerId || c.partnerId === 'no-partner' || c.partnerId === 'direct' || c.partnerId === 'p-8').length})
                    </option>
                    {partners
                      .filter((p) => p.id !== 'no-partner' && p.id !== 'p-8' && p.id !== 'direct')
                      .map((p) => {
                        const count = customers.filter((c) => c.partnerId === p.id).length;
                        return (
                          <option key={p.id} value={p.id}>
                            Partner: {p.name} ({count})
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* RFM Segment Dropdown */}
                <select
                  value={customerRfmFilter}
                  onChange={(e) => {
                    setCustomerRfmFilter(e.target.value);
                    setCustomerPage(1);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                >
                  <option value="all">All RFM Segments</option>
                  <option value="Champions">Champions</option>
                  <option value="Loyal Customers">Loyal Customers</option>
                  <option value="Potential Loyalists">Potential Loyalists</option>
                  <option value="Recent Customers">Recent Customers</option>
                  <option value="Promising">Promising</option>
                  <option value="Needs Attention">Needs Attention</option>
                  <option value="At Risk">At Risk</option>
                  <option value="Can't Lose Them">Can't Lose Them</option>
                  <option value="Hibernating">Hibernating</option>
                </select>
              </div>

              {/* Status counter & Add Button */}
              <div className="flex items-center gap-2 text-xs">
                <span className="opacity-70">
                  Showing <strong>{filteredCustomersList.length}</strong> matching patients
                </span>
                <button
                  onClick={() => setIsAddCustomerModalOpen(true)}
                  className="px-3 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-semibold rounded-lg flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Patient</span>
                </button>
              </div>
            </div>

            {/* Patients Table */}
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
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
                    <th className="py-2.5 px-4 font-bold text-emerald-800 dark:text-emerald-300">
                      Patient Name
                    </th>
                    <th className="py-2.5 px-3 font-bold">Partner Referral (Click to Edit)</th>
                    <th className="py-2.5 px-3 font-bold">Referral Code</th>
                    <th className="py-2.5 px-2 font-bold text-center">Visits</th>
                    <th className="py-2.5 px-3 font-bold">Lifetime CAD</th>
                    <th className="py-2.5 px-3 font-bold">Preferred Service</th>
                    <th className="py-2.5 px-3 font-bold">Direct Insurer</th>
                    <th className="py-2.5 px-3 font-bold">RFM Segment</th>
                    <th className="py-2.5 px-3 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-inherit font-mono">
                  {paginatedCustomers.map((c) => {
                    const isPartnerAssigned =
                      c.partnerId &&
                      c.partnerId !== 'no-partner' &&
                      c.partnerId !== 'direct' &&
                      c.partnerId !== 'p-8';
                    return (
                      <tr
                        key={c.id}
                        className={`transition-colors ${
                          isDarkMode
                            ? 'hover:bg-[#202517] border-[#292e1e]'
                            : 'hover:bg-[#f4f1eb] border-[#e7e3da]'
                        }`}
                      >
                        <td className="py-2.5 px-3 opacity-60">{c.id}</td>
                        <td className="py-2.5 px-4 font-sans whitespace-nowrap">
                          <div className="font-bold text-sm text-emerald-950 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-2.5 py-1 rounded-md inline-block shadow-2xs">
                            {c.name}
                          </div>
                          {(c.email || c.phone) && (
                            <div className="text-[10px] opacity-60 font-mono mt-0.5">
                              {c.email || c.phone}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-sans whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenAssignCustomerModal(c)}
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border shadow-2xs ${
                              isPartnerAssigned
                                ? isDarkMode
                                  ? 'bg-[#686e4a]/25 text-[#c7ccaa] border-[#686e4a]/40 hover:bg-[#686e4a]/40'
                                  : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4] hover:bg-[#dfe4d3]'
                                : isDarkMode
                                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50'
                                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                            }`}
                            title="Click to assign or reassign partner"
                          >
                            <span>{c.partnerName || 'No partner'}</span>
                            <Pencil className="w-3 h-3 opacity-70" />
                          </button>
                        </td>
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
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenAssignCustomerModal(c)}
                            className="px-2 py-1 rounded-md text-[11px] font-semibold bg-[#686e4a]/10 hover:bg-[#686e4a]/20 text-[#52573a] dark:text-[#c7ccaa] transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                            title="Assign or reassign referral partner"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Assign</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div
              className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs ${
                isDarkMode
                  ? 'bg-[#181b11] border-[#292e1e]'
                  : 'bg-[#fbfaf8] border-[#e7e3da]'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="opacity-70">
                  Showing{' '}
                  <strong>
                    {filteredCustomersList.length === 0
                      ? 0
                      : (customerPage - 1) * customerPageSize + 1}
                  </strong>{' '}
                  to{' '}
                  <strong>
                    {Math.min(customerPage * customerPageSize, filteredCustomersList.length)}
                  </strong>{' '}
                  of <strong>{filteredCustomersList.length}</strong> patients
                </span>
                <span className="opacity-40">|</span>
                <div className="flex items-center gap-1.5">
                  <span className="opacity-70">Rows:</span>
                  <select
                    value={customerPageSize}
                    onChange={(e) => {
                      setCustomerPageSize(Number(e.target.value));
                      setCustomerPage(1);
                    }}
                    className={`px-2 py-1 rounded border text-xs focus:outline-none ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={filteredCustomersList.length}>All</option>
                  </select>
                </div>
              </div>

              {/* Page Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCustomerPage(1)}
                  disabled={customerPage === 1}
                  className="p-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
                  title="First Page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCustomerPage((prev) => Math.max(1, prev - 1))}
                  disabled={customerPage === 1}
                  className="p-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 py-1 font-semibold">
                  Page {customerPage} of {totalCustomerPages}
                </span>
                <button
                  onClick={() => setCustomerPage((prev) => Math.min(totalCustomerPages, prev + 1))}
                  disabled={customerPage >= totalCustomerPages}
                  className="p-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCustomerPage(totalCustomerPages)}
                  disabled={customerPage >= totalCustomerPages}
                  className="p-1.5 rounded border disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/5"
                  title="Last Page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Partners Table View */}
        {activeTab === 'partners' && (
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
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
                    <th className="py-2.5 px-2 font-bold text-center">Referred Patients</th>
                    <th className="py-2.5 px-3 font-bold">Gross CAD</th>
                    <th className="py-2.5 px-3 font-bold">Commission CAD</th>
                    <th className="py-2.5 px-3 font-bold">Net Margin CAD</th>
                    <th className="py-2.5 px-3 font-bold">ROI %</th>
                    <th className="py-2.5 px-3 font-bold text-center">Actions</th>
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
                        <div className="flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.status === 'Active' && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-xs">{p.category}</td>
                      <td className="py-2.5 px-3 font-sans text-xs">
                        <div>{p.contactPerson}</div>
                        {p.email && <div className="text-[10px] opacity-60">{p.email}</div>}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('customers');
                            setCustomerPartnerFilter(p.id);
                            setCustomerPage(1);
                          }}
                          className="px-2 py-0.5 rounded bg-[#686e4a]/15 text-[#52573a] dark:text-[#c7ccaa] hover:bg-[#686e4a]/30 transition-colors font-bold cursor-pointer"
                          title="View all patients referred by this partner"
                        >
                          {p.referredCustomersCount} patients
                        </button>
                      </td>
                      <td className="py-2.5 px-3 font-bold">${p.totalRevenueCAD}</td>
                      <td className="py-2.5 px-3">${p.totalCommissionPaidCAD}</td>
                      <td className="py-2.5 px-3 font-bold text-[#686e4a] dark:text-[#aab187]">
                        ${p.netRevenueCAD}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#686e4a] dark:text-[#aab187]">
                        +{p.roiPercent.toFixed(0)}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditPartner(p)}
                            className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[#686e4a] dark:text-[#c7ccaa] transition-colors cursor-pointer"
                            title="Edit Partner"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {p.id !== 'no-partner' && p.id !== 'p-8' && p.id !== 'direct' && (
                            <button
                              type="button"
                              onClick={() => {
                                setConfirmationConfig({
                                  isOpen: true,
                                  title: `Delete Partner "${p.name}"?`,
                                  description: `Are you sure you want to remove ${p.name}? Any patients currently linked will be reassigned to "No partner".`,
                                  details: [
                                    `Partner ID: ${p.id}`,
                                    `Category: ${p.category}`,
                                    `Referred Patients: ${p.referredCustomersCount}`,
                                  ],
                                  action: async () => {
                                    if (onDeletePartner) onDeletePartner(p.id);
                                  },
                                });
                              }}
                              className="p-1.5 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                              title="Delete Partner"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Bookings Table View */}
        {activeTab === 'bookings' && (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
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
                  <th className="py-2.5 px-4 font-bold text-emerald-800 dark:text-emerald-300">Customer (Patient)</th>
                  <th className="py-2.5 px-3 font-bold">Partner Source (Click to Edit)</th>
                  <th className="py-2.5 px-3 font-bold">Category</th>
                  <th className="py-2.5 px-3 font-bold">Date</th>
                  <th className="py-2.5 px-3 font-bold">Price CAD</th>
                  <th className="py-2.5 px-3 font-bold">Insurance Billed</th>
                  <th className="py-2.5 px-3 font-bold text-emerald-800 dark:text-emerald-300">Patient Copay</th>
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
                    <td className="py-2.5 px-4 font-sans whitespace-nowrap">
                      <span className="font-bold text-sm text-emerald-950 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded-md inline-block shadow-2xs">
                        {b.customerName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-xs whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenAssignBookingModal(b)}
                        className="px-2 py-1 rounded-md text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-[#686e4a]/20 flex items-center gap-1.5 transition-colors cursor-pointer border border-neutral-300 dark:border-neutral-700"
                        title="Click to edit partner source for this appointment log"
                      >
                        <span>{b.partnerName || 'No partner'}</span>
                        <Pencil className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-xs">{b.serviceCategory}</td>
                    <td className="py-2.5 px-3 text-xs">{b.bookingDate}</td>
                    <td className="py-2.5 px-3 font-bold">${b.priceCAD}</td>
                    <td className="py-2.5 px-3 text-[#686e4a] dark:text-[#aab187]">
                      ${b.insuranceBilledCAD}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-emerald-700 dark:text-emerald-300">
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
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
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
                  <th className="py-2.5 px-2 font-bold text-center text-emerald-800 dark:text-emerald-300">New Patients</th>
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
                    <td className="py-2.5 px-2 text-center font-bold text-emerald-700 dark:text-emerald-300">
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

        {/* Tab 5: Practitioners Table View */}
        {activeTab === 'practitioners' && (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
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
                  <th className="py-2.5 px-4 font-bold">Practitioner Name</th>
                  <th className="py-2.5 px-3 font-bold">Professional Title</th>
                  <th className="py-2.5 px-3 font-bold">Clinical Specialty</th>
                  <th className="py-2.5 px-3 font-bold">Contact Email</th>
                  <th className="py-2.5 px-3 font-bold">Phone</th>
                  <th className="py-2.5 px-3 font-bold">Services & Treatments</th>
                  <th className="py-2.5 px-3 font-bold text-center">Status</th>
                  <th className="py-2.5 px-3 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {practitioners.map((p) => (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isDarkMode
                        ? 'hover:bg-[#202517] border-[#292e1e]'
                        : 'hover:bg-[#f4f1eb] border-[#e7e3da]'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono opacity-60">{p.id}</td>
                    <td className="py-2.5 px-4 font-sans whitespace-nowrap">
                      <div className="font-bold text-sm text-[#100e0a] dark:text-[#f9f8f5] flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-[#686e4a]/15 text-[#52573a] dark:text-[#c7ccaa] font-bold flex items-center justify-center text-xs border border-[#686e4a]/30">
                          {p.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </span>
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-xs whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full bg-[#edf0e6] dark:bg-[#686e4a]/20 text-[#52573a] dark:text-[#c7ccaa] border border-[#bcc2a4]">
                        {p.title}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 opacity-80 whitespace-nowrap">{p.discipline}</td>
                    <td className="py-2.5 px-3 font-mono text-xs opacity-75">{p.email || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-xs opacity-75">{p.phone || '—'}</td>
                    <td className="py-2.5 px-3 text-xs">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {p.servicesOffered.map((svc, sIdx) => (
                          <span
                            key={sIdx}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700"
                          >
                            {svc}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditPractitioner(p)}
                          className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[#686e4a] dark:text-[#c7ccaa] transition-colors cursor-pointer"
                          title="Edit Practitioner Details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmationConfig({
                              isOpen: true,
                              title: `Delete Practitioner "${p.name}"?`,
                              description: `Are you sure you want to remove ${p.name} (${p.title}) from the clinical team?`,
                              details: [
                                `Practitioner ID: ${p.id}`,
                                `Specialty: ${p.discipline}`,
                                `Status: ${p.status}`,
                              ],
                              action: async () => {
                                if (onDeletePractitioner) {
                                  onDeletePractitioner(p.id);
                                }
                              },
                            });
                          }}
                          className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Practitioner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 6: Procedures Table View */}
        {activeTab === 'procedures' && (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
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
                  <th className="py-2.5 px-4 font-bold">Procedure / Treatment</th>
                  <th className="py-2.5 px-3 font-bold">Category</th>
                  <th className="py-2.5 px-2 font-bold text-center">Duration</th>
                  <th className="py-2.5 px-3 font-bold text-right">Fee CAD</th>
                  <th className="py-2.5 px-3 font-bold text-center">Insurance</th>
                  <th className="py-2.5 px-3 font-bold text-right">Direct Billed</th>
                  <th className="py-2.5 px-3 font-bold text-right text-emerald-800 dark:text-emerald-300">Typical Copay</th>
                  <th className="py-2.5 px-3 font-bold">Assigned Practitioners</th>
                  <th className="py-2.5 px-3 font-bold text-center">Status</th>
                  <th className="py-2.5 px-3 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {procedures.map((proc) => (
                  <tr
                    key={proc.id}
                    className={`transition-colors ${
                      isDarkMode
                        ? 'hover:bg-[#202517] border-[#292e1e]'
                        : 'hover:bg-[#f4f1eb] border-[#e7e3da]'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono opacity-60">{proc.id}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-bold text-sm text-[#100e0a] dark:text-[#f9f8f5]">
                        {proc.name}
                      </div>
                      <div className="text-[11px] opacity-70 line-clamp-1 mt-0.5">
                        {proc.description}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#edf0e6] dark:bg-[#686e4a]/20 text-[#52573a] dark:text-[#c7ccaa] border border-[#bcc2a4]">
                        {proc.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono">{proc.durationMinutes}m</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right">
                      ${proc.priceCAD.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          proc.insuranceCovered
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        {proc.insuranceCovered ? 'Eligible' : 'Self-Pay'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-right opacity-80">
                      ${proc.typicalInsuranceBillingCAD.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-right text-emerald-700 dark:text-emerald-300">
                      ${proc.typicalCopayCAD.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-xs">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {proc.assignedPractitioners.map((pr, prIdx) => (
                          <span
                            key={prIdx}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                          >
                            {pr}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                        {proc.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditProcedure(proc)}
                          className="p-1 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-[#686e4a] dark:text-[#c7ccaa] transition-colors cursor-pointer"
                          title="Edit Procedure / Treatment"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmationConfig({
                              isOpen: true,
                              title: `Delete Treatment "${proc.name}"?`,
                              description: `Are you sure you want to remove ${proc.name} ($${proc.priceCAD} CAD) from the procedures catalog?`,
                              details: [
                                `Procedure ID: ${proc.id}`,
                                `Category: ${proc.category}`,
                                `Duration: ${proc.durationMinutes} mins`,
                                `Standard Fee: $${proc.priceCAD} CAD`,
                              ],
                              action: async () => {
                                if (onDeleteProcedure) {
                                  onDeleteProcedure(proc.id);
                                }
                              },
                            });
                          }}
                          className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Procedure"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
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
                  <option value="Clinic Referral Partner">Clinic Referral Partner</option>
                  <option value="Client Referral">Client Referral</option>
                  <option value="Fitness & CrossFit">Fitness & CrossFit</option>
                  <option value="Physiotherapy & Chiro">Physiotherapy & Chiro</option>
                  <option value="OB-GYN, Doulas & Pelvic Health">OB-GYN, Doulas & Pelvic Health</option>
                  <option value="MedSpa & Aesthetics">MedSpa & Aesthetics</option>
                  <option value="Local Wellness Influencer">Local Wellness Influencer</option>
                  <option value="Corporate Wellness">Corporate Wellness</option>
                  <option value="Paid Social (Meta)">Paid Social (Meta)</option>
                  <option value="Paid & Organic Search (Google)">Paid & Organic Search (Google)</option>
                  <option value="Direct / No Partner">Direct / No Partner</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Contact Person</label>
                  <input
                    type="text"
                    value={newPartnerContact}
                    onChange={(e) => setNewPartnerContact(e.target.value)}
                    placeholder="e.g. Clinic Manager"
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Referral Code</label>
                  <input
                    type="text"
                    value={newPartnerCode}
                    onChange={(e) => setNewPartnerCode(e.target.value)}
                    placeholder="Auto if empty"
                    className={`w-full rounded-lg p-2 border uppercase font-mono focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Contact Email</label>
                  <input
                    type="email"
                    value={newPartnerEmail}
                    onChange={(e) => setNewPartnerEmail(e.target.value)}
                    placeholder="partner@domain.ca"
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Commission Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={newPartnerCommission}
                    onChange={(e) => setNewPartnerCommission(Number(e.target.value))}
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

      {/* Modal: Add New Practitioner */}
      {isAddPractitionerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`rounded-2xl max-w-md w-full p-6 shadow-2xl border ${
              isDarkMode
                ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
            }`}
          >
            <h3 className="font-serif text-xl font-bold mb-4">
              Add Team Practitioner
            </h3>
            <form onSubmit={handleCreatePractitioner} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newPractName}
                  onChange={(e) => setNewPractName(e.target.value)}
                  placeholder="e.g. Dr. Jordan Hayes"
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Professional Title *
                </label>
                <input
                  type="text"
                  required
                  value={newPractTitle}
                  onChange={(e) => setNewPractTitle(e.target.value)}
                  placeholder="e.g. Registered Massage Therapist, Registered Acupuncturist"
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Clinical Specialty / Discipline
                </label>
                <input
                  type="text"
                  value={newPractDiscipline}
                  onChange={(e) => setNewPractDiscipline(e.target.value)}
                  placeholder="e.g. Massage Therapy, Acupuncture, Psychotherapy, Aesthetics"
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Email</label>
                  <input
                    type="email"
                    value={newPractEmail}
                    onChange={(e) => setNewPractEmail(e.target.value)}
                    placeholder="practitioner@wellthera.ca"
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Phone</label>
                  <input
                    type="tel"
                    value={newPractPhone}
                    onChange={(e) => setNewPractPhone(e.target.value)}
                    placeholder="(705) 555-0199"
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Services Offered (comma-separated)
                </label>
                <input
                  type="text"
                  value={newPractServices}
                  onChange={(e) => setNewPractServices(e.target.value)}
                  placeholder="e.g. Brazilian Lymphatic Drainage, 60 Min RMT, Prenatal"
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
                  onClick={() => setIsAddPractitionerModalOpen(false)}
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
                  Add Practitioner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Procedure / Treatment */}
      {isAddProcedureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`rounded-2xl max-w-md w-full p-6 shadow-2xl border ${
              isDarkMode
                ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
            }`}
          >
            <h3 className="font-serif text-xl font-bold mb-4">
              Add Treatment / Service
            </h3>
            <form onSubmit={handleCreateProcedure} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Treatment / Procedure Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProcName}
                  onChange={(e) => setNewProcName(e.target.value)}
                  placeholder="e.g. Deep Tissue Lymphatic Sculpt (75 Min)"
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Category</label>
                  <select
                    value={newProcCategory}
                    onChange={(e) => setNewProcCategory(e.target.value)}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  >
                    <option value="Registered Massage Therapy">Registered Massage Therapy</option>
                    <option value="Brazilian Lymphatic Drainage">Brazilian Lymphatic Drainage</option>
                    <option value="Acupuncture & TCM">Acupuncture & TCM</option>
                    <option value="Medical Aesthetics">Medical Aesthetics</option>
                    <option value="Psychotherapy">Psychotherapy</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Duration (Mins)</label>
                  <input
                    type="number"
                    value={newProcDuration}
                    onChange={(e) => setNewProcDuration(Number(e.target.value))}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Standard Fee (CAD)</label>
                  <input
                    type="number"
                    value={newProcPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setNewProcPrice(val);
                      if (newProcInsurance) setNewProcBilling(val);
                    }}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Direct Insurer CAD</label>
                  <input
                    type="number"
                    value={newProcBilling}
                    onChange={(e) => setNewProcBilling(Number(e.target.value))}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Patient Copay CAD</label>
                  <input
                    type="number"
                    value={newProcCopay}
                    onChange={(e) => setNewProcCopay(Number(e.target.value))}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">Insurance Coverage</label>
                <div className="flex gap-4 items-center mt-1">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={newProcInsurance}
                      onChange={() => setNewProcInsurance(true)}
                    />
                    <span>Direct-Billing Eligible</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={!newProcInsurance}
                      onChange={() => {
                        setNewProcInsurance(false);
                        setNewProcBilling(0);
                        setNewProcCopay(newProcPrice);
                      }}
                    />
                    <span>Self-Pay / Non-Insured</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">Description</label>
                <textarea
                  rows={2}
                  value={newProcDesc}
                  onChange={(e) => setNewProcDesc(e.target.value)}
                  placeholder="Clinical purpose and protocol details..."
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
                  onClick={() => setIsAddProcedureModalOpen(false)}
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
                  Add Treatment Row
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign / Re-assign Partner to Customer */}
      {assigningCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`rounded-2xl max-w-lg w-full p-6 shadow-2xl border ${
              isDarkMode
                ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#686e4a] dark:text-[#c7ccaa]" />
                <h3 className="font-serif text-lg font-bold">
                  Assign Referral Partner
                </h3>
              </div>
              <button
                onClick={() => setAssigningCustomer(null)}
                className="p-1 rounded-md opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className={`p-3 rounded-xl mb-4 border text-xs ${
                isDarkMode
                  ? 'bg-[#14160e] border-[#292e1e]'
                  : 'bg-[#edf0e6] border-[#bcc2a4]'
              }`}
            >
              <div className="font-bold text-sm text-[#100e0a] dark:text-[#f9f8f5]">
                {assigningCustomer.name}
              </div>
              <div className="text-[11px] opacity-75 mt-0.5">
                {assigningCustomer.email || assigningCustomer.phone || 'No contact on file'} •{' '}
                {assigningCustomer.totalVisits} visits • ${assigningCustomer.totalSpendCAD} CAD lifetime spend
              </div>
              <div className="text-[11px] font-semibold text-[#686e4a] dark:text-[#c7ccaa] mt-1">
                Current Partner:{' '}
                <span className="font-bold">{assigningCustomer.partnerName || 'No partner'}</span>
              </div>
            </div>

            <form onSubmit={handleSaveCustomerPartner} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Select Referral Partner / Acquisition Channel *
                </label>
                <select
                  value={assignPartnerId}
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    setAssignPartnerId(selectedId);
                    if (selectedId === 'no-partner' || selectedId === 'direct') {
                      setAssignReferralCode('DIRECT');
                    } else {
                      const found = partners.find((p) => p.id === selectedId);
                      setAssignReferralCode(
                        found?.referralCode ||
                          (found ? found.name.split(' ')[0].toUpperCase() + '-REF' : '')
                      );
                    }
                  }}
                  className={`w-full rounded-lg p-2.5 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] font-medium ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                >
                  <option value="no-partner">No partner (Direct / Organic)</option>
                  <optgroup label="Active Partners & Channels">
                    {partners
                      .filter((p) => p.id !== 'no-partner' && p.id !== 'p-8' && p.id !== 'direct')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category}) — {p.commissionType === 'Percentage' ? `${p.commissionValue}% rev` : p.commissionType === 'FlatPerBooking' ? `$${p.commissionValue} flat` : 'Channel'}
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {assignPartnerId !== 'no-partner' && assignPartnerId !== 'direct' && (
                <div>
                  <label className="block mb-1 font-semibold opacity-75">
                    Referral Code / Campaign Identifier
                  </label>
                  <input
                    type="text"
                    value={assignReferralCode}
                    onChange={(e) => setAssignReferralCode(e.target.value)}
                    placeholder="e.g. CF-BARRIE, PT-SIMCOE"
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] uppercase font-mono ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                  <p className="text-[10px] opacity-60 mt-1">
                    This code associates the patient with this partner across future appointments.
                  </p>
                </div>
              )}

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={assignUpdateBookings}
                    onChange={(e) => setAssignUpdateBookings(e.target.checked)}
                    className="w-4 h-4 rounded text-[#686e4a] focus:ring-[#686e4a]"
                  />
                  <span className="font-semibold">
                    Also link and update all existing past bookings for {assigningCustomer.name} to this partner
                  </span>
                </label>
                <p className="text-[10px] opacity-60 ml-6 mt-0.5">
                  Recalculates partner revenue, commission totals, and ROI metrics immediately.
                </p>
              </div>

              <div
                className={`pt-4 border-t flex items-center justify-between gap-2 ${
                  isDarkMode ? 'border-[#24291c]' : 'border-[#e7e3da]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAssignPartnerId('no-partner');
                    setAssignReferralCode('DIRECT');
                  }}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold"
                >
                  Set to No partner
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAssigningCustomer(null)}
                    className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#a2a992]'
                        : 'bg-[#f0ede6] border-[#e7e3da] text-[#554e38]'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save & Link Partner</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Partner to Booking */}
      {assigningBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`rounded-2xl max-w-md w-full p-6 shadow-2xl border ${
              isDarkMode
                ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit mb-4">
              <h3 className="font-serif text-lg font-bold">
                Edit Booking Partner Source
              </h3>
              <button
                onClick={() => setAssigningBooking(null)}
                className="p-1 rounded-md opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className={`p-3 rounded-xl mb-4 border text-xs ${
                isDarkMode
                  ? 'bg-[#14160e] border-[#292e1e]'
                  : 'bg-[#edf0e6] border-[#bcc2a4]'
              }`}
            >
              <div className="font-bold text-sm">
                {assigningBooking.customerName}
              </div>
              <div className="opacity-75 mt-0.5">
                {assigningBooking.serviceCategory} • {assigningBooking.bookingDate} • ${assigningBooking.priceCAD} CAD
              </div>
            </div>

            <form onSubmit={handleSaveBookingPartner} className="space-y-4 text-xs">
              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Assigned Partner Referral
                </label>
                <select
                  value={assignBookingPartnerId}
                  onChange={(e) => setAssignBookingPartnerId(e.target.value)}
                  className={`w-full rounded-lg p-2.5 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] font-medium ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                >
                  <option value="no-partner">No partner (Direct / Organic)</option>
                  {partners
                    .filter((p) => p.id !== 'no-partner' && p.id !== 'p-8' && p.id !== 'direct')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.category})
                      </option>
                    ))}
                </select>
              </div>

              <div
                className={`pt-4 border-t flex justify-end gap-2 ${
                  isDarkMode ? 'border-[#24291c]' : 'border-[#e7e3da]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setAssigningBooking(null)}
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
                  className="px-4 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Update Booking Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Partner */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`rounded-2xl max-w-lg w-full p-6 shadow-2xl border ${
              isDarkMode
                ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit mb-4">
              <h3 className="font-serif text-lg font-bold">
                Edit Partner Organization
              </h3>
              <button
                onClick={() => setEditingPartner(null)}
                className="p-1 rounded-md opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPartner} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold opacity-75">Partner Name *</label>
                <input
                  type="text"
                  required
                  value={editingPartner.name}
                  onChange={(e) => setEditingPartner({ ...editingPartner, name: e.target.value })}
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Category *</label>
                  <select
                    value={editingPartner.category}
                    onChange={(e) => setEditingPartner({ ...editingPartner, category: e.target.value as PartnerCategory })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  >
                    <option value="Clinic Referral Partner">Clinic Referral Partner</option>
                    <option value="Client Referral">Client Referral</option>
                    <option value="Fitness & CrossFit">Fitness & CrossFit</option>
                    <option value="Physiotherapy & Chiro">Physiotherapy & Chiro</option>
                    <option value="OB-GYN, Doulas & Pelvic Health">OB-GYN, Doulas & Pelvic Health</option>
                    <option value="MedSpa & Aesthetics">MedSpa & Aesthetics</option>
                    <option value="Local Wellness Influencer">Local Wellness Influencer</option>
                    <option value="Corporate Wellness">Corporate Wellness</option>
                    <option value="Paid Social (Meta)">Paid Social (Meta)</option>
                    <option value="Paid & Organic Search (Google)">Paid & Organic Search (Google)</option>
                    <option value="Direct / No Partner">Direct / No Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Status *</label>
                  <select
                    value={editingPartner.status}
                    onChange={(e) => setEditingPartner({ ...editingPartner, status: e.target.value as any })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Prospect">Prospect</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Contact Person</label>
                  <input
                    type="text"
                    value={editingPartner.contactPerson}
                    onChange={(e) => setEditingPartner({ ...editingPartner, contactPerson: e.target.value })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Contact Email</label>
                  <input
                    type="email"
                    value={editingPartner.email}
                    onChange={(e) => setEditingPartner({ ...editingPartner, email: e.target.value })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Commission Type</label>
                  <select
                    value={editingPartner.commissionType}
                    onChange={(e) => setEditingPartner({ ...editingPartner, commissionType: e.target.value as any })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="FlatPerBooking">Flat per Booking ($)</option>
                    <option value="CoMarketingRetainer">Retainer Only</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Commission Value</label>
                  <input
                    type="number"
                    value={editingPartner.commissionValue}
                    onChange={(e) => setEditingPartner({ ...editingPartner, commissionValue: Number(e.target.value) })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Monthly Retainer CAD</label>
                  <input
                    type="number"
                    value={editingPartner.monthlyRetainerCAD}
                    onChange={(e) => setEditingPartner({ ...editingPartner, monthlyRetainerCAD: Number(e.target.value) })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div
                className={`pt-4 border-t flex justify-end gap-2 ${
                  isDarkMode ? 'border-[#24291c]' : 'border-[#e7e3da]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
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
                  className="px-4 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Save Partner Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Practitioner */}
      {editingPractitioner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`rounded-2xl max-w-md w-full p-6 shadow-2xl border ${
              isDarkMode
                ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit mb-4">
              <h3 className="font-serif text-lg font-bold">
                Edit Practitioner Profile
              </h3>
              <button
                onClick={() => setEditingPractitioner(null)}
                className="p-1 rounded-md opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditPractitioner} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold opacity-75">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingPractitioner.name}
                  onChange={(e) => setEditingPractitioner({ ...editingPractitioner, name: e.target.value })}
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Professional Title</label>
                  <input
                    type="text"
                    value={editingPractitioner.title}
                    onChange={(e) => setEditingPractitioner({ ...editingPractitioner, title: e.target.value })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Specialty / Discipline</label>
                  <input
                    type="text"
                    value={editingPractitioner.discipline}
                    onChange={(e) => setEditingPractitioner({ ...editingPractitioner, discipline: e.target.value })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Email</label>
                  <input
                    type="email"
                    value={editingPractitioner.email}
                    onChange={(e) => setEditingPractitioner({ ...editingPractitioner, email: e.target.value })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Phone</label>
                  <input
                    type="text"
                    value={editingPractitioner.phone}
                    onChange={(e) => setEditingPractitioner({ ...editingPractitioner, phone: e.target.value })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Services Offered (comma separated)
                </label>
                <input
                  type="text"
                  value={editPractServices}
                  onChange={(e) => setEditPractServices(e.target.value)}
                  placeholder="e.g. Brazilian Lymphatic Drainage, Deep Tissue"
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">Status</label>
                <select
                  value={editingPractitioner.status}
                  onChange={(e) => setEditingPractitioner({ ...editingPractitioner, status: e.target.value as any })}
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div
                className={`pt-4 border-t flex justify-end gap-2 ${
                  isDarkMode ? 'border-[#24291c]' : 'border-[#e7e3da]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setEditingPractitioner(null)}
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
                  className="px-4 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Save Practitioner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Procedure */}
      {editingProcedure && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`rounded-2xl max-w-md w-full p-6 shadow-2xl border ${
              isDarkMode
                ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit mb-4">
              <h3 className="font-serif text-lg font-bold">
                Edit Procedure / Treatment
              </h3>
              <button
                onClick={() => setEditingProcedure(null)}
                className="p-1 rounded-md opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProcedure} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold opacity-75">Procedure Name *</label>
                <input
                  type="text"
                  required
                  value={editingProcedure.name}
                  onChange={(e) => setEditingProcedure({ ...editingProcedure, name: e.target.value })}
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Category *</label>
                  <select
                    value={editingProcedure.category}
                    onChange={(e) => setEditingProcedure({ ...editingProcedure, category: e.target.value as ServiceCategory })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  >
                    <option value="Registered Massage Therapy">Registered Massage Therapy</option>
                    <option value="Brazilian Lymphatic Drainage">Brazilian Lymphatic Drainage</option>
                    <option value="Acupuncture">Acupuncture</option>
                    <option value="Nurse-Led Injectables">Nurse-Led Injectables</option>
                    <option value="Psychotherapy">Psychotherapy</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Duration (mins)</label>
                  <input
                    type="number"
                    value={editingProcedure.durationMinutes}
                    onChange={(e) => setEditingProcedure({ ...editingProcedure, durationMinutes: Number(e.target.value) })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Standard Fee CAD</label>
                  <input
                    type="number"
                    value={editingProcedure.priceCAD}
                    onChange={(e) => setEditingProcedure({ ...editingProcedure, priceCAD: Number(e.target.value) })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Direct Billed CAD</label>
                  <input
                    type="number"
                    value={editingProcedure.typicalInsuranceBillingCAD}
                    onChange={(e) => setEditingProcedure({ ...editingProcedure, typicalInsuranceBillingCAD: Number(e.target.value) })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Typical Copay CAD</label>
                  <input
                    type="number"
                    value={editingProcedure.typicalCopayCAD}
                    onChange={(e) => setEditingProcedure({ ...editingProcedure, typicalCopayCAD: Number(e.target.value) })}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editInsuranceCovered"
                  checked={editingProcedure.insuranceCovered}
                  onChange={(e) => setEditingProcedure({ ...editingProcedure, insuranceCovered: e.target.checked })}
                  className="rounded text-[#686e4a]"
                />
                <label htmlFor="editInsuranceCovered" className="font-semibold cursor-pointer">
                  Eligible for Direct Insurance Billing (e.g. RMT, Acupuncture)
                </label>
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Assigned Practitioners (comma separated)
                </label>
                <input
                  type="text"
                  value={editProcPractitioners}
                  onChange={(e) => setEditProcPractitioners(e.target.value)}
                  placeholder="e.g. Jane Doe, RMT, John Smith"
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">Description</label>
                <textarea
                  rows={2}
                  value={editingProcedure.description}
                  onChange={(e) => setEditingProcedure({ ...editingProcedure, description: e.target.value })}
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div
                className={`pt-4 border-t flex justify-end gap-2 ${
                  isDarkMode ? 'border-[#24291c]' : 'border-[#e7e3da]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setEditingProcedure(null)}
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
                  className="px-4 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Save Treatment
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
        initialTab={setupModalTab}
        isDarkMode={isDarkMode}
        syncState={syncState}
        onSaveSyncSettings={(settings) => {
          setSyncState((prev) => ({
            ...prev,
            sheetId: settings.sheetId,
            sheetUrl: settings.sheetUrl,
            appsScriptUrl: settings.appsScriptUrl,
            syncMode: settings.appsScriptUrl ? 'appscript' : 'oauth',
            syncMessage: settings.appsScriptUrl
              ? 'Apps Script Webhook saved! Click "Sync to Sheet" to push updates.'
              : 'Google Sheet link saved successfully!',
          }));
        }}
        customers={customers}
        partners={partners}
        bookings={bookings}
        cacChannels={cacChannels}
        practitioners={practitioners}
        procedures={procedures}
        okrPlans={okrPlans}
        accessToken={accessToken}
        onSignInGoogle={onOpenSignIn}
        onCreateViaOAuth={handleCreateSheetPrompt}
      />
    </div>
  );
};
