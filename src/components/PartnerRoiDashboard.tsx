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
} from 'lucide-react';
import { Partner, Customer, ServiceBooking } from '../types';

interface PartnerRoiDashboardProps {
  partners: Partner[];
  customers: Customer[];
  bookings: ServiceBooking[];
  onSelectPartnerFilter?: (partnerId: string) => void;
  onOpenAddPartnerModal?: () => void;
  isDarkMode?: boolean;
}

export const PartnerRoiDashboard: React.FC<PartnerRoiDashboardProps> = ({
  partners,
  customers,
  bookings,
  onSelectPartnerFilter,
  onOpenAddPartnerModal,
  isDarkMode = false,
}) => {
  const [selectedPartnerDetail, setSelectedPartnerDetail] = useState<Partner | null>(null);

  // Filter out the organic benchmark for partner-only ROI calculation
  const referralPartners = partners.filter((p) => p.id !== 'p-8');

  // Compute aggregates
  const totalPartnerGross = referralPartners.reduce((acc, p) => acc + p.totalRevenueCAD, 0);
  const totalPartnerCommissions = referralPartners.reduce((acc, p) => acc + p.totalCommissionPaidCAD, 0);
  const totalRetainers = referralPartners.reduce((acc, p) => acc + p.monthlyRetainerCAD * 6, 0);
  const totalPartnerCosts = totalPartnerCommissions + totalRetainers;
  const netPartnerRevenue = totalPartnerGross - totalPartnerCosts;
  const blendedRoi = totalPartnerCosts > 0 ? (netPartnerRevenue / totalPartnerCosts) * 100 : 0;
  const totalReferralPatients = referralPartners.reduce((acc, p) => acc + p.referredCustomersCount, 0);

  // Find top partner
  const topPartner = [...referralPartners].sort((a, b) => b.roiPercent - a.roiPercent)[0];
  const maxRevenue = Math.max(...referralPartners.map((p) => p.totalRevenueCAD), 1);

  return (
    <div className="space-y-6">
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
              <TrendingUp className="w-3 h-3" /> 74.2% of clinic total
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
            {onOpenAddPartnerModal && (
              <button
                onClick={onOpenAddPartnerModal}
                className="px-3.5 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-semibold text-xs rounded-full transition-colors shadow-sm"
              >
                + Add Partner
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
                const totalCost = partner.totalCommissionPaidCAD + partner.monthlyRetainerCAD * 6;
                const isOrganic = partner.id === 'p-8';
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
              const netPct = ((partner.netRevenueCAD / partner.totalRevenueCAD) * 100).toFixed(0);
              const commPct = ((totalCost / partner.totalRevenueCAD) * 100).toFixed(0);

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
    </div>
  );
};
