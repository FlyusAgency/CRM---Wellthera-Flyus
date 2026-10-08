import React, { useState } from 'react';
import {
  Flame,
  Heart,
  UserCheck,
  AlertOctagon,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Send,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { Customer, RfmSegment } from '../types';

interface RfmMatrixDashboardProps {
  customers: Customer[];
  onFilterBySegment?: (segment: RfmSegment) => void;
  isDarkMode?: boolean;
}

const SEGMENT_DEFINITIONS: Record<
  RfmSegment,
  {
    title: string;
    description: string;
    actionStrategy: string;
    badgeColor: string;
    bgAccent: string;
    borderAccent: string;
    icon: React.ReactNode;
  }
> = {
  Champions: {
    title: 'Champions',
    description: 'Book frequently, recent visits, and highest lifetime spend on Brazilian Lymphatic Drainage & Injectables.',
    actionStrategy: 'Reward with VIP concierge perks, priority weekend bookings, and founder appreciation gifts.',
    badgeColor: 'bg-[#edf0e6] dark:bg-[#686e4a]/20 text-[#52573a] dark:text-[#c7ccaa] border-[#bcc2a4]',
    bgAccent: 'bg-[#edf0e6] dark:bg-[#686e4a]/10',
    borderAccent: 'border-[#686e4a]',
    icon: <Flame className="w-4 h-4 text-[#686e4a]" />,
  },
  'Loyal Customers': {
    title: 'Loyal Customers',
    description: 'Consistently book monthly RMT, Lymphatic Drainage, or Acupuncture. Responsive to direct billing.',
    actionStrategy: 'Upsell Brazilian Drainage 5-session package; encourage booking re-occurrence during insurer cycle.',
    badgeColor: 'bg-[#fff9e6] dark:bg-[#e6b000]/15 text-[#997500] dark:text-[#e6b000] border-[#f4d068]',
    bgAccent: 'bg-[#fff9e6] dark:bg-[#e6b000]/10',
    borderAccent: 'border-[#e6b000]',
    icon: <Heart className="w-4 h-4 text-[#e6b000]" />,
  },
  'Potential Loyalists': {
    title: 'Potential Loyalists',
    description: 'Recent new patients referred by partners (Lakeview Physio, Crossfit Apex) with multiple bookings.',
    actionStrategy: 'Offer cross-service discovery voucher (e.g., try Acupuncture or Facial MLD after RMT).',
    badgeColor: 'bg-[#edf0e6] dark:bg-[#686e4a]/15 text-[#686e4a] dark:text-[#c7ccaa] border-[#bcc2a4]',
    bgAccent: 'bg-[#edf0e6] dark:bg-[#686e4a]/10',
    borderAccent: 'border-[#bcc2a4]',
    icon: <UserCheck className="w-4 h-4 text-[#686e4a]" />,
  },
  'Recent Customers': {
    title: 'Recent Customers',
    description: 'Booked their first appointment within the last 30 days. High initial engagement score.',
    actionStrategy: 'Trigger 14-day post-treatment care follow-up with direct online booking link for session 2.',
    badgeColor: 'bg-[#f0ede6] dark:bg-[#1f2418] text-[#554e38] dark:text-[#c2c8b0] border-[#e7e3da]',
    bgAccent: 'bg-[#f0ede6] dark:bg-[#1f2418]',
    borderAccent: 'border-[#cdc8bb]',
    icon: <Sparkles className="w-4 h-4 text-[#686e4a]" />,
  },
  Promising: {
    title: 'Promising',
    description: 'Visited 2–3 times recently; above-average ticket size but irregular booking schedule.',
    actionStrategy: 'Introduce customized wellness roadmap to transition them into regular maintenance cadence.',
    badgeColor: 'bg-[#fff9e6] dark:bg-[#e6b000]/15 text-[#997500] dark:text-[#e6b000] border-[#f4d068]',
    bgAccent: 'bg-[#fff9e6] dark:bg-[#e6b000]/10',
    borderAccent: 'border-[#f4d068]',
    icon: <TrendingUp className="w-4 h-4 text-[#e6b000]" />,
  },
  'Needs Attention': {
    title: 'Needs Attention',
    description: 'Above average frequency and monetary spend, but no appointment in the past 60–90 days.',
    actionStrategy: 'Personalized check-in email from Camila mentioning insurance direct-billing utilization.',
    badgeColor: 'bg-[#faeee9] dark:bg-[#b84a36]/15 text-[#b84a36] dark:text-[#e8816f] border-[#eec2b8]',
    bgAccent: 'bg-[#faeee9] dark:bg-[#b84a36]/10',
    borderAccent: 'border-[#eec2b8]',
    icon: <Clock className="w-4 h-4 text-[#b84a36]" />,
  },
  "Can't Lose Them": {
    title: "Can't Lose Them",
    description: 'Historically top spenders (VIP Brazilian packages) who have gone inactive for >90 days.',
    actionStrategy: 'VIP founder phone call or direct SMS with complimentary add-on enhancement on next session.',
    badgeColor: 'bg-[#faeee9] dark:bg-[#b84a36]/20 text-[#b84a36] dark:text-[#e8816f] border-[#b84a36]',
    bgAccent: 'bg-[#faeee9] dark:bg-[#b84a36]/10',
    borderAccent: 'border-[#b84a36]',
    icon: <AlertOctagon className="w-4 h-4 text-[#b84a36]" />,
  },
  'At Risk': {
    title: 'At Risk',
    description: 'Medium spenders with last appointment >90 days ago. High likelihood of churning to competing clinics.',
    actionStrategy: 'Re-activation campaign with limited-time seasonal benefit reminder before benefits reset.',
    badgeColor: 'bg-[#faeee9] dark:bg-[#b84a36]/15 text-[#b84a36] dark:text-[#e8816f] border-[#eec2b8]',
    bgAccent: 'bg-[#faeee9] dark:bg-[#b84a36]/10',
    borderAccent: 'border-[#eec2b8]',
    icon: <ShieldAlert className="w-4 h-4 text-[#b84a36]" />,
  },
  Hibernating: {
    title: 'Hibernating',
    description: 'Lowest frequency and last visited >120 days ago with single or minimal historical spend.',
    actionStrategy: 'Automated quarterly clinic newsletter highlighting new therapies or seasonal promotions.',
    badgeColor: 'bg-[#f0ede6] dark:bg-[#181b11] text-[#7d7663] dark:text-[#8b927a] border-[#e7e3da]',
    bgAccent: 'bg-[#f0ede6] dark:bg-[#181b11]',
    borderAccent: 'border-[#e7e3da]',
    icon: <Clock className="w-4 h-4 text-[#7d7663]" />,
  },
};

export const RfmMatrixDashboard: React.FC<RfmMatrixDashboardProps> = ({
  customers,
  onFilterBySegment,
  isDarkMode = false,
}) => {
  const [selectedSegment, setSelectedSegment] = useState<RfmSegment>('Champions');
  const [selectedCustomerForOutreach, setSelectedCustomerForOutreach] = useState<Customer | null>(null);
  const [outreachSuccessNotice, setOutreachSuccessNotice] = useState<string | null>(null);

  // Group customers by segment
  const segmentCounts: Record<RfmSegment, Customer[]> = {
    Champions: [],
    'Loyal Customers': [],
    'Potential Loyalists': [],
    'Recent Customers': [],
    Promising: [],
    'Needs Attention': [],
    "Can't Lose Them": [],
    'At Risk': [],
    Hibernating: [],
  };

  customers.forEach((c) => {
    if (segmentCounts[c.rfmSegment]) {
      segmentCounts[c.rfmSegment].push(c);
    }
  });

  const activeSegmentData = SEGMENT_DEFINITIONS[selectedSegment];
  const activeSegmentCustomers = segmentCounts[selectedSegment] || [];

  const handleSendOutreach = () => {
    if (selectedCustomerForOutreach) {
      setOutreachSuccessNotice(
        `Clinical reminder queued for ${selectedCustomerForOutreach.name}! Sent via SMS & Email.`
      );
      setSelectedCustomerForOutreach(null);
      setTimeout(() => setOutreachSuccessNotice(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {outreachSuccessNotice && (
        <div className="p-3.5 rounded-xl bg-[#edf0e6] dark:bg-[#686e4a]/20 border border-[#bcc2a4] dark:border-[#686e4a]/40 text-[#332e1e] dark:text-[#f9f8f5] flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle className="w-4 h-4 text-[#686e4a]" />
            <span>{outreachSuccessNotice}</span>
          </div>
          <button
            onClick={() => setOutreachSuccessNotice(null)}
            className="opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Overview Cards & Segment Distribution */}
      <div
        className={`rounded-xl border p-5 shadow-sm transition-colors ${
          isDarkMode
            ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
            : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-serif text-lg font-bold flex items-center gap-2">
              <span>Wellthera RFM Segmentation Matrix</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-sans font-semibold border ${
                  isDarkMode
                    ? 'bg-[#686e4a]/20 text-[#c7ccaa] border-[#686e4a]/40'
                    : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4]'
                }`}
              >
                Recency • Frequency • Monetary
              </span>
            </h3>
            <p
              className={`text-xs mt-1 ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
              }`}
            >
              Classifying {customers.length} clinic patients based on days since visit, appointment frequency, and total CAD spend.
            </p>
          </div>
        </div>

        {/* Segment Pill Selectors (Click to view and filter) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {(Object.keys(SEGMENT_DEFINITIONS) as RfmSegment[]).map((segKey) => {
            const seg = SEGMENT_DEFINITIONS[segKey];
            const list = segmentCounts[segKey] || [];
            const isSelected = selectedSegment === segKey;
            const percentage = customers.length > 0 ? ((list.length / customers.length) * 100).toFixed(0) : '0';
            const totalSpend = list.reduce((acc, c) => acc + c.totalSpendCAD, 0);

            return (
              <button
                key={segKey}
                onClick={() => setSelectedSegment(segKey)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-[#252c1a] border-[#686e4a] ring-1 ring-[#686e4a] shadow-sm'
                      : 'bg-[#edf0e6] border-[#686e4a] ring-1 ring-[#686e4a] shadow-sm'
                    : isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] hover:border-[#383f2a]'
                    : 'bg-[#f9f8f5] border-[#e7e3da] hover:border-[#bcc2a4]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`p-1 rounded border ${
                      isDarkMode
                        ? 'bg-[#1c2015] border-[#292e1e]'
                        : 'bg-[#ffffff] border-[#e7e3da]'
                    }`}
                  >
                    {seg.icon}
                  </span>
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                    }`}
                  >
                    {percentage}%
                  </span>
                </div>
                <div className="font-serif font-bold text-xs truncate">
                  {seg.title}
                </div>
                <div
                  className={`flex items-center justify-between text-[11px] mt-1 font-mono ${
                    isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                  }`}
                >
                  <span>{list.length} patients</span>
                  <span className="text-[#686e4a] dark:text-[#aab187] font-bold">
                    ${totalSpend}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Segment Drill-Down & Roster */}
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
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${activeSegmentData.badgeColor}`}>
                {activeSegmentData.title}
              </span>
              <span className="text-xs font-bold">
                {activeSegmentCustomers.length} Patients
              </span>
            </div>
            <p
              className={`text-xs mt-1 max-w-2xl ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
              }`}
            >
              {activeSegmentData.description}
            </p>
          </div>

          <div
            className={`px-3 py-1.5 rounded-lg border text-xs max-w-sm ${
              isDarkMode
                ? 'bg-[#1c2015] border-[#292e1e] text-[#a2a992]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#554e38]'
            }`}
          >
            <strong className="text-[#686e4a] dark:text-[#c7ccaa] block text-[10px] uppercase font-bold">
              Recommended Protocol:
            </strong>
            <span>{activeSegmentData.actionStrategy}</span>
          </div>
        </div>

        {/* Customer Table */}
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
                <th className="py-3 px-4 font-bold">Patient</th>
                <th className="py-3 px-3 font-bold">Partner Source</th>
                <th className="py-3 px-2 font-bold text-center">Recency</th>
                <th className="py-3 px-2 font-bold text-center">Visits</th>
                <th className="py-3 px-3 font-bold">Total CAD Spend</th>
                <th className="py-3 px-3 font-bold">Specialty Service</th>
                <th className="py-3 px-3 font-bold">Direct Insurer</th>
                <th className="py-3 px-2 font-bold text-center">R-F-M</th>
                <th className="py-3 px-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-inherit">
              {activeSegmentCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs opacity-60">
                    No patients currently in this segment.
                  </td>
                </tr>
              ) : (
                activeSegmentCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className={`transition-colors ${
                      isDarkMode
                        ? 'hover:bg-[#202517] border-[#292e1e]'
                        : 'hover:bg-[#f4f1eb] border-[#e7e3da]'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-sm">{cust.name}</div>
                      <div
                        className={`text-[11px] ${
                          isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                        }`}
                      >
                        {cust.email} • {cust.phone}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium">{cust.partnerName}</span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono">
                      <span
                        className={`font-bold ${
                          cust.recencyDays <= 30
                            ? 'text-[#686e4a] dark:text-[#aab187]'
                            : cust.recencyDays <= 90
                            ? 'text-[#b88c00] dark:text-[#e6b000]'
                            : 'text-[#b84a36] dark:text-[#e8816f]'
                        }`}
                      >
                        {cust.recencyDays}d ago
                      </span>
                      <span
                        className={`text-[10px] block ${
                          isDarkMode ? 'text-[#8b927a]' : 'text-[#7d7663]'
                        }`}
                      >
                        {cust.lastVisitDate}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono font-bold">
                      {cust.totalVisits}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#686e4a] dark:text-[#aab187]">
                      ${cust.totalSpendCAD} CAD
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] border ${
                          isDarkMode
                            ? 'bg-[#14160e] border-[#292e1e] text-[#c2c8b0]'
                            : 'bg-[#f0ede6] border-[#e7e3da] text-[#554e38]'
                        }`}
                      >
                        {cust.preferredService}
                      </span>
                    </td>
                    <td className="py-3 px-3">{cust.insuranceProvider}</td>
                    <td className="py-3 px-2 text-center font-mono text-[11px]">
                      <span
                        className={`px-1.5 py-0.5 rounded font-bold border ${
                          isDarkMode
                            ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                            : 'bg-[#f0ede6] border-[#e7e3da] text-[#332e1e]'
                        }`}
                      >
                        {cust.recencyScore}-{cust.frequencyScore}-{cust.monetaryScore}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => setSelectedCustomerForOutreach(cust)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                          isDarkMode
                            ? 'bg-[#686e4a]/15 text-[#c7ccaa] border-[#686e4a]/40 hover:bg-[#686e4a]/30'
                            : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4] hover:bg-[#dfe4d3]'
                        }`}
                      >
                        Recall
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outreach Action Drawer / Modal */}
      {selectedCustomerForOutreach && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`rounded-2xl max-w-lg w-full p-6 shadow-2xl border ${
              isDarkMode
                ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
            }`}
          >
            <div
              className={`flex items-start justify-between border-b pb-3 mb-4 ${
                isDarkMode ? 'border-[#24291c]' : 'border-[#e7e3da]'
              }`}
            >
              <div>
                <span className="text-xs uppercase font-bold text-[#686e4a] dark:text-[#c7ccaa] tracking-wider">
                  Clinical Recall & Retention
                </span>
                <h3 className="font-serif text-xl font-bold mt-0.5">
                  {selectedCustomerForOutreach.name}
                </h3>
                <span
                  className={`text-xs ${
                    isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
                  }`}
                >
                  Partner: {selectedCustomerForOutreach.partnerName} • RFM: {selectedCustomerForOutreach.rfmSegment}
                </span>
              </div>
              <button
                onClick={() => setSelectedCustomerForOutreach(null)}
                className={`p-1.5 rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e] text-[#a2a992] hover:text-white'
                    : 'bg-[#f0ede6] border-[#e7e3da] text-[#6e6856] hover:text-[#100e0a]'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div
                className={`p-3 rounded-xl border ${
                  isDarkMode
                    ? 'bg-[#14160e] border-[#292e1e]'
                    : 'bg-[#f9f8f5] border-[#e7e3da]'
                }`}
              >
                <span className="font-bold block mb-1">
                  Drafting Personalized Clinical Message (Camila Dos Santos, RMT):
                </span>
                <p
                  className={`leading-relaxed italic p-2.5 rounded border font-mono text-[11px] ${
                    isDarkMode
                      ? 'bg-[#1c2015] border-[#292e1e] text-[#c2c8b0]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#554e38]'
                  }`}
                >
                  "Hi {selectedCustomerForOutreach.name.split(' ')[0]}, this is Camila from Wellthera Integrated Health in Barrie! Hope you’re feeling great after your last {selectedCustomerForOutreach.preferredService} session. We noticed your {selectedCustomerForOutreach.insuranceProvider} direct-billing benefits renew soon—would you like to reserve a priority spot this month?"
                </p>
              </div>

              <div
                className={`flex items-center justify-between text-xs py-2 px-1 ${
                  isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
                }`}
              >
                <span>Phone: {selectedCustomerForOutreach.phone}</span>
                <span>Email: {selectedCustomerForOutreach.email}</span>
              </div>
            </div>

            <div
              className={`mt-6 pt-4 border-t flex justify-end gap-2 ${
                isDarkMode ? 'border-[#24291c]' : 'border-[#e7e3da]'
              }`}
            >
              <button
                onClick={() => setSelectedCustomerForOutreach(null)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                  isDarkMode
                    ? 'bg-[#14160e] text-[#f9f8f5] border-[#292e1e] hover:bg-[#202517]'
                    : 'bg-[#f0ede6] text-[#332e1e] border-[#e7e3da] hover:bg-[#e7e3da]'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSendOutreach}
                className="px-4 py-2 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Queue Recall Notice</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
