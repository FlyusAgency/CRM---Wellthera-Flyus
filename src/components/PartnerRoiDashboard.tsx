import React, { useState } from 'react';
import {
  Users,
  Award,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  Percent,
  CheckCircle,
  ChevronRight,
  Sparkles,
  X,
  Plus,
} from 'lucide-react';
import { Partner, PartnerCategory, Customer, ServiceBooking } from '../types';

interface PartnerRoiDashboardProps {
  partners: Partner[];
  customers: Customer[];
  bookings: ServiceBooking[];
  onSelectPartnerFilter?: (partnerId: string) => void;
  onAddNewPartner?: (partner: Partner) => void;
  onOpenAddPartnerModal?: () => void;
  isDarkMode?: boolean;
}

const isNoPartnerChannel = (id?: string) =>
  !id || id === 'no-partner' || id === 'p-8' || id === 'direct';

export const PartnerRoiDashboard: React.FC<PartnerRoiDashboardProps> = ({
  partners,
  customers,
  bookings,
  onSelectPartnerFilter,
  onAddNewPartner,
  onOpenAddPartnerModal,
  isDarkMode = false,
}) => {
  const [selectedPartnerDetail, setSelectedPartnerDetail] = useState<Partner | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [createdBanner, setCreatedBanner] = useState<string | null>(null);

  // Add Partner Modal Form State
  const [partnerName, setPartnerName] = useState('');
  const [partnerCategory, setPartnerCategory] = useState<PartnerCategory>('Fitness & CrossFit');
  const [partnerContact, setPartnerContact] = useState('');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [partnerCommType, setPartnerCommType] = useState<Partner['commissionType']>('Percentage');
  const [partnerCommVal, setPartnerCommVal] = useState<number>(10);
  const [partnerRetainer, setPartnerRetainer] = useState<number>(0);

  const handleSubmitNewPartner = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = partnerName.trim();
    if (!trimmedName || !onAddNewPartner) return;

    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 20);
    const id = `p-${slug || 'partner'}-${Date.now().toString().slice(-4)}`;
    const autoCode =
      partnerCode.trim().toUpperCase() ||
      trimmedName
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 6)
        .toUpperCase() + '-REF';

    const newPartner: Partner = {
      id,
      name: trimmedName,
      category: partnerCategory,
      contactPerson: partnerContact.trim(),
      email: partnerEmail.trim(),
      phone: partnerPhone.trim(),
      commissionType: partnerCommType,
      commissionValue: Number.isFinite(Number(partnerCommVal)) ? Number(partnerCommVal) : 0,
      referralCode: autoCode,
      monthlyRetainerCAD: Number.isFinite(Number(partnerRetainer)) ? Number(partnerRetainer) : 0,
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

    onAddNewPartner(newPartner);
    setCreatedBanner(`Partner "${trimmedName}" added to the registry (Code: ${autoCode}).`);
    setPartnerName('');
    setPartnerContact('');
    setPartnerEmail('');
    setPartnerPhone('');
    setPartnerCode('');
    setPartnerCommVal(10);
    setPartnerRetainer(0);
    setIsAddModalOpen(false);
    setTimeout(() => setCreatedBanner(null), 6000);
  };

  // Filter out No partner / direct channel for partner-only ROI calculation
  const referralPartners = partners.filter((p) => !isNoPartnerChannel(p.id));

  // Compute aggregates
  const totalClinicGross = partners.reduce((acc, p) => acc + p.totalRevenueCAD, 0);
  const totalPartnerGross = referralPartners.reduce((acc, p) => acc + p.totalRevenueCAD, 0);
  const partnerShareOfClinic =
    totalClinicGross > 0 ? ((totalPartnerGross / totalClinicGross) * 100).toFixed(1) : '0.0';
  const totalPartnerCommissions = referralPartners.reduce((acc, p) => acc + p.totalCommissionPaidCAD, 0);
  const totalRetainers = referralPartners.reduce((acc, p) => acc + p.monthlyRetainerCAD * 6, 0);
  const totalPartnerCosts = totalPartnerCommissions + totalRetainers;
  const netPartnerRevenue = totalPartnerGross - totalPartnerCosts;
  const blendedRoi =
    totalPartnerCosts > 0
      ? (netPartnerRevenue / totalPartnerCosts) * 100
      : totalPartnerGross > 0
      ? 100
      : 0;
  const totalReferralPatients = referralPartners.reduce((acc, p) => acc + p.referredCustomersCount, 0);

  // Find top partner
  const topPartner = [...referralPartners].sort((a, b) => b.totalRevenueCAD - a.totalRevenueCAD)[0];
  const maxRevenue = Math.max(...partners.map((p) => p.totalRevenueCAD), 1);

  return (
    <div className="space-y-6">
      {createdBanner && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-semibold flex items-center justify-between gap-2 ${
            isDarkMode
              ? 'bg-[#686e4a]/20 border-[#686e4a]/40 text-[#c7ccaa]'
              : 'bg-[#edf0e6] border-[#bcc2a4] text-[#52573a]'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{createdBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setCreatedBanner(null)}
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {/* Top Section: Highlights & Quick DAX Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`rounded-xl border p-4 shadow-sm flex items-center justify-between transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider block font-sans ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
              }`}
            >
              Referred Partner Revenue
            </span>
            <div className="text-2xl font-bold font-serif mt-1">
              ${totalPartnerGross.toLocaleString('en-CA', { maximumFractionDigits: 0 })} CAD
            </div>
            <span className="text-[11px] text-[#686e4a] dark:text-[#aab187] flex items-center gap-1 mt-1 font-semibold">
              <TrendingUp className="w-3 h-3" /> {partnerShareOfClinic}% of clinic total ({totalReferralPatients} patients)
            </span>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? 'bg-[#686e4a]/15 text-[#c7ccaa] border-[#686e4a]/30'
                : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4]'
            }`}
          >
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`rounded-xl border p-4 shadow-sm flex items-center justify-between transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider block font-sans ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
              }`}
            >
              Partner Payouts & Costs
            </span>
            <div className="text-2xl font-bold font-serif text-[#b88c00] dark:text-[#e6b000] mt-1">
              ${totalPartnerCosts.toLocaleString('en-CA', { maximumFractionDigits: 0 })} CAD
            </div>
            <span
              className={`text-[11px] mt-1 block ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
              }`}
            >
              Commissions + Retainers
            </span>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? 'bg-[#e6b000]/15 text-[#e6b000] border-[#e6b000]/30'
                : 'bg-[#fff9e6] text-[#b88c00] border-[#f4d068]'
            }`}
          >
            <Percent className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`rounded-xl border p-4 shadow-sm flex items-center justify-between transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider block font-sans ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
              }`}
            >
              Blended Partner ROI
            </span>
            <div className="text-2xl font-bold font-serif text-[#686e4a] dark:text-[#c7ccaa] mt-1">
              +{blendedRoi.toFixed(1)}%
            </div>
            <span className="text-[11px] text-[#686e4a] dark:text-[#aab187] flex items-center gap-1 mt-1 font-semibold">
              <ArrowUpRight className="w-3 h-3" /> $
              {(netPartnerRevenue / (totalPartnerCosts || 1)).toFixed(1)}x return on cost
            </span>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? 'bg-[#686e4a]/15 text-[#c7ccaa] border-[#686e4a]/30'
                : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4]'
            }`}
          >
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div
          className={`rounded-xl border p-4 shadow-sm flex items-center justify-between transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div>
            <span
              className={`text-[11px] font-bold uppercase tracking-wider block font-sans ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
              }`}
            >
              Highest ROI Partner
            </span>
            <div className="text-base font-bold mt-1 truncate max-w-[170px]" title={topPartner?.name}>
              {topPartner?.name || 'N/A'}
            </div>
            <span className="text-[11px] text-[#686e4a] dark:text-[#aab187] font-semibold mt-1 block">
              +{topPartner?.roiPercent.toFixed(1)}% ROI ({topPartner?.category})
            </span>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? 'bg-[#e6b000]/15 text-[#e6b000] border-[#e6b000]/30'
                : 'bg-[#fff9e6] text-[#b88c00] border-[#f4d068]'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Power BI Matrix / Table */}
      <div
        className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${
          isDarkMode
            ? 'bg-[#1a1e13] border-[#292e1e]'
            : 'bg-[#ffffff] border-[#e7e3da]'
        }`}
      >
        <div
          className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
            isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f0ede6] border-[#e7e3da]'
          }`}
        >
          <div>
            <h3 className="font-serif text-lg font-bold flex items-center gap-2">
              <span>Partner Performance & ROI Matrix</span>
              <span
                className={`text-xs font-sans font-normal ${
                  isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
                }`}
              >
                (Power BI Conditional Formatting & Data Bars)
              </span>
            </h3>
            <p
              className={`text-xs mt-0.5 ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
              }`}
            >
              Tracking patient acquisition, referral commissions, net clinic yield, and return on investment.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(onAddNewPartner || onOpenAddPartnerModal) && (
              <button
                type="button"
                onClick={() => {
                  if (onAddNewPartner) {
                    setIsAddModalOpen(true);
                  } else if (onOpenAddPartnerModal) {
                    onOpenAddPartnerModal();
                  }
                }}
                className="px-3.5 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-semibold text-xs rounded-full transition-colors shadow-sm flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Partner</span>
              </button>
            )}
          </div>
        </div>

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
                <th className="py-3 px-4 font-bold">Partner / Organization</th>
                <th className="py-3 px-3 font-bold">Category</th>
                <th className="py-3 px-3 font-bold text-center">Patients</th>
                <th className="py-3 px-3 font-bold text-center">Bookings</th>
                <th className="py-3 px-4 font-bold">Gross Revenue</th>
                <th className="py-3 px-3 font-bold">Commission / Fee</th>
                <th className="py-3 px-4 font-bold">Net Clinic Margin</th>
                <th className="py-3 px-4 font-bold">ROI Metric</th>
                <th className="py-3 px-3 font-bold text-center">Status</th>
                <th className="py-3 px-3 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit">
              {partners.map((partner) => {
                const isOrganic = isNoPartnerChannel(partner.id);
                const revenueBarPercent = ((partner.totalRevenueCAD / maxRevenue) * 100).toFixed(0);

                return (
                  <tr
                    key={partner.id}
                    className={`transition-colors ${
                      isDarkMode
                        ? 'hover:bg-[#202517] border-[#292e1e]'
                        : 'hover:bg-[#f4f1eb] border-[#e7e3da]'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-sm">{partner.name}</div>
                      <div
                        className={`text-[11px] font-mono ${
                          isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                        }`}
                      >
                        Code: {partner.referralCode || `REF-${partner.id.toUpperCase()}`}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          isDarkMode
                            ? 'bg-[#14160e] text-[#c2c8b0] border-[#292e1e]'
                            : 'bg-[#f0ede6] text-[#554e38] border-[#e7e3da]'
                        }`}
                      >
                        {partner.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center font-bold">
                      {partner.referredCustomersCount}
                    </td>

                    <td className="py-3.5 px-3 text-center opacity-80">
                      {partner.totalBookingsCount}
                    </td>

                    {/* Gross Revenue with Power BI Data Bar */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold font-mono">
                        ${partner.totalRevenueCAD.toLocaleString()} CAD
                      </div>
                      <div
                        className={`w-28 rounded-full h-1.5 mt-1 overflow-hidden border ${
                          isDarkMode
                            ? 'bg-[#14160e] border-[#292e1e]'
                            : 'bg-[#f0ede6] border-[#e7e3da]'
                        }`}
                      >
                        <div
                          className="bg-[#686e4a] h-1.5 rounded-full"
                          style={{ width: `${revenueBarPercent}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-3 font-mono">
                      <div>${partner.totalCommissionPaidCAD.toLocaleString()}</div>
                      {partner.monthlyRetainerCAD > 0 && (
                        <div
                          className={`text-[10px] ${
                            isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                          }`}
                        >
                          +${partner.monthlyRetainerCAD}/mo retain
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-[#686e4a] dark:text-[#aab187]">
                      ${partner.netRevenueCAD.toLocaleString()} CAD
                    </td>

                    {/* ROI Badge */}
                    <td className="py-3.5 px-4">
                      {isOrganic ? (
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                            isDarkMode
                              ? 'bg-[#14160e] text-[#8b927a] border-[#292e1e]'
                              : 'bg-[#f0ede6] text-[#7d7663] border-[#e7e3da]'
                          }`}
                        >
                          Baseline (Organic)
                        </span>
                      ) : partner.roiPercent >= 400 ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#edf0e6] dark:bg-[#686e4a]/20 text-[#52573a] dark:text-[#c7ccaa] border border-[#bcc2a4] dark:border-[#686e4a]/40 inline-flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-[#686e4a]" />
                          +{partner.roiPercent.toFixed(0)}% ROI
                        </span>
                      ) : partner.roiPercent >= 200 ? (
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#fff9e6] dark:bg-[#e6b000]/15 text-[#997500] dark:text-[#e6b000] border border-[#f4d068] dark:border-[#e6b000]/40 inline-flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-[#e6b000]" />
                          +{partner.roiPercent.toFixed(0)}% ROI
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#faeee9] dark:bg-[#b84a36]/15 text-[#b84a36] dark:text-[#e8816f] border border-[#eec2b8] dark:border-[#b84a36]/40">
                          +{partner.roiPercent.toFixed(0)}% ROI
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          partner.status === 'Active' ? 'bg-[#686e4a]' : 'bg-[#e6b000]'
                        }`}
                        title={partner.status}
                      />
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedPartnerDetail(partner)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isDarkMode
                            ? 'bg-[#14160e] border-[#292e1e] text-[#c2c8b0] hover:bg-[#202517]'
                            : 'bg-[#f0ede6] border-[#e7e3da] text-[#554e38] hover:bg-[#e7e3da]'
                        }`}
                        title="View referred patients drill-down"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Analytics: Partner Revenue vs Commission Waterfall Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className={`rounded-xl border p-5 shadow-sm transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-serif text-base font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-[#686e4a]" />
              <span>Gross Patient Revenue by Partner</span>
            </h4>
            <span
              className={`text-xs ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
              }`}
            >
              CAD Volume
            </span>
          </div>

          <div className="space-y-3.5">
            {referralPartners.map((partner) => {
              const widthPct = ((partner.totalRevenueCAD / maxRevenue) * 100).toFixed(0);
              return (
                <div key={partner.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium truncate max-w-[200px]">{partner.name}</span>
                    <span className="font-mono font-bold">${partner.totalRevenueCAD.toLocaleString()} CAD</span>
                  </div>
                  <div
                    className={`w-full rounded-full h-3 overflow-hidden border ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e]'
                        : 'bg-[#f0ede6] border-[#e7e3da]'
                    }`}
                  >
                    <div
                      className="bg-[#686e4a] h-3 rounded-full transition-all flex items-center justify-end pr-2 text-[9px] font-bold text-white"
                      style={{ width: `${widthPct}%` }}
                    >
                      {Number(widthPct) > 20 ? `${widthPct}%` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Clinic Margin Retention Stacked Chart */}
        <div
          className={`rounded-xl border p-5 shadow-sm transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-serif text-base font-bold flex items-center gap-2">
              <Percent className="w-4 h-4 text-[#686e4a]" />
              <span>Revenue Retention vs Partner Payout</span>
            </h4>
            <span
              className={`text-xs ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
              }`}
            >
              Profitability
            </span>
          </div>

          <div className="space-y-3.5">
            {referralPartners.map((partner) => {
              const totalCost = partner.totalCommissionPaidCAD + partner.monthlyRetainerCAD * 6;
              const netPct =
                partner.totalRevenueCAD > 0
                  ? ((partner.netRevenueCAD / partner.totalRevenueCAD) * 100).toFixed(0)
                  : '100';
              const commPct =
                partner.totalRevenueCAD > 0
                  ? ((totalCost / partner.totalRevenueCAD) * 100).toFixed(0)
                  : '0';

              return (
                <div key={partner.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium truncate max-w-[200px]">{partner.name}</span>
                    <span className="font-mono text-[11px] text-[#686e4a] dark:text-[#aab187] font-semibold">
                      {netPct}% Net Margin
                    </span>
                  </div>
                  <div
                    className={`w-full rounded-full h-3 overflow-hidden flex border ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e]'
                        : 'bg-[#f0ede6] border-[#e7e3da]'
                    }`}
                  >
                    <div
                      className="bg-[#686e4a] text-[9px] font-bold text-white flex items-center justify-center transition-all"
                      style={{ width: `${netPct}%` }}
                      title={`Net Clinic Revenue: ${netPct}%`}
                    >
                      {Number(netPct) > 30 ? `${netPct}% Net` : ''}
                    </div>
                    <div
                      className="bg-[#e6b000] text-[9px] font-bold text-[#14160e] flex items-center justify-center transition-all"
                      style={{ width: `${commPct}%` }}
                      title={`Partner Payout: ${commPct}%`}
                    >
                      {Number(commPct) > 15 ? `${commPct}% Payout` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className={`flex items-center justify-center gap-6 mt-6 pt-4 border-t text-xs ${
              isDarkMode
                ? 'border-[#24291c] text-[#8b927a]'
                : 'border-[#f0ede6] text-[#6e6856]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#686e4a]" />
              <span>Net Clinic Retention</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-[#e6b000]" />
              <span>Partner Payout / Commission</span>
            </div>
          </div>
        </div>
      </div>

      {/* Drill-Down Modal for Selected Partner */}
      {selectedPartnerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto border ${
              isDarkMode
                ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
            }`}
          >
            <div
              className={`flex items-start justify-between border-b pb-4 mb-4 ${
                isDarkMode ? 'border-[#24291c]' : 'border-[#e7e3da]'
              }`}
            >
              <div>
                <span className="text-xs uppercase font-bold text-[#686e4a] dark:text-[#c7ccaa] tracking-wider">
                  {selectedPartnerDetail.category} Partner Drill-Down
                </span>
                <h3 className="font-serif text-2xl font-bold mt-0.5">
                  {selectedPartnerDetail.name}
                </h3>
                <p
                  className={`text-xs mt-1 ${
                    isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
                  }`}
                >
                  Contact: {selectedPartnerDetail.contactPerson} ({selectedPartnerDetail.email}) • {selectedPartnerDetail.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedPartnerDetail(null)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#a2a992] hover:text-white'
                    : 'bg-[#f0ede6] border-[#e7e3da] text-[#6e6856] hover:text-[#100e0a]'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Partner Quick Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div
                className={`p-3 rounded-xl border text-center ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e]'
                    : 'bg-[#f9f8f5] border-[#e7e3da]'
                }`}
              >
                <span
                  className={`text-[10px] uppercase font-bold block ${
                    isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                  }`}
                >
                  Total Revenue
                </span>
                <div className="text-lg font-bold font-serif mt-0.5">
                  ${selectedPartnerDetail.totalRevenueCAD.toLocaleString()} CAD
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border text-center ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e]'
                    : 'bg-[#f9f8f5] border-[#e7e3da]'
                }`}
              >
                <span
                  className={`text-[10px] uppercase font-bold block ${
                    isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                  }`}
                >
                  Commissions Paid
                </span>
                <div className="text-lg font-bold font-serif text-[#b88c00] dark:text-[#e6b000] mt-0.5">
                  ${selectedPartnerDetail.totalCommissionPaidCAD.toLocaleString()} CAD
                </div>
              </div>
              <div
                className={`p-3 rounded-xl border text-center ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e]'
                    : 'bg-[#f9f8f5] border-[#e7e3da]'
                }`}
              >
                <span
                  className={`text-[10px] uppercase font-bold block ${
                    isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                  }`}
                >
                  ROI Multiplier
                </span>
                <div className="text-lg font-bold font-serif text-[#686e4a] dark:text-[#c7ccaa] mt-0.5">
                  +{selectedPartnerDetail.roiPercent.toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Referred Customer Roster */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-2 font-serif">
                Referred Patients ({customers.filter((c) => c.partnerId === selectedPartnerDetail.id).length})
              </h4>
              <div className="space-y-2">
                {customers
                  .filter((c) => c.partnerId === selectedPartnerDetail.id)
                  .map((customer) => (
                    <div
                      key={customer.id}
                      className={`p-3 rounded-lg border flex items-center justify-between text-xs ${
                        isDarkMode
                          ? 'bg-[#14160e] border-[#292e1e]'
                          : 'bg-[#f9f8f5] border-[#e7e3da]'
                      }`}
                    >
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          <span>{customer.name}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                              isDarkMode
                                ? 'bg-[#1c2015] text-[#c7ccaa] border-[#292e1e]'
                                : 'bg-[#f0ede6] text-[#52573a] border-[#e7e3da]'
                            }`}
                          >
                            {customer.referralCode}
                          </span>
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 ${
                            isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                          }`}
                        >
                          {customer.preferredService} • {customer.totalVisits} visits • Insurer: {customer.insuranceProvider}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="font-bold text-[#686e4a] dark:text-[#aab187]">
                          ${customer.totalSpendCAD} CAD
                        </div>
                        <span
                          className={`text-[10px] ${
                            isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                          }`}
                        >
                          RFM: {customer.rfmSegment}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div
              className={`mt-6 pt-4 border-t flex justify-end ${
                isDarkMode ? 'border-[#24291c]' : 'border-[#e7e3da]'
              }`}
            >
              <button
                onClick={() => setSelectedPartnerDetail(null)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-[#14160e] text-[#f9f8f5] border-[#292e1e] hover:bg-[#202517]'
                    : 'bg-[#f0ede6] text-[#332e1e] border-[#e7e3da] hover:bg-[#e7e3da]'
                }`}
              >
                Close Drill-Down
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Partner Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`rounded-2xl max-w-lg w-full p-6 shadow-2xl border max-h-[90vh] overflow-y-auto ${
              isDarkMode
                ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit mb-4">
              <div>
                <h3 className="font-serif text-xl font-bold">Add Partner or Acquisition Channel</h3>
                <p className="text-xs opacity-70 mt-0.5">
                  Register a new referral partner or marketing channel to track patients and ROI.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg opacity-70 hover:opacity-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewPartner} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold opacity-80">
                  Partner / Channel Name *
                </label>
                <input
                  type="text"
                  required
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="e.g. Barrie Wellness Studio, TikTok Ads, Dr. Smith Clinic"
                  className={`w-full rounded-lg p-2.5 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold opacity-80">Category *</label>
                  <select
                    value={partnerCategory}
                    onChange={(e) => setPartnerCategory(e.target.value as PartnerCategory)}
                    className={`w-full rounded-lg p-2.5 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
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
                    <option value="Clinic Referral Partner">Clinic Referral Partner</option>
                    <option value="Client Referral">Client Referral</option>
                    <option value="Paid Social (Meta)">Paid Social (Meta)</option>
                    <option value="Paid & Organic Search (Google)">Paid & Organic Search (Google)</option>
                    <option value="Direct / No Partner">Direct / No Partner</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-semibold opacity-80">Referral Code</label>
                  <input
                    type="text"
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value)}
                    placeholder="Auto-generated if empty"
                    className={`w-full rounded-lg p-2.5 border uppercase font-mono focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold opacity-80">Contact Person</label>
                  <input
                    type="text"
                    value={partnerContact}
                    onChange={(e) => setPartnerContact(e.target.value)}
                    placeholder="e.g. Clinic Manager"
                    className={`w-full rounded-lg p-2.5 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-80">Contact Email</label>
                  <input
                    type="email"
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="partner@domain.ca"
                    className={`w-full rounded-lg p-2.5 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 font-semibold opacity-80">Commission Type</label>
                  <select
                    value={partnerCommType}
                    onChange={(e) => setPartnerCommType(e.target.value as Partner['commissionType'])}
                    className={`w-full rounded-lg p-2.5 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  >
                    <option value="Percentage">Percentage (%)</option>
                    <option value="FlatPerBooking">Flat per Booking ($)</option>
                    <option value="CoMarketingRetainer">Retainer / Ad Channel</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-80">
                    {partnerCommType === 'FlatPerBooking' ? 'Flat Fee (CAD)' : 'Rate (%)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={partnerCommVal}
                    onChange={(e) => setPartnerCommVal(Number(e.target.value))}
                    className={`w-full rounded-lg p-2.5 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-80">Monthly Retainer ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    value={partnerRetainer}
                    onChange={(e) => setPartnerRetainer(Number(e.target.value))}
                    className={`w-full rounded-lg p-2.5 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-80">Phone (Optional)</label>
                <input
                  type="text"
                  value={partnerPhone}
                  onChange={(e) => setPartnerPhone(e.target.value)}
                  placeholder="(705) 555-0100"
                  className={`w-full rounded-lg p-2.5 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div
                className={`mt-5 pt-4 border-t flex justify-end gap-2 ${
                  isDarkMode ? 'border-[#24291c]' : 'border-[#e7e3da]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className={`px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#a2a992]'
                      : 'bg-[#f0ede6] border-[#e7e3da] text-[#554e38]'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Create Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
