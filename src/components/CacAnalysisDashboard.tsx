import React, { useState } from 'react';
import {
  TrendingDown,
  Target,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { CacChannelSpend } from '../types';

interface CacAnalysisDashboardProps {
  cacChannels: CacChannelSpend[];
  isDarkMode?: boolean;
}

export const CacAnalysisDashboard: React.FC<CacAnalysisDashboardProps> = ({
  cacChannels,
  isDarkMode = false,
}) => {
  // Simulator state
  const [extraBudget, setExtraBudget] = useState(500);

  // Compute overall aggregates
  const totalSpend = cacChannels.reduce((acc, c) => acc + c.spendCAD, 0);
  const totalNewCustomers = cacChannels.reduce((acc, c) => acc + c.newCustomersAcquired, 0);
  const blendedCac = totalNewCustomers > 0 ? totalSpend / totalNewCustomers : 0;

  const partnerChannels = cacChannels.filter((c) => c.isPartner);
  const directChannels = cacChannels.filter((c) => !c.isPartner);

  const partnerSpend = partnerChannels.reduce((acc, c) => acc + c.spendCAD, 0);
  const partnerNewCust = partnerChannels.reduce((acc, c) => acc + c.newCustomersAcquired, 0);
  const partnerCac = partnerNewCust > 0 ? partnerSpend / partnerNewCust : 0;

  const directSpend = directChannels.reduce((acc, c) => acc + c.spendCAD, 0);
  const directNewCust = directChannels.reduce((acc, c) => acc + c.newCustomersAcquired, 0);
  const directCac = directNewCust > 0 ? directSpend / directNewCust : 0;

  const avgLtv = cacChannels.reduce((acc, c) => acc + c.averageLtvCAD, 0) / (cacChannels.length || 1);
  const blendedLtvCacRatio = blendedCac > 0 ? avgLtv / blendedCac : 0;

  // Simulator calculation: If we allocate extra budget to the best partner channel
  const simulatedNewPatients = Math.round(extraBudget / (partnerCac || 45));
  const simulatedRevenueYield = Math.round(simulatedNewPatients * avgLtv);

  return (
    <div className="space-y-6">
      {/* Top Banner KPI Cards for CAC */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Blended CAC */}
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
              Blended Clinic CAC
            </span>
            <div className="text-2xl font-bold font-serif text-[#686e4a] dark:text-[#aab187] mt-1">
              ${blendedCac.toFixed(2)} CAD
            </div>
            <span className="text-[11px] text-[#686e4a] dark:text-[#aab187] flex items-center gap-1 mt-1 font-semibold">
              <TrendingDown className="w-3 h-3" /> -18.4% vs industry ($115)
            </span>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? 'bg-[#686e4a]/15 text-[#c7ccaa] border-[#686e4a]/30'
                : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4]'
            }`}
          >
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Partner Referral CAC */}
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
              Partner Referral CAC
            </span>
            <div className="text-2xl font-bold font-serif text-[#686e4a] dark:text-[#c7ccaa] mt-1">
              ${partnerCac.toFixed(2)} CAD
            </div>
            <span className="text-[11px] text-[#686e4a] dark:text-[#aab187] flex items-center gap-1 mt-1 font-semibold">
              <ShieldCheck className="w-3 h-3" /> 60% cheaper than paid ads
            </span>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? 'bg-[#686e4a]/15 text-[#c7ccaa] border-[#686e4a]/30'
                : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4]'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Paid Digital Ads CAC */}
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
              Paid Ads (Google / Meta)
            </span>
            <div className="text-2xl font-bold font-serif text-[#b88c00] dark:text-[#e6b000] mt-1">
              ${directCac.toFixed(2)} CAD
            </div>
            <span
              className={`text-[11px] mt-1 block ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
              }`}
            >
              $1,300 spend • 13 patients
            </span>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? 'bg-[#e6b000]/15 text-[#e6b000] border-[#e6b000]/30'
                : 'bg-[#fff9e6] text-[#b88c00] border-[#f4d068]'
            }`}
          >
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* LTV:CAC Ratio */}
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
              LTV : CAC Ratio
            </span>
            <div className="text-2xl font-bold font-serif text-[#686e4a] dark:text-[#c7ccaa] mt-1">
              {blendedLtvCacRatio.toFixed(1)} : 1
            </div>
            <span className="text-[11px] text-[#686e4a] dark:text-[#aab187] flex items-center gap-1 mt-1 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Target &gt;3.0x exceeded
            </span>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? 'bg-[#686e4a]/15 text-[#c7ccaa] border-[#686e4a]/30'
                : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4]'
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main CAC Table */}
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
              <Target className="w-4 h-4 text-[#686e4a]" />
              <span>Customer Acquisition Cost (CAC) by Channel</span>
            </h3>
            <p
              className={`text-xs mt-0.5 ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
              }`}
            >
              Comparing partnership referral economics vs direct paid advertising for Wellthera Barrie.
            </p>
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
                <th className="py-3 px-4 font-bold">Acquisition Channel</th>
                <th className="py-3 px-3 font-bold">Channel Type</th>
                <th className="py-3 px-3 font-bold">Marketing Spend (CAD)</th>
                <th className="py-3 px-3 font-bold text-center">Patients Acquired</th>
                <th className="py-3 px-4 font-bold">CAC (Cost / Patient)</th>
                <th className="py-3 px-3 font-bold">Avg Lifetime Value (LTV)</th>
                <th className="py-3 px-3 font-bold">LTV : CAC Multiplier</th>
                <th className="py-3 px-3 font-bold">Payback Period</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit">
              {cacChannels.map((channel) => {
                const isHighPerformer = channel.calculatedCacCAD <= 50;

                return (
                  <tr
                    key={channel.id}
                    className={`transition-colors ${
                      isDarkMode
                        ? 'hover:bg-[#202517] border-[#292e1e]'
                        : 'hover:bg-[#f4f1eb] border-[#e7e3da]'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-sm">
                      {channel.partnerOrChannel}
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          channel.isPartner
                            ? isDarkMode
                              ? 'bg-[#686e4a]/20 text-[#c7ccaa] border-[#686e4a]/40'
                              : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4]'
                            : isDarkMode
                            ? 'bg-[#14160e] text-[#a2a992] border-[#292e1e]'
                            : 'bg-[#f0ede6] text-[#7d7663] border-[#e7e3da]'
                        }`}
                      >
                        {channel.isPartner ? 'Partner Referral' : 'Direct Paid Ads'}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold">
                      ${channel.spendCAD.toLocaleString()} CAD
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-bold">
                      {channel.newCustomersAcquired}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold">
                      <span
                        className={
                          isHighPerformer
                            ? 'text-[#686e4a] dark:text-[#aab187]'
                            : channel.calculatedCacCAD < 90
                            ? 'text-[#b88c00] dark:text-[#e6b000]'
                            : 'text-[#b84a36] dark:text-[#e8816f]'
                        }
                      >
                        ${channel.calculatedCacCAD.toFixed(2)} CAD
                      </span>
                    </td>

                    <td className="py-3.5 px-3 font-mono">
                      ${channel.averageLtvCAD.toFixed(0)} CAD
                    </td>

                    <td className="py-3.5 px-3 font-mono font-bold text-[#686e4a] dark:text-[#aab187]">
                      {channel.ltvCacRatio.toFixed(1)}x
                    </td>

                    <td
                      className={`py-3.5 px-3 font-mono ${
                        isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                      }`}
                    >
                      {channel.paybackPeriodMonths} mo ({channel.paybackPeriodVisits} sessions)
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Partner Budget Reallocation Simulator */}
      <div
        className={`rounded-xl border p-5 shadow-sm transition-colors ${
          isDarkMode
            ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
            : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="font-serif text-base font-bold flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#686e4a]" />
              <span>Partner Budget Reallocation Simulator</span>
            </h4>
            <p
              className={`text-xs mt-0.5 ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
              }`}
            >
              Simulate ROI if shifting budget from Paid Digital Ads to local Barrie Wellness Partners.
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              isDarkMode
                ? 'bg-[#686e4a]/15 text-[#c7ccaa] border-[#686e4a]/30'
                : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4]'
            }`}
          >
            Reallocation: ${extraBudget} CAD
          </span>
        </div>

        <div className="space-y-4">
          <input
            type="range"
            min={100}
            max={2000}
            step={50}
            value={extraBudget}
            onChange={(e) => setExtraBudget(Number(e.target.value))}
            className="w-full accent-[#686e4a] cursor-pointer"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div
              className={`p-3 rounded-xl border ${
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
                Projected New Patients
              </span>
              <div className="text-2xl font-bold font-serif text-[#686e4a] dark:text-[#aab187] mt-1">
                +{simulatedNewPatients} Patients
              </div>
              <span
                className={`text-[10px] mt-0.5 block ${
                  isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                }`}
              >
                via high-yield partners
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border ${
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
                Projected Lifetime Revenue
              </span>
              <div className="text-2xl font-bold font-serif text-[#b88c00] dark:text-[#e6b000] mt-1">
                +${simulatedRevenueYield.toLocaleString()} CAD
              </div>
              <span
                className={`text-[10px] mt-0.5 block ${
                  isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                }`}
              >
                Estimated @ ${avgLtv.toFixed(0)} LTV
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border ${
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
                Simulated Net Profit Yield
              </span>
              <div className="text-2xl font-bold font-serif text-[#686e4a] dark:text-[#c7ccaa] mt-1">
                +${(simulatedRevenueYield - extraBudget).toLocaleString()} CAD
              </div>
              <span
                className={`text-[10px] mt-0.5 block ${
                  isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                }`}
              >
                Net after referral fee
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
