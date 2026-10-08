import React from 'react';
import {
  Layers,
  ShieldCheck,
  CreditCard,
  UserCheck,
  TrendingUp,
} from 'lucide-react';
import { ServiceBooking, ServiceCategory } from '../types';

interface ServicesBreakdownDashboardProps {
  bookings: ServiceBooking[];
  isDarkMode?: boolean;
}

export const ServicesBreakdownDashboard: React.FC<ServicesBreakdownDashboardProps> = ({
  bookings,
  isDarkMode = false,
}) => {
  // Aggregate stats per service category
  const categories: ServiceCategory[] = [
    'Brazilian Lymphatic Drainage',
    'Registered Massage Therapy',
    'Acupuncture',
    'Nurse-Led Injectables',
    'Psychotherapy',
  ];

  const serviceStats = categories.map((cat) => {
    const list = bookings.filter((b) => b.serviceCategory === cat);
    const totalRev = list.reduce((acc, b) => acc + b.priceCAD, 0);
    const insuranceRev = list.reduce((acc, b) => acc + b.insuranceBilledCAD, 0);
    const patientRev = list.reduce((acc, b) => acc + b.patientPaidCAD, 0);
    const avgTicket = list.length > 0 ? totalRev / list.length : 0;

    // Dominant partner
    const partnerCounts: Record<string, number> = {};
    list.forEach((b) => {
      partnerCounts[b.partnerName] = (partnerCounts[b.partnerName] || 0) + 1;
    });
    const topPartner = Object.entries(partnerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Direct';

    return {
      category: cat,
      bookingCount: list.length,
      totalRevenueCAD: totalRev,
      insuranceBilledCAD: insuranceRev,
      patientPaidCAD: patientRev,
      averageTicketCAD: avgTicket,
      topPartner,
      insuranceSharePct: totalRev > 0 ? ((insuranceRev / totalRev) * 100).toFixed(0) : '0',
    };
  });

  const grandTotalRevenue = bookings.reduce((acc, b) => acc + b.priceCAD, 0);
  const totalInsuranceBilled = bookings.reduce((acc, b) => acc + b.insuranceBilledCAD, 0);
  const totalPatientPaid = bookings.reduce((acc, b) => acc + b.patientPaidCAD, 0);

  // Therapist breakdown
  const therapistCounts: Record<string, { count: number; rev: number; specialty: string }> = {};
  bookings.forEach((b) => {
    if (!therapistCounts[b.therapist]) {
      therapistCounts[b.therapist] = { count: 0, rev: 0, specialty: b.serviceCategory };
    }
    therapistCounts[b.therapist].count += 1;
    therapistCounts[b.therapist].rev += b.priceCAD;
  });

  return (
    <div className="space-y-6">
      {/* Top Level Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              Direct Insurance Billed
            </span>
            <div className="text-2xl font-bold font-serif text-[#686e4a] dark:text-[#aab187] mt-1">
              ${totalInsuranceBilled.toLocaleString()} CAD
            </div>
            <span
              className={`text-[11px] mt-1 block ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
              }`}
            >
              {grandTotalRevenue > 0
                ? ((totalInsuranceBilled / grandTotalRevenue) * 100).toFixed(1)
                : '0'}
              % of total bookings
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
              Patient Copay / Self-Pay
            </span>
            <div className="text-2xl font-bold font-serif text-[#b88c00] dark:text-[#e6b000] mt-1">
              ${totalPatientPaid.toLocaleString()} CAD
            </div>
            <span
              className={`text-[11px] mt-1 block ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
              }`}
            >
              Cash & Credit Card Copay
            </span>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? 'bg-[#e6b000]/15 text-[#e6b000] border-[#e6b000]/30'
                : 'bg-[#fff9e6] text-[#b88c00] border-[#f4d068]'
            }`}
          >
            <CreditCard className="w-5 h-5" />
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
              Completed Appointments
            </span>
            <div className="text-2xl font-bold font-serif mt-1">
              {bookings.length} Sessions
            </div>
            <span
              className={`text-[11px] mt-1 block ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
              }`}
            >
              Avg ticket: ${bookings.length > 0 ? (grandTotalRevenue / bookings.length).toFixed(0) : '0'} CAD
            </span>
          </div>
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? 'bg-[#1c2015] text-[#e7e3da] border-[#292e1e]'
                : 'bg-[#f0ede6] text-[#332e1e] border-[#e7e3da]'
            }`}
          >
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Primary Services Table */}
      <div
        className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${
          isDarkMode
            ? 'bg-[#1a1e13] border-[#292e1e]'
            : 'bg-[#ffffff] border-[#e7e3da]'
        }`}
      >
        <div
          className={`p-4 border-b ${
            isDarkMode ? 'bg-[#14160e] border-[#292e1e]' : 'bg-[#f0ede6] border-[#e7e3da]'
          }`}
        >
          <h3 className="font-serif text-lg font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#686e4a]" />
            <span>Wellthera Clinical Services Breakdown</span>
          </h3>
          <p
            className={`text-xs mt-0.5 ${
              isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
            }`}
          >
            Revenue volume, average ticket, direct insurance billing ratio, and lead referral channel.
          </p>
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
                <th className="py-3 px-4 font-bold">Service Category</th>
                <th className="py-3 px-3 font-bold text-center">Bookings</th>
                <th className="py-3 px-4 font-bold">Total Revenue (CAD)</th>
                <th className="py-3 px-3 font-bold">Avg Ticket</th>
                <th className="py-3 px-4 font-bold">Direct Billing vs Cash</th>
                <th className="py-3 px-3 font-bold">Top Partner Channel</th>
                <th className="py-3 px-3 text-right font-bold">Revenue Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit">
              {serviceStats.map((item) => {
                const sharePct =
                  grandTotalRevenue > 0
                    ? ((item.totalRevenueCAD / grandTotalRevenue) * 100).toFixed(1)
                    : '0';

                return (
                  <tr
                    key={item.category}
                    className={`transition-colors ${
                      isDarkMode
                        ? 'hover:bg-[#202517] border-[#292e1e]'
                        : 'hover:bg-[#f4f1eb] border-[#e7e3da]'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-medium flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#686e4a] shrink-0" />
                      <div>
                        <span className="font-semibold text-sm">{item.category}</span>
                        {item.category.includes('Lymphatic') && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-[#edf0e6] dark:bg-[#686e4a]/20 text-[#52573a] dark:text-[#c7ccaa] text-[10px] font-bold border border-[#bcc2a4] dark:border-[#686e4a]/40">
                            Signature
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center font-mono font-bold">
                      {item.bookingCount}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold">
                      ${item.totalRevenueCAD.toLocaleString()} CAD
                    </td>

                    <td
                      className={`py-3.5 px-3 font-mono ${
                        isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                      }`}
                    >
                      ${item.averageTicketCAD.toFixed(0)} CAD
                    </td>

                    {/* Insured vs Out-of-pocket Bar */}
                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="flex items-center justify-between text-[11px] mb-1 font-mono">
                        <span className="text-[#686e4a] dark:text-[#aab187] font-semibold">
                          Insured: {item.insuranceSharePct}%
                        </span>
                        <span className="text-[#b88c00] dark:text-[#e6b000] font-semibold">
                          Cash: {100 - Number(item.insuranceSharePct)}%
                        </span>
                      </div>
                      <div
                        className={`w-full rounded-full h-2 flex overflow-hidden border ${
                          isDarkMode
                            ? 'bg-[#14160e] border-[#292e1e]'
                            : 'bg-[#f0ede6] border-[#e7e3da]'
                        }`}
                      >
                        <div
                          className="bg-[#686e4a] h-2 transition-all"
                          style={{ width: `${item.insuranceSharePct}%` }}
                        />
                        <div
                          className="bg-[#e6b000] h-2 transition-all"
                          style={{ width: `${100 - Number(item.insuranceSharePct)}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                          isDarkMode
                            ? 'bg-[#14160e] text-[#c7ccaa] border-[#292e1e]'
                            : 'bg-[#f0ede6] text-[#52573a] border-[#e7e3da]'
                        }`}
                      >
                        {item.topPartner}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono font-bold text-[#686e4a] dark:text-[#aab187]">
                      {sharePct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Analytics Grid: Service Share Visual & Clinician Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual 1: Service Revenue Distribution */}
        <div
          className={`rounded-xl border p-5 shadow-sm transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <h4 className="font-serif text-base font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#686e4a]" />
            <span>Service Revenue Proportions</span>
          </h4>

          <div className="space-y-4">
            {serviceStats.map((item) => {
              const maxCatRev = Math.max(...serviceStats.map((s) => s.totalRevenueCAD), 1);
              const barWidth = ((item.totalRevenueCAD / maxCatRev) * 100).toFixed(0);

              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{item.category}</span>
                    <span className="font-mono font-bold">
                      ${item.totalRevenueCAD.toLocaleString()} CAD ({item.bookingCount} sessions)
                    </span>
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
                      style={{ width: `${barWidth}%` }}
                    >
                      {Number(barWidth) > 18 ? `${barWidth}%` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual 2: Clinician Delivery Roster */}
        <div
          className={`rounded-xl border p-5 shadow-sm transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <h4 className="font-serif text-base font-bold mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#686e4a]" />
            <span>Clinicians & Delivery Capacity (Barrie Clinic)</span>
          </h4>

          <div className="space-y-3">
            {Object.entries(therapistCounts).map(([therapist, data]) => (
              <div
                key={therapist}
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e]'
                    : 'bg-[#f9f8f5] border-[#e7e3da]'
                }`}
              >
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2">
                    <span>{therapist}</span>
                    {therapist.includes('Camila') && (
                      <span className="px-2 py-0.5 rounded-full bg-[#edf0e6] dark:bg-[#686e4a]/20 text-[#52573a] dark:text-[#c7ccaa] text-[10px] font-bold border border-[#bcc2a4] dark:border-[#686e4a]/40">
                        Founder & Master RMT
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 ${
                      isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                    }`}
                  >
                    Primary: {data.specialty}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="font-bold text-[#686e4a] dark:text-[#aab187]">
                    ${data.rev.toLocaleString()} CAD
                  </div>
                  <div
                    className={`text-[10px] ${
                      isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                    }`}
                  >
                    {data.count} Sessions Delivered
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
