import React, { useState, useMemo } from 'react';
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
} from '../types';
import { generateCsvDownload } from '../services/googleSheets';

interface ManagerDailyLogViewProps {
  bookings: ServiceBooking[];
  customers: Customer[];
  partners: Partner[];
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
  onAddNewBooking,
  onAddNewCustomer,
  syncState,
  onSyncNow,
  isDarkMode = false,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Quick Booking Form State
  const [customerName, setCustomerName] = useState('');
  const [partnerId, setPartnerId] = useState(partners[0]?.id || 'p-1');
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>(
    'Brazilian Lymphatic Drainage'
  );
  const [serviceTitle, setServiceTitle] = useState('Full Body Lymphatic Drainage');
  const [therapist, setTherapist] = useState('Camila Santos, RMT');
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [priceCAD, setPriceCAD] = useState(160);
  const [insuranceBilledCAD, setInsuranceBilledCAD] = useState(120);
  const [status, setStatus] = useState<'Completed' | 'Upcoming'>('Completed');
  const [autoRegisterCustomer, setAutoRegisterCustomer] = useState(false);
  const [patientPhone, setPatientPhone] = useState('(705) 555-0199');
  const [patientEmail, setPatientEmail] = useState('');
  const [insuranceProvider, setInsuranceProvider] = useState('Sun Life');

  // Search & Filter in Table
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClinicianFilter, setSelectedClinicianFilter] = useState('all');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Derived Copay
  const calculatedPatientPaid = Math.max(0, priceCAD - insuranceBilledCAD);

  // Clinician options
  const cliniciansList = [
    'Camila Santos, RMT',
    'Lucas Silva, RMT',
    'Dr. Jin Park, R.Ac',
    'Nurse Sarah, RN',
    'Dr. Rachel Vance, ND',
    'Elena Rostova, RP',
  ];

  // Service titles by category
  const serviceOptionsByCategory: Record<ServiceCategory, string[]> = {
    'Brazilian Lymphatic Drainage': [
      'Full Body Lymphatic Drainage',
      'Post-Op Contouring Drainage',
      'Detox & Metabolic Drainage',
    ],
    'Registered Massage Therapy': [
      'Deep Tissue Recovery Massage',
      'Sports Massage & Cupping',
      'Relaxation & Myofascial Release',
    ],
    Acupuncture: [
      'Hormonal & Pelvic Acupuncture',
      'Pain Relief & Trigger Point Acupuncture',
      'Stress & Insomnia Acupuncture',
    ],
    'Nurse-Led Injectables': [
      'Microneedling PRP',
      'B-Complex & Glutathione IV Drip',
      'Facial Rejuvenation Assessment',
    ],
    Psychotherapy: [
      'Cognitive Behavioural Therapy (CBT)',
      'Stress & Burnout Counselling',
      'Holistic Wellness Coaching',
    ],
  };

  const handleCategoryChange = (cat: ServiceCategory) => {
    setServiceCategory(cat);
    const options = serviceOptionsByCategory[cat] || [];
    if (options[0]) {
      setServiceTitle(options[0]);
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;

    const partner = partners.find((p) => p.id === partnerId) || partners[0];
    const newId = `b-${Date.now().toString().slice(-4)}`;

    const newBooking: ServiceBooking = {
      id: newId,
      customerId: `c-${Date.now().toString().slice(-4)}`,
      customerName: customerName.trim(),
      partnerId: partner.id,
      partnerName: partner.name,
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

    // Auto-register new customer if requested
    if (autoRegisterCustomer) {
      onAddNewCustomer({
        id: newBooking.customerId,
        name: customerName.trim(),
        email: patientEmail || `${customerName.toLowerCase().replace(/\s+/g, '.')}@email.com`,
        phone: patientPhone || '(705) 555-0100',
        partnerId: partner.id,
        partnerName: partner.name,
        referralCode: `${partner.name.slice(0, 4).toUpperCase()}`,
        firstVisitDate: bookingDate,
        lastVisitDate: bookingDate,
        totalVisits: 1,
        totalSpendCAD: Number(priceCAD) || 0,
        preferredService: serviceCategory,
        insuranceProvider: insuranceProvider || 'Sun Life',
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
  };

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.therapist.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesClinician =
        selectedClinicianFilter === 'all' || b.therapist === selectedClinicianFilter;

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
            isDarkMode ? 'bg-[#181b12] border-[#292e1e]' : 'bg-[#ffffff] border-[#e7e3da]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold opacity-75">
            <span>Patient Copay</span>
            <UserCheck className="w-4 h-4 text-[#686e4a]" />
          </div>
          <div className="text-xl sm:text-2xl font-serif font-bold text-[#332e1e] dark:text-[#f9f8f5]">
            ${totalPatientPaid.toLocaleString('en-CA', { minimumFractionDigits: 0 })}
          </div>
          <span className="text-[10px] opacity-70 block font-medium">
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
                placeholder="e.g. Sarah Jenkins"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                    : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                }`}
              />
            </div>

            {/* Partner / Source */}
            <div className="space-y-1">
              <label className="font-semibold block">Referral Partner / Source *</label>
              <select
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                    : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                }`}
              >
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Category */}
            <div className="space-y-1">
              <label className="font-semibold block">Therapy Category *</label>
              <select
                value={serviceCategory}
                onChange={(e) => handleCategoryChange(e.target.value as ServiceCategory)}
                className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                    : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                }`}
              >
                <option value="Brazilian Lymphatic Drainage">Brazilian Lymphatic Drainage</option>
                <option value="Registered Massage Therapy">Registered Massage Therapy</option>
                <option value="Acupuncture">Acupuncture</option>
                <option value="Nurse-Led Injectables">Nurse-Led Injectables</option>
                <option value="Psychotherapy">Psychotherapy</option>
              </select>
            </div>

            {/* Specific Procedure */}
            <div className="space-y-1">
              <label className="font-semibold block">Procedure Performed</label>
              <input
                type="text"
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                    : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {/* Therapist */}
            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold block">Therapist / Clinician</label>
              <select
                value={therapist}
                onChange={(e) => setTherapist(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border text-xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-[#686e4a] ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                    : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                }`}
              >
                {cliniciansList.map((c) => (
                  <option key={c} value={c}>
                    {c}
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
              <label className="font-semibold block text-emerald-600 dark:text-emerald-400">
                Patient Copay CAD
              </label>
              <div
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono font-bold ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-emerald-400'
                    : 'bg-[#edf0e6] border-[#bcc2a4] text-[#332e1e]'
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
                  placeholder="Phone: (705) 555-0100"
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
                <select
                  value={insuranceProvider}
                  onChange={(e) => setInsuranceProvider(e.target.value)}
                  className={`px-3 py-2 rounded-xl border text-xs ${
                    isDarkMode
                      ? 'bg-[#181b12] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
                  }`}
                >
                  <option value="Sun Life">Sun Life (eClaims)</option>
                  <option value="Manulife">Manulife (eClaims)</option>
                  <option value="Canada Life">Canada Life</option>
                  <option value="Green Shield Canada">Green Shield Canada</option>
                  <option value="Blue Cross">Blue Cross</option>
                  <option value="None / Self-Pay">None / Self-Pay (Self-Pay)</option>
                </select>
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
              onChange={(e) => setSelectedClinicianFilter(e.target.value)}
              className={`px-3 py-1.5 rounded-full border text-xs ${
                isDarkMode
                  ? 'bg-[#181b12] border-[#292e1e] text-[#f9f8f5]'
                  : 'bg-[#ffffff] border-[#bcc2a4] text-[#332e1e]'
              }`}
            >
              <option value="all">All Therapists</option>
              {cliniciansList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs opacity-70">
              {filteredBookings.length} of {bookings.length} records
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
                <th className="py-2.5 px-3">Patient</th>
                <th className="py-2.5 px-3">Origin / Partner</th>
                <th className="py-2.5 px-3">Procedure</th>
                <th className="py-2.5 px-3">Therapist</th>
                <th className="py-2.5 px-3 text-right">Total CAD</th>
                <th className="py-2.5 px-3 text-right">Insurance CAD</th>
                <th className="py-2.5 px-3 text-right">Patient Copay</th>
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
                filteredBookings.map((b) => (
                  <tr
                    key={b.id}
                    className={`transition-colors ${
                      isDarkMode ? 'hover:bg-[#1f2417]' : 'hover:bg-[#f9f8f5]'
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-[11px] opacity-80 whitespace-nowrap">
                      {b.bookingDate}
                    </td>
                    <td className="py-2 px-3 font-bold text-[#332e1e] dark:text-[#f9f8f5] whitespace-nowrap">
                      {b.customerName}
                    </td>
                    <td className="py-2 px-3 opacity-80 whitespace-nowrap">{b.partnerName}</td>
                    <td className="py-2 px-3 whitespace-nowrap">{b.serviceTitle}</td>
                    <td className="py-2 px-3 opacity-80 whitespace-nowrap">{b.therapist}</td>
                    <td className="py-2 px-3 font-mono font-bold text-right whitespace-nowrap">
                      ${b.priceCAD.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 font-mono text-right opacity-80 whitespace-nowrap">
                      ${b.insuranceBilledCAD.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
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
      </div>
    </div>
  );
};
