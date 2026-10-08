import React from 'react';
import {
  Users,
  DollarSign,
  TrendingUp,
  Target,
  Award,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Customer, Partner, ServiceBooking, CacChannelSpend } from '../types';
import { KpiCard } from './KpiCard';
import { ActiveTab } from './PowerBIHeader';

interface ExecutiveOverviewProps {
  customers: Customer[];
  partners: Partner[];
  bookings: ServiceBooking[];
  cacChannels: CacChannelSpend[];
  onNavigateTab: (tab: ActiveTab) => void;
  isDarkMode?: boolean;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  customers,
  partners,
  bookings,
  cacChannels,
  onNavigateTab,
  isDarkMode = false,
}) => {
  const totalRevenue = bookings.reduce((acc, b) => acc + b.priceCAD, 0);
  const totalInsurance = bookings.reduce((acc, b) => acc + b.insuranceBilledCAD, 0);
  const referralPartners = partners.filter((p) => p.id !== 'p-8');
  const partnerGross = referralPartners.reduce((acc, p) => acc + p.totalRevenueCAD, 0);
  const partnerCommissions = referralPartners.reduce((acc, p) => acc + p.totalCommissionPaidCAD, 0);
  const partnerRetainers = referralPartners.reduce((acc, p) => acc + p.monthlyRetainerCAD * 6, 0);
  const partnerCost = partnerCommissions + partnerRetainers;
  const netPartnerRev = partnerGross - partnerCost;
  const partnerRoi = partnerCost > 0 ? (netPartnerRev / partnerCost) * 100 : 0;

  const totalMarketingSpend = cacChannels.reduce((acc, c) => acc + c.spendCAD, 0);
  const totalNewPatients = cacChannels.reduce((acc, c) => acc + c.newCustomersAcquired, 0);
  const blendedCac = totalNewPatients > 0 ? totalMarketingSpend / totalNewPatients : 0;
  const avgLtv = cacChannels.reduce((acc, c) => acc + c.averageLtvCAD, 0) / (cacChannels.length || 1);
  const ltvCacRatio = blendedCac > 0 ? avgLtv / blendedCac : 0;

  const championsCount = customers.filter((c) => c.rfmSegment === 'Champions').length;
  const loyalCount = customers.filter((c) => c.rfmSegment === 'Loyal Customers').length;
  const atRiskCount = customers.filter((c) => c.rfmSegment === 'At Risk' || c.rfmSegment === "Can't Lose Them").length;

  return (
    <div className="space-y-6">
      {/* Power BI Primary DAX KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Clinic Revenue"
          value={`$${totalRevenue.toLocaleString()} CAD`}
          subValue="Past 12 Mo"
          changePercent={18.5}
          changeLabel="vs target"
          targetInfo="Goal: $50,000 CAD"
          color="olive"
          isDarkMode={isDarkMode}
          icon={<DollarSign className="w-4 h-4" />}
        />

        <KpiCard
          title="Partner Referral ROI"
          value={`+${partnerRoi.toFixed(0)}%`}
          subValue={`$${netPartnerRev.toLocaleString()} Net`}
          changePercent={24.2}
          changeLabel="high profitability"
          targetInfo="7 Active Partners"
          color="gold"
          isDarkMode={isDarkMode}
          icon={<Award className="w-4 h-4" />}
        />

        <KpiCard
          title="Blended CAC"
          value={`$${blendedCac.toFixed(2)} CAD`}
          subValue="Partner CAC: $37.50"
          changePercent={-14.8}
          changeLabel="CAC reduced"
          targetInfo="Benchmark: $100"
          color="olive"
          isDarkMode={isDarkMode}
          icon={<Target className="w-4 h-4" />}
        />

        <KpiCard
          title="LTV : CAC Multiplier"
          value={`${ltvCacRatio.toFixed(1)}x`}
          subValue={`Avg LTV: $${avgLtv.toFixed(0)}`}
          changePercent={12.0}
          changeLabel="World-class unit econ"
          targetInfo="Target: >4.0x"
          color="gold"
          isDarkMode={isDarkMode}
          icon={<TrendingUp className="w-4 h-4" />}
        />
      </div>

      {/* Second Row: Partner ROI & RFM Distribution Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Partner Channel Contribution */}
        <div
          className={`rounded-xl border p-5 shadow-sm flex flex-col justify-between transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif text-lg font-bold flex items-center gap-2">
                <Users className="w-4 h-4 text-[#686e4a]" />
                <span>Partner Referral Volume</span>
              </h4>
              <button
                onClick={() => onNavigateTab('partners')}
                className="text-xs text-[#686e4a] dark:text-[#c7ccaa] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Full Matrix</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p
              className={`text-xs mb-4 ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
              }`}
            >
              Referral partners generate{' '}
              <strong className={isDarkMode ? 'text-[#f9f8f5]' : 'text-[#100e0a]'}>
                ${partnerGross.toLocaleString()} CAD
              </strong>{' '}
              ({totalRevenue > 0 ? ((partnerGross / totalRevenue) * 100).toFixed(0) : 0}% of clinic bookings).
            </p>

            <div className="space-y-3">
              {referralPartners.slice(0, 4).map((p) => {
                const pct = partnerGross > 0 ? ((p.totalRevenueCAD / partnerGross) * 100).toFixed(0) : 0;
                return (
                  <div key={p.id} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium truncate max-w-[170px]">{p.name}</span>
                      <span className="font-mono text-[#686e4a] dark:text-[#aab187] font-semibold">
                        +{p.roiPercent.toFixed(0)}% ROI (${p.totalRevenueCAD})
                      </span>
                    </div>
                    <div
                      className={`w-full rounded-full h-2 overflow-hidden border ${
                        isDarkMode
                          ? 'bg-[#14160e] border-[#292e1e]'
                          : 'bg-[#f0ede6] border-[#e7e3da]'
                      }`}
                    >
                      <div
                        className="bg-[#686e4a] h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`mt-5 pt-3 border-t flex items-center justify-between text-xs ${
              isDarkMode
                ? 'border-[#24291c] text-[#8b927a]'
                : 'border-[#f0ede6] text-[#6e6856]'
            }`}
          >
            <span>Direct insurance claims billed:</span>
            <span className="font-mono font-bold text-[#686e4a] dark:text-[#aab187]">
              ${totalInsurance.toLocaleString()} CAD
            </span>
          </div>
        </div>

        {/* Card 2: RFM Customer Health Overview */}
        <div
          className={`rounded-xl border p-5 shadow-sm flex flex-col justify-between transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#e6b000]" />
                <span>RFM Customer Matrix Status</span>
              </h4>
              <button
                onClick={() => onNavigateTab('rfm')}
                className="text-xs text-[#686e4a] dark:text-[#c7ccaa] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Explore Matrix</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p
              className={`text-xs mb-4 ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
              }`}
            >
              Segmentation across Recency (days), Frequency (visits), and Monetary spend (CAD).
            </p>

            <div className="grid grid-cols-3 gap-2 text-center mb-4">
              <div
                className={`p-3 rounded-xl border ${
                  isDarkMode
                    ? 'bg-[#686e4a]/15 border-[#686e4a]/30'
                    : 'bg-[#edf0e6] border-[#bcc2a4]'
                }`}
              >
                <span className="text-[10px] text-[#52573a] dark:text-[#aab187] uppercase font-bold block">
                  Champions
                </span>
                <div className="text-xl font-bold font-serif text-[#686e4a] dark:text-[#c7ccaa] mt-1">
                  {championsCount}
                </div>
                <span className="text-[10px] opacity-75">High spend & recent</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isDarkMode
                    ? 'bg-[#e6b000]/15 border-[#e6b000]/30'
                    : 'bg-[#fff9e6] border-[#f4d068]'
                }`}
              >
                <span className="text-[10px] text-[#997500] dark:text-[#e6b000] uppercase font-bold block">
                  Loyalists
                </span>
                <div className="text-xl font-bold font-serif text-[#b88c00] dark:text-[#e6b000] mt-1">
                  {loyalCount}
                </div>
                <span className="text-[10px] opacity-75">Regular visits</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isDarkMode
                    ? 'bg-[#b84a36]/15 border-[#b84a36]/30'
                    : 'bg-[#faeee9] border-[#eec2b8]'
                }`}
              >
                <span className="text-[10px] text-[#b84a36] uppercase font-bold block">
                  At Risk
                </span>
                <div className="text-xl font-bold font-serif text-[#b84a36] dark:text-[#e8816f] mt-1">
                  {atRiskCount}
                </div>
                <span className="text-[10px] opacity-75">&gt;90d gap</span>
              </div>
            </div>

            <p
              className={`text-[11px] leading-relaxed p-2.5 rounded-lg border ${
                isDarkMode
                  ? 'bg-[#14160e] border-[#292e1e] text-[#a2a992]'
                  : 'bg-[#f9f8f5] border-[#e7e3da] text-[#554e38]'
              }`}
            >
              <strong className={isDarkMode ? 'text-[#f9f8f5]' : 'text-[#100e0a]'}>
                Retention Focus:{' '}
              </strong>
              {atRiskCount} valued patients haven't booked in &gt;90 days. Dedicated recall offers before year-end insurance expiration can recover ~$3,200 CAD.
            </p>
          </div>

          <div
            className={`mt-4 pt-3 border-t text-xs flex justify-between ${
              isDarkMode
                ? 'border-[#24291c] text-[#8b927a]'
                : 'border-[#f0ede6] text-[#6e6856]'
            }`}
          >
            <span>Total Tracked Patients:</span>
            <span className="font-mono font-bold">{customers.length}</span>
          </div>
        </div>

        {/* Card 3: CAC & Service Economics */}
        <div
          className={`rounded-xl border p-5 shadow-sm flex flex-col justify-between transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-serif text-lg font-bold flex items-center gap-2">
                <Target className="w-4 h-4 text-[#686e4a]" />
                <span>CAC & Service Profitability</span>
              </h4>
              <button
                onClick={() => onNavigateTab('cac')}
                className="text-xs text-[#686e4a] dark:text-[#c7ccaa] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>CAC Details</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <p
              className={`text-xs mb-4 ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
              }`}
            >
              Cost to acquire a new patient vs lifetime value at Wellthera Barrie.
            </p>

            <div
              className={`space-y-2.5 p-3 rounded-xl border text-xs font-mono ${
                isDarkMode
                  ? 'bg-[#14160e] border-[#292e1e]'
                  : 'bg-[#f9f8f5] border-[#e7e3da]'
              }`}
            >
              <div className="flex justify-between">
                <span className="font-sans opacity-75">Physio Referral CAC:</span>
                <span className="text-[#686e4a] dark:text-[#aab187] font-bold">$25.00 CAD</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans opacity-75">Crossfit Co-Marketing CAC:</span>
                <span className="text-[#686e4a] dark:text-[#aab187] font-bold">$87.50 CAD</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans opacity-75">Google Local Search Ads:</span>
                <span className="font-bold opacity-90">$92.86 CAD</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans opacity-75">Meta Instagram Ads:</span>
                <span className="font-bold opacity-90">$104.00 CAD</span>
              </div>
            </div>

            <div
              className={`mt-4 p-3 rounded-xl border text-xs ${
                isDarkMode
                  ? 'bg-[#686e4a]/10 border-[#686e4a]/30 text-[#e7e3da]'
                  : 'bg-[#edf0e6] border-[#bcc2a4] text-[#332e1e]'
              }`}
            >
              <div className="font-bold text-[#686e4a] dark:text-[#c7ccaa] mb-0.5">
                Signature Clinic Specialty:
              </div>
              <div>
                Authentic Brazilian Lymphatic Drainage (BLD) drives the highest lifetime retention and organic word-of-mouth.
              </div>
            </div>
          </div>

          <div
            className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
              isDarkMode ? 'border-[#24291c]' : 'border-[#f0ede6]'
            }`}
          >
            <button
              onClick={() => onNavigateTab('sheet')}
              className="text-[#686e4a] dark:text-[#c7ccaa] hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Manage Google Sheet Spreadsheet Data</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
