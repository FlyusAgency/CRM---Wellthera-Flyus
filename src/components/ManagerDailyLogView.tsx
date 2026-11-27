import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  ServiceBooking,
  Customer,
  Partner,
  ServiceCategory,
  GoogleSheetSyncState,
  Practitioner,
  ClinicProcedure,
} from '../types';
import { generateCsvDownload } from '../services/googleSheets';
import { initialPractitioners, initialProcedures } from '../data/initialData';

interface ManagerDailyLogViewProps {
  bookings: ServiceBooking[];
  customers: Customer[];
  partners: Partner[];
  practitioners?: Practitioner[];
  procedures?: ClinicProcedure[];
  onAddNewBooking: (booking: ServiceBooking) => void;
  onAddNewCustomer: (customer: Customer) => void;
  syncState: GoogleSheetSyncState;
  onSyncNow: () => void;
  isDarkMode?: boolean;
}

export const ManagerDailyLogView: React.FC<ManagerDailyLogViewProps> = ({
  bookings,
  customers,
  partners,
  practitioners = initialPractitioners,
  procedures = initialProcedures,
  onAddNewBooking,
  onAddNewCustomer,
  syncState,
  onSyncNow,
  isDarkMode = false,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Unified Origin / Partner options: all registered partners + any historical tags from ClinicSense customers & bookings
  const originPartnerOptions = useMemo(() => {
    const options: { id: string; name: string; referralCode?: string; category?: string }[] = [];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    for (const p of partners) {
      if (!p.name?.trim()) continue;
      options.push({
        id: p.id,
        name: p.name.trim(),
        referralCode: p.referralCode,
        category: p.category,
      });
      seenIds.add(p.id);
      seenNames.add(p.name.trim().toLowerCase());
    }

    const addHistoricalTag = (rawId?: string, rawName?: string, rawCode?: string) => {
      const name = (rawName || '').trim();
      if (!name) return;
      const lower = name.toLowerCase();
      if (seenNames.has(lower)) return;
      const slug = lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const id = rawId && !seenIds.has(rawId) ? rawId : `origin-${slug || options.length}`;
      options.push({
        id,
        name,
        referralCode: rawCode || slug.toUpperCase().slice(0, 10) || 'REF',
      });
      seenIds.add(id);
      seenNames.add(lower);
    };

    for (const c of customers) {
      addHistoricalTag(c.partnerId, c.partnerName, c.referralCode);
    }
    for (const b of bookings) {
      addHistoricalTag(b.partnerId, b.partnerName);
    }

    return options;
  }, [partners, customers, bookings]);

  // Active practitioners & procedures driven live from Tab 5 (Practitioners) and Tab 6 (Procedures)
  const activePractitioners = useMemo(
    () => practitioners.filter((p) => p.status === 'Active'),
    [practitioners]
  );

  const activeProcedures = useMemo(
    () => procedures.filter((proc) => proc.status !== 'Inactive'),
    [procedures]
  );

  // Dynamically derive active Therapy Categories in clinical order
  const availableCategories = useMemo(() => {
    const preferredOrder: ServiceCategory[] = [
      'Registered Massage Therapy',
      'Brazilian Lymphatic Drainage',
      'Acupuncture',
      'Psychotherapy',
      'Nurse-Led Injectables',
    ];
    const present = new Set<ServiceCategory>(activeProcedures.map((p) => p.category));
    const ordered = preferredOrder.filter((cat) => present.has(cat));
    for (const cat of present) {
      if (!ordered.includes(cat)) ordered.push(cat);
    }
    return ordered;
  }, [activeProcedures]);

  // Helper: find active practitioners qualified for a specific procedure
  const getEligiblePractitioners = (proc?: ClinicProcedure): Practitioner[] => {
    if (!proc) return activePractitioners;
    const assignedSet = new Set(
      (proc.assignedPractitioners || []).map((n) => n.trim().toLowerCase()).filter(Boolean)
    );
    const procNameLower = proc.name.trim().toLowerCase();
    const matched = activePractitioners.filter(
      (p) =>
        assignedSet.has(p.name.trim().toLowerCase()) ||
        (p.servicesOffered || []).some((s) => s.trim().toLowerCase() === procNameLower)
    );
    return matched.length > 0 ? matched : activePractitioners;
  };

  // Pick a sensible initial procedure from active catalog
  const defaultProcedure = useMemo(() => {
    return (
      activeProcedures.find((p) => p.name === 'Therapeutic Massage Therapy (60min)') ||
      activeProcedures[0]
    );
  }, [activeProcedures]);

  // Quick Booking Form State
  const [customerName, setCustomerName] = useState('');
  const [partnerId, setPartnerId] = useState(
    () => partners.find((p) => p.id === 'no-partner')?.id || partners[0]?.id || 'no-partner'
  );
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ServiceCategory | 'all'>('all');
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>(
    () => defaultProcedure?.category || 'Registered Massage Therapy'
  );
  const [serviceTitle, setServiceTitle] = useState(
    () => defaultProcedure?.name || 'Therapeutic Massage Therapy (60min)'
  );
  const [therapist, setTherapist] = useState(() => {
    const eligible = getEligiblePractitioners(defaultProcedure);
    return eligible[0]?.name || activePractitioners[0]?.name || '';
  });
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [durationMinutes, setDurationMinutes] = useState(() => defaultProcedure?.durationMinutes ?? 60);
  const [priceCAD, setPriceCAD] = useState(() => defaultProcedure?.priceCAD ?? 120);
  const [insuranceBilledCAD, setInsuranceBilledCAD] = useState(
    () => defaultProcedure?.typicalInsuranceBillingCAD ?? 120
  );
  const [status, setStatus] = useState<'Completed' | 'Upcoming'>('Completed');
  const [autoRegisterCustomer, setAutoRegisterCustomer] = useState(false);
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('None / Self-Pay');
  const [isAddingNewInsurance, setIsAddingNewInsurance] = useState(false);
  const [newInsuranceInput, setNewInsuranceInput] = useState('');

  // Persistent list of custom insurance providers added by the front desk
  const [customInsurers, setCustomInsurers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wellthera_custom_insurers_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((v): v is string => typeof v === 'string' && v.trim().length > 0);
        }
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('wellthera_custom_insurers_v1', JSON.stringify(customInsurers));
    } catch {
      // ignore storage errors
    }
  }, [customInsurers]);

  // Unified insurance provider options: standard Canadian insurers + saved custom insurers + historical customer insurers
  const insuranceOptions = useMemo(() => {
    const defaults: { value: string; label: string }[] = [
      { value: 'Sun Life', label: 'Sun Life (eClaims)' },
      { value: 'Manulife', label: 'Manulife (eClaims)' },
      { value: 'Canada Life', label: 'Canada Life' },
      { value: 'Green Shield Canada', label: 'Green Shield Canada' },
      { value: 'Blue Cross', label: 'Blue Cross' },
    ];
    const seen = new Set(defaults.map((d) => d.value.toLowerCase()));
    seen.add('none / self-pay');
    seen.add('not recorded');
    seen.add('direct insurance billing');

    const extras: { value: string; label: string }[] = [];
    const addUnique = (raw?: string) => {
      const clean = (raw || '').trim();
      if (!clean) return;
      const lower = clean.toLowerCase();
      if (seen.has(lower)) return;
      seen.add(lower);
      extras.push({ value: clean, label: clean });
    };

    for (const c of customInsurers) addUnique(c);
    for (const cust of customers) addUnique(cust.insuranceProvider);

    return [
      ...defaults,
      ...extras,
      { value: 'None / Self-Pay', label: 'None / Self-Pay (Self-Pay)' },
    ];
  }, [customInsurers, customers]);

  const handleSaveNewInsurance = (rawName?: string): string | null => {
    const clean = (rawName ?? newInsuranceInput).trim();
    if (!clean) return null;
    const existing = insuranceOptions.find(
      (opt) => opt.value.toLowerCase() === clean.toLowerCase()
    );
    const finalName = existing ? existing.value : clean;
    if (!existing) {
      setCustomInsurers((prev) =>
        prev.some((x) => x.toLowerCase() === finalName.toLowerCase()) ? prev : [...prev, finalName]
      );
    }
    setInsuranceProvider(finalName);
    setNewInsuranceInput('');
    setIsAddingNewInsurance(false);
    return finalName;
  };

  // Keep selected partnerId valid whenever partners / historical origins update
  useEffect(() => {
    if (originPartnerOptions.length === 0) return;
    if (!originPartnerOptions.some((o) => o.id === partnerId)) {
      const fallback =
        originPartnerOptions.find((o) => o.id === 'no-partner') || originPartnerOptions[0];
      if (fallback) setPartnerId(fallback.id);
    }
  }, [originPartnerOptions, partnerId]);

  // Procedures shown in the Front Desk dropdown (all active procedures or filtered by category)
  const formProcedures = useMemo(() => {
    if (selectedCategoryFilter === 'all') return activeProcedures;
    return activeProcedures.filter((p) => p.category === selectedCategoryFilter);
  }, [activeProcedures, selectedCategoryFilter]);

  // Currently selected ClinicProcedure object
  const selectedProcedure = useMemo(() => {
    return (
      activeProcedures.find((p) => p.name.trim().toLowerCase() === serviceTitle.trim().toLowerCase()) ||
      formProcedures[0] ||
      activeProcedures[0]
    );
  }, [activeProcedures, formProcedures, serviceTitle]);

  // Eligible active practitioners for the selected procedure
  const eligiblePractitioners = useMemo(
    () => getEligiblePractitioners(selectedProcedure),
    [selectedProcedure, activePractitioners]
  );

  // Sync procedure fields automatically if Samuel updates/deletes a procedure in Tab 6
  useEffect(() => {
    if (activeProcedures.length === 0) return;
    const exists = activeProcedures.some(
      (p) => p.name.trim().toLowerCase() === serviceTitle.trim().toLowerCase()
    );
    if (!exists) {
      const nextProc = formProcedures[0] || activeProcedures[0];
      if (nextProc) {
        setServiceTitle(nextProc.name);
        setServiceCategory(nextProc.category);
        setPriceCAD(nextProc.priceCAD);
        setInsuranceBilledCAD(nextProc.typicalInsuranceBillingCAD);
        setDurationMinutes(nextProc.durationMinutes);
      }
    }
  }, [activeProcedures, formProcedures, serviceTitle]);

  // Sync therapist automatically whenever procedure or active practitioners list changes
  useEffect(() => {
    if (eligiblePractitioners.length === 0) {
      if (therapist !== '') setTherapist('');
      return;
    }
    const stillEligible = eligiblePractitioners.some(
      (p) => p.name.trim().toLowerCase() === therapist.trim().toLowerCase()
    );
    if (!stillEligible) {
      setTherapist(eligiblePractitioners[0].name);
    }
  }, [eligiblePractitioners, therapist]);

  // Search & Filter in Table
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinicianFilter, setSelectedClinicianFilter] = useState('all');
  const [visibleRows, setVisibleRows] = useState(150);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Derived Copay
  const calculatedPatientPaid = Math.max(0, priceCAD - insuranceBilledCAD);

  // Historical clinician filter list: active roster first + any historical ClinicSense names in bookings
  const tableClinicianOptions = useMemo(() => {
    const activeNames = activePractitioners.map((p) => p.name);
    const activeLower = new Set(activeNames.map((n) => n.toLowerCase()));
    const historicalOnly: string[] = [];
    const seenHist = new Set<string>();
    for (const b of bookings) {
      const t = (b.therapist || '').trim();
      if (!t) continue;
      const lower = t.toLowerCase();
      if (!activeLower.has(lower) && !seenHist.has(lower)) {
        seenHist.add(lower);
        historicalOnly.push(t);
      }
    }
    historicalOnly.sort((a, b) => a.localeCompare(b));
    return { activeNames, historicalOnly };
  }, [activePractitioners, bookings]);

  const applyProcedureSelection = (proc: ClinicProcedure) => {
    setServiceTitle(proc.name);
    setServiceCategory(proc.category);
    setPriceCAD(proc.priceCAD);
    setInsuranceBilledCAD(proc.typicalInsuranceBillingCAD);
    setDurationMinutes(proc.durationMinutes);
    const eligible = getEligiblePractitioners(proc);
    if (
      eligible.length > 0 &&
      !eligible.some((p) => p.name.trim().toLowerCase() === therapist.trim().toLowerCase())
    ) {
      setTherapist(eligible[0].name);
    }
  };

  const handleCategoryChange = (cat: ServiceCategory | 'all') => {
    setSelectedCategoryFilter(cat);
    if (cat === 'all') return;
    setServiceCategory(cat);
    const matchingProc = activeProcedures.find((p) => p.category === cat);
    if (matchingProc) {
      applyProcedureSelection(matchingProc);
    }
  };

  const handlePatientNameChange = (val: string) => {
    setCustomerName(val);
    const matched = customers.find(
      (c) => c.name.trim().toLowerCase() === val.trim().toLowerCase()
    );
    if (matched) {
      const matchedOpt =
        originPartnerOptions.find((o) => o.id === matched.partnerId) ||
        originPartnerOptions.find(
          (o) => o.name.toLowerCase() === (matched.partnerName || '').toLowerCase()
        );
      if (matchedOpt) {
        setPartnerId(matchedOpt.id);
      }
    }
  };

  const handleProcedureSelectChange = (procName: string) => {
    const matchedProc = activeProcedures.find(
      (p) => p.name.trim().toLowerCase() === procName.trim().toLowerCase()
    );
    if (matchedProc) {
      applyProcedureSelection(matchedProc);
    } else {
      setServiceTitle(procName);
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const selectedOrigin =
      originPartnerOptions.find((p) => p.id === partnerId) ||
      originPartnerOptions[0] || { id: 'no-partner', name: 'No partner', referralCode: 'DIRECT' };
    const existingCustomer = customers.find(
      (c) => c.name.trim().toLowerCase() === customerName.trim().toLowerCase()
    );
    const newId = `b-${Date.now().toString().slice(-4)}`;

    const newBooking: ServiceBooking = {
      id: newId,
      customerId: existingCustomer?.id || `c-${Date.now().toString().slice(-4)}`,
      customerName: customerName.trim(),
      partnerId: selectedOrigin.id,
      partnerName: selectedOrigin.name,
      serviceCategory,
      serviceTitle,
      bookingDate,
      durationMinutes: Number(durationMinutes) || 60,
      therapist,
      priceCAD: Number(priceCAD) || 0,
      insuranceBilledCAD: Number(insuranceBilledCAD) || 0,
      patientPaidCAD: calculatedPatientPaid,
      status,
    };

    onAddNewBooking(newBooking);

    // Auto-save any newly typed insurance provider if user submitted directly
    let resolvedInsuranceProvider = insuranceProvider || 'None / Self-Pay';
    if (isAddingNewInsurance && newInsuranceInput.trim()) {
      const saved = handleSaveNewInsurance(newInsuranceInput);
      if (saved) resolvedInsuranceProvider = saved;
    }

    // Auto-register new customer if requested
    if (autoRegisterCustomer && !existingCustomer) {
      onAddNewCustomer({
        id: newBooking.customerId,
        name: customerName.trim(),
        email: patientEmail.trim(),
        phone: patientPhone.trim(),
        partnerId: selectedOrigin.id,
        partnerName: selectedOrigin.name,
        referralCode:
          selectedOrigin.referralCode ||
          (selectedOrigin.id === 'no-partner'
            ? 'DIRECT'
            : selectedOrigin.name.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, '')),
        firstVisitDate: bookingDate,
        lastVisitDate: bookingDate,
        totalVisits: 1,
        totalSpendCAD: Number(priceCAD) || 0,
        preferredService: serviceCategory,
        insuranceProvider: resolvedInsuranceProvider,
        status: 'Active',
        recencyDays: 0,
        recencyScore: 5,
        frequencyScore: 1,
        monetaryScore: 2,
        rfmSegment: 'Recent Customers',
      });
    }

    setFormSuccessMessage(`Appointment for "${customerName}" logged successfully!`);
    setTimeout(() => setFormSuccessMessage(null), 3000);

    // Reset customer name
    setCustomerName('');
    setPatientEmail('');
    setPatientPhone('');
    setIsAddingNewInsurance(false);
    setNewInsuranceInput('');
  };

  // Helper: match active short names against historical ClinicSense legal names in table filter
  const matchesSelectedClinician = (bookingTherapist: string, selectedFilter: string) => {
    if (selectedFilter === 'all') return true;
    const bt = (bookingTherapist || '').trim().toLowerCase();
    const sf = selectedFilter.trim().toLowerCase();
    if (bt === sf || bt.startsWith(sf)) return true;
    if (sf === 'yuki hamada' && bt.includes('yukiko hamada')) return true;
    if (sf === 'liz cerato' && bt.includes('elizabeth cerato')) return true;
    if (sf === 'djuna cunha' && bt.includes('djuna') && bt.includes('cunha')) return true;
    return false;
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesSearch =
        !q ||
        b.customerName.toLowerCase().includes(q) ||
        b.serviceTitle.toLowerCase().includes(q) ||
        b.partnerName.toLowerCase().includes(q) ||
        b.therapist.toLowerCase().includes(q);

      const matchesClinician = matchesSelectedClinician(b.therapist, selectedClinicianFilter);

      return matchesSearch && matchesClinician;
    });
  }, [bookings, searchQuery, selectedClinicianFilter]);

  // Operational Stats
  const totalBookingsCount = bookings.length;
  const totalRevenueCAD = bookings.reduce((sum, b) => sum + b.priceCAD, 0);
  const totalInsuranceBilled = bookings.reduce((sum, b) => sum + b.insuranceBilledCAD, 0);
  const totalPatientPaid = bookings.reduce((sum, b) => sum + b.patientPaidCAD, 0);

  const handleExportManagerCsv = () => {
    const headers = [
      'Booking ID',
      'Date',
      'Patient',
      'Partner / Referral Source',
      'Service',
      'Procedure',
      'Therapist',
      'Duration (Min)',
      'Total Value CAD',
      'Direct Insurance Billed CAD',
      'Patient Paid Copay CAD',
      'Status',
    ];
    const rows = filteredBookings.map((b) => [
      b.id,
      b.bookingDate,
      b.customerName,
      b.partnerName,
      b.serviceCategory,
      b.serviceTitle,
      b.therapist,
      b.durationMinutes,
      b.priceCAD,
      b.insuranceBilledCAD,
      b.patientPaidCAD,
      b.status,
    ]);
    generateCsvDownload(`wellthera_manager_report_${todayStr}`, headers, rows);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Top Banner & Fast Stats for Manager */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className={`p-3.5 rounded-xl border space-y-1 transition-colors ${
            isDarkMode ? 'bg-[#181b12] border-[#292e1e]' : 'bg-[#ffffff] border-[#e7e3da]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold opacity-75">
            <span>Logged Appointments</span>
            <Calendar className="w-4 h-4 text-[#686e4a] dark:text-[#c7ccaa]" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#332e1e] dark:text-[#f9f8f5]">
            {totalBookingsCount}
          </div>
          <span className="text-[10px] text-[#686e4a] dark:text-[#c7ccaa] font-medium block">
            Recorded in System
          </span>
        </div>

        <div
          className={`p-3.5 rounded-xl border space-y-1 transition-colors ${
            isDarkMode ? 'bg-[#181b12] border-[#292e1e]' : 'bg-[#ffffff] border-[#e7e3da]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold opacity-75">
            <span>Total Revenue</span>
            <DollarSign className="w-4 h-4 text-[#e6b000]" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#52573a] dark:text-[#e6b000]">
            ${totalRevenueCAD.toLocaleString('en-CA', { minimumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] opacity-70 block font-medium">
            Avg ${(totalRevenueCAD / Math.max(1, totalBookingsCount)).toFixed(0)}/session
          </span>
        </div>

        <div
          className={`p-3.5 rounded-xl border space-y-1 transition-colors ${
            isDarkMode ? 'bg-[#181b12] border-[#292e1e]' : 'bg-[#ffffff] border-[#e7e3da]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold opacity-75">
            <span>Direct Insurance Billed</span>
            <ShieldCheck className="w-4 h-4 text-[#686e4a]" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#686e4a] dark:text-[#c7ccaa]">
            ${totalInsuranceBilled.toLocaleString('en-CA', { minimumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
            {((totalInsuranceBilled / Math.max(1, totalRevenueCAD)) * 100).toFixed(0)}% of Revenue
          </span>
        </div>

        <div
          className={`p-3.5 rounded-xl border space-y-1 transition-colors ${
            isDarkMode ? 'bg-[#181b12] border-indigo-900/60' : 'bg-indigo-50/60 border-indigo-200'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <span>Patient Copay</span>
            <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-indigo-950 dark:text-indigo-100">
            ${totalPatientPaid.toLocaleString('en-CA', { minimumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-semibold block">
            Direct at Clinic (Out-of-Pocket)
          </span>
        </div>
      </div>

      {/* Quick Logging Form for Manager & Reception */}
      <div
        className={`rounded-2xl border p-5 shadow-sm space-y-4 transition-colors ${
          isDarkMode ? 'bg-[#181b12] border-[#292e1e]' : 'bg-[#ffffff] border-[#e7e3da]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 border-inherit">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#686e4a] text-white">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base">
                Front Desk Quick Log (Patient Checkout)
              </h3>
              <p className="text-[11px] opacity-75">
                Log visits in under 10 seconds upon session completion
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSyncNow}
              disabled={syncState.isSyncing}
              className="px-3.5 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-semibold text-xs rounded-full flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
              <span>{syncState.isSyncing ? 'Syncing...' : 'Sync to Sheet'}</span>
            </button>
          </div>
        </div>

        {formSuccessMessage && (
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>{formSuccessMessage}</span>
          </div>
        )}

        <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Patient Name */}
            <div className="space-y-1">
              <label className="font-semibold block">Full Patient Name *</label>
              <input
                type="text"
                required
                list="wellthera-patients-datalist"
                placeholder="Type or pick existing patient..."
                value={customerName}
                onChange={(e) => handlePatientNameChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                    : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                }`}
              />
              <datalist id="wellthera-patients-datalist">
                {customers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            {/* Partner / Source */}
            <div className="space-y-1">
              <label className="font-semibold block">Origin / Referral Partner *</label>
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                    : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                }`}
              >
                {originPartnerOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Category Filter */}
            <div className="space-y-1">
              <label className="font-semibold block">Therapy Category *</label>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value as ServiceCategory | 'all')}
                className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                    : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                }`}
              >
                <option value="all">All Categories ({activeProcedures.length} Services)</option>
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Specific Procedure (Live Dropdown from Tab 6 Procedures) */}
            <div className="space-y-1">
              <label className="font-semibold block">Procedure Performed *</label>
              <select
                value={selectedProcedure?.name || serviceTitle}
                onChange={(e) => handleProcedureSelectChange(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                    : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                }`}
              >
                {selectedCategoryFilter === 'all'
                  ? availableCategories.map((cat) => {
                      const catProcs = activeProcedures.filter((p) => p.category === cat);
                      if (catProcs.length === 0) return null;
                      return (
                        <optgroup key={cat} label={cat}>
                          {catProcs.map((proc) => (
                            <option key={proc.id} value={proc.name}>
                              {proc.name} — ${proc.priceCAD.toFixed(0)}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })
                  : formProcedures.map((proc) => (
                      <option key={proc.id} value={proc.name}>
                        {proc.name} — ${proc.priceCAD.toFixed(0)}
                      </option>
                    ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {/* Therapist (Live Active Practitioners Qualified for Selected Procedure) */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold block">
                Therapist / Clinician ({eligiblePractitioners.length} qualified)
              </label>
              <select
                value={therapist}
                onChange={(e) => setTherapist(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                    : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                }`}
              >
                {eligiblePractitioners.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name} — {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1">
              <label className="font-semibold block">Date</label>
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                    : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                }`}
              />
            </div>

            {/* Price CAD */}
            <div className="space-y-1">
              <label className="font-semibold block">Total Value (CAD)</label>
              <input
                type="number"
                min="0"
                step="5"
                value={priceCAD}
                onChange={(e) => setPriceCAD(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                    : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                }`}
              />
            </div>

            {/* Insurance CAD */}
            <div className="space-y-1">
              <label className="font-semibold block">Insurance Billed CAD</label>
              <input
                type="number"
                min="0"
                step="5"
                value={insuranceBilledCAD}
                onChange={(e) => setInsuranceBilledCAD(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                    : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                }`}
              />
            </div>

            {/* Patient Copay (Calculated) */}
            <div className="space-y-1">
              <label className="font-bold block text-indigo-700 dark:text-indigo-300">
                Patient Copay CAD
              </label>
              <div
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold ${
                  isDarkMode
                    ? 'bg-[#14160e] border-indigo-800 text-indigo-300'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-950'
                }`}
              >
                ${calculatedPatientPaid}
              </div>
            </div>
          </div>

          {/* New Patient Registration Option */}
          <div
            className={`p-3 rounded-xl border space-y-2 ${
              isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f9f8f5] border-[#e7e3da]'
            }`}
          >
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={autoRegisterCustomer}
                onChange={(e) => setAutoRegisterCustomer(e.target.checked)}
                className="w-4 h-4 rounded text-[#686e4a] accent-[#686e4a]"
              />
              <span>
                Is this patient NEW to the clinic? (Automatically register in "Customers & RFM")
              </span>
            </label>

            {autoRegisterCustomer && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <input
                  type="text"
                  placeholder="Patient phone (optional)"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-xs ${
                    isDarkMode
                      ? 'bg-[#181b12] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                  }`}
                />
                <input
                  type="email"
                  placeholder="Patient email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-xs ${
                    isDarkMode
                      ? 'bg-[#181b12] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                  }`}
                />
                <div className="space-y-2">
                  <select
                    value={isAddingNewInsurance ? '__ADD_NEW_INSURANCE__' : insuranceProvider}
                    onChange={(e) => {
                      if (e.target.value === '__ADD_NEW_INSURANCE__') {
                        setIsAddingNewInsurance(true);
                        setNewInsuranceInput('');
                      } else {
                        setIsAddingNewInsurance(false);
                        setNewInsuranceInput('');
                        setInsuranceProvider(e.target.value);
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-xl border text-xs ${
                      isDarkMode
                        ? 'bg-[#181b12] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                    }`}
                  >
                    {insuranceOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                    <option value="__ADD_NEW_INSURANCE__">+ Add New Insurance...</option>
                  </select>

                  {isAddingNewInsurance && (
                    <div
                      className={`p-2 rounded-xl border space-y-1.5 ${
                        isDarkMode
                          ? 'bg-[#181b12] border-[#686e4a]/60'
                          : 'bg-[#ffffff] border-[#686e4a]/50'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          autoFocus
                          placeholder="New insurance name (e.g. Desjardins)..."
                          value={newInsuranceInput}
                          onChange={(e) => setNewInsuranceInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveNewInsurance();
                            } else if (e.key === 'Escape') {
                              setIsAddingNewInsurance(false);
                              setNewInsuranceInput('');
                            }
                          }}
                          className={`flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border text-xs focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                            isDarkMode
                              ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                              : 'bg-[#f9f8f5] border-[#bcc2a4] text-[#332e1e]'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveNewInsurance()}
                          disabled={!newInsuranceInput.trim()}
                          className="px-2.5 py-1.5 rounded-lg bg-[#686e4a] hover:bg-[#52573a] disabled:opacity-40 text-white font-semibold text-xs cursor-pointer transition-colors shrink-0"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingNewInsurance(false);
                            setNewInsuranceInput('');
                          }}
                          className={`px-2 py-1.5 rounded-lg border text-xs cursor-pointer shrink-0 ${
                            isDarkMode
                              ? 'border-[#292e1e] text-[#a2a992] hover:bg-[#1f2417]'
                              : 'border-[#e7e3da] text-[#554e38] hover:bg-[#f0ede6]'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-[10px] opacity-70">
                        Quick-adds the insurer to the list now — full insurance details can be completed later.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-xl shadow-sm flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Log Appointment in System</span>
            </button>
          </div>
        </form>
      </div>

      {/* Daily Records Table */}
      <div
        className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${
          isDarkMode ? 'bg-[#181b12] border-[#292e1e]' : 'bg-[#ffffff] border-[#e7e3da]'
        }`}
      >
        {/* Table Filter Bar */}
        <div
          className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f0ede6] border-[#e7e3da]'
          }`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                placeholder="Search by patient, service, partner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-8 pr-3 py-1.5 rounded-full border text-xs w-60 sm:w-72 transition-colors ${
                  isDarkMode
                    ? 'bg-[#181b12] border-[#292e1e] text-[#f9f8f5]'
                    : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                }`}
              />
            </div>

            <select
              value={selectedClinicianFilter}
              onChange={(e) => {
                setSelectedClinicianFilter(e.target.value);
                setVisibleRows(150);
              }}
              className={`px-3 py-1.5 rounded-full border text-xs ${
                isDarkMode
                  ? 'bg-[#181b12] border-[#292e1e] text-[#f9f8f5]'
                  : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
              }`}
            >
              <option value="all">All Therapists</option>
              <optgroup label="Active Clinic Team">
                {tableClinicianOptions.activeNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </optgroup>
              {tableClinicianOptions.historicalOnly.length > 0 && (
                <optgroup label="Historical ClinicSense Records">
                  {tableClinicianOptions.historicalOnly.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">
              Showing {Math.min(visibleRows, filteredBookings.length).toLocaleString()} of{' '}
              {filteredBookings.length.toLocaleString()} records
            </span>
            <button
              onClick={handleExportManagerCsv}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDarkMode
                  ? 'bg-[#1c2015] border-[#292e1e] text-[#c7ccaa] hover:bg-[#252a1c]'
                  : 'bg-[#ffffff] border-[#e7e3da] text-[#52573a] hover:bg-[#f0ede6]'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-xs text-left">
            <thead
              className={`font-semibold border-b sticky top-0 ${
                isDarkMode
                  ? 'bg-[#14160e] border-[#292e1e] text-[#c7ccaa]'
                  : 'bg-[#edf0e6] border-[#bcc2a4] text-[#4a5035]'
              }`}
            >
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 font-bold text-emerald-800 dark:text-emerald-300">Patient</th>
                <th className="py-2.5 px-3">Origin / Partner</th>
                <th className="py-2.5 px-3">Procedure</th>
                <th className="py-2.5 px-3">Therapist</th>
                <th className="py-2.5 px-3 text-right">Total CAD</th>
                <th className="py-2.5 px-3 text-right">Insurance CAD</th>
                <th className="py-2.5 px-3 text-right font-bold text-emerald-800 dark:text-emerald-300">Patient Copay</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center opacity-60">
                    No appointments found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.slice(0, visibleRows).map((b) => (
                  <tr
                    key={b.id}
                    className={`transition-colors ${
                      isDarkMode ? 'hover:bg-[#1f2417]' : 'hover:bg-[#f9f8f5]'
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-[11px] opacity-80 whitespace-nowrap">
                      {b.bookingDate}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="font-bold text-emerald-950 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-2 py-0.5 rounded-md inline-block shadow-2xs">
                        {b.customerName}
                      </span>
                    </td>
                    <td className="py-2 px-3 opacity-80 whitespace-nowrap">{b.partnerName}</td>
                    <td className="py-2 px-3 whitespace-nowrap font-medium">{b.serviceTitle}</td>
                    <td className="py-2 px-3 opacity-80 whitespace-nowrap">{b.therapist}</td>
                    <td className="py-2 px-3 font-mono font-bold text-right whitespace-nowrap">
                      ${b.priceCAD.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 font-mono text-right opacity-80 whitespace-nowrap">
                      ${b.insuranceBilledCAD.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-right text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                      ${b.patientPaidCAD.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'Completed'
                            ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                            : b.status === 'Upcoming'
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                            : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredBookings.length > visibleRows && (
          <div
            className={`p-3 border-t flex items-center justify-center ${
              isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f9f8f5] border-[#e7e3da]'
            }`}
          >
            <button
              type="button"
              onClick={() => setVisibleRows((prev) => prev + 200)}
              className={`px-4 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-colors ${
                isDarkMode
                  ? 'bg-[#1c2015] border-[#292e1e] text-[#c7ccaa] hover:bg-[#252a1c]'
                  : 'bg-[#ffffff] border-[#bcc2a4] text-[#52573a] hover:bg-[#f0ede6]'
              }`}
            >
              Load more records ({(filteredBookings.length - visibleRows).toLocaleString()} remaining)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
