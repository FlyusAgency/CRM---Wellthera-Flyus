import React, { useState } from 'react';
import {
  Compass,
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  CheckCircle,
  AlertTriangle,
  Clock,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  X,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  QuarterlyOkrPlan,
  ClinicObjective,
  KeyResult,
  OkrStatus,
  ObjectiveCategory,
  Customer,
  Partner,
  ServiceBooking,
  CacChannelSpend,
} from '../types';

interface OkrDashboardProps {
  okrPlans: QuarterlyOkrPlan[];
  customers: Customer[];
  partners: Partner[];
  bookings: ServiceBooking[];
  cacChannels: CacChannelSpend[];
  onUpdateQuarterTargets: (quarterId: string, updatedTargets: Partial<QuarterlyOkrPlan>) => void;
  onAddQuarter: (newQuarter: QuarterlyOkrPlan) => void;
  onAddObjective: (quarterId: string, newObjective: ClinicObjective) => void;
  onUpdateObjective: (quarterId: string, updatedObjective: ClinicObjective) => void;
  onDeleteObjective: (quarterId: string, objectiveId: string) => void;
  onAddKeyResult: (quarterId: string, objectiveId: string, newKR: KeyResult) => void;
  onUpdateKeyResult: (quarterId: string, objectiveId: string, updatedKR: KeyResult) => void;
  onDeleteKeyResult: (quarterId: string, objectiveId: string, krId: string) => void;
  isDarkMode?: boolean;
}

export const OkrDashboard: React.FC<OkrDashboardProps> = ({
  okrPlans,
  customers,
  partners,
  bookings,
  cacChannels,
  onUpdateQuarterTargets,
  onAddQuarter,
  onAddObjective,
  onUpdateObjective,
  onDeleteObjective,
  onAddKeyResult,
  onUpdateKeyResult,
  onDeleteKeyResult,
  isDarkMode = false,
}) => {
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>(
    okrPlans[0]?.id || 'okr-2026-q1'
  );

  // Active Plan
  const activePlan =
    okrPlans.find((plan) => plan.id === selectedQuarterId) || okrPlans[0];

  // Modals state
  const [isEditTargetsOpen, setIsEditTargetsOpen] = useState(false);
  const [isAddObjectiveOpen, setIsAddObjectiveOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<ClinicObjective | null>(null);
  const [addingKrForObjectiveId, setAddingKrForObjectiveId] = useState<string | null>(null);
  const [editingKr, setEditingKr] = useState<{ objectiveId: string; kr: KeyResult } | null>(null);
  const [isAddQuarterOpen, setIsAddQuarterOpen] = useState(false);

  // Form states for Targets Modal
  const [formRevenueGoal, setFormRevenueGoal] = useState(activePlan?.revenueGoalCAD || 95000);
  const [formCacBenchmark, setFormCacBenchmark] = useState(activePlan?.cacBenchmarkCAD || 40);
  const [formLtvCac, setFormLtvCac] = useState(activePlan?.ltvCacTargetRatio || 7);
  const [formNewPatients, setFormNewPatients] = useState(activePlan?.newPatientsTarget || 160);
  const [formRetentionRate, setFormRetentionRate] = useState(activePlan?.retentionTargetRate || 70);
  const [formPartnerShare, setFormPartnerShare] = useState(activePlan?.partnerRevenueShareTarget || 65);

  // Form states for New Objective
  const [objTitle, setObjTitle] = useState('');
  const [objDescription, setObjDescription] = useState('');
  const [objOwner, setObjOwner] = useState('Clinic Director');
  const [objCategory, setObjCategory] = useState<ObjectiveCategory>('Revenue & Growth');

  // Form states for Key Result
  const [krTitle, setKrTitle] = useState('');
  const [krMetricType, setKrMetricType] = useState<KeyResult['metricType']>('number');
  const [krTargetValue, setKrTargetValue] = useState(100);
  const [krCurrentValue, setKrCurrentValue] = useState(0);
  const [krUnit, setKrUnit] = useState('patients');
  const [krStatus, setKrStatus] = useState<OkrStatus>('on_track');
  const [krNotes, setKrNotes] = useState('');

  // Form states for New Quarter
  const [newQuarterName, setNewQuarterName] = useState('Q1 2027');
  const [newQuarterYear, setNewQuarterYear] = useState(2027);

  // Derived Actuals scoped accurately to the active quarter (real ClinicSense bookings & payments)
  const billableBookings = bookings.filter(
    (b) => b.status === 'Completed' || (b.status === 'Cancelled' && (b.priceCAD || 0) > 0)
  );
  const quarterMatch = activePlan?.quarter?.match(/Q([1-4])\s+(\d{4})/i);
  const quarterStartIso = quarterMatch
    ? `${quarterMatch[2]}-${String((parseInt(quarterMatch[1], 10) - 1) * 3 + 1).padStart(2, '0')}-01`
    : '';
  const quarterEndIso = quarterMatch
    ? `${quarterMatch[2]}-${String(parseInt(quarterMatch[1], 10) * 3).padStart(2, '0')}-31`
    : '';

  const quarterBillableBookings = quarterMatch
    ? billableBookings.filter(
        (b) => b.bookingDate >= quarterStartIso && b.bookingDate <= quarterEndIso
      )
    : billableBookings;

  const totalActualRevenue =
    Math.round(
      quarterBillableBookings.reduce((sum, b) => sum + (b.priceCAD || 0), 0) * 100
    ) / 100;

  const totalSpend = cacChannels.reduce((sum, c) => sum + c.spendCAD, 0);
  const paidChannels = cacChannels.filter((c) => c.spendCAD > 0);
  const paidAcquired = paidChannels.reduce((sum, c) => sum + c.newCustomersAcquired, 0);
  const totalAcquired = quarterMatch
    ? customers.filter(
        (c) =>
          Boolean(c.firstVisitDate) &&
          c.firstVisitDate >= quarterStartIso &&
          c.firstVisitDate <= quarterEndIso
      ).length
    : customers.filter((c) => Boolean(c.firstVisitDate)).length;
  const actualBlendedCac = totalSpend > 0 && paidAcquired > 0 ? totalSpend / paidAcquired : 0;

  const totalCustomerSpend = customers.reduce((sum, c) => sum + (c.totalSpendCAD || 0), 0);
  const paidCusts = customers.filter((c) => c.totalSpendCAD > 0).length;
  const avgLtv = paidCusts > 0 ? totalCustomerSpend / paidCusts : 0;
  const actualLtvCac = actualBlendedCac > 0 && avgLtv > 0 ? avgLtv / actualBlendedCac : 0;

  const partnerOnlyGross = quarterBillableBookings
    .filter((b) => b.partnerId && b.partnerId !== 'no-partner' && b.partnerId !== 'p-8' && b.partnerId !== 'direct')
    .reduce((sum, b) => sum + (b.priceCAD || 0), 0);
  const actualPartnerShare =
    totalActualRevenue > 0 ? (partnerOnlyGross / totalActualRevenue) * 100 : 0;

  const activeVisitedCustomers = customers.filter((c) => c.totalVisits >= 1);
  const repeatPatientsCount = activeVisitedCustomers.filter((c) => c.totalVisits >= 2).length;
  const actualRetentionRate =
    activeVisitedCustomers.length > 0
      ? (repeatPatientsCount / activeVisitedCustomers.length) * 100
      : 0;

  // Open Edit Targets
  const handleOpenEditTargets = () => {
    if (!activePlan) return;
    setFormRevenueGoal(activePlan.revenueGoalCAD);
    setFormCacBenchmark(activePlan.cacBenchmarkCAD);
    setFormLtvCac(activePlan.ltvCacTargetRatio);
    setFormNewPatients(activePlan.newPatientsTarget);
    setFormRetentionRate(activePlan.retentionTargetRate);
    setFormPartnerShare(activePlan.partnerRevenueShareTarget);
    setIsEditTargetsOpen(true);
  };

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan) return;
    onUpdateQuarterTargets(activePlan.id, {
      revenueGoalCAD: Number(formRevenueGoal),
      cacBenchmarkCAD: Number(formCacBenchmark),
      ltvCacTargetRatio: Number(formLtvCac),
      newPatientsTarget: Number(formNewPatients),
      retentionTargetRate: Number(formRetentionRate),
      partnerRevenueShareTarget: Number(formPartnerShare),
    });
    setIsEditTargetsOpen(false);
  };

  // Submit Objective
  const handleSaveObjective = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan || !objTitle.trim()) return;

    if (editingObjective) {
      onUpdateObjective(activePlan.id, {
        ...editingObjective,
        title: objTitle.trim(),
        description: objDescription.trim(),
        owner: objOwner.trim(),
        category: objCategory,
      });
      setEditingObjective(null);
    } else {
      const newObj: ClinicObjective = {
        id: `obj-${Date.now()}`,
        title: objTitle.trim(),
        description: objDescription.trim(),
        owner: objOwner.trim(),
        category: objCategory,
        keyResults: [],
      };
      onAddObjective(activePlan.id, newObj);
      setIsAddObjectiveOpen(false);
    }
    setObjTitle('');
    setObjDescription('');
  };

  // Submit Key Result
  const handleSaveKeyResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan || !krTitle.trim()) return;

    if (editingKr) {
      const updated: KeyResult = {
        ...editingKr.kr,
        title: krTitle.trim(),
        metricType: krMetricType,
        targetValue: Number(krTargetValue),
        currentValue: Number(krCurrentValue),
        unit: krUnit.trim(),
        status: krStatus,
        notes: krNotes.trim(),
      };
      onUpdateKeyResult(activePlan.id, editingKr.objectiveId, updated);
      setEditingKr(null);
    } else if (addingKrForObjectiveId) {
      const newKR: KeyResult = {
        id: `kr-${Date.now()}`,
        title: krTitle.trim(),
        metricType: krMetricType,
        targetValue: Number(krTargetValue),
        currentValue: Number(krCurrentValue),
        unit: krUnit.trim(),
        status: krStatus,
        notes: krNotes.trim(),
      };
      onAddKeyResult(activePlan.id, addingKrForObjectiveId, newKR);
      setAddingKrForObjectiveId(null);
    }

    setKrTitle('');
    setKrNotes('');
  };

  // Submit New Quarter
  const handleSaveQuarter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuarterName.trim()) return;
    const newPlan: QuarterlyOkrPlan = {
      id: `okr-${newQuarterYear}-${newQuarterName.toLowerCase().replace(/\s+/g, '-')}`,
      quarter: newQuarterName.trim(),
      year: Number(newQuarterYear),
      revenueGoalCAD: 100000,
      cacBenchmarkCAD: 40.0,
      ltvCacTargetRatio: 7.0,
      newPatientsTarget: 150,
      retentionTargetRate: 70,
      partnerRevenueShareTarget: 65,
      objectives: [],
    };
    onAddQuarter(newPlan);
    setSelectedQuarterId(newPlan.id);
    setIsAddQuarterOpen(false);
  };

  if (!activePlan) {
    return <div className="p-8 text-center">Loading OKR Plans...</div>;
  }

  // Format Helper for Key Result values
  const formatMetricValue = (val: number, type: KeyResult['metricType'], unit?: string) => {
    if (type === 'currency') {
      return `$${val.toLocaleString()} CAD`;
    }
    if (type === 'percentage') {
      return `${val}%`;
    }
    if (type === 'ratio') {
      return `${val.toFixed(1)}x`;
    }
    return `${val} ${unit || ''}`.trim();
  };

  // Status Badge Helper
  const renderStatusBadge = (status: OkrStatus) => {
    switch (status) {
      case 'achieved':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
            <CheckCircle className="w-2.5 h-2.5" /> Achieved
          </span>
        );
      case 'on_track':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-300 dark:border-teal-700 flex items-center gap-1">
            <Compass className="w-2.5 h-2.5" /> On Track
          </span>
        );
      case 'at_risk':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> At Risk
          </span>
        );
      case 'behind':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" /> Behind
          </span>
        );
    }
  };

  // Revenue calculation & progress
  const revPct = Math.min(
    100,
    Math.round((totalActualRevenue / Math.max(activePlan.revenueGoalCAD, 1)) * 100)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Quarter Selector Bar */}
      <div
        className={`p-4 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-4 transition-colors ${
          isDarkMode
            ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
            : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              isDarkMode
                ? 'bg-[#686e4a]/15 text-[#c7ccaa] border-[#686e4a]/30'
                : 'bg-[#edf0e6] text-[#52573a] border-[#bcc2a4]'
            }`}
          >
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl font-bold tracking-tight">
                Clinic OKRs & Quarterly Target Benchmarks
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#686e4a] text-white">
                {activePlan.quarter}
              </span>
            </div>
            <p
              className={`text-xs mt-0.5 ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
              }`}
            >
              Align team priorities, set quarterly revenue goals, monitor CAC thresholds, and measure key results.
            </p>
          </div>
        </div>

        {/* Quarter Selectors & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quarter Pills */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
            {okrPlans.map((plan) => {
              const isSelected = plan.id === activePlan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedQuarterId(plan.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#686e4a] text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {plan.quarter}
                </button>
              );
            })}
            <button
              onClick={() => setIsAddQuarterOpen(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#686e4a] dark:text-[#c7ccaa] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer flex items-center gap-1"
              title="Add New Quarter Plan"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Quarter</span>
            </button>
          </div>

          {/* Edit Targets Button */}
          <button
            onClick={handleOpenEditTargets}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
              isDarkMode
                ? 'bg-[#1c2015] border-[#343a27] text-[#c7ccaa] hover:bg-[#252a1c]'
                : 'bg-[#edf0e6] border-[#bcc2a4] text-[#52573a] hover:bg-[#dfe4d3]'
            }`}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edit Quarter Targets</span>
          </button>

          {/* Add Objective Button */}
          <button
            onClick={() => {
              setEditingObjective(null);
              setObjTitle('');
              setObjDescription('');
              setIsAddObjectiveOpen(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#686e4a] hover:bg-[#52573a] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Strategic Objective</span>
          </button>
        </div>
      </div>

      {/* Primary KPI & Benchmark Cards Grid (6 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Quarterly Revenue Goal */}
        <div
          className={`p-4 rounded-xl border shadow-xs transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              Quarterly Revenue Goal
            </span>
            <span className="p-1.5 rounded-lg bg-[#686e4a]/15 text-[#686e4a] dark:text-[#c7ccaa]">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-serif mt-1">
            ${activePlan.revenueGoalCAD.toLocaleString()} CAD
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="opacity-75">
                Current Actual: <strong>${totalActualRevenue.toLocaleString()} CAD</strong>
              </span>
              <span className="font-bold text-[#686e4a] dark:text-[#c7ccaa]">{revPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-[#686e4a] rounded-full transition-all duration-500"
                style={{ width: `${revPct}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] opacity-60 mt-2 flex items-center justify-between">
            <span>
              Remaining:{' '}
              {totalActualRevenue >= activePlan.revenueGoalCAD
                ? 'Target Exceeded 🎉'
                : `$${(activePlan.revenueGoalCAD - totalActualRevenue).toLocaleString()} CAD`}
            </span>
            <span>Target: {activePlan.quarter}</span>
          </div>
        </div>

        {/* Card 2: CAC Benchmark */}
        <div
          className={`p-4 rounded-xl border shadow-xs transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              Blended CAC Benchmark
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Target className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-serif mt-1 flex items-baseline gap-2">
            <span>&le; ${activePlan.cacBenchmarkCAD.toFixed(2)} CAD</span>
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="opacity-75">
                Actual CAC: <strong>${actualBlendedCac.toFixed(2)} CAD</strong>
              </span>
              <span
                className={`font-bold ${
                  actualBlendedCac <= activePlan.cacBenchmarkCAD
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {actualBlendedCac <= activePlan.cacBenchmarkCAD
                  ? 'Favorable (Under Cap)'
                  : 'Above Cap'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  actualBlendedCac <= activePlan.cacBenchmarkCAD ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (activePlan.cacBenchmarkCAD / Math.max(actualBlendedCac, 1)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
          <div className="text-[11px] opacity-60 mt-2 flex items-center justify-between">
            <span>
              Variance: ${(activePlan.cacBenchmarkCAD - actualBlendedCac).toFixed(2)} CAD margin
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {actualBlendedCac <= activePlan.cacBenchmarkCAD ? '✅ Benchmark Met' : '⚠️ Action Req.'}
            </span>
          </div>
        </div>

        {/* Card 3: LTV:CAC Target */}
        <div
          className={`p-4 rounded-xl border shadow-xs transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              LTV:CAC Target Ratio
            </span>
            <span className="p-1.5 rounded-lg bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-serif mt-1">
            &ge; {activePlan.ltvCacTargetRatio.toFixed(1)}x
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="opacity-75">
                Current Ratio: <strong>{actualLtvCac.toFixed(1)}x</strong>
              </span>
              <span className="font-bold text-teal-600 dark:text-teal-400">
                {actualLtvCac >= activePlan.ltvCacTargetRatio ? 'Target Reached' : 'Scaling'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-teal-600 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (actualLtvCac / activePlan.ltvCacTargetRatio) * 100)}%`,
                }}
              />
            </div>
          </div>
          <div className="text-[11px] opacity-60 mt-2 flex items-center justify-between">
            <span>Avg Patient LTV: ${avgLtv.toFixed(0)} CAD</span>
            <span>Payback: &lt; 2 Months</span>
          </div>
        </div>

        {/* Card 4: New Patient Acquisition Goal */}
        <div
          className={`p-4 rounded-xl border shadow-xs transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              New Patients Acquisition Target
            </span>
            <span className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-serif mt-1">
            {activePlan.newPatientsTarget} Patients
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="opacity-75">
                Acquired to date: <strong>{totalAcquired} Patients</strong>
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {Math.round((totalAcquired / Math.max(activePlan.newPatientsTarget, 1)) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (totalAcquired / Math.max(activePlan.newPatientsTarget, 1)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
          <div className="text-[11px] opacity-60 mt-2 flex items-center justify-between">
            <span>Total Clinic Database: {customers.length}</span>
            <span>Target: {activePlan.quarter}</span>
          </div>
        </div>

        {/* Card 5: Partner Revenue Share Target */}
        <div
          className={`p-4 rounded-xl border shadow-xs transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              Partner Revenue Share Goal
            </span>
            <span className="p-1.5 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-serif mt-1">
            &ge; {activePlan.partnerRevenueShareTarget}%
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="opacity-75">
                Current Partner Contribution:{' '}
                <strong>{actualPartnerShare.toFixed(1)}%</strong>
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {Math.round(
                  (actualPartnerShare / Math.max(activePlan.partnerRevenueShareTarget, 1)) * 100
                )}
                %
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (actualPartnerShare / Math.max(activePlan.partnerRevenueShareTarget, 1)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
          <div className="text-[11px] opacity-60 mt-2 flex items-center justify-between">
            <span>Partner Gross: ${partnerOnlyGross.toLocaleString()} CAD</span>
            <span>Referrals Active: 7 Partners</span>
          </div>
        </div>

        {/* Card 6: Repeat Patient Retention Rate */}
        <div
          className={`p-4 rounded-xl border shadow-xs transition-colors ${
            isDarkMode
              ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
              : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider opacity-70">
              Patient Retention Target
            </span>
            <span className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-bold font-serif mt-1">
            &ge; {activePlan.retentionTargetRate}%
          </div>
          <div className="mt-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="opacity-75">
                Repeat Patients: <strong>{actualRetentionRate.toFixed(1)}%</strong>
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {actualRetentionRate >= activePlan.retentionTargetRate
                  ? 'Target Met'
                  : 'In Progress'}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (actualRetentionRate / Math.max(activePlan.retentionTargetRate, 1)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
          <div className="text-[11px] opacity-60 mt-2 flex items-center justify-between">
            <span>{repeatPatientsCount} Repeat Visitors</span>
            <span>Telus eClaims Direct Billed</span>
          </div>
        </div>
      </div>

      {/* Strategic Objectives & Key Results List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold">
              Strategic Objectives & Key Results ({activePlan.objectives.length})
            </h3>
            <p
              className={`text-xs ${
                isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
              }`}
            >
              Quarterly milestones owned by clinic clinical and marketing personnel.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingObjective(null);
              setObjTitle('');
              setObjDescription('');
              setIsAddObjectiveOpen(true);
            }}
            className="px-3 py-1.5 rounded-lg bg-[#686e4a] hover:bg-[#52573a] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Objective</span>
          </button>
        </div>

        {activePlan.objectives.length === 0 ? (
          <div
            className={`p-8 text-center rounded-2xl border ${
              isDarkMode
                ? 'bg-[#1a1e13] border-[#292e1e] text-[#8b927a]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#7d7663]'
            }`}
          >
            <Compass className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <h4 className="font-bold text-sm">No Strategic Objectives set for {activePlan.quarter}</h4>
            <p className="text-xs mt-1 mb-4 opacity-75">
              Create your first Objective with quantifiable Key Results to guide the team.
            </p>
            <button
              onClick={() => setIsAddObjectiveOpen(true)}
              className="px-4 py-2 bg-[#686e4a] text-white font-semibold text-xs rounded-xl"
            >
              + Add Objective
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activePlan.objectives.map((obj, idx) => {
              const totalKrs = obj.keyResults.length;
              const achievedCount = obj.keyResults.filter(
                (k) => k.status === 'achieved'
              ).length;
              const progressPct =
                totalKrs > 0
                  ? Math.round(
                      (obj.keyResults.reduce((acc, k) => {
                        const ratio = Math.min(1, k.currentValue / Math.max(k.targetValue, 1));
                        return acc + ratio;
                      }, 0) /
                        totalKrs) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={obj.id}
                  className={`rounded-2xl border shadow-xs overflow-hidden transition-colors ${
                    isDarkMode
                      ? 'bg-[#1a1e13] border-[#292e1e]'
                      : 'bg-[#ffffff] border-[#e7e3da]'
                  }`}
                >
                  {/* Objective Header */}
                  <div
                    className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 ${
                      isDarkMode ? 'border-[#24291c] bg-[#161910]' : 'border-[#e7e3da] bg-[#fbfaf8]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#686e4a] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm text-[#100e0a] dark:text-[#f9f8f5]">
                            {obj.title}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#686e4a]/15 text-[#52573a] dark:text-[#c7ccaa] border border-[#686e4a]/30">
                            {obj.category}
                          </span>
                          <span className="text-[11px] opacity-60">
                            Owner: <strong>{obj.owner}</strong>
                          </span>
                        </div>
                        {obj.description && (
                          <p
                            className={`text-xs mt-1 ${
                              isDarkMode ? 'text-[#8b927a]' : 'text-[#6e6856]'
                            }`}
                          >
                            {obj.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold">{progressPct}% Complete</div>
                        <div className="text-[10px] opacity-60">
                          {achievedCount} of {totalKrs} KRs Achieved
                        </div>
                      </div>
                      <div className="flex items-center gap-1 border-l pl-3 border-inherit">
                        <button
                          onClick={() => {
                            setEditingObjective(obj);
                            setObjTitle(obj.title);
                            setObjDescription(obj.description);
                            setObjOwner(obj.owner);
                            setObjCategory(obj.category);
                            setIsAddObjectiveOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[#686e4a] dark:text-[#c7ccaa]"
                          title="Edit Objective"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteObjective(activePlan.id, obj.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                          title="Delete Objective"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Key Results Rows */}
                  <div className="p-4 space-y-3">
                    {obj.keyResults.length === 0 ? (
                      <div className="text-xs opacity-60 italic py-2">
                        No Key Results defined for this objective yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {obj.keyResults.map((kr) => {
                          const pct = Math.min(
                            100,
                            Math.round(
                              (kr.currentValue / Math.max(kr.targetValue, 1)) * 100
                            )
                          );

                          return (
                            <div
                              key={kr.id}
                              className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs transition-colors ${
                                isDarkMode
                                  ? 'bg-[#14160e] border-[#24291c]'
                                  : 'bg-[#faf8f5] border-[#eae6de]'
                              }`}
                            >
                              <div className="flex-1 min-w-[240px]">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{kr.title}</span>
                                  {renderStatusBadge(kr.status)}
                                </div>
                                {kr.notes && (
                                  <p className="text-[11px] opacity-65 mt-0.5">{kr.notes}</p>
                                )}
                              </div>

                              {/* Target vs Current Metric Progress */}
                              <div className="flex items-center gap-4 min-w-[240px] flex-1">
                                <div className="flex-1">
                                  <div className="flex justify-between text-[11px] mb-1 font-mono">
                                    <span>
                                      Current:{' '}
                                      <strong>
                                        {formatMetricValue(
                                          kr.currentValue,
                                          kr.metricType,
                                          kr.unit
                                        )}
                                      </strong>
                                    </span>
                                    <span>
                                      Target:{' '}
                                      <strong>
                                        {formatMetricValue(
                                          kr.targetValue,
                                          kr.metricType,
                                          kr.unit
                                        )}
                                      </strong>
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        kr.status === 'achieved'
                                          ? 'bg-emerald-500'
                                          : kr.status === 'at_risk'
                                          ? 'bg-amber-500'
                                          : kr.status === 'behind'
                                          ? 'bg-rose-500'
                                          : 'bg-[#686e4a]'
                                      }`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                                <span className="font-bold w-10 text-right">{pct}%</span>
                              </div>

                              {/* KR Actions */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingKr({ objectiveId: obj.id, kr });
                                    setKrTitle(kr.title);
                                    setKrMetricType(kr.metricType);
                                    setKrTargetValue(kr.targetValue);
                                    setKrCurrentValue(kr.currentValue);
                                    setKrUnit(kr.unit || '');
                                    setKrStatus(kr.status);
                                    setKrNotes(kr.notes || '');
                                  }}
                                  className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 text-[#686e4a] dark:text-[#c7ccaa]"
                                  title="Edit Key Result"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() =>
                                    onDeleteKeyResult(activePlan.id, obj.id, kr.id)
                                  }
                                  className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400"
                                  title="Delete Key Result"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Key Result Button */}
                    <button
                      onClick={() => {
                        setEditingKr(null);
                        setAddingKrForObjectiveId(obj.id);
                        setKrTitle('');
                        setKrTargetValue(100);
                        setKrCurrentValue(0);
                        setKrMetricType('number');
                        setKrStatus('on_track');
                        setKrNotes('');
                      }}
                      className="w-full py-2 rounded-xl border border-dashed text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[#686e4a] dark:text-[#c7ccaa] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Key Result to Objective #{idx + 1}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Edit Quarterly Targets & Benchmarks */}
      {isEditTargetsOpen && (
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
                Edit {activePlan.quarter} OKR Targets & Benchmarks
              </h3>
              <button
                onClick={() => setIsEditTargetsOpen(false)}
                className="p-1 rounded-md opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTargets} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">
                    Quarterly Revenue Goal (CAD) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formRevenueGoal}
                    onChange={(e) => setFormRevenueGoal(Number(e.target.value))}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                  <span className="text-[10px] opacity-60">e.g. $95,000 CAD</span>
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">
                    Blended CAC Benchmark (CAD) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formCacBenchmark}
                    onChange={(e) => setFormCacBenchmark(Number(e.target.value))}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                  <span className="text-[10px] opacity-60">Max acquisition cost</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">
                    LTV:CAC Target Ratio (x) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formLtvCac}
                    onChange={(e) => setFormLtvCac(Number(e.target.value))}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">
                    New Patients Target *
                  </label>
                  <input
                    type="number"
                    required
                    value={formNewPatients}
                    onChange={(e) => setFormNewPatients(Number(e.target.value))}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">
                    Retention Target Rate (%) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formRetentionRate}
                    onChange={(e) => setFormRetentionRate(Number(e.target.value))}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">
                    Partner Revenue Share (%) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formPartnerShare}
                    onChange={(e) => setFormPartnerShare(Number(e.target.value))}
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
                  onClick={() => setIsEditTargetsOpen(false)}
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
                  className="px-4 py-1.5 bg-[#686e4a] hover:bg-[#52573a] text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Save Targets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Objective */}
      {isAddObjectiveOpen && (
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
                {editingObjective ? 'Edit Objective' : 'New Strategic Objective'}
              </h3>
              <button
                onClick={() => setIsAddObjectiveOpen(false)}
                className="p-1 rounded-md opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveObjective} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Objective Title *
                </label>
                <input
                  type="text"
                  required
                  value={objTitle}
                  onChange={(e) => setObjTitle(e.target.value)}
                  placeholder="e.g. Expand Barrie Partner Referral Flywheel"
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
                    value={objCategory}
                    onChange={(e) => setObjCategory(e.target.value as ObjectiveCategory)}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  >
                    <option value="Revenue & Growth">Revenue & Growth</option>
                    <option value="Acquisition & CAC">Acquisition & CAC</option>
                    <option value="Partnerships & Referrals">Partnerships & Referrals</option>
                    <option value="Clinical Excellence & Retention">
                      Clinical Excellence & Retention
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Owner *</label>
                  <input
                    type="text"
                    required
                    value={objOwner}
                    onChange={(e) => setObjOwner(e.target.value)}
                    placeholder="e.g. Clinic Director"
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
                  Strategic Description
                </label>
                <textarea
                  rows={2}
                  value={objDescription}
                  onChange={(e) => setObjDescription(e.target.value)}
                  placeholder="Rationale and clinical impact..."
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
                  onClick={() => setIsAddObjectiveOpen(false)}
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
                  {editingObjective ? 'Update Objective' : 'Create Objective'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add / Edit Key Result */}
      {(addingKrForObjectiveId || editingKr) && (
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
                {editingKr ? 'Edit Key Result' : 'Add Key Result'}
              </h3>
              <button
                onClick={() => {
                  setAddingKrForObjectiveId(null);
                  setEditingKr(null);
                }}
                className="p-1 rounded-md opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKeyResult} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Key Result Title *
                </label>
                <input
                  type="text"
                  required
                  value={krTitle}
                  onChange={(e) => setKrTitle(e.target.value)}
                  placeholder="e.g. Keep blended CAC <= $40 CAD"
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Metric Type *</label>
                  <select
                    value={krMetricType}
                    onChange={(e) => setKrMetricType(e.target.value as any)}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  >
                    <option value="number">Numeric Count</option>
                    <option value="currency">Currency ($ CAD)</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="ratio">Ratio (e.g. 7.0x)</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Unit Label</label>
                  <input
                    type="text"
                    value={krUnit}
                    onChange={(e) => setKrUnit(e.target.value)}
                    placeholder="e.g. CAD, patients, %"
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
                  <label className="block mb-1 font-semibold opacity-75">Target Value *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={krTargetValue}
                    onChange={(e) => setKrTargetValue(Number(e.target.value))}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold opacity-75">Current Value *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={krCurrentValue}
                    onChange={(e) => setKrCurrentValue(Number(e.target.value))}
                    className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                      isDarkMode
                        ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                        : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">Status *</label>
                <select
                  value={krStatus}
                  onChange={(e) => setKrStatus(e.target.value as OkrStatus)}
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                >
                  <option value="on_track">On Track</option>
                  <option value="achieved">Achieved</option>
                  <option value="at_risk">At Risk</option>
                  <option value="behind">Behind</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">Notes / Context</label>
                <textarea
                  rows={2}
                  value={krNotes}
                  onChange={(e) => setKrNotes(e.target.value)}
                  placeholder="Progress updates or hurdles..."
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
                  onClick={() => {
                    setAddingKrForObjectiveId(null);
                    setEditingKr(null);
                  }}
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
                  {editingKr ? 'Update Key Result' : 'Add Key Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Quarter */}
      {isAddQuarterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className={`rounded-2xl max-w-sm w-full p-6 shadow-2xl border ${
              isDarkMode
                ? 'bg-[#1a1e13] border-[#292e1e] text-[#f9f8f5]'
                : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-inherit mb-4">
              <h3 className="font-serif text-lg font-bold">New Quarter Plan</h3>
              <button
                onClick={() => setIsAddQuarterOpen(false)}
                className="p-1 rounded-md opacity-60 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuarter} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-semibold opacity-75">
                  Quarter Label *
                </label>
                <input
                  type="text"
                  required
                  value={newQuarterName}
                  onChange={(e) => setNewQuarterName(e.target.value)}
                  placeholder="e.g. Q1 2027"
                  className={`w-full rounded-lg p-2 border focus:outline-none focus:ring-1 focus:ring-[#686e4a] ${
                    isDarkMode
                      ? 'bg-[#14160e] border-[#292e1e] text-[#f9f8f5]'
                      : 'bg-[#ffffff] border-[#e7e3da] text-[#332e1e]'
                  }`}
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold opacity-75">Year *</label>
                <input
                  type="number"
                  required
                  value={newQuarterYear}
                  onChange={(e) => setNewQuarterYear(Number(e.target.value))}
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
                  onClick={() => setIsAddQuarterOpen(false)}
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
                  Create Quarter Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
