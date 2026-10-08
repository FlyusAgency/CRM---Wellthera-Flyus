import React from 'react';
import { Filter, RotateCcw, Search, ChevronDown, Check } from 'lucide-react';
import { SlicerFilters, Partner, ServiceCategory, RfmSegment } from '../types';

interface SlicerBarProps {
  filters: SlicerFilters;
  onChange: (updated: SlicerFilters) => void;
  partners: Partner[];
  onReset: () => void;
  isDarkMode?: boolean;
}

const SERVICE_OPTIONS: ServiceCategory[] = [
  'Brazilian Lymphatic Drainage',
  'Registered Massage Therapy',
  'Acupuncture',
  'Nurse-Led Injectables',
  'Psychotherapy',
];

const RFM_OPTIONS: RfmSegment[] = [
  'Champions',
  'Loyal Customers',
  'Potential Loyalists',
  'Recent Customers',
  'Promising',
  'Needs Attention',
  'Can\'t Lose Them',
  'At Risk',
  'Hibernating',
];

export const SlicerBar: React.FC<SlicerBarProps> = ({
  filters,
  onChange,
  partners,
  onReset,
  isDarkMode = false,
}) => {
  const [partnerDropdownOpen, setPartnerDropdownOpen] = React.useState(false);
  const [serviceDropdownOpen, setServiceDropdownOpen] = React.useState(false);
  const [rfmDropdownOpen, setRfmDropdownOpen] = React.useState(false);

  const togglePartner = (id: string) => {
    if (filters.selectedPartners.includes(id)) {
      onChange({
        ...filters,
        selectedPartners: filters.selectedPartners.filter((p) => p !== id),
      });
    } else {
      onChange({
        ...filters,
        selectedPartners: [...filters.selectedPartners, id],
      });
    }
  };

  const toggleService = (srv: string) => {
    if (filters.selectedServices.includes(srv)) {
      onChange({
        ...filters,
        selectedServices: filters.selectedServices.filter((s) => s !== srv),
      });
    } else {
      onChange({
        ...filters,
        selectedServices: [...filters.selectedServices, srv],
      });
    }
  };

  const toggleRfm = (segment: RfmSegment) => {
    if (filters.selectedRfmSegments.includes(segment)) {
      onChange({
        ...filters,
        selectedRfmSegments: filters.selectedRfmSegments.filter((s) => s !== segment),
      });
    } else {
      onChange({
        ...filters,
        selectedRfmSegments: [...filters.selectedRfmSegments, segment],
      });
    }
  };

  const activeFiltersCount =
    (filters.dateRange !== 'all' ? 1 : 0) +
    filters.selectedPartners.length +
    filters.selectedServices.length +
    filters.selectedRfmSegments.length +
    (filters.paymentType !== 'all' ? 1 : 0) +
    (filters.searchQuery.trim() ? 1 : 0);

  return (
    <div
      className={`border-b transition-colors ${
        isDarkMode
          ? 'bg-[#181b12] border-[#292e1e] text-[#f9f8f5]'
          : 'bg-[#f4f1eb] border-[#e7e3da] text-[#332e1e]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Slicer Label & Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mr-1 ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-[#686e4a]" />
              <span>Slicers</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#686e4a] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </div>

            {/* Date Range Slicer */}
            <div className="flex items-center rounded-lg border p-0.5 text-xs">
              {(
                [
                  { id: 'all' as const, label: 'All Time' },
                  { id: '30d' as const, label: '30D' },
                  { id: '90d' as const, label: '90D' },
                  { id: '180d' as const, label: '180D' },
                  { id: '365d' as const, label: '365D' },
                ]
              ).map((d) => (
                <button
                  key={d.id}
                  onClick={() => onChange({ ...filters, dateRange: d.id })}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    filters.dateRange === d.id
                      ? 'bg-[#686e4a] text-white font-semibold'
                      : isDarkMode
                      ? 'text-[#a2a992] hover:text-white'
                      : 'text-[#6e6856] hover:text-[#100e0a]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Partner Slicer Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setPartnerDropdownOpen(!partnerDropdownOpen);
                  setServiceDropdownOpen(false);
                  setRfmDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  filters.selectedPartners.length > 0
                    ? 'bg-[#686e4a]/15 border-[#686e4a] text-[#686e4a] dark:text-[#c7ccaa] font-semibold'
                    : isDarkMode
                    ? 'bg-[#1c2015] border-[#292e1e] text-[#a2a992] hover:border-[#383f2a]'
                    : 'bg-[#ffffff] border-[#e7e3da] text-[#554e38] hover:border-[#bcc2a4]'
                }`}
              >
                <span>
                  Partner:{' '}
                  {filters.selectedPartners.length === 0
                    ? 'All Partners'
                    : `${filters.selectedPartners.length} selected`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {partnerDropdownOpen && (
                <div
                  className={`absolute left-0 mt-1 w-64 rounded-xl border shadow-xl p-2 z-40 max-h-72 overflow-y-auto ${
                    isDarkMode
                      ? 'bg-[#1c2015] border-[#383f2a] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                >
                  <div className="flex items-center justify-between px-2 py-1 border-b pb-1.5 mb-1.5 border-inherit">
                    <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                      Filter by Partner
                    </span>
                    {filters.selectedPartners.length > 0 && (
                      <button
                        onClick={() => onChange({ ...filters, selectedPartners: [] })}
                        className="text-[10px] text-[#686e4a] dark:text-[#aab187] hover:underline font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {partners.map((p) => {
                    const isSelected = filters.selectedPartners.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePartner(p.id)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                          isDarkMode ? 'hover:bg-[#252a1c]' : 'hover:bg-[#f0ede6]'
                        }`}
                      >
                        <span className="truncate pr-2 font-medium">{p.name}</span>
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#686e4a] border-[#686e4a] text-white'
                              : 'border-[#bcc2a4]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Service Category Slicer Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setServiceDropdownOpen(!serviceDropdownOpen);
                  setPartnerDropdownOpen(false);
                  setRfmDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  filters.selectedServices.length > 0
                    ? 'bg-[#686e4a]/15 border-[#686e4a] text-[#686e4a] dark:text-[#c7ccaa] font-semibold'
                    : isDarkMode
                    ? 'bg-[#1c2015] border-[#292e1e] text-[#a2a992] hover:border-[#383f2a]'
                    : 'bg-[#ffffff] border-[#e7e3da] text-[#554e38] hover:border-[#bcc2a4]'
                }`}
              >
                <span>
                  Service:{' '}
                  {filters.selectedServices.length === 0
                    ? 'All Services'
                    : `${filters.selectedServices.length} selected`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {serviceDropdownOpen && (
                <div
                  className={`absolute left-0 mt-1 w-64 rounded-xl border shadow-xl p-2 z-40 ${
                    isDarkMode
                      ? 'bg-[#1c2015] border-[#383f2a] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                >
                  <div className="flex items-center justify-between px-2 py-1 border-b pb-1.5 mb-1.5 border-inherit">
                    <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                      Filter by Service
                    </span>
                    {filters.selectedServices.length > 0 && (
                      <button
                        onClick={() => onChange({ ...filters, selectedServices: [] })}
                        className="text-[10px] text-[#686e4a] dark:text-[#aab187] hover:underline font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {SERVICE_OPTIONS.map((srv) => {
                    const isSelected = filters.selectedServices.includes(srv);
                    return (
                      <button
                        key={srv}
                        onClick={() => toggleService(srv)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                          isDarkMode ? 'hover:bg-[#252a1c]' : 'hover:bg-[#f0ede6]'
                        }`}
                      >
                        <span className="truncate pr-2 font-medium">{srv}</span>
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#686e4a] border-[#686e4a] text-white'
                              : 'border-[#bcc2a4]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RFM Matrix Segment Slicer Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setRfmDropdownOpen(!rfmDropdownOpen);
                  setPartnerDropdownOpen(false);
                  setServiceDropdownOpen(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  filters.selectedRfmSegments.length > 0
                    ? 'bg-[#e6b000]/15 border-[#e6b000] text-[#997500] dark:text-[#e6b000] font-semibold'
                    : isDarkMode
                    ? 'bg-[#1c2015] border-[#292e1e] text-[#a2a992] hover:border-[#383f2a]'
                    : 'bg-[#ffffff] border-[#e7e3da] text-[#554e38] hover:border-[#bcc2a4]'
                }`}
              >
                <span>
                  RFM Segment:{' '}
                  {filters.selectedRfmSegments.length === 0
                    ? 'All Segments'
                    : `${filters.selectedRfmSegments.length} selected`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {rfmDropdownOpen && (
                <div
                  className={`absolute left-0 mt-1 w-60 rounded-xl border shadow-xl p-2 z-40 max-h-72 overflow-y-auto ${
                    isDarkMode
                      ? 'bg-[#1c2015] border-[#383f2a] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                >
                  <div className="flex items-center justify-between px-2 py-1 border-b pb-1.5 mb-1.5 border-inherit">
                    <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                      RFM Customer Segments
                    </span>
                    {filters.selectedRfmSegments.length > 0 && (
                      <button
                        onClick={() => onChange({ ...filters, selectedRfmSegments: [] })}
                        className="text-[10px] text-[#e6b000] hover:underline font-semibold"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {RFM_OPTIONS.map((seg) => {
                    const isSelected = filters.selectedRfmSegments.includes(seg);
                    return (
                      <button
                        key={seg}
                        onClick={() => toggleRfm(seg)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs transition-colors ${
                          isDarkMode ? 'hover:bg-[#252a1c]' : 'hover:bg-[#f0ede6]'
                        }`}
                      >
                        <span className="truncate pr-2 font-medium">{seg}</span>
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-[#e6b000] border-[#e6b000] text-[#14160e]'
                              : 'border-[#bcc2a4]'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Insurance Direct-Billing Filter */}
            <div className="flex items-center rounded-lg border p-0.5 text-xs">
              {(
                [
                  { id: 'all' as const, label: 'All Billings' },
                  { id: 'directBilling' as const, label: 'Direct Billing' },
                  { id: 'outOfPocket' as const, label: 'Self-Pay' },
                ]
              ).map((pay) => (
                <button
                  key={pay.id}
                  onClick={() => onChange({ ...filters, paymentType: pay.id })}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    filters.paymentType === pay.id
                      ? 'bg-[#686e4a] text-white font-semibold'
                      : isDarkMode
                      ? 'text-[#a2a992] hover:text-white'
                      : 'text-[#6e6856] hover:text-[#100e0a]'
                  }`}
                >
                  {pay.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Search Query & Reset All Slicers */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 opacity-50" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => onChange({ ...filters, searchQuery: e.target.value })}
                placeholder="Search patient or partner..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5] placeholder-[#8b927a]'
                    : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e] placeholder-[#9ba098]'
                }`}
              />
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={onReset}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                  isDarkMode
                    ? 'bg-[#1c2015] border-[#292e1e] text-[#c7ccaa] hover:bg-[#252a1c]'
                    : 'bg-[#ffffff] border-[#e7e3da] text-[#52573a] hover:bg-[#f0ede6]'
                }`}
                title="Clear all active filters"
              >
                <RotateCcw className="w-3 h-3 text-[#686e4a]" />
                <span className="hidden sm:inline">Reset Slicers</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
