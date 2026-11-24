/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  Customer,
  Partner,
  ServiceBooking,
  CacChannelSpend,
  SlicerFilters,
  GoogleSheetSyncState,
  Practitioner,
  ClinicProcedure,
  QuarterlyOkrPlan,
  ClinicObjective,
  KeyResult,
} from './types';
import {
  initialCustomers,
  initialPartners,
  initialBookings,
  initialCacChannels,
  initialPractitioners,
  initialProcedures,
  initialOkrPlans,
  computeRfmSegment,
} from './data/initialData';
import { initAuth, googleSignIn, logout } from './services/firebaseAuth';
import { PowerBIHeader, ActiveTab } from './components/PowerBIHeader';
import { SlicerBar } from './components/SlicerBar';
import { ExecutiveOverview } from './components/ExecutiveOverview';
import { OkrDashboard } from './components/OkrDashboard';
import { PartnerRoiDashboard } from './components/PartnerRoiDashboard';
import { RfmMatrixDashboard } from './components/RfmMatrixDashboard';
import { ServicesBreakdownDashboard } from './components/ServicesBreakdownDashboard';
import { CacAnalysisDashboard } from './components/CacAnalysisDashboard';
import { GoogleSheetTrackerView } from './components/GoogleSheetTrackerView';
import { WelltheraLogo } from './components/WelltheraLogo';
import { SetupInstructionsModal } from './components/SetupInstructionsModal';
import {
  fetchSheetDataViaAppsScript,
  pullLatestDataFromSpreadsheet,
  parseSpreadsheetIdFromInput,
} from './services/googleSheets';
import { GatekeeperLogin } from './components/GatekeeperLogin';

export default function App() {
  // Gatekeeper protection state for Vercel public deployment
  const [isGatekeeperUnlocked, setIsGatekeeperUnlocked] = useState<boolean>(() => {
    try {
      return (
        localStorage.getItem('wellthera_auth_gate') === 'authenticated' ||
        sessionStorage.getItem('wellthera_auth_gate') === 'authenticated'
      );
    } catch {
      return false;
    }
  });

  // Theme state: default to false (Wellthera Signature Warm Cream from www.wellthera.ca)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Help & Setup Guide Modal state
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Authentication State (per workspace integration skill)
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Helper: identify synthetic ClinicSense placeholder bookings generated in prior versions (b-1000..b-1999)
  const isSyntheticLegacyBooking = (b: ServiceBooking) =>
    /^b-1\d{3}$/.test(String(b.id || ''));

  // Primary Data State with Smart Migration (v9: Zero Fabricated Data — preserves Samuel's practitioners, services, OKRs, partners, sheet sync & manual logs)
  const [bookings, setBookings] = useState<ServiceBooking[]>(() => {
    try {
      const savedV9 = localStorage.getItem('wellthera_bookings_v9');
      if (savedV9) {
        const parsed = JSON.parse(savedV9);
        if (Array.isArray(parsed)) return parsed;
      }
      // One-time migration from v8: strip only the 260 synthetic bookings (b-1000..b-1259) and preserve any real manual bookings logged today
      const savedV8 = localStorage.getItem('wellthera_bookings_v8');
      if (savedV8) {
        const parsed = JSON.parse(savedV8);
        if (Array.isArray(parsed)) {
          return parsed.filter((b: ServiceBooking) => !isSyntheticLegacyBooking(b));
        }
      }
    } catch (e) {
      console.warn('Failed to load bookings from storage', e);
    }
    return initialBookings;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const savedV9 = localStorage.getItem('wellthera_customers_v9');
      if (savedV9) {
        const parsed = JSON.parse(savedV9);
        if (Array.isArray(parsed) && parsed.length >= 1000) {
          return parsed;
        }
      }

      // One-time clean migration from v8 -> v9:
      // Start from authentic ClinicSense CSV customers (no fake dates/spend/services/insurers),
      // while preserving any manual customers, manual partner assignments, and real bookings logged today.
      const baseById = new Map<string, Customer>(
        initialCustomers.map((c) => [c.id, { ...c }])
      );

      const savedV8CustsRaw = localStorage.getItem('wellthera_customers_v8');
      if (savedV8CustsRaw) {
        const savedV8Custs = JSON.parse(savedV8CustsRaw);
        if (Array.isArray(savedV8Custs)) {
          for (const prev of savedV8Custs as Customer[]) {
            const existing = baseById.get(prev.id);
            if (!existing) {
              // Preserve brand-new customer manually created by staff
              baseById.set(prev.id, prev);
            } else if (
              prev.partnerId &&
              prev.partnerId !== existing.partnerId &&
              prev.partnerId !== 'p-8'
            ) {
              // Preserve manual partner re-assignment made by staff
              existing.partnerId = prev.partnerId;
              existing.partnerName = prev.partnerName;
              existing.referralCode = prev.referralCode || existing.referralCode;
            }
          }
        }
      }

      // Re-apply any preserved real manual bookings onto their customers
      const savedV8BookRaw = localStorage.getItem('wellthera_bookings_v8');
      if (savedV8BookRaw) {
        const savedV8Books = JSON.parse(savedV8BookRaw);
        if (Array.isArray(savedV8Books)) {
          const realBooks = (savedV8Books as ServiceBooking[]).filter(
            (b) => !isSyntheticLegacyBooking(b) && b.status === 'Completed'
          );
          for (const b of realBooks) {
            const cust =
              baseById.get(b.customerId) ||
              Array.from(baseById.values()).find(
                (c) => c.name.trim().toLowerCase() === (b.customerName || '').trim().toLowerCase()
              );
            if (cust) {
              cust.totalSpendCAD = Math.round((cust.totalSpendCAD + (b.priceCAD || 0)) * 100) / 100;
              if (!cust.firstVisitDate || (b.bookingDate && b.bookingDate < cust.firstVisitDate)) {
                cust.firstVisitDate = b.bookingDate;
              }
              if (!cust.lastVisitDate || (b.bookingDate && b.bookingDate > cust.lastVisitDate)) {
                cust.lastVisitDate = b.bookingDate;
              }
              if (b.serviceCategory) cust.preferredService = b.serviceCategory;
              const diffDays = b.bookingDate
                ? Math.max(0, Math.round((Date.now() - new Date(b.bookingDate).getTime()) / 86400000))
                : 0;
              cust.recencyDays = diffDays;
              const { rScore, fScore, mScore, segment } = computeRfmSegment(
                diffDays,
                Math.max(1, cust.totalVisits),
                cust.totalSpendCAD
              );
              cust.recencyScore = rScore;
              cust.frequencyScore = fScore;
              cust.monetaryScore = mScore;
              cust.rfmSegment = segment;
            }
          }
        }
      }

      return Array.from(baseById.values());
    } catch (e) {
      console.warn('Failed to load customers from storage', e);
    }
    return initialCustomers;
  });

  // Preserve Samuel's partners (wellthera_partners_v8 is kept intact; metrics recompute dynamically)
  const [partners, setPartners] = useState<Partner[]>(() => {
    try {
      const saved = localStorage.getItem('wellthera_partners_v8');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load partners from storage', e);
    }
    return initialPartners;
  });

  const [cacChannels, setCacChannels] = useState<CacChannelSpend[]>(initialCacChannels);

  // Preserve Samuel's practitioners (wellthera_practitioners_v5 untouched)
  const [practitioners, setPractitioners] = useState<Practitioner[]>(() => {
    try {
      const saved = localStorage.getItem('wellthera_practitioners_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load practitioners from storage', e);
    }
    return initialPractitioners;
  });

  // Preserve Samuel's services/procedures (wellthera_procedures_v5 untouched)
  const [procedures, setProcedures] = useState<ClinicProcedure[]>(() => {
    try {
      const saved = localStorage.getItem('wellthera_procedures_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load procedures from storage', e);
    }
    return initialProcedures;
  });

  // Persist datasets to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('wellthera_customers_v9', JSON.stringify(customers));
    } catch (e) {
      console.warn('Failed to persist customers', e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem('wellthera_partners_v8', JSON.stringify(partners));
    } catch (e) {
      console.warn('Failed to persist partners', e);
    }
  }, [partners]);

  useEffect(() => {
    try {
      localStorage.setItem('wellthera_bookings_v9', JSON.stringify(bookings));
    } catch (e) {
      console.warn('Failed to persist bookings', e);
    }
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem('wellthera_practitioners_v5', JSON.stringify(practitioners));
    } catch (e) {
      console.warn('Failed to persist practitioners', e);
    }
  }, [practitioners]);

  useEffect(() => {
    try {
      localStorage.setItem('wellthera_procedures_v5', JSON.stringify(procedures));
    } catch (e) {
      console.warn('Failed to persist procedures', e);
    }
  }, [procedures]);

  // OKR & Quarterly Target Plans State
  const [okrPlans, setOkrPlans] = useState<QuarterlyOkrPlan[]>(() => {
    try {
      const saved = localStorage.getItem('wellthera_okrs_v5');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load OKRs from storage', e);
    }
    return initialOkrPlans;
  });

  useEffect(() => {
    try {
      localStorage.setItem('wellthera_okrs_v5', JSON.stringify(okrPlans));
    } catch (e) {
      console.warn('Failed to persist OKRs', e);
    }
  }, [okrPlans]);

  // Google Sheet Sync State with LocalStorage Persistence
  const [syncState, setSyncState] = useState<GoogleSheetSyncState>(() => {
    const envWebhookUrl =
      (import.meta as any).env?.VITE_APPS_SCRIPT_WEBHOOK_URL?.trim() ||
      (import.meta as any).env?.VITE_WELLTHERA_WEBHOOK_URL?.trim() ||
      null;
    const envSheetUrl =
      (import.meta as any).env?.VITE_GOOGLE_SHEET_URL?.trim() ||
      (import.meta as any).env?.VITE_SHEET_URL?.trim() ||
      null;
    const envSheetId =
      (import.meta as any).env?.VITE_SHEET_ID?.trim() ||
      (envSheetUrl ? parseSpreadsheetIdFromInput(envSheetUrl) : null);

    try {
      const saved = localStorage.getItem('wellthera_sheet_sync_state_v8');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (envWebhookUrl && !parsed.appsScriptUrl) {
          parsed.appsScriptUrl = envWebhookUrl;
        }
        if (envSheetUrl && !parsed.sheetUrl) {
          parsed.sheetUrl = envSheetUrl;
        }
        if (envSheetId && !parsed.sheetId) {
          parsed.sheetId = envSheetId;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load saved sync state', e);
    }
    return {
      sheetId: envSheetId,
      sheetUrl: envSheetUrl,
      appsScriptUrl: envWebhookUrl,
      syncMode: envWebhookUrl ? 'appscript' : 'oauth',
      lastSyncedAt: null,
      isSyncing: false,
      syncMessage: envWebhookUrl
        ? 'Webhook configured via environment variable.'
        : 'Ready to create a clean Google Sheet with all 1,176 ClinicSense patients and 5 Origin/Partner tags.',
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('wellthera_sheet_sync_state_v8', JSON.stringify(syncState));
    } catch (e) {
      console.warn('Failed to persist sync state', e);
    }
  }, [syncState]);

  // Pull fresh data from Google Sheets (patients, partners, bookings, CAC)
  const handleRefreshFromSheet = async () => {
    setSyncState((prev) => ({
      ...prev,
      isSyncing: true,
      syncMessage: 'Pulling latest records from Google Sheet...',
    }));

    try {
      const result = await pullLatestDataFromSpreadsheet(syncState, accessToken);
      if (result.success) {
        const nextCustomers =
          result.customers && result.customers.length > 0
            ? result.customers.map((c) => {
                const { rScore, fScore, mScore, segment } = computeRfmSegment(
                  c.recencyDays || 15,
                  c.totalVisits || 1,
                  c.totalSpendCAD || 0
                );
                return {
                  ...c,
                  recencyScore: c.recencyScore || rScore,
                  frequencyScore: c.frequencyScore || fScore,
                  monetaryScore: c.monetaryScore || mScore,
                  rfmSegment: c.rfmSegment || segment,
                };
              })
            : customers;

        if (result.customers && result.customers.length > 0) {
          setCustomers(nextCustomers);
        }

        const nextBookings =
          result.bookings && result.bookings.length > 0 ? result.bookings : bookings;
        if (result.bookings && result.bookings.length > 0) {
          setBookings(nextBookings);
        }

        // Merge pulled partners with any historical origin/partner tags present on customers or bookings
        const basePartners =
          result.partners && result.partners.length > 0 ? [...result.partners] : [...partners];
        const seenNames = new Set(basePartners.map((p) => p.name.trim().toLowerCase()));
        const ensureOriginTag = (partnerId?: string, partnerName?: string, referralCode?: string) => {
          const cleanName = (partnerName || '').trim();
          if (!cleanName || seenNames.has(cleanName.toLowerCase())) return;
          seenNames.add(cleanName.toLowerCase());
          const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          basePartners.push({
            id: partnerId && !basePartners.some((p) => p.id === partnerId) ? partnerId : `p-${slug}`,
            name: cleanName,
            category: 'Clinic Referral Partner',
            contactPerson: 'Auto-discovered from History',
            email: 'frontdesk@wellthera.ca',
            phone: '(705) 730-1000',
            commissionType: 'Percentage',
            commissionValue: 0,
            referralCode: referralCode || slug.toUpperCase().slice(0, 10) || 'REF',
            monthlyRetainerCAD: 0,
            referredCustomersCount: 0,
            activeCustomersCount: 0,
            totalBookingsCount: 0,
            totalRevenueCAD: 0,
            totalCommissionPaidCAD: 0,
            netRevenueCAD: 0,
            roiPercent: 0,
            averageCustomerSpendCAD: 0,
            status: 'Active',
          });
        };
        for (const c of nextCustomers) ensureOriginTag(c.partnerId, c.partnerName, c.referralCode);
        for (const b of nextBookings) ensureOriginTag(b.partnerId, b.partnerName);
        if (result.partners && result.partners.length > 0) {
          setPartners(recomputePartnerMetrics(basePartners, nextCustomers, nextBookings));
        }

        if (result.cacChannels && result.cacChannels.length > 0) {
          setCacChannels(result.cacChannels);
        }

        if (result.practitioners && result.practitioners.length > 0) {
          setPractitioners(result.practitioners);
        }

        if (result.procedures && result.procedures.length > 0) {
          setProcedures(result.procedures);
        }

        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          lastSyncedAt: new Date().toLocaleTimeString(),
          syncMessage: result.message,
        }));
      } else {
        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          syncMessage: result.message,
        }));
      }
    } catch (err: any) {
      console.warn('Pull error:', err);
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        syncMessage: `Sync note: ${err.message || 'Check network connection'}`,
      }));
    }
  };

  // Note: Pulling from Google Sheets is strictly user-initiated via "Pull from Google Sheet"
  // so local edits, newly created partners, and ClinicSense imports are never overwritten by stale sheet tabs.

  // Lock portal handler (resets gatekeeper session)
  const handleLockPortal = () => {
    try {
      localStorage.removeItem('wellthera_auth_gate');
      sessionStorage.removeItem('wellthera_auth_gate');
    } catch (e) {
      console.warn('Failed to clear gatekeeper session', e);
    }
    setIsGatekeeperUnlocked(false);
  };

  // Power BI Slicers State
  const [filters, setFilters] = useState<SlicerFilters>({
    dateRange: 'all',
    selectedPartners: [],
    selectedServices: [],
    selectedRfmSegments: [],
    paymentType: 'all',
    searchQuery: '',
  });

  // Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsLoadingAuth(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        setSyncState((prev) => ({
          ...prev,
          syncMessage: `Signed in as ${res.user.displayName || res.user.email}. Ready to sync Google Sheets.`,
        }));
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setSyncState((prev) => ({
      ...prev,
      syncMessage: 'Signed out from Google account. Linked Sheet reference preserved.',
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: 'all',
      selectedPartners: [],
      selectedServices: [],
      selectedRfmSegments: [],
      paymentType: 'all',
      searchQuery: '',
    });
  };

  const isNoPartnerId = (id?: string) =>
    !id || id === 'no-partner' || id === 'direct' || id === 'p-8';

  // Helper to recompute partner metrics dynamically across customers and bookings
  const recomputePartnerMetrics = (
    currentPartners: Partner[],
    currentCustomers: Customer[],
    currentBookings: ServiceBooking[]
  ): Partner[] => {
    return currentPartners.map((partner) => {
      const partnerIsNoPartner = isNoPartnerId(partner.id);
      // Find all customers referred by this partner
      const referredCusts = currentCustomers.filter((c) => {
        if (partnerIsNoPartner) {
          return isNoPartnerId(c.partnerId);
        }
        return c.partnerId === partner.id;
      });

      const referredCustomersCount = referredCusts.length;
      const activeCustomersCount = referredCusts.filter(
        (c) => c.status === 'Active' || c.status === 'VIP'
      ).length;

      // Find all COMPLETED bookings linked to this partner (never count Upcoming/Cancelled in realized revenue)
      const partnerBookings = currentBookings.filter((b) => {
        if (b.status !== 'Completed') return false;
        if (partnerIsNoPartner) {
          return isNoPartnerId(b.partnerId);
        }
        return b.partnerId === partner.id;
      });

      const totalBookingsCount = partnerBookings.length;

      const totalRevenueCAD =
        partnerBookings.length > 0
          ? partnerBookings.reduce((sum, b) => sum + (b.priceCAD || 0), 0)
          : referredCusts.reduce((sum, c) => sum + (c.totalSpendCAD || 0), 0);

      let commissionPaid = 0;
      if (partner.commissionType === 'Percentage') {
        commissionPaid = (totalRevenueCAD * (partner.commissionValue || 0)) / 100;
      } else if (partner.commissionType === 'FlatPerBooking') {
        commissionPaid = totalBookingsCount * (partner.commissionValue || 0);
      }

      const retainerCost = (partner.monthlyRetainerCAD || 0) * 6;
      const totalCost = commissionPaid + retainerCost;
      const netRevenueCAD = totalRevenueCAD - totalCost;
      const roiPercent =
        totalCost > 0
          ? (netRevenueCAD / totalCost) * 100
          : totalRevenueCAD > 0
          ? 100
          : 0;
      const averageCustomerSpendCAD =
        referredCustomersCount > 0 ? totalRevenueCAD / referredCustomersCount : 0;

      return {
        ...partner,
        referredCustomersCount,
        activeCustomersCount,
        totalBookingsCount,
        totalRevenueCAD: Math.round(totalRevenueCAD * 100) / 100,
        totalCommissionPaidCAD: Math.round(commissionPaid * 100) / 100,
        netRevenueCAD: Math.round(netRevenueCAD * 100) / 100,
        roiPercent: Math.round(roiPercent * 10) / 10,
        averageCustomerSpendCAD: Math.round(averageCustomerSpendCAD * 100) / 100,
      };
    });
  };

  // Add customer handler
  const handleAddNewCustomer = (newCustomer: Customer) => {
    // Recompute RFM
    const { rScore, fScore, mScore, segment } = computeRfmSegment(
      newCustomer.recencyDays,
      newCustomer.totalVisits,
      newCustomer.totalSpendCAD
    );
    const enriched: Customer = {
      ...newCustomer,
      recencyScore: rScore,
      frequencyScore: fScore,
      monetaryScore: mScore,
      rfmSegment: segment,
    };

    const nextCustomers = [enriched, ...customers];
    setCustomers(nextCustomers);
    setPartners((prev) => recomputePartnerMetrics(prev, nextCustomers, bookings));
  };

  // Partner assignment to customer (even after creation/import)
  const handleAssignPartnerToCustomer = (
    customerId: string,
    partnerId: string,
    partnerName: string,
    referralCode?: string,
    updatePastBookings: boolean = true
  ) => {
    let targetCustomer: Customer | undefined;

    const nextCustomers = customers.map((c) => {
      if (c.id === customerId) {
        targetCustomer = {
          ...c,
          partnerId,
          partnerName,
          referralCode:
            referralCode ||
            (isNoPartnerId(partnerId)
              ? 'DIRECT'
              : partnerName.split(' ')[0].toUpperCase() + '-REF'),
        };
        return targetCustomer;
      }
      return c;
    });

    let nextBookings = bookings;
    if (updatePastBookings && targetCustomer) {
      const custNameLower = targetCustomer.name.toLowerCase();
      nextBookings = bookings.map((b) => {
        if (b.customerId === customerId || b.customerName.toLowerCase() === custNameLower) {
          return {
            ...b,
            partnerId,
            partnerName,
          };
        }
        return b;
      });
      setBookings(nextBookings);
    }

    setCustomers(nextCustomers);
    setPartners((prev) => recomputePartnerMetrics(prev, nextCustomers, nextBookings));
  };

  // Partner assignment to individual booking
  const handleAssignPartnerToBooking = (
    bookingId: string,
    partnerId: string,
    partnerName: string
  ) => {
    const nextBookings = bookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          partnerId,
          partnerName,
        };
      }
      return b;
    });
    setBookings(nextBookings);
    setPartners((prev) => recomputePartnerMetrics(prev, customers, nextBookings));
  };

  // Add partner handler
  const handleAddNewPartner = (newPartner: Partner) => {
    const nextPartners = [newPartner, ...partners];
    setPartners(recomputePartnerMetrics(nextPartners, customers, bookings));
  };

  // Update partner handler
  const handleUpdatePartner = (updatedPartner: Partner) => {
    const nextPartners = partners.map((p) =>
      p.id === updatedPartner.id ? updatedPartner : p
    );
    const recomputed = recomputePartnerMetrics(nextPartners, customers, bookings);
    setPartners(recomputed);

    // Update names in customers & bookings if partner name changed
    setCustomers((prev) =>
      prev.map((c) =>
        c.partnerId === updatedPartner.id ? { ...c, partnerName: updatedPartner.name } : c
      )
    );
    setBookings((prev) =>
      prev.map((b) =>
        b.partnerId === updatedPartner.id ? { ...b, partnerName: updatedPartner.name } : b
      )
    );
  };

  // Delete partner handler
  const handleDeletePartner = (partnerId: string) => {
    const nextPartners = partners.filter((p) => p.id !== partnerId);
    const nextCustomers = customers.map((c) =>
      c.partnerId === partnerId
        ? { ...c, partnerId: 'no-partner', partnerName: 'No partner', referralCode: 'DIRECT' }
        : c
    );
    const nextBookings = bookings.map((b) =>
      b.partnerId === partnerId
        ? { ...b, partnerId: 'no-partner', partnerName: 'No partner' }
        : b
    );
    setCustomers(nextCustomers);
    setBookings(nextBookings);
    setPartners(recomputePartnerMetrics(nextPartners, nextCustomers, nextBookings));
  };

  // Add booking handler for clinic manager daily logging
  const handleAddNewBooking = (newBooking: ServiceBooking) => {
    const nextBookings = [newBooking, ...bookings];
    setBookings(nextBookings);

    // Automatically update customer's last visit, total visits and spend
    const nextCustomers = customers.map((c) => {
      if (
        c.name.toLowerCase() === newBooking.customerName.toLowerCase() ||
        c.id === newBooking.customerId
      ) {
        const totalVisits = c.totalVisits + 1;
        const totalSpendCAD = c.totalSpendCAD + newBooking.priceCAD;
        const { rScore, fScore, mScore, segment } = computeRfmSegment(
          0,
          totalVisits,
          totalSpendCAD
        );
        return {
          ...c,
          lastVisitDate: newBooking.bookingDate,
          totalVisits,
          totalSpendCAD,
          recencyDays: 0,
          recencyScore: rScore,
          frequencyScore: fScore,
          monetaryScore: mScore,
          rfmSegment: segment,
        };
      }
      return c;
    });

    setCustomers(nextCustomers);
    setPartners((prev) => recomputePartnerMetrics(prev, nextCustomers, nextBookings));
  };

  // Practitioner handlers
  const handleAddNewPractitioner = (practitioner: Practitioner) => {
    setPractitioners((prev) => [practitioner, ...prev]);
  };

  const handleUpdatePractitioner = (updated: Practitioner) => {
    setPractitioners((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleDeletePractitioner = (id: string) => {
    setPractitioners((prev) => prev.filter((p) => p.id !== id));
  };

  // Procedure handlers
  const handleAddNewProcedure = (procedure: ClinicProcedure) => {
    setProcedures((prev) => [procedure, ...prev]);
  };

  const handleUpdateProcedure = (updated: ClinicProcedure) => {
    setProcedures((prev) => prev.map((proc) => (proc.id === updated.id ? updated : proc)));
  };

  const handleDeleteProcedure = (id: string) => {
    setProcedures((prev) => prev.filter((proc) => proc.id !== id));
  };

  // OKR & Quarterly Target Handlers
  const handleUpdateQuarterTargets = (
    quarterId: string,
    updatedTargets: Partial<QuarterlyOkrPlan>
  ) => {
    setOkrPlans((prev) =>
      prev.map((plan) => (plan.id === quarterId ? { ...plan, ...updatedTargets } : plan))
    );
  };

  const handleAddQuarter = (newQuarter: QuarterlyOkrPlan) => {
    setOkrPlans((prev) => [newQuarter, ...prev]);
  };

  const handleAddObjective = (quarterId: string, newObjective: ClinicObjective) => {
    setOkrPlans((prev) =>
      prev.map((plan) =>
        plan.id === quarterId
          ? { ...plan, objectives: [...plan.objectives, newObjective] }
          : plan
      )
    );
  };

  const handleUpdateObjective = (quarterId: string, updatedObjective: ClinicObjective) => {
    setOkrPlans((prev) =>
      prev.map((plan) =>
        plan.id === quarterId
          ? {
              ...plan,
              objectives: plan.objectives.map((obj) =>
                obj.id === updatedObjective.id ? updatedObjective : obj
              ),
            }
          : plan
      )
    );
  };

  const handleDeleteObjective = (quarterId: string, objectiveId: string) => {
    setOkrPlans((prev) =>
      prev.map((plan) =>
        plan.id === quarterId
          ? {
              ...plan,
              objectives: plan.objectives.filter((obj) => obj.id !== objectiveId),
            }
          : plan
      )
    );
  };

  const handleAddKeyResult = (
    quarterId: string,
    objectiveId: string,
    newKR: KeyResult
  ) => {
    setOkrPlans((prev) =>
      prev.map((plan) =>
        plan.id === quarterId
          ? {
              ...plan,
              objectives: plan.objectives.map((obj) =>
                obj.id === objectiveId
                  ? { ...obj, keyResults: [...obj.keyResults, newKR] }
                  : obj
              ),
            }
          : plan
      )
    );
  };

  const handleUpdateKeyResult = (
    quarterId: string,
    objectiveId: string,
    updatedKR: KeyResult
  ) => {
    setOkrPlans((prev) =>
      prev.map((plan) =>
        plan.id === quarterId
          ? {
              ...plan,
              objectives: plan.objectives.map((obj) =>
                obj.id === objectiveId
                  ? {
                      ...obj,
                      keyResults: obj.keyResults.map((kr) =>
                        kr.id === updatedKR.id ? updatedKR : kr
                      ),
                    }
                  : obj
              ),
            }
          : plan
      )
    );
  };

  const handleDeleteKeyResult = (
    quarterId: string,
    objectiveId: string,
    krId: string
  ) => {
    setOkrPlans((prev) =>
      prev.map((plan) =>
        plan.id === quarterId
          ? {
              ...plan,
              objectives: plan.objectives.map((obj) =>
                obj.id === objectiveId
                  ? {
                      ...obj,
                      keyResults: obj.keyResults.filter((kr) => kr.id !== krId),
                    }
                  : obj
              ),
            }
          : plan
      )
    );
  };

  // Calculate reference timestamp for relative date range filtering (capped at today so future bookings never skew cutoffs)
  const maxBookingTimestamp = useMemo(() => {
    const now = Date.now();
    let max = 0;
    for (const b of bookings) {
      if (b.status !== 'Completed') continue;
      const t = new Date(b.bookingDate).getTime();
      if (!isNaN(t) && t <= now && t > max) max = t;
    }
    return max || now;
  }, [bookings]);

  // Set of customer IDs that match the active RFM segment slicer
  const rfmEligibleCustomerIds = useMemo(() => {
    if (filters.selectedRfmSegments.length === 0) return null;
    const ids = new Set<string>();
    for (const c of customers) {
      if (filters.selectedRfmSegments.includes(c.rfmSegment)) {
        ids.add(c.id);
        if (c.name) ids.add(c.name.trim().toLowerCase());
      }
    }
    return ids;
  }, [customers, filters.selectedRfmSegments]);

  // Helper to check if a partner is selected in slicers (handles both no-partner/direct IDs and partner IDs)
  const isPartnerMatched = (
    partnerId: string | undefined,
    selectedPartnerIds: string[]
  ) => {
    if (selectedPartnerIds.length === 0) return true;
    const isDirect = isNoPartnerId(partnerId);
    return selectedPartnerIds.some((id) => {
      if (isNoPartnerId(id)) return isDirect;
      return id === partnerId;
    });
  };

  // Cross-filtering computation across all visual models
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Date range filter based on real recorded lastVisitDate
      if (filters.dateRange !== 'all') {
        if (!c.lastVisitDate || c.lastVisitDate === 'Never') {
          return false;
        }
        const days =
          filters.dateRange === '30d'
            ? 30
            : filters.dateRange === '90d'
            ? 90
            : filters.dateRange === '180d'
            ? 180
            : 365;
        const cutoff = maxBookingTimestamp - days * 24 * 60 * 60 * 1000;
        const lastTime = new Date(c.lastVisitDate).getTime();
        if (isNaN(lastTime) || lastTime < cutoff) {
          return false;
        }
      }

      // Partner filter
      if (
        filters.selectedPartners.length > 0 &&
        !isPartnerMatched(c.partnerId, filters.selectedPartners)
      ) {
        return false;
      }

      // Service filter
      if (
        filters.selectedServices.length > 0 &&
        !filters.selectedServices.includes(c.preferredService)
      ) {
        return false;
      }

      // RFM filter
      if (
        filters.selectedRfmSegments.length > 0 &&
        !filters.selectedRfmSegments.includes(c.rfmSegment)
      ) {
        return false;
      }

      // Payment filter
      if (
        filters.paymentType === 'directBilling' &&
        (c.insuranceProvider === 'None / Self-Pay' || !c.insuranceProvider)
      ) {
        return false;
      }
      if (
        filters.paymentType === 'outOfPocket' &&
        c.insuranceProvider &&
        c.insuranceProvider !== 'None / Self-Pay'
      ) {
        return false;
      }

      // Search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchName = c.name?.toLowerCase().includes(query);
        const matchPartner = c.partnerName?.toLowerCase().includes(query);
        const matchEmail = c.email?.toLowerCase().includes(query);
        const matchCode = c.referralCode?.toLowerCase().includes(query);
        const matchPhone = c.phone?.toLowerCase().includes(query);
        const matchService = c.preferredService?.toLowerCase().includes(query);
        const matchNotes = c.notes?.toLowerCase().includes(query);
        if (
          !matchName &&
          !matchPartner &&
          !matchEmail &&
          !matchCode &&
          !matchPhone &&
          !matchService &&
          !matchNotes
        ) {
          return false;
        }
      }

      return true;
    });
  }, [customers, filters]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Date range filter
      if (filters.dateRange !== 'all') {
        const days =
          filters.dateRange === '30d'
            ? 30
            : filters.dateRange === '90d'
            ? 90
            : filters.dateRange === '180d'
            ? 180
            : 365;
        const cutoff = maxBookingTimestamp - days * 24 * 60 * 60 * 1000;
        const bTime = new Date(b.bookingDate).getTime();
        if (!isNaN(bTime) && bTime < cutoff) {
          return false;
        }
      }

      // Partner filter
      if (
        filters.selectedPartners.length > 0 &&
        !isPartnerMatched(b.partnerId, filters.selectedPartners)
      ) {
        return false;
      }

      // Service category filter
      if (
        filters.selectedServices.length > 0 &&
        !filters.selectedServices.includes(b.serviceCategory)
      ) {
        return false;
      }

      // RFM customer segment filter
      if (rfmEligibleCustomerIds) {
        const hasId = b.customerId && rfmEligibleCustomerIds.has(b.customerId);
        const hasName =
          b.customerName &&
          rfmEligibleCustomerIds.has(b.customerName.trim().toLowerCase());
        if (!hasId && !hasName) {
          return false;
        }
      }

      // Payment filter (Direct billing vs Out of pocket)
      if (filters.paymentType === 'directBilling' && (b.insuranceBilledCAD || 0) <= 0) {
        return false;
      }
      if (filters.paymentType === 'outOfPocket' && (b.insuranceBilledCAD || 0) > 0) {
        return false;
      }

      // Search query
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchCustomer = b.customerName?.toLowerCase().includes(query);
        const matchPartner = b.partnerName?.toLowerCase().includes(query);
        const matchTherapist = b.therapist?.toLowerCase().includes(query);
        const matchTitle = b.serviceTitle?.toLowerCase().includes(query);
        const matchCategory = b.serviceCategory?.toLowerCase().includes(query);
        if (
          !matchCustomer &&
          !matchPartner &&
          !matchTherapist &&
          !matchTitle &&
          !matchCategory
        ) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, filters, maxBookingTimestamp, rfmEligibleCustomerIds]);

  const filteredPartners = useMemo(() => {
    let list = partners;
    if (filters.selectedPartners.length > 0) {
      list = partners.filter((p) => {
        const isDirect = isNoPartnerId(p.id);
        return filters.selectedPartners.some((selId) => {
          if (isNoPartnerId(selId)) return isDirect;
          return selId === p.id;
        });
      });
    }
    // Recompute partner metrics dynamically based on active filteredCustomers and filteredBookings
    return recomputePartnerMetrics(list, filteredCustomers, filteredBookings);
  }, [partners, filters.selectedPartners, filteredCustomers, filteredBookings]);

  const filteredCacChannels = useMemo(() => {
    const base =
      filters.selectedPartners.length === 0
        ? cacChannels
        : cacChannels.filter((c) => {
            const partner = partners.find(
              (p) => p.name.toLowerCase() === c.partnerOrChannel.toLowerCase()
            );
            if (partner) {
              return filters.selectedPartners.includes(partner.id);
            }
            if (
              filters.selectedPartners.some((id) => isNoPartnerId(id)) &&
              !c.isPartner
            ) {
              return true;
            }
            return false;
          });

    // Dynamically recompute real customer counts & real LTV from filteredCustomers
    return base.map((ch) => {
      const matchedPartner = partners.find(
        (p) => p.name.toLowerCase() === ch.partnerOrChannel.toLowerCase()
      );
      const channelCusts = filteredCustomers.filter((cust) => {
        if (!ch.isPartner) return isNoPartnerId(cust.partnerId);
        if (matchedPartner) return cust.partnerId === matchedPartner.id;
        return cust.partnerName.toLowerCase() === ch.partnerOrChannel.toLowerCase();
      });
      const count = channelCusts.length;
      const totalSpend = channelCusts.reduce((sum, cust) => sum + (cust.totalSpendCAD || 0), 0);
      const avgLtv = count > 0 ? totalSpend / count : 0;
      const calcCac = count > 0 && ch.spendCAD > 0 ? ch.spendCAD / count : 0;
      const ratio = calcCac > 0 && avgLtv > 0 ? avgLtv / calcCac : 0;

      return {
        ...ch,
        newCustomersAcquired: count,
        calculatedCacCAD: Math.round(calcCac * 100) / 100,
        averageLtvCAD: Math.round(avgLtv * 100) / 100,
        ltvCacRatio: Math.round(ratio * 100) / 100,
      };
    });
  }, [cacChannels, filters.selectedPartners, partners, filteredCustomers]);

  const filteredTotalRevenue = useMemo(() => {
    return filteredBookings
      .filter((b) => b.status === 'Completed')
      .reduce((acc, b) => acc + b.priceCAD, 0);
  }, [filteredBookings]);

  // Gatekeeper protection screen (protects public dashboard on Vercel)
  if (!isGatekeeperUnlocked) {
    return (
      <GatekeeperLogin
        onAuthenticated={() => setIsGatekeeperUnlocked(true)}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
        isDarkMode
          ? 'bg-[#14160e] text-[#f9f8f5] selection:bg-[#686e4a]/40'
          : 'bg-[#f9f8f5] text-[#332e1e] selection:bg-[#686e4a]/20'
      }`}
    >
      {/* Top Header & Navigation */}
      <PowerBIHeader
        activeTab={activeTab}
        onTabChange={setActiveTab}
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        isLoadingAuth={isLoadingAuth}
        totalRevenue={filteredTotalRevenue}
        totalCustomers={filteredCustomers.length}
        sheetUrl={syncState.sheetUrl}
        isDarkMode={isDarkMode}
        onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onLockPortal={handleLockPortal}
      />

      {/* Slicer Bar (Interactive Power BI Filtering) */}
      <SlicerBar
        filters={filters}
        onChange={setFilters}
        partners={partners}
        onReset={handleResetFilters}
        isDarkMode={isDarkMode}
      />

      {/* Main Canvas Area */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full">
        {activeTab === 'overview' && (
          <ExecutiveOverview
            customers={filteredCustomers}
            partners={filteredPartners}
            bookings={filteredBookings}
            cacChannels={filteredCacChannels}
            okrPlans={okrPlans}
            onNavigateTab={setActiveTab}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'okrs' && (
          <OkrDashboard
            okrPlans={okrPlans}
            customers={customers}
            partners={partners}
            bookings={bookings}
            cacChannels={cacChannels}
            onUpdateQuarterTargets={handleUpdateQuarterTargets}
            onAddQuarter={handleAddQuarter}
            onAddObjective={handleAddObjective}
            onUpdateObjective={handleUpdateObjective}
            onDeleteObjective={handleDeleteObjective}
            onAddKeyResult={handleAddKeyResult}
            onUpdateKeyResult={handleUpdateKeyResult}
            onDeleteKeyResult={handleDeleteKeyResult}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'partners' && (
          <PartnerRoiDashboard
            partners={filteredPartners}
            customers={filteredCustomers}
            bookings={filteredBookings}
            onAddNewPartner={handleAddNewPartner}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'rfm' && (
          <RfmMatrixDashboard
            customers={filteredCustomers}
            onFilterBySegment={(seg) =>
              setFilters((prev) => ({ ...prev, selectedRfmSegments: [seg] }))
            }
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'services' && (
          <ServicesBreakdownDashboard
            bookings={filteredBookings}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'cac' && (
          <CacAnalysisDashboard
            cacChannels={filteredCacChannels}
            isDarkMode={isDarkMode}
          />
        )}

        {activeTab === 'sheet' && (
          <GoogleSheetTrackerView
            customers={customers}
            partners={partners}
            bookings={bookings}
            cacChannels={cacChannels}
            practitioners={practitioners}
            procedures={procedures}
            okrPlans={okrPlans}
            syncState={syncState}
            setSyncState={setSyncState}
            accessToken={accessToken}
            onAddNewCustomer={handleAddNewCustomer}
            onAssignPartnerToCustomer={handleAssignPartnerToCustomer}
            onAssignPartnerToBooking={handleAssignPartnerToBooking}
            onAddNewPartner={handleAddNewPartner}
            onUpdatePartner={handleUpdatePartner}
            onDeletePartner={handleDeletePartner}
            onAddNewBooking={handleAddNewBooking}
            onAddNewPractitioner={handleAddNewPractitioner}
            onUpdatePractitioner={handleUpdatePractitioner}
            onDeletePractitioner={handleDeletePractitioner}
            onAddNewProcedure={handleAddNewProcedure}
            onUpdateProcedure={handleUpdateProcedure}
            onDeleteProcedure={handleDeleteProcedure}
            onOpenSignIn={handleSignIn}
            onRefreshFromSheet={handleRefreshFromSheet}
            isDarkMode={isDarkMode}
            onOpenHelp={() => setIsHelpOpen(true)}
          />
        )}
      </main>

      {/* Setup Instructions & GitHub Deployment Modal */}
      <SetupInstructionsModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        isDarkMode={isDarkMode}
        hasGoogleAuth={!!accessToken}
        onOpenGoogleSheetTab={() => setActiveTab('sheet')}
      />

      {/* Footer */}
      <footer
        className={`border-t px-4 py-3 text-xs flex flex-wrap items-center justify-between gap-3 ${
          isDarkMode
            ? 'bg-[#10120b] border-[#24291c] text-[#8b927a]'
            : 'bg-[#f0ede6] border-[#e7e3da] text-[#6e6856]'
        }`}
      >
        <div className="flex items-center gap-2">
          <WelltheraLogo
            size="sm"
            variant={isDarkMode ? 'white' : 'olive'}
          />
          <span className="font-serif font-bold text-sm tracking-tight text-inherit">
            Wellthera Integrated Health
          </span>
          <span>•</span>
          <span>464 Big Bay Point Rd, Barrie, ON</span>
          <span>•</span>
          <a
            href="https://www.wellthera.ca"
            target="_blank"
            rel="noreferrer"
            className="text-[#686e4a] dark:text-[#c7ccaa] font-semibold hover:underline"
          >
            wellthera.ca
          </a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHelpOpen(true)}
            className="font-bold text-[#686e4a] dark:text-[#c7ccaa] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Setup & Deployment Guide</span>
            <span className="w-3.5 h-3.5 rounded-full bg-[#686e4a] text-white text-[9px] flex items-center justify-center font-bold">
              ?
            </span>
          </button>
          <span>•</span>
          <span>Google Sheets & Drive Connected</span>
          <span>•</span>
          <span>RFM Matrix v2.4</span>
        </div>
      </footer>
    </div>
  );
}
